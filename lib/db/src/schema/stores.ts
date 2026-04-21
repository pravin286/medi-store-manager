import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const storesTable = pgTable("stores", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull(),
  ownerName: text("owner_name").notNull(),
  address: text("address").notNull(),
  city: text("city"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  imageUrl: text("image_url"),
  whatsappNumber: text("whatsapp_number"),
  discountPercentage: numeric("discount_percentage", { precision: 5, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStoreSchema = createInsertSchema(storesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof storesTable.$inferSelect;
