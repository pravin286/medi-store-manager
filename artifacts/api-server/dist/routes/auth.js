"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const zod_1 = require("zod");
const auth_1 = require("../lib/auth");
const router = (0, express_1.Router)();
// ================= ZOD SCHEMAS =================
const SignupBody = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
    name: zod_1.z.string(),
});
const LoginBody = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
// ================= SIGNUP =================
router.post("/auth/signup", async (req, res) => {
    const parsed = SignupBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const { email, password, name } = parsed.data;
    const [existing] = await db_1.db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
        res.status(409).json({ error: "Email already exists" });
        return;
    }
    const passwordHash = await (0, auth_1.hashPassword)(password);
    // ✅ FIXED HERE
    const [result] = await db_1.db.execute("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'owner')", [email, passwordHash, name]);
    const userId = result.insertId;
    const token = (0, auth_1.signToken)({
        id: userId,
        email,
        name,
        role: "owner",
    });
    res.status(201).json({
        token,
        user: {
            id: userId,
            email,
            name,
            role: "owner",
        },
    });
});
// ================= LOGIN =================
router.post("/auth/login", async (req, res) => {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const { email, password } = parsed.data;
    const [rows] = await db_1.db.execute("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user || user.role !== "owner") {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }
    // ✅ FIXED HERE
    const valid = await (0, auth_1.comparePassword)(password, user.password_hash);
    if (!valid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }
    const token = (0, auth_1.signToken)({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    });
    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.created_at,
        },
    });
});
// ================= ADMIN LOGIN =================
router.post("/auth/admin/login", async (req, res) => {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const { email, password } = parsed.data;
    const [rows] = await db_1.db.execute("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user || user.role !== "admin") {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }
    // ✅ FIXED HERE
    const valid = await (0, auth_1.comparePassword)(password, user.password_hash);
    if (!valid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }
    const token = (0, auth_1.signToken)({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    });
    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.created_at,
        },
    });
});
// ================= CURRENT USER =================
router.get("/auth/me", auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const [rows] = await db_1.db.execute("SELECT * FROM users WHERE id = ?", [user.id]);
    const dbUser = rows[0];
    if (!dbUser) {
        res.status(401).json({ error: "User not found" });
        return;
    }
    res.json({
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        createdAt: dbUser.created_at,
    });
});
exports.default = router;
