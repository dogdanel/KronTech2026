"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.initDb = initDb;
const pg_1 = __importDefault(require("pg"));
const pool = new pg_1.default.Pool({
    connectionString: process.env.DATABASE_URL,
});
exports.pool = pool;
async function initDb() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      space_id UUID NOT NULL,
      host_user_id UUID NOT NULL,
      driver_user_id UUID NOT NULL,
      start_at TIMESTAMPTZ NOT NULL,
      end_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled', 'expired')),
      total_price_cents INTEGER NOT NULL CHECK (total_price_cents >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT bookings_time_order CHECK (end_at > start_at)
    );
    CREATE INDEX IF NOT EXISTS idx_bookings_space ON bookings(space_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_driver ON bookings(driver_user_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_host ON bookings(host_user_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
  `);
}
