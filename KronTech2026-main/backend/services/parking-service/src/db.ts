import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS parking_spaces (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_user_id UUID NOT NULL,
      title TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      price_per_hour_cents INTEGER NOT NULL CHECK (price_per_hour_cents >= 0),
      description TEXT NOT NULL DEFAULT '',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_spaces_owner ON parking_spaces(owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_spaces_active ON parking_spaces(is_active);
  `);
}

export { pool };
