"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../lib/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const zod_1 = require("zod");
// ================= LOCAL ZOD SCHEMAS =================
const CreateStoreBody = zod_1.z.object({
    storeName: zod_1.z.string(),
    ownerName: zod_1.z.string(),
    address: zod_1.z.string(),
    city: zod_1.z.string().optional(),
    latitude: zod_1.z.union([zod_1.z.number(), zod_1.z.null()]).optional(),
    longitude: zod_1.z.union([zod_1.z.number(), zod_1.z.null()]).optional(),
    imageUrl: zod_1.z.union([zod_1.z.string(), zod_1.z.null()]).optional(),
    whatsappNumber: zod_1.z.string().optional(),
    is24x7: zod_1.z.boolean().optional(),
    discountPercentage: zod_1.z.number(),
});
const UpdateStoreBody = CreateStoreBody.partial();
const ListStoresQueryParams = zod_1.z.object({
    search: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    minDiscount: zod_1.z.coerce.number().optional(),
    maxDiscount: zod_1.z.coerce.number().optional(),
    is24x7: zod_1.z.coerce.boolean().optional(),
});
// ================= FILE UPLOAD =================
const uploadsDir = path_1.default.resolve(process.env.UPLOADS_DIR ?? path_1.default.join(process.cwd(), "uploads"));
const publicApiUrl = (process.env.PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path_1.default.extname(file.originalname)}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/"))
            cb(null, true);
        else
            cb(new Error("Only images allowed"));
    },
});
const router = (0, express_1.Router)();
const toStoreResponse = (store) => ({
    ...store,
    storeName: store.storeName ?? store.store_name,
    ownerName: store.ownerName ?? store.owner_name,
    imageUrl: store.imageUrl ?? store.image_url,
    whatsappNumber: store.whatsappNumber ?? store.whatsapp_number,
    is24x7: typeof store.is24x7 === "boolean"
        ? store.is24x7
        : Boolean(store.is_24x7),
    discountPercentage: store.discountPercentage ?? store.discount_percentage,
    ownerId: store.ownerId ?? store.owner_id,
    createdAt: store.createdAt ?? store.created_at,
    updatedAt: store.updatedAt ?? store.updated_at,
    rejectionReason: store.rejectionReason ?? store.rejection_reason,
});
// ================= IMAGE =================
router.post("/upload/image", auth_1.requireAuth, upload.single("image"), async (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: "No image file provided" });
        return;
    }
    res.json({
        url: `${publicApiUrl}/uploads/${req.file.filename}`,
    });
});
router.get("/uploads/:filename", async (req, res) => {
    const filePath = path_1.default.join(uploadsDir, req.params.filename);
    if (!fs_1.default.existsSync(filePath)) {
        res.status(404).json({ error: "File not found" });
        return;
    }
    res.sendFile(filePath);
});
// ================= GET STORES =================
router.get("/stores", async (req, res) => {
    const params = ListStoresQueryParams.safeParse(req.query);
    const { search, city, minDiscount, maxDiscount, is24x7 } = params.success ? params.data : {};
    let query = "SELECT * FROM stores WHERE status='approved'";
    const values = [];
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
    const [rows] = await db_1.db.execute(query, values);
    res.json(rows.map(toStoreResponse));
});
// ================= CREATE =================
router.post("/stores", auth_1.requireAuth, async (req, res) => {
    const parsed = CreateStoreBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const user = req.user;
    const d = parsed.data;
    const [result] = await db_1.db.execute(`INSERT INTO stores 
    (store_name, owner_name, address, city, latitude, longitude, image_url, whatsapp_number, is_24x7, discount_percentage, status, owner_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`, [
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
    ]);
    res.status(201).json({ id: result.insertId });
});
// ================= MY STORES =================
router.get("/stores/my", auth_1.requireAuth, async (req, res) => {
    const [rows] = await db_1.db.execute("SELECT * FROM stores WHERE owner_id=? ORDER BY created_at DESC", [req.user.id]);
    res.json(rows.map(toStoreResponse));
});
// ================= GET CITIES =================
router.get("/stores/cities", async (_req, res) => {
    try {
        const [rows] = await db_1.db.execute("SELECT DISTINCT city FROM stores");
        const cities = rows.map((r) => r.city);
        res.json(cities);
    }
    catch (error) {
        console.error("Error fetching cities:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// ================= GET STORE BY ID =================
router.get("/stores/:id", async (req, res) => {
    try {
        const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(rawId, 10);
        const [rows] = await db_1.db.execute("SELECT * FROM stores WHERE id = ?", [id]);
        const store = rows[0];
        if (!store) {
            res.status(404).json({ error: "Store not found" });
            return;
        }
        res.json(toStoreResponse(store));
    }
    catch (error) {
        console.error("Error fetching store by id:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// ================= UPDATE =================
router.patch("/stores/:id", auth_1.requireAuth, async (req, res) => {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    const parsed = UpdateStoreBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const body = parsed.data;
    // 🔥 MAP camelCase → snake_case
    const mappedData = {
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
    Object.keys(mappedData).forEach((key) => mappedData[key] === undefined && delete mappedData[key]);
    if (Object.keys(mappedData).length === 0) {
        res.status(400).json({ error: "No fields to update" });
        return;
    }
    const fields = Object.keys(mappedData).map((k) => `${k}=?`);
    const values = Object.values(mappedData);
    await db_1.db.execute(`UPDATE stores SET ${fields.join(",")} WHERE id=?`, [...values, id]);
    res.json({ success: true });
});
// ================= DELETE =================
router.delete("/stores/:id", auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    await db_1.db.execute("DELETE FROM stores WHERE id=?", [id]);
    res.sendStatus(204);
});
// ================= APPROVE =================
router.post("/stores/:id/approve", auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    await db_1.db.execute("UPDATE stores SET status='approved', rejection_reason=NULL WHERE id=?", [id]);
    res.json({ success: true });
});
// ================= REJECT =================
router.post("/stores/:id/reject", auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    const reason = req.body.reason ?? null;
    await db_1.db.execute("UPDATE stores SET status='rejected', rejection_reason=? WHERE id=?", [reason, id]);
    res.json({ success: true });
});
// ================= ADMIN =================
router.get("/admin/stores", auth_1.requireAuth, auth_1.requireAdmin, async (_req, res) => {
    const [rows] = await db_1.db.execute("SELECT * FROM stores ORDER BY created_at DESC");
    res.json(rows);
});
router.get("/admin/stats", auth_1.requireAuth, auth_1.requireAdmin, async (_req, res) => {
    const [rows] = await db_1.db.execute("SELECT * FROM stores");
    const totalStores = rows.length;
    const pendingStores = rows.filter((s) => s.status === "pending").length;
    const approvedStores = rows.filter((s) => s.status === "approved").length;
    const rejectedStores = rows.filter((s) => s.status === "rejected").length;
    const discounts = rows.map((s) => Number(s.discount_percentage));
    const avg = discounts.length
        ? discounts.reduce((a, b) => a + b, 0) / discounts.length
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
exports.default = router;
