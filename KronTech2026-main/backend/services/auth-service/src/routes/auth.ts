import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../db.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(120),
  role: z.enum(["driver", "host", "both"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(userId: string, email: string, role: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"],
  };
  return jwt.sign({ sub: userId, email, role }, secret, options);
}

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { email, password, displayName, role } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const insert = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, role)
       VALUES ($1, $2, $3, COALESCE($4, 'driver'))
       RETURNING id, email, display_name, role, created_at`,
      [email.toLowerCase(), passwordHash, displayName, role ?? null]
    );
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
  } catch (e: unknown) {
    const err = e as { code?: string };
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
  const found = await pool.query(
    `SELECT id, email, password_hash, display_name, role, created_at FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
  if (found.rowCount === 0) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const row = found.rows[0];
  const ok = await bcrypt.compare(password, row.password_hash);
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
    const payload = jwt.verify(token, secret) as {
      sub: string;
      email: string;
      role: string;
    };
    const found = await pool.query(
      `SELECT id, email, display_name, role, created_at FROM users WHERE id = $1`,
      [payload.sub]
    );
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
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
