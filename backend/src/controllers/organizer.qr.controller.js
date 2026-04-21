import crypto from "crypto";
import { pool } from "../config/db.js";

function formatDayKey(dateLike) {
  const date = new Date(dateLike);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const openEventQr = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { qr_type = "ENTRY", day } = req.body;
    const { clubId } = req.user;

    if (!["ENTRY", "EXIT"].includes(qr_type)) {
      return res.status(400).json({ error: "qr_type must be ENTRY or EXIT" });
    }

    const ev = await pool.query(
      `
      SELECT id, club_id, title, start_time, end_time, status
      FROM events
      WHERE id = $1
      `,
      [eventId]
    );

    if (!ev.rows.length) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = ev.rows[0];
    if (String(event.club_id) !== String(clubId)) {
      return res.status(403).json({ error: "Not allowed for this club event" });
    }

    if (event.status === "Archived") {
      return res.status(400).json({ error: "Archived events cannot open QR attendance" });
    }

    const now = new Date();
    const eventStart = new Date(event.start_time);
    const archiveAt = new Date(new Date(event.end_time).getTime() + 7 * 24 * 60 * 60 * 1000);

    if (now < eventStart) {
      return res.status(400).json({ error: "QR can be opened after the event starts" });
    }

    if (now > archiveAt) {
      return res.status(400).json({ error: "QR is no longer valid for archived attendance" });
    }

    const dayKey = day || formatDayKey(now);
    const existingSessionRes = await pool.query(
      `
      SELECT id, token, expires_at, is_active, created_at
      FROM event_qr_sessions
      WHERE event_id = $1
        AND day = $2::date
        AND qr_type = $3
        AND expires_at >= NOW()
      ORDER BY created_at DESC, id DESC
      LIMIT 1
      `,
      [eventId, dayKey, qr_type]
    );

    if (existingSessionRes.rows.length) {
      const existing = existingSessionRes.rows[0];

      if (!existing.is_active) {
        await pool.query(
          `
          UPDATE event_qr_sessions
          SET is_active = true
          WHERE id = $1
          `,
          [existing.id]
        );
      }

      return res.json({
        message: "Existing event QR returned successfully",
        token: existing.token,
        expiresAt: existing.expires_at,
        qr_type,
        day: dayKey,
        reused: true,
        event: {
          id: event.id,
          title: event.title,
        },
      });
    }

    const token = crypto.randomBytes(18).toString("hex");

    await pool.query(
      `
      INSERT INTO event_qr_sessions (event_id, day, qr_type, token, expires_at, is_active)
      VALUES ($1, $2::date, $3, $4, $5, true)
      `,
      [eventId, dayKey, qr_type, token, archiveAt]
    );

    return res.json({
      message: "Event QR opened successfully",
      token,
      expiresAt: archiveAt,
      qr_type,
      day: dayKey,
      reused: false,
      event: {
        id: event.id,
        title: event.title,
      },
    });
  } catch (err) {
    console.error("openEventQr error:", err);
    return res.status(500).json({ error: "Failed to open QR" });
  }
};
