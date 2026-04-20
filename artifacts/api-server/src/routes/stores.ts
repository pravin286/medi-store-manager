import { Router, type IRouter } from "express";
import { db, storesTable } from "@workspace/db";
import { eq, and, ilike, gte, lte, avg, count, desc } from "drizzle-orm";
import {
  CreateStoreBody,
  UpdateStoreBody,
  GetStoreParams,
  UpdateStoreParams,
  DeleteStoreParams,
  ApproveStoreParams,
  RejectStoreParams,
  RejectStoreBody,
  ListStoresQueryParams,
  AdminListStoresQueryParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin, type AuthRequest } from "../lib/auth";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed"));
    }
  },
});

function formatStore(store: typeof storesTable.$inferSelect) {
  return {
    id: store.id,
    storeName: store.storeName,
    ownerName: store.ownerName,
    address: store.address,
    latitude: store.latitude != null ? Number(store.latitude) : null,
    longitude: store.longitude != null ? Number(store.longitude) : null,
    imageUrl: store.imageUrl,
    discountPercentage: Number(store.discountPercentage),
    status: store.status,
    rejectionReason: store.rejectionReason,
    ownerId: store.ownerId,
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
  };
}

const router: IRouter = Router();

router.post("/upload/image", requireAuth, upload.single("image"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }
  const url = `/api/uploads/${req.file.filename}`;
  res.json({ url });
});

router.get("/uploads/:filename", async (req, res): Promise<void> => {
  const rawFilename = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
  const filePath = path.join(uploadsDir, rawFilename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.sendFile(filePath);
});

router.get("/stores", async (req, res): Promise<void> => {
  const params = ListStoresQueryParams.safeParse(req.query);
  const search = params.success ? params.data.search : undefined;
  const minDiscount = params.success ? params.data.minDiscount : undefined;
  const maxDiscount = params.success ? params.data.maxDiscount : undefined;

  let query = db.select().from(storesTable).where(
    and(
      eq(storesTable.status, "approved"),
      search ? ilike(storesTable.storeName, `%${search}%`) : undefined,
      minDiscount != null ? gte(storesTable.discountPercentage, String(minDiscount)) : undefined,
      maxDiscount != null ? lte(storesTable.discountPercentage, String(maxDiscount)) : undefined,
    )
  ).$dynamic();

  const stores = await query;
  res.json(stores.map(formatStore));
});

router.post("/stores", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateStoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = req.user!;
  const { storeName, ownerName, address, latitude, longitude, imageUrl, discountPercentage } = parsed.data;

  const [store] = await db.insert(storesTable).values({
    storeName,
    ownerName,
    address,
    latitude: latitude != null ? String(latitude) : null,
    longitude: longitude != null ? String(longitude) : null,
    imageUrl: imageUrl ?? null,
    discountPercentage: String(discountPercentage),
    status: "pending",
    ownerId: user.id,
  }).returning();

  res.status(201).json(formatStore(store));
});

router.get("/stores/my", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const user = req.user!;
  const stores = await db.select().from(storesTable).where(eq(storesTable.ownerId, user.id)).orderBy(desc(storesTable.createdAt));
  res.json(stores.map(formatStore));
});

router.get("/stores/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetStoreParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [store] = await db.select().from(storesTable).where(eq(storesTable.id, params.data.id));
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  res.json(formatStore(store));
});

router.patch("/stores/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsResult = UpdateStoreParams.safeParse({ id: parseInt(rawId, 10) });
  if (!paramsResult.success) {
    res.status(400).json({ error: paramsResult.error.message });
    return;
  }

  const parsed = UpdateStoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = req.user!;
  const [existing] = await db.select().from(storesTable).where(eq(storesTable.id, paramsResult.data.id));
  if (!existing) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  if (user.role !== "admin" && existing.ownerId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const updateData: Partial<typeof storesTable.$inferInsert> = {};
  if (parsed.data.storeName != null) updateData.storeName = parsed.data.storeName;
  if (parsed.data.ownerName != null) updateData.ownerName = parsed.data.ownerName;
  if (parsed.data.address != null) updateData.address = parsed.data.address;
  if (parsed.data.latitude !== undefined) updateData.latitude = parsed.data.latitude != null ? String(parsed.data.latitude) : null;
  if (parsed.data.longitude !== undefined) updateData.longitude = parsed.data.longitude != null ? String(parsed.data.longitude) : null;
  if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;
  if (parsed.data.discountPercentage != null) updateData.discountPercentage = String(parsed.data.discountPercentage);

  const [updated] = await db.update(storesTable).set(updateData).where(eq(storesTable.id, paramsResult.data.id)).returning();
  res.json(formatStore(updated));
});

router.delete("/stores/:id", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteStoreParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(storesTable).where(eq(storesTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/stores/:id/approve", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ApproveStoreParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [updated] = await db.update(storesTable)
    .set({ status: "approved", rejectionReason: null })
    .where(eq(storesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  res.json(formatStore(updated));
});

router.post("/stores/:id/reject", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RejectStoreParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const bodyParsed = RejectStoreBody.safeParse(req.body);
  const reason = bodyParsed.success ? bodyParsed.data.reason : undefined;

  const [updated] = await db.update(storesTable)
    .set({ status: "rejected", rejectionReason: reason ?? null })
    .where(eq(storesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  res.json(formatStore(updated));
});

router.get("/admin/stores", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const params = AdminListStoresQueryParams.safeParse(req.query);
  const status = params.success ? params.data.status : undefined;
  const search = params.success ? params.data.search : undefined;

  const stores = await db.select().from(storesTable).where(
    and(
      status ? eq(storesTable.status, status) : undefined,
      search ? ilike(storesTable.storeName, `%${search}%`) : undefined,
    )
  ).orderBy(desc(storesTable.createdAt));

  res.json(stores.map(formatStore));
});

router.get("/admin/stats", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const allStores = await db.select().from(storesTable);
  const totalStores = allStores.length;
  const pendingStores = allStores.filter((s) => s.status === "pending").length;
  const approvedStores = allStores.filter((s) => s.status === "approved").length;
  const rejectedStores = allStores.filter((s) => s.status === "rejected").length;
  const discounts = allStores.map((s) => Number(s.discountPercentage)).filter((d) => !isNaN(d));
  const averageDiscount = discounts.length > 0 ? discounts.reduce((a, b) => a + b, 0) / discounts.length : 0;

  const recentActivity = allStores
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10)
    .map(formatStore);

  res.json({ totalStores, pendingStores, approvedStores, rejectedStores, averageDiscount, recentActivity });
});

export default router;
