import { Router, type IRouter } from "express";
import { db } from "../db";
import { requireAuth, requireAdmin, type AuthRequest } from "../lib/auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";

// ================= LOCAL ZOD SCHEMAS =================
const CreateStoreBody = z.object({
  storeName: z.string(),
  ownerName: z.string(),
  address: z.string(),
  city: z.string().optional(),
  latitude: z.union([z.number(), z.null()]).optional(),
  longitude: z.union([z.number(), z.null()]).optional(),
  imageUrl: z.union([z.string(), z.null()]).optional(),
  whatsappNumber: z.string().optional(),
  is24x7: z.boolean().optional(),
  discountPercentage: z.number(),
});

const UpdateStoreBody = CreateStoreBody.partial();

const ListStoresQueryParams = z.object({
  search: z.string().optional(),
  city: z.string().optional(),
  minDiscount: z.coerce.number().optional(),
  maxDiscount: z.coerce.number().optional(),
  is24x7: z.coerce.boolean().optional(),
});

// ================= FILE UPLOAD =================
const uploadsDir = path.resolve(process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads"));
const publicApiUrl = (process.env.PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
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
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

const router: IRouter = Router();

// ================= IMAGE =================
router.post("/upload/image", requireAuth, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image file provided" });
  res.json({
  url: `${publicApiUrl}/uploads/${req.file.filename}`,
});
});

router.get("/uploads/:filename", async (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
  res.sendFile(filePath);
});

// ================= GET STORES =================
router.get("/stores", async (req, res) => {
  const params = ListStoresQueryParams.safeParse(req.query);
  const { search, city, minDiscount, maxDiscount, is24x7 } = params.success ? params.data : {};

  let query = "SELECT * FROM stores WHERE status='approved'";
  const values: any[] = [];

  if (search) {
    query += " AND city LIKE ?";
    values.push(`%${search}%`);
  }
  if (city) {
    query += " AND city LIKE ?";
    values.push(`%${city}%`);
  }
  if (minDiscount != null) {
    query += " AND discount_percentage >= ?";
    values.push(minDiscount);
  }
  if (maxDiscount != null) {
    query += " AND discount_percentage <= ?";
    values.push(maxDiscount);
  }
  if (is24x7 === true) {
    query += " AND is_24x7 = 1";
  }

  const [rows]: any = await db.execute(query, values);
  res.json(rows);
});

// ================= CREATE =================
router.post("/stores", requireAuth, async (req: AuthRequest, res) => {
  const parsed = CreateStoreBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const user = req.user!;
  const d = parsed.data;

  const [result]: any = await db.execute(
    `INSERT INTO stores 
    (store_name, owner_name, address, city, latitude, longitude, image_url, whatsapp_number, is_24x7, discount_percentage, status, owner_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      d.storeName,
      d.ownerName,
      d.address,
      d.city ?? null,
      d.latitude ?? null,
      d.longitude ?? null,
      d.imageUrl ?? null,
      d.whatsappNumber ?? null,
      d.is24x7 ?? false,
      d.discountPercentage,
      user.id,
    ]
  );

  res.status(201).json({ id: result.insertId });
});




// ================= MY STORES =================
router.get("/stores/my", requireAuth, async (req: AuthRequest, res) => {
  const [rows]: any = await db.execute(
    "SELECT * FROM stores WHERE owner_id=? ORDER BY created_at DESC",
    [req.user!.id]
  );
  res.json(rows);
});

// ================= GET CITIES =================
router.get("/stores/cities", async (_req, res): Promise<void> => {
  try {
    const [rows]: any = await db.execute(
      "SELECT DISTINCT city FROM stores"
    );

    const cities = rows.map((r: any) => r.city);
    res.json(cities);
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ================= GET STORE BY ID =================
router.get("/stores/:id", async (req, res): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);

    const [rows]: any = await db.execute(
      "SELECT * FROM stores WHERE id = ?",
      [id]
    );

    const store = rows[0];

    if (!store) {
      res.status(404).json({ error: "Store not found" });
      return;
    }

    res.json(store);
  } catch (error) {
    console.error("Error fetching store by id:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// ================= UPDATE =================
router.patch("/stores/:id", requireAuth, async (req: AuthRequest, res) => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const parsed = UpdateStoreBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  const body = parsed.data;

  // 🔥 MAP camelCase → snake_case
  const mappedData: any = {
    store_name: body.storeName,
    owner_name: body.ownerName,
    address: body.address,
    city: body.city,
    latitude: body.latitude,
    longitude: body.longitude,
    image_url: body.imageUrl,
    whatsapp_number: body.whatsappNumber,
    is_24x7: body.is24x7,
    discount_percentage: body.discountPercentage,
  };

  // remove undefined fields (important for partial update)
  Object.keys(mappedData).forEach(
    (key) => mappedData[key] === undefined && delete mappedData[key]
  );

  if (Object.keys(mappedData).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  const fields = Object.keys(mappedData).map((k) => `${k}=?`);
  const values = Object.values(mappedData);

  await db.execute(
    `UPDATE stores SET ${fields.join(",")} WHERE id=?`,
    [...values, id] as any
  );

  res.json({ success: true });
});

// ================= DELETE =================
router.delete("/stores/:id", requireAuth, requireAdmin, async (req, res) => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  await db.execute("DELETE FROM stores WHERE id=?", [id]);
  res.sendStatus(204);
});

// ================= APPROVE =================
router.post("/stores/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  await db.execute(
    "UPDATE stores SET status='approved', rejection_reason=NULL WHERE id=?",
    [id]
  );

  res.json({ success: true });
});

// ================= REJECT =================
router.post("/stores/:id/reject", requireAuth, requireAdmin, async (req, res) => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const reason = req.body.reason ?? null;

  await db.execute(
    "UPDATE stores SET status='rejected', rejection_reason=? WHERE id=?",
    [reason, id]
  );

  res.json({ success: true });
});

// ================= ADMIN =================
router.get("/admin/stores", requireAuth, requireAdmin, async (_req, res) => {
  const [rows]: any = await db.execute("SELECT * FROM stores ORDER BY created_at DESC");
  res.json(rows);
});

router.get("/admin/stats", requireAuth, requireAdmin, async (_req, res) => {
  const [rows]: any = await db.execute("SELECT * FROM stores");

  const totalStores = rows.length;
  const pendingStores = rows.filter((s: any) => s.status === "pending").length;
  const approvedStores = rows.filter((s: any) => s.status === "approved").length;
  const rejectedStores = rows.filter((s: any) => s.status === "rejected").length;

  const discounts = rows.map((s: any) => Number(s.discount_percentage));
  const avg = discounts.length
    ? discounts.reduce((a: number, b: number) => a + b, 0) / discounts.length
    : 0;

  res.json({
    totalStores,
    pendingStores,
    approvedStores,
    rejectedStores,
    averageDiscount: avg,
    recentActivity: rows.slice(0, 10),
  });
});

export default router;
