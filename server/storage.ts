import {
  staffProfiles, events, shifts, timeEntries, availability, messages, reviews, notifications,
  type StaffProfile, type InsertStaffProfile,
  type Event, type InsertEvent,
  type Shift, type InsertShift,
  type TimeEntry, type InsertTimeEntry,
  type Availability, type InsertAvailability,
  type Message, type InsertMessage,
  type Review, type InsertReview,
  type Notification, type InsertNotification,
} from "@shared/schema";
import { type User } from "@shared/models/auth";
import { db } from "./db";
import { eq, and, desc, or, sql, asc, ne, lt, gt, count, isNull } from "drizzle-orm";
import { users } from "@shared/models/auth";

export interface IStorage {
  getStaffProfile(userId: string): Promise<StaffProfile | undefined>;
  upsertStaffProfile(profile: InsertStaffProfile): Promise<StaffProfile>;
  getAllStaffProfiles(): Promise<(StaffProfile & { user: User })[]>;

  getEvent(id: string): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  getEventWithShiftCounts(id: string): Promise<(Event & { shiftCount: number; confirmedCount: number }) | undefined>;

  getShift(id: string): Promise<Shift | undefined>;
  getShiftsByEvent(eventId: string): Promise<(Shift & { staff?: User | null })[]>;
  getShiftsByStaff(staffId: string): Promise<(Shift & { event: Event })[]>;
  getAvailableShifts(): Promise<(Shift & { event: Event })[]>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: string, data: Partial<InsertShift>): Promise<Shift>;
  deleteShift(id: string): Promise<void>;

  getActiveTimeEntry(staffId: string): Promise<TimeEntry | undefined>;
  getTimeEntriesByStaff(staffId: string): Promise<(TimeEntry & { shift: Shift; event: Event })[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, data: Partial<InsertTimeEntry>): Promise<TimeEntry>;

  getAvailability(staffId: string): Promise<Availability[]>;
  setAvailability(entry: InsertAvailability): Promise<Availability>;

  getConversation(userId1: string, userId2: string): Promise<Message[]>;
  getConversations(userId: string): Promise<{ partnerId: string; partnerName: string; partnerAvatar: string | null; lastMessage: Message; unreadCount: number }[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markAsRead(userId: string, partnerId: string): Promise<void>;

  getReviewsByUser(userId: string): Promise<(Review & { shift: Shift; reviewer: User })[]>;
  getReviewsForEvent(eventId: string): Promise<(Review & { reviewer: User; reviewee: User })[]>;
  createReview(review: InsertReview): Promise<Review>;

  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  async getStaffProfile(userId: string): Promise<StaffProfile | undefined> {
    const [profile] = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, userId));
    return profile;
  }

  async upsertStaffProfile(profile: InsertStaffProfile): Promise<StaffProfile> {
    const [result] = await db
      .insert(staffProfiles)
      .values(profile)
      .onConflictDoUpdate({
        target: staffProfiles.userId,
        set: profile,
      })
      .returning();
    return result;
  }

  async getAllStaffProfiles(): Promise<(StaffProfile & { user: User })[]> {
    const results = await db
      .select()
      .from(staffProfiles)
      .innerJoin(users, eq(staffProfiles.userId, users.id));
    return results.map(r => ({ ...r.staff_profiles, user: r.users }));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEventWithShiftCounts(id: string): Promise<(Event & { shiftCount: number; confirmedCount: number }) | undefined> {
    const event = await this.getEvent(id);
    if (!event) return undefined;
    const shiftList = await db.select().from(shifts).where(eq(shifts.eventId, id));
    const shiftCount = shiftList.length;
    const confirmedCount = shiftList.filter(s => s.status === "confirmed").length;
    return { ...event, shiftCount, confirmedCount };
  }

  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.date));
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [result] = await db.insert(events).values(event).returning();
    return result;
  }

  async updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event> {
    const [result] = await db.update(events).set(data).where(eq(events.id, id)).returning();
    return result;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(shifts).where(eq(shifts.eventId, id));
    await db.delete(events).where(eq(events.id, id));
  }

  async getShift(id: string): Promise<Shift | undefined> {
    const [shift] = await db.select().from(shifts).where(eq(shifts.id, id));
    return shift;
  }

  async getShiftsByEvent(eventId: string): Promise<(Shift & { staff?: User | null })[]> {
    const results = await db
      .select()
      .from(shifts)
      .leftJoin(users, eq(shifts.staffId, users.id))
      .where(eq(shifts.eventId, eventId));
    return results.map(r => ({ ...r.shifts, staff: r.users || null }));
  }

  async getShiftsByStaff(staffId: string): Promise<(Shift & { event: Event })[]> {
    const results = await db
      .select()
      .from(shifts)
      .innerJoin(events, eq(shifts.eventId, events.id))
      .where(eq(shifts.staffId, staffId))
      .orderBy(desc(events.date));
    return results.map(r => ({ ...r.shifts, event: r.events }));
  }

  async getAvailableShifts(): Promise<(Shift & { event: Event })[]> {
    const results = await db
      .select()
      .from(shifts)
      .innerJoin(events, eq(shifts.eventId, events.id))
      .where(
        and(
          eq(shifts.status, "open"),
          or(
            eq(shifts.assignmentType, "publishing"),
            isNull(shifts.staffId)
          )
        )
      )
      .orderBy(asc(events.date));
    return results.map(r => ({ ...r.shifts, event: r.events }));
  }

  async createShift(shift: InsertShift): Promise<Shift> {
    const [result] = await db.insert(shifts).values(shift).returning();
    return result;
  }

  async updateShift(id: string, data: Partial<InsertShift>): Promise<Shift> {
    const [result] = await db.update(shifts).set({
      ...data,
      respondedAt: new Date(),
    }).where(eq(shifts.id, id)).returning();
    return result;
  }

  async deleteShift(id: string): Promise<void> {
    await db.delete(shifts).where(eq(shifts.id, id));
  }

  async getActiveTimeEntry(staffId: string): Promise<TimeEntry | undefined> {
    const [entry] = await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.staffId, staffId), eq(timeEntries.status, "active")));
    return entry;
  }

  async getTimeEntriesByStaff(staffId: string): Promise<(TimeEntry & { shift: Shift; event: Event })[]> {
    const results = await db
      .select()
      .from(timeEntries)
      .innerJoin(shifts, eq(timeEntries.shiftId, shifts.id))
      .innerJoin(events, eq(shifts.eventId, events.id))
      .where(eq(timeEntries.staffId, staffId))
      .orderBy(desc(timeEntries.clockIn));
    return results.map(r => ({ ...r.time_entries, shift: r.shifts, event: r.events }));
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const [result] = await db.insert(timeEntries).values(entry).returning();
    return result;
  }

  async updateTimeEntry(id: string, data: Partial<InsertTimeEntry>): Promise<TimeEntry> {
    const [result] = await db.update(timeEntries).set(data).where(eq(timeEntries.id, id)).returning();
    return result;
  }

  async getAvailability(staffId: string): Promise<Availability[]> {
    return await db
      .select()
      .from(availability)
      .where(eq(availability.staffId, staffId))
      .orderBy(desc(availability.date));
  }

  async setAvailability(entry: InsertAvailability): Promise<Availability> {
    const [result] = await db.insert(availability).values(entry).returning();
    return result;
  }

  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.recipientId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.recipientId, userId1))
        )
      )
      .orderBy(asc(messages.createdAt));
  }

  async getConversations(userId: string): Promise<{ partnerId: string; partnerName: string; partnerAvatar: string | null; lastMessage: Message; unreadCount: number }[]> {
    const sentMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.senderId, userId))
      .orderBy(desc(messages.createdAt));

    const receivedMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.recipientId, userId))
      .orderBy(desc(messages.createdAt));

    const allMessages = [...sentMessages, ...receivedMessages]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const partnerMap = new Map<string, { lastMessage: Message; unreadCount: number }>();

    for (const msg of allMessages) {
      const partnerId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      if (!partnerMap.has(partnerId)) {
        const unreadCount = receivedMessages.filter(
          m => m.senderId === partnerId && !m.isRead
        ).length;
        partnerMap.set(partnerId, { lastMessage: msg, unreadCount });
      }
    }

    const partnerIds = Array.from(partnerMap.keys());
    const partnerUsers = partnerIds.length > 0
      ? await db.select().from(users).where(
          sql`${users.id} = ANY(${partnerIds})`
        )
      : [];

    const userMap = new Map(partnerUsers.map(u => [u.id, u]));

    return Array.from(partnerMap.entries()).map(([partnerId, data]) => {
      const partner = userMap.get(partnerId);
      return {
        partnerId,
        partnerName: partner
          ? [partner.firstName, partner.lastName].filter(Boolean).join(" ") || partner.email || "Unknown"
          : "Unknown User",
        partnerAvatar: partner?.profileImageUrl || null,
        ...data,
      };
    });
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db.insert(messages).values(message).returning();
    return result;
  }

  async markAsRead(userId: string, partnerId: string): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.senderId, partnerId),
          eq(messages.recipientId, userId),
          eq(messages.isRead, false)
        )
      );
  }

  async getReviewsByUser(userId: string): Promise<(Review & { shift: Shift; reviewer: User })[]> {
    const results = await db
      .select()
      .from(reviews)
      .innerJoin(shifts, eq(reviews.shiftId, shifts.id))
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .where(eq(reviews.revieweeId, userId))
      .orderBy(desc(reviews.createdAt));
    return results.map(r => ({ ...r.reviews, shift: r.shifts, reviewer: r.users }));
  }

  async getReviewsForEvent(eventId: string): Promise<(Review & { reviewer: User; reviewee: User })[]> {
    const reviewerAlias = users;
    const results = await db
      .select()
      .from(reviews)
      .innerJoin(shifts, eq(reviews.shiftId, shifts.id))
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .where(eq(shifts.eventId, eventId))
      .orderBy(desc(reviews.createdAt));

    const revieweeIds = Array.from(new Set(results.map(r => r.reviews.revieweeId)));
    const revieweeUsers = revieweeIds.length > 0
      ? await db.select().from(users).where(sql`${users.id} = ANY(${revieweeIds})`)
      : [];
    const revieweeMap = new Map(revieweeUsers.map(u => [u.id, u]));

    return results.map(r => ({
      ...r.reviews,
      reviewer: r.users,
      reviewee: revieweeMap.get(r.reviews.revieweeId) || { id: r.reviews.revieweeId, email: null, firstName: null, lastName: null, profileImageUrl: null, createdAt: null, updatedAt: null },
    }));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [result] = await db.insert(reviews).values(review).returning();
    return result;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db.insert(notifications).values(notification).returning();
    return result;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result?.count || 0;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
}

export const storage = new DatabaseStorage();
