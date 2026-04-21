import pkg from "pg";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./env.js";

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 10
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL Connected");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL error:", err);
  process.exit(1);
});

// Utility function
export const query = (text, params) => pool.query(text, params);

export const initializeDatabase = async () => {
  const schemaPath = path.resolve(__dirname, "../database/schema.sql");
  const schemaSql = await readFile(schemaPath, "utf8");
  await pool.query(schemaSql);
  await pool.query(`
    ALTER TABLE members DROP CONSTRAINT IF EXISTS members_role_check;
    ALTER TABLE members
    ADD CONSTRAINT members_role_check
    CHECK (role IN ('President','Secretary','Member'));
  `);
  await pool.query(`
    ALTER TABLE events DROP CONSTRAINT IF EXISTS events_organizer_id_fkey;
    ALTER TABLE events ADD COLUMN IF NOT EXISTS venue TEXT;
    ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;
    ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 200;
    ALTER TABLE events ADD COLUMN IF NOT EXISTS attendance_session_code TEXT;
    ALTER TABLE events ADD COLUMN IF NOT EXISTS attendance_session_expires TIMESTAMP;
    ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
    ALTER TABLE events
    ADD CONSTRAINT events_status_check
    CHECK (status IN ('Draft','Created','Live','Completed','Archived'));
  `);
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'password';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT UNIQUE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_no TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS year TEXT;
  `);
  await pool.query(`
    UPDATE users
    SET auth_provider = 'password'
    WHERE auth_provider IS NULL OR auth_provider = '';
  `);
  await pool.query(`
    ALTER TABLE attendance ADD COLUMN IF NOT EXISTS day DATE;
    ALTER TABLE attendance ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_event_id_student_id_key;
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_attendance_event_day_student
    ON attendance (event_id, day, student_id);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_qr_sessions (
      id SERIAL PRIMARY KEY,
      event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      day DATE NOT NULL,
      qr_type TEXT NOT NULL CHECK (qr_type IN ('ENTRY', 'EXIT')),
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_qr_scans (
      id SERIAL PRIMARY KEY,
      event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      day DATE NOT NULL,
      student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      qr_type TEXT NOT NULL CHECK (qr_type IN ('ENTRY', 'EXIT')),
      scanned_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(event_id, day, student_id, qr_type)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_scan_student_snapshot (
      id SERIAL PRIMARY KEY,
      event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      day DATE NOT NULL,
      student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT,
      email TEXT,
      roll_no TEXT,
      department TEXT,
      phone TEXT,
      gender TEXT,
      year TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(event_id, day, student_id)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS club_student_profiles (
      id SERIAL PRIMARY KEY,
      club_id INT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
      student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      roll_no TEXT,
      department TEXT,
      phone TEXT,
      gender TEXT,
      year TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(club_id, student_id)
    );
  `);
};
