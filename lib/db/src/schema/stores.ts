import { z } from "zod";

// Validation schema (same fields as before)
export const insertStoreSchema = z.object({
  storeName: z.string(),
  ownerName: z.string(),
  address: z.string(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  imageUrl: z.string().optional(),
  whatsappNumber: z.string().optional(),
  is24x7: z.boolean().default(false),
  discountPercentage: z.number().default(0),
  status: z.string().default("pending"),
  rejectionReason: z.string().optional(),
  ownerId: z.number(),
});

// Types (same usage as before)
export type InsertStore = z.infer<typeof insertStoreSchema>;

export type Store = {
  id: number;
  storeName: string;
  ownerName: string;
  address: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  whatsappNumber?: string;
  is24x7: boolean;
  discountPercentage: number;
  status: string;
  rejectionReason?: string;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
};