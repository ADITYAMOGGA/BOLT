import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  code: varchar("code", { length: 6 }).notNull().unique(),
  password: text("password"), // Legacy - keeping for compatibility
  passwordHash: text("password_hash"), // Hashed password for security
  passwordProtected: integer("password_protected").notNull().default(0), // Boolean as integer
  maxDownloads: integer("max_downloads"), // Optional download limit
  downloadCount: integer("download_count").notNull().default(0),
  expirationType: varchar("expiration_type", { length: 20 }).notNull().default('24h'), // 1h, 6h, 24h, 7d, 30d, never
  customMessage: text("custom_message"), // Custom message for recipients
  userId: varchar("user_id"), // Optional - files can be anonymous or owned by user
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  expiresAt: timestamp("expires_at").notNull(),
});

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  password: z.string().min(4, "Password must be at least 4 characters"),
});

export const loginUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

// File schemas
export const insertFileSchema = createInsertSchema(files).pick({
  originalName: true,
  mimeType: true,
  size: true,
  password: true,
  passwordProtected: true,
  maxDownloads: true,
  expirationType: true,
  customMessage: true,
  userId: true,
}).extend({
  password: z.string().optional(),
  maxDownloads: z.number().min(1).max(1000).optional(),
  expirationType: z.enum(['1h', '6h', '24h', '7d', '30d', 'never']).default('24h'),
  customMessage: z.string().max(500).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
