import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core"

export const shifts = sqliteTable("shifts", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text("location").notNull(),
  color: text("color"),
  specialty: text("specialty"),
  shiftType: text("shift_type"),
  paymentAmount: real("payment_amount"),
  paymentStatus: text("payment_status"),
  notes: text("notes"),
})

export const monthlyTargets = sqliteTable("monthly_targets", {
  id: text("id").primaryKey(), // key: year-month
  year: text("year").notNull(),
  month: text("month").notNull(),
  expected: real("expected").notNull().default(0),
  actual: real("actual").notNull().default(0),
})

export const savedLocations = sqliteTable("saved_locations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  usageCount: integer("usage_count").notNull().default(0),
})
