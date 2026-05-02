"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_js_1 = require("../db.js");
const middleware_js_1 = require("../middleware.js");
const router = (0, express_1.Router)();
const createSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    address: zod_1.z.string().min(1).max(500),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    pricePerHourCents: zod_1.z.number().int().min(0),
    description: zod_1.z.string().max(5000).optional(),
});
const patchSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    address: zod_1.z.string().min(1).max(500).optional(),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    pricePerHourCents: zod_1.z.number().int().min(0).optional(),
    description: zod_1.z.string().max(5000).optional(),
    isActive: zod_1.z.boolean().optional(),
});
function mapRow(row) {
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
    const r = await db_js_1.pool.query(`SELECT * FROM parking_spaces WHERE is_active = TRUE ORDER BY created_at DESC`);
    res.json({ spaces: r.rows.map(mapRow) });
});
router.get("/spaces/:id", async (req, res) => {
    const r = await db_js_1.pool.query(`SELECT * FROM parking_spaces WHERE id = $1`, [
        req.params.id,
    ]);
    if (r.rowCount === 0) {
        res.status(404).json({ error: "Space not found" });
        return;
    }
    res.json(mapRow(r.rows[0]));
});
router.post("/spaces", (0, middleware_js_1.requireUserId)(), async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const b = parsed.data;
    const insert = await db_js_1.pool.query(`INSERT INTO parking_spaces (
       owner_user_id, title, address, latitude, longitude, price_per_hour_cents, description
     ) VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`, [
        req.userId,
        b.title,
        b.address,
        b.latitude,
        b.longitude,
        b.pricePerHourCents,
        b.description ?? "",
    ]);
    res.status(201).json(mapRow(insert.rows[0]));
});
router.patch("/spaces/:id", (0, middleware_js_1.requireUserId)(), async (req, res) => {
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const existing = await db_js_1.pool.query(`SELECT * FROM parking_spaces WHERE id = $1`, [req.params.id]);
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
    const updated = await db_js_1.pool.query(`UPDATE parking_spaces SET
       title = COALESCE($2, title),
       address = COALESCE($3, address),
       latitude = COALESCE($4, latitude),
       longitude = COALESCE($5, longitude),
       price_per_hour_cents = COALESCE($6, price_per_hour_cents),
       description = COALESCE($7, description),
       is_active = COALESCE($8, is_active),
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`, [
        req.params.id,
        b.title ?? null,
        b.address ?? null,
        b.latitude ?? null,
        b.longitude ?? null,
        b.pricePerHourCents ?? null,
        b.description ?? null,
        b.isActive ?? null,
    ]);
    res.json(mapRow(updated.rows[0]));
});
router.get("/internal/spaces/:id", (0, middleware_js_1.requireInternalSecret)(), async (req, res) => {
    const r = await db_js_1.pool.query(`SELECT * FROM parking_spaces WHERE id = $1`, [
        req.params.id,
    ]);
    if (r.rowCount === 0) {
        res.status(404).json({ error: "Space not found" });
        return;
    }
    res.json(mapRow(r.rows[0]));
});
exports.default = router;
