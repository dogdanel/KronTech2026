import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireInternalSecret, requireUserId } from "../middleware.js";

const router = Router();

const createSchema = z.object({
  title: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  pricePerHourCents: z.number().int().min(0),
  description: z.string().max(5000).optional(),
});

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  address: z.string().min(1).max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  pricePerHourCents: z.number().int().min(0).optional(),
  description: z.string().max(5000).optional(),
  isActive: z.boolean().optional(),
});

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    title: row.title,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    pricePerHourCents: row.price_per_hour_cents,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get("/spaces", async (_req, res) => {
  const r = await pool.query(
    `SELECT * FROM parking_spaces WHERE is_active = TRUE ORDER BY created_at DESC`
  );
  res.json({ spaces: r.rows.map(mapRow) });
});

router.get("/spaces/:id", async (req, res) => {
  const r = await pool.query(`SELECT * FROM parking_spaces WHERE id = $1`, [
    req.params.id,
  ]);
  if (r.rowCount === 0) {
    res.status(404).json({ error: "Space not found" });
    return;
  }
  res.json(mapRow(r.rows[0]));
});

router.post("/spaces", requireUserId(), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const b = parsed.data;
  const insert = await pool.query(
    `INSERT INTO parking_spaces (
       owner_user_id, title, address, latitude, longitude, price_per_hour_cents, description
     ) VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      req.userId,
      b.title,
      b.address,
      b.latitude,
      b.longitude,
      b.pricePerHourCents,
      b.description ?? "",
    ]
  );
  res.status(201).json(mapRow(insert.rows[0]));
});

router.patch("/spaces/:id", requireUserId(), async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const existing = await pool.query(
    `SELECT * FROM parking_spaces WHERE id = $1`,
    [req.params.id]
  );
  if (existing.rowCount === 0) {
    res.status(404).json({ error: "Space not found" });
    return;
  }
  const row = existing.rows[0];
  if (row.owner_user_id !== req.userId) {
    res.status(403).json({ error: "Not the owner of this space" });
    return;
  }
  const b = parsed.data;
  const updated = await pool.query(
    `UPDATE parking_spaces SET
       title = COALESCE($2, title),
       address = COALESCE($3, address),
       latitude = COALESCE($4, latitude),
       longitude = COALESCE($5, longitude),
       price_per_hour_cents = COALESCE($6, price_per_hour_cents),
       description = COALESCE($7, description),
       is_active = COALESCE($8, is_active),
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      req.params.id,
      b.title ?? null,
      b.address ?? null,
      b.latitude ?? null,
      b.longitude ?? null,
      b.pricePerHourCents ?? null,
      b.description ?? null,
      b.isActive ?? null,
    ]
  );
  res.json(mapRow(updated.rows[0]));
});

router.get("/internal/spaces/:id", requireInternalSecret(), async (req, res) => {
  const r = await pool.query(`SELECT * FROM parking_spaces WHERE id = $1`, [
    req.params.id,
  ]);
  if (r.rowCount === 0) {
    res.status(404).json({ error: "Space not found" });
    return;
  }
  res.json(mapRow(r.rows[0]));
});

export default router;
