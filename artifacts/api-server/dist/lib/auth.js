import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const JWT_SECRET = process.env.SESSION_SECRET ?? "fallback-secret-change-in-prod";
export function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
export async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}
export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}
export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const token = authHeader.slice(7);
    try {
        req.user = verifyToken(token);
        next();
    }
    catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}
export function requireAdmin(req, res, next) {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    if (req.user.role !== "admin") {
        res.status(403).json({ error: "Forbidden: admin only" });
        return;
    }
    next();
}
