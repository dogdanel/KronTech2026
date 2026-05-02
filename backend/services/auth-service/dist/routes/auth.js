"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const db_js_1 = require("../db.js");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    displayName: zod_1.z.string().min(1).max(120),
    role: zod_1.z.enum(["driver", "host", "both"]).optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
function signToken(userId, email, role) {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error("JWT_SECRET is required");
    const options = {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d"),
    };
    return jsonwebtoken_1.default.sign({ sub: userId, email, role }, secret, options);
}
router.post("/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const { email, password, displayName, role } = parsed.data;
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    try {
        const insert = await db_js_1.pool.query(`INSERT INTO users (email, password_hash, display_name, role)
       VALUES ($1, $2, $3, COALESCE($4, 'driver'))
       RETURNING id, email, display_name, role, created_at`, [email.toLowerCase(), passwordHash, displayName, role ?? null]);
        const row = insert.rows[0];
        const token = signToken(row.id, row.email, row.role);
        res.status(201).json({
            token,
            user: {
                id: row.id,
                email: row.email,
                displayName: row.display_name,
                role: row.role,
                createdAt: row.created_at,
            },
        });
    }
    catch (e) {
        const err = e;
        if (err.code === "23505") {
            res.status(409).json({ error: "Email already registered" });
            return;
        }
        console.error(e);
        res.status(500).json({ error: "Registration failed" });
    }
});
router.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const { email, password } = parsed.data;
    const found = await db_js_1.pool.query(`SELECT id, email, password_hash, display_name, role, created_at FROM users WHERE email = $1`, [email.toLowerCase()]);
    if (found.rowCount === 0) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }
    const row = found.rows[0];
    const ok = await bcryptjs_1.default.compare(password, row.password_hash);
    if (!ok) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }
    const token = signToken(row.id, row.email, row.role);
    res.json({
        token,
        user: {
            id: row.id,
            email: row.email,
            displayName: row.display_name,
            role: row.role,
            createdAt: row.created_at,
        },
    });
});
router.get("/me", async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing bearer token" });
        return;
    }
    const token = auth.slice("Bearer ".length);
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        res.status(500).json({ error: "Server misconfiguration" });
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, secret);
        const found = await db_js_1.pool.query(`SELECT id, email, display_name, role, created_at FROM users WHERE id = $1`, [payload.sub]);
        if (found.rowCount === 0) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        const row = found.rows[0];
        res.json({
            id: row.id,
            email: row.email,
            displayName: row.display_name,
            role: row.role,
            createdAt: row.created_at,
        });
    }
    catch {
        res.status(401).json({ error: "Invalid token" });
    }
});
exports.default = router;
