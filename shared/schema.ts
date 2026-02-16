import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const staffProfiles = pgTable("staff_profiles", {
  userId: varchar("user_id").primaryKey(),
  role: text("role").notNull().default("staff"),
  phone: text("phone"),
  uniformSize: text("uniform_size"),
  certifications: text("certifications"),
  preferredRoles: text("preferred_roles"),
  minPayRate: integer("min_pay_rate"),
  maxDistance: integer("max_distance"),
  preferredAreas: text("preferred_areas"),
  readyPoolEnabled: boolean("ready_pool_enabled").notNull().default(true),
  assignmentPreference: text("assignment_preference").notNull().default("seekreply"),
  autoAcceptShifts: boolean("auto_accept_shifts").notNull().default(false),
  showAvailability: boolean("show_availability").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  pushNotifications: boolean("push_notifications").notNull().default(true),
  shiftReminders: boolean("shift_reminders").notNull().default(true),
  messageNotifications: boolean("message_notifications").notNull().default(true),
  scheduleUpdates: boolean("schedule_updates").notNull().default(true),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  venue: text("venue").notNull(),
  venueAddress: text("venue_address"),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  description: text("description"),
  uniformRequirements: text("uniform_requirements"),
  specialInstructions: text("special_instructions"),
  status: text("status").notNull().default("draft"),
  requiredStaff: integer("required_staff").notNull().default(0),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const shifts = pgTable("shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull(),
  staffId: varchar("staff_id"),
  role: text("role").notNull(),
  assignmentType: text("assignment_type").notNull(),
  status: text("status").notNull().default("open"),
  payRate: integer("pay_rate"),
  notes: text("notes"),
  breakMinutes: integer("break_minutes"),
  assignedAt: timestamp("assigned_at"),
  respondedAt: timestamp("responded_at"),
});

export const timeEntries = pgTable("time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shiftId: varchar("shift_id").notNull(),
  staffId: varchar("staff_id").notNull(),
  clockIn: timestamp("clock_in").notNull(),
  clockOut: timestamp("clock_out"),
  totalMinutes: integer("total_minutes"),
  breakMinutes: integer("break_minutes").default(0),
  notes: text("notes"),
  status: text("status").notNull().default("active"),
});

export const availability = pgTable("availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull(),
  date: timestamp("date").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull(),
  recipientId: varchar("recipient_id").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shiftId: varchar("shift_id").notNull(),
  reviewerId: varchar("reviewer_id").notNull(),
  revieweeId: varchar("reviewee_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  relatedId: varchar("related_id"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const eventsRelations = relations(events, ({ many }) => ({
  shifts: many(shifts),
}));

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  event: one(events, { fields: [shifts.eventId], references: [events.id] }),
  timeEntries: many(timeEntries),
  reviews: many(reviews),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  shift: one(shifts, { fields: [timeEntries.shiftId], references: [shifts.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  shift: one(shifts, { fields: [reviews.shiftId], references: [shifts.id] }),
}));

export const insertStaffProfileSchema = createInsertSchema(staffProfiles);
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertShiftSchema = createInsertSchema(shifts).omit({ id: true, assignedAt: true, respondedAt: true });
export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({ id: true });
export const insertAvailabilitySchema = createInsertSchema(availability).omit({ id: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

export type StaffProfile = typeof staffProfiles.$inferSelect;
export type InsertStaffProfile = z.infer<typeof insertStaffProfileSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
