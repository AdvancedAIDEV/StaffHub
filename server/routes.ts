import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { getSession } from "./replit_integrations/auth/replitAuth";
import { insertEventSchema, insertShiftSchema, insertMessageSchema, insertReviewSchema } from "@shared/schema";
import { z } from "zod";
import passport from "passport";

const clients = new Map<string, Set<WebSocket>>();

function broadcastToUser(userId: string, data: any) {
  const userSockets = clients.get(userId);
  if (userSockets) {
    const message = JSON.stringify(data);
    userSockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

function extractUserFromRequest(req: IncomingMessage): Promise<string | null> {
  return new Promise((resolve) => {
    const mockRes = { end: () => {}, setHeader: () => {}, getHeader: () => undefined } as any;
    const sessionMiddleware = getSession();
    sessionMiddleware(req as any, mockRes, () => {
      passport.initialize()(req as any, mockRes, () => {
        passport.session()(req as any, mockRes, () => {
          const user = (req as any).user;
          if (user?.claims?.sub) {
            resolve(user.claims.sub);
          } else {
            resolve(null);
          }
        });
      });
    });
  });
}

async function isAdmin(req: any, res: Response, next: NextFunction) {
  const userId = req.user?.claims?.sub;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const profile = await storage.getStaffProfile(userId);
  if (!profile || profile.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getStaffProfile(userId);
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  const updateProfileSchema = z.object({
    phone: z.string().nullable().optional(),
    uniformSize: z.string().nullable().optional(),
    certifications: z.string().nullable().optional(),
    preferredRoles: z.string().nullable().optional(),
    minPayRate: z.number().int().nullable().optional(),
    maxDistance: z.number().int().nullable().optional(),
    preferredAreas: z.string().nullable().optional(),
    readyPoolEnabled: z.boolean().optional(),
    assignmentPreference: z.string().optional(),
    autoAcceptShifts: z.boolean().optional(),
    showAvailability: z.boolean().optional(),
    isActive: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    shiftReminders: z.boolean().optional(),
    messageNotifications: z.boolean().optional(),
    scheduleUpdates: z.boolean().optional(),
  });

  app.put("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = updateProfileSchema.parse(req.body);
      const profile = await storage.upsertStaffProfile({ ...validated, userId });
      res.json(profile);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/staff", isAuthenticated, async (_req, res) => {
    try {
      const staffList = await storage.getAllStaffProfiles();
      res.json(staffList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.get("/api/staff/:userId", isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.getStaffProfile(req.params.userId);
      if (!profile) return res.status(404).json({ message: "Staff not found" });
      const user = await storage.getUser(req.params.userId);
      res.json({ ...profile, user: user || null });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff profile" });
    }
  });

  app.get("/api/users", isAuthenticated, async (_req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers.map(u => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        profileImageUrl: u.profileImageUrl,
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/events", isAuthenticated, async (_req, res) => {
    try {
      const eventList = await storage.getAllEvents();
      res.json(eventList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", isAuthenticated, async (req, res) => {
    try {
      const event = await storage.getEventWithShiftCounts(req.params.id);
      if (!event) return res.status(404).json({ message: "Event not found" });
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  const createEventSchema = z.object({
    title: z.string().min(1, "Title is required"),
    venue: z.string().min(1, "Venue is required"),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    description: z.string().optional(),
    venueAddress: z.string().optional(),
    uniformRequirements: z.string().optional(),
    specialInstructions: z.string().optional(),
    requiredStaff: z.number().int().min(0).optional(),
    status: z.string().optional(),
  });

  app.post("/api/events", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const validated = createEventSchema.parse(req.body);
      const parsed = insertEventSchema.parse({
        ...validated,
        date: new Date(validated.date),
        createdBy: req.user.claims.sub,
      });
      const event = await storage.createEvent(parsed);
      res.json(event);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      res.status(400).json({ message: error.message || "Invalid event data" });
    }
  });

  const updateEventSchema = z.object({
    title: z.string().min(1).optional(),
    venue: z.string().min(1).optional(),
    date: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    description: z.string().nullable().optional(),
    venueAddress: z.string().nullable().optional(),
    uniformRequirements: z.string().nullable().optional(),
    specialInstructions: z.string().nullable().optional(),
    requiredStaff: z.number().int().min(0).optional(),
    status: z.enum(["draft", "published", "completed", "cancelled"]).optional(),
  });

  app.patch("/api/events/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validated = updateEventSchema.parse(req.body);
      const data: any = { ...validated };
      if (data.date) data.date = new Date(data.date);
      const event = await storage.updateEvent(req.params.id, data);
      res.json(event);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteEvent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  app.get("/api/events/:eventId/shifts", isAuthenticated, async (req, res) => {
    try {
      const shiftList = await storage.getShiftsByEvent(req.params.eventId);
      res.json(shiftList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  app.get("/api/shifts/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const myShifts = await storage.getShiftsByStaff(userId);
      res.json(myShifts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  app.get("/api/shifts/available", isAuthenticated, async (_req, res) => {
    try {
      const openShifts = await storage.getAvailableShifts();
      res.json(openShifts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available shifts" });
    }
  });

  const createShiftSchema = z.object({
    eventId: z.string().min(1),
    role: z.string().min(1, "Role is required"),
    assignmentType: z.enum(["autoconfirm", "seekreply", "publishing"]),
    payRate: z.number().int().min(0).optional(),
    notes: z.string().optional(),
    breakMinutes: z.number().int().min(0).optional(),
    staffId: z.string().optional(),
    status: z.string().optional(),
  });

  app.post("/api/shifts", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validated = createShiftSchema.parse(req.body);
      const shift = await storage.createShift({
        ...validated,
        status: validated.staffId ? (validated.assignmentType === "autoconfirm" ? "confirmed" : "pending") : "open",
        payRate: validated.payRate || null,
        notes: validated.notes || null,
        breakMinutes: validated.breakMinutes || null,
        staffId: validated.staffId || null,
      });

      if (validated.staffId && validated.assignmentType !== "autoconfirm") {
        await storage.createNotification({
          userId: validated.staffId,
          type: "shift_offer",
          title: "New Shift Offer",
          message: `You've been offered a ${validated.role} shift`,
          isRead: false,
          relatedId: shift.id,
        });
        broadcastToUser(validated.staffId, { type: "notification" });
      }

      res.json(shift);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      res.status(400).json({ message: error.message || "Invalid shift data" });
    }
  });

  app.patch("/api/shifts/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const shift = await storage.getShift(req.params.id);
      if (!shift) return res.status(404).json({ message: "Shift not found" });
      const updated = await storage.updateShift(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update shift" });
    }
  });

  app.delete("/api/shifts/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteShift(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete shift" });
    }
  });

  app.patch("/api/shifts/:id/respond", isAuthenticated, async (req: any, res) => {
    try {
      const { action } = req.body;
      if (!action || !["accept", "reject", "claim"].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be accept, reject, or claim." });
      }

      const userId = req.user.claims.sub;
      const shift = await storage.getShift(req.params.id);
      if (!shift) return res.status(404).json({ message: "Shift not found" });

      if (action === "accept" || action === "claim") {
        if (action === "claim" && shift.assignmentType !== "publishing") {
          return res.status(400).json({ message: "This shift is not available for claiming" });
        }
        if (action === "accept" && shift.staffId !== userId) {
          return res.status(403).json({ message: "This shift was not offered to you" });
        }
        const updated = await storage.updateShift(req.params.id, {
          status: "confirmed",
          staffId: userId,
        });

        const event = await storage.getEvent(shift.eventId);
        if (event) {
          await storage.createNotification({
            userId: event.createdBy,
            type: "shift_accepted",
            title: "Shift Accepted",
            message: `A staff member accepted the ${shift.role} shift for ${event.title}`,
            isRead: false,
            relatedId: shift.id,
          });
          broadcastToUser(event.createdBy, { type: "notification" });
        }

        res.json(updated);
      } else if (action === "reject") {
        const updated = await storage.updateShift(req.params.id, {
          status: "open",
          staffId: null,
        });

        const event = await storage.getEvent(shift.eventId);
        if (event) {
          await storage.createNotification({
            userId: event.createdBy,
            type: "shift_rejected",
            title: "Shift Declined",
            message: `A staff member declined the ${shift.role} shift for ${event.title}`,
            isRead: false,
            relatedId: shift.id,
          });
          broadcastToUser(event.createdBy, { type: "notification" });
        }

        res.json(updated);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to respond to shift" });
    }
  });

  app.get("/api/time/active", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const active = await storage.getActiveTimeEntry(userId);
      res.json(active || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active time entry" });
    }
  });

  app.get("/api/time/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getTimeEntriesByStaff(userId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  app.post("/api/time/clock-in", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { shiftId } = req.body;
      if (!shiftId) return res.status(400).json({ message: "Shift ID is required" });

      const shift = await storage.getShift(shiftId);
      if (!shift) return res.status(404).json({ message: "Shift not found" });
      if (shift.staffId !== userId) return res.status(403).json({ message: "This shift is not assigned to you" });
      if (shift.status !== "confirmed") return res.status(400).json({ message: "Shift must be confirmed to clock in" });

      const existing = await storage.getActiveTimeEntry(userId);
      if (existing) return res.status(400).json({ message: "Already clocked in to another shift" });

      const entry = await storage.createTimeEntry({
        shiftId,
        staffId: userId,
        clockIn: new Date(),
        status: "active",
      });
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to clock in" });
    }
  });

  app.post("/api/time/clock-out", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const active = await storage.getActiveTimeEntry(userId);
      if (!active) return res.status(400).json({ message: "Not clocked in" });

      const clockOut = new Date();
      const totalMinutes = Math.floor((clockOut.getTime() - active.clockIn.getTime()) / 60000);
      const entry = await storage.updateTimeEntry(active.id, {
        clockOut,
        totalMinutes,
        status: "completed",
      });
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to clock out" });
    }
  });

  app.get("/api/messages/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const convos = await storage.getConversations(userId);
      res.json(convos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/messages/:partnerId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAsRead(userId, req.params.partnerId);
      const convo = await storage.getConversation(userId, req.params.partnerId);
      res.json(convo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schema = z.object({
        recipientId: z.string().min(1, "Recipient is required"),
        content: z.string().min(1, "Message cannot be empty"),
      });
      const validated = schema.parse(req.body);

      const parsed = insertMessageSchema.parse({
        ...validated,
        senderId: userId,
        isRead: false,
      });
      const message = await storage.createMessage(parsed);

      const sender = await storage.getUser(userId);
      const senderName = sender
        ? [sender.firstName, sender.lastName].filter(Boolean).join(" ") || sender.email || "Someone"
        : "Someone";

      await storage.createNotification({
        userId: validated.recipientId,
        type: "new_message",
        title: "New Message",
        message: `${senderName}: ${validated.content.slice(0, 100)}`,
        isRead: false,
        relatedId: message.id,
      });

      broadcastToUser(validated.recipientId, { type: "new_message", message });
      broadcastToUser(userId, { type: "new_message", message });
      res.json(message);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      res.status(400).json({ message: error.message || "Invalid message data" });
    }
  });

  app.get("/api/reviews/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userReviews = await storage.getReviewsByUser(userId);
      res.json(userReviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get("/api/reviews/event/:eventId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const eventReviews = await storage.getReviewsForEvent(req.params.eventId);
      res.json(eventReviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event reviews" });
    }
  });

  app.post("/api/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schema = z.object({
        shiftId: z.string().min(1),
        revieweeId: z.string().min(1),
        rating: z.number().int().min(1).max(5),
        comment: z.string().optional(),
      });
      const validated = schema.parse(req.body);

      const parsed = insertReviewSchema.parse({
        ...validated,
        reviewerId: userId,
      });
      const review = await storage.createReview(parsed);

      const reviewer = await storage.getUser(userId);
      const reviewerName = reviewer
        ? [reviewer.firstName, reviewer.lastName].filter(Boolean).join(" ") || "Someone"
        : "Someone";

      await storage.createNotification({
        userId: validated.revieweeId,
        type: "new_review",
        title: "New Performance Review",
        message: `${reviewerName} left you a ${validated.rating}-star review`,
        isRead: false,
        relatedId: review.id,
      });
      broadcastToUser(validated.revieweeId, { type: "notification" });

      res.json(review);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      res.status(400).json({ message: error.message || "Invalid review data" });
    }
  });

  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifs = await storage.getNotifications(userId);
      res.json(notifs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", async (ws, req) => {
    const userId = await extractUserFromRequest(req);
    if (!userId) {
      ws.close(1008, "Unauthorized");
      return;
    }

    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId)!.add(ws);

    ws.on("close", () => {
      if (clients.has(userId)) {
        clients.get(userId)!.delete(ws);
        if (clients.get(userId)!.size === 0) {
          clients.delete(userId);
        }
      }
    });
  });

  return httpServer;
}
