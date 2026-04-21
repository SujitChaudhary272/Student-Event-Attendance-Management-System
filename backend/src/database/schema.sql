-- Student Event Attendance Management system
-- PostgreSQL schema for hackathon MVP

-- Safety: create extension for UUID if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Remove legacy audit table if it exists.
DROP TABLE IF EXISTS audit_trail;

-- =========================
-- USERS (Students/Admins)
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  auth_provider TEXT NOT NULL DEFAULT 'password',
  google_sub TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('Student','Admin')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- CLUBS (Organizing units)
-- =========================
CREATE TABLE IF NOT EXISTS clubs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  description TEXT,
  image TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- CLUB MEMBERS (Organizers)
-- =========================
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  club_id INT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Member' CHECK (role IN ('President','Secretary','Member')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- EVENTS
-- =========================
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  club_id INT REFERENCES clubs(id) ON DELETE SET NULL,
  organizer_id INT,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  venue TEXT,
  image_url TEXT,
  capacity INT DEFAULT 200,
  attendance_method TEXT NOT NULL DEFAULT 'QR_SINGLE'
    CHECK (attendance_method IN ('QR_SINGLE','QR_INOUT','OTP','MANUAL')),
  attendance_session_code TEXT,
  attendance_session_expires TIMESTAMP,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft','Created','Live','Completed','Archived')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- REGISTRATIONS
-- =========================
CREATE TABLE IF NOT EXISTS registrations (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Registered' CHECK (status IN ('Registered','Cancelled')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, student_id)
);

-- =========================
-- ATTENDANCE
-- =========================
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'Absent' CHECK (status IN ('Present','Absent')),
  verified_by_member_id INT REFERENCES members(id) ON DELETE SET NULL,
  method TEXT NOT NULL DEFAULT 'QR' CHECK (method IN ('QR','OTP','MANUAL')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, student_id)
);

-- =========================
-- CERTIFICATES
-- =========================
CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL DEFAULT 'Participation',
  verification_code TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, student_id)
);

-- =========================
-- SIMPLE REPORTING VIEW
-- =========================
CREATE OR REPLACE VIEW event_statistics AS
SELECT
  e.id AS event_id,
  e.title,
  e.status,
  e.start_time,
  e.end_time,
  COUNT(DISTINCT r.student_id) AS registrations,
  COUNT(DISTINCT a.student_id) FILTER (WHERE a.status = 'Present') AS attended,
  COUNT(DISTINCT cert.student_id) AS certified
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'Registered'
LEFT JOIN attendance a ON a.event_id = e.id
LEFT JOIN certificates cert ON cert.event_id = e.id
GROUP BY e.id;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance(event_id);
