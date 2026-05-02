"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_js_1 = require("../db.js");
const parkingClient_js_1 = require("../parkingClient.js");
const pricing_js_1 = require("../pricing.js");
const middleware_js_1 = require("../middleware.js");
const router = (0, express_1.Router)();
const createSchema = zod_1.z.object({
    spaceId: zod_1.z.string().uuid(),
    startAt: zod_1.z.string().datetime(),
    endAt: zod_1.z.string().datetime(),
});
function mapBooking(row) {
    return {
        id: row.id,
        spaceId: row.space_id,
        hostUserId: row.host_user_id,
        driverUserId: row.driver_user_id,
        startAt: row.start_at,
        endAt: row.end_at,
        status: row.status,
        totalPriceCents: row.total_price_cents,
        createdAt: row.created_at,
    };
}
router.post("/bookings", (0, middleware_js_1.requireUserId)(), async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const { spaceId, startAt, endAt } = parsed.data;
    const start = new Date(startAt);
    const end = new Date(endAt);
    if (!(start < end)) {
        res.status(400).json({ error: "endAt must be after startAt" });
        return;
    }
    if (start < new Date()) {
        res.status(400).json({ error: "startAt must be in the future" });
        return;
    }
    let space;
    try {
        space = await (0, parkingClient_js_1.fetchSpaceById)(spaceId);
    }
    catch (e) {
        console.error(e);
        res.status(502).json({ error: "Could not verify parking space" });
        return;
    }
    if (!space) {
        res.status(404).json({ error: "Space not found" });
        return;
    }
    if (!space.isActive) {
        res.status(400).json({ error: "Space is not accepting bookings" });
        return;
    }
    if (space.ownerUserId === req.userId) {
        res.status(400).json({ error: "You cannot book your own space" });
        return;
    }
    const total = (0, pricing_js_1.computeTotalCents)(start, end, space.pricePerHourCents);
    if (total <= 0) {
        res.status(400).json({ error: "Duration too short for billing" });
        return;
    }
    const overlap = await db_js_1.pool.query(`SELECT id FROM bookings
     WHERE space_id = $1
       AND status = 'confirmed'
       AND start_at < $3 AND end_at > $2`, [spaceId, start.toISOString(), end.toISOString()]);
    if (overlap.rowCount && overlap.rowCount > 0) {
        res.status(409).json({ error: "That time range overlaps an existing booking" });
        return;
    }
    const insert = await db_js_1.pool.query(`INSERT INTO bookings (
       space_id, host_user_id, driver_user_id, start_at, end_at, status, total_price_cents
     ) VALUES ($1,$2,$3,$4,$5,'confirmed',$6)
     RETURNING *`, [spaceId, space.ownerUserId, req.userId, start.toISOString(), end.toISOString(), total]);
    res.status(201).json(mapBooking(insert.rows[0]));
});
router.get("/bookings", (0, middleware_js_1.requireUserId)(), async (req, res) => {
    const perspective = zod_1.z.enum(["driver", "host", "all"]).safeParse(req.query.perspective);
    const p = perspective.success ? perspective.data : "all";
    if (p === "driver" || p === "all") {
        const driver = await db_js_1.pool.query(`SELECT * FROM bookings WHERE driver_user_id = $1 ORDER BY start_at DESC`, [req.userId]);
        if (p === "driver") {
            res.json({ bookings: driver.rows.map(mapBooking) });
            return;
        }
        const host = await db_js_1.pool.query(`SELECT * FROM bookings WHERE host_user_id = $1 ORDER BY start_at DESC`, [req.userId]);
        res.json({
            asDriver: driver.rows.map(mapBooking),
            asHost: host.rows.map(mapBooking),
        });
        return;
    }
    const host = await db_js_1.pool.query(`SELECT * FROM bookings WHERE host_user_id = $1 ORDER BY start_at DESC`, [req.userId]);
    res.json({ bookings: host.rows.map(mapBooking) });
});
router.get("/bookings/:id", (0, middleware_js_1.requireUserId)(), async (req, res) => {
    const r = await db_js_1.pool.query(`SELECT * FROM bookings WHERE id = $1`, [req.params.id]);
    if (r.rowCount === 0) {
        res.status(404).json({ error: "Booking not found" });
        return;
    }
    const row = r.rows[0];
    if (row.driver_user_id !== req.userId && row.host_user_id !== req.userId) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    res.json(mapBooking(row));
});
router.patch("/bookings/:id/cancel", (0, middleware_js_1.requireUserId)(), async (req, res) => {
    const r = await db_js_1.pool.query(`SELECT * FROM bookings WHERE id = $1`, [req.params.id]);
    if (r.rowCount === 0) {
        res.status(404).json({ error: "Booking not found" });
        return;
    }
    const row = r.rows[0];
    if (row.driver_user_id !== req.userId && row.host_user_id !== req.userId) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    if (row.status !== "confirmed") {
        res.status(400).json({ error: "Booking cannot be cancelled" });
        return;
    }
    if (row.host_user_id === req.userId) {
        res.status(400).json({ error: "Host cancellation policy not implemented; contact support" });
        return;
    }
    const upd = await db_js_1.pool.query(`UPDATE bookings SET status = 'cancelled' WHERE id = $1 AND status = 'confirmed' RETURNING *`, [req.params.id]);
    if (upd.rowCount === 0) {
        res.status(400).json({ error: "Could not cancel" });
        return;
    }
    res.json(mapBooking(upd.rows[0]));
});
exports.default = router;
