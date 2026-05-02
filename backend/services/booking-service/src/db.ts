import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDb(): Promise<void> {
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

export { pool };
