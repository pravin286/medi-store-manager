import { Router, type IRouter } from "express";
import { db } from "../db";
import { z } from "zod";
import {
  signToken,
  hashPassword,
  comparePassword,
  requireAuth,
  type AuthRequest,
} from "../lib/auth";

const router: IRouter = Router();

// ================= ZOD SCHEMAS =================
const SignupBody = z.object({
  email: z.string().email(),
  password: z.string(),
  name: z.string(),
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string(),
});

// ================= SIGNUP =================
router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password, name } = parsed.data;

  const [existing]: any = await db.execute(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  if (existing.length > 0) {
    res.status(409).json({ error: "Email already exists" });
    return;
  }

  const passwordHash = await hashPassword(password);

  // ✅ FIXED HERE
  const [result]: any = await db.execute(
    "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'owner')",
    [email, passwordHash, name]
  );

  const userId = result.insertId;

  const token = signToken({
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
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [rows]: any = await db.execute(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  const user = rows[0];

  if (!user || user.role !== "owner") {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  // ✅ FIXED HERE
  const valid = await comparePassword(password, user.password_hash);

  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({
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
router.post("/auth/admin/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [rows]: any = await db.execute(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  const user = rows[0];

  if (!user || user.role !== "admin") {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  // ✅ FIXED HERE
  const valid = await comparePassword(password, user.password_hash);

  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({
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
router.get("/auth/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const user = req.user!;

  const [rows]: any = await db.execute(
    "SELECT * FROM users WHERE id = ?",
    [user.id]
  );

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

export default router;