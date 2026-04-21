import { pool } from "../config/db.js";
import { issueCertificatesForEventIfCompleted } from "../services/autoCertificateJob.js";

/**
 * Status lifecycle (NO Draft):
 * Created -> Live -> Completed -> Archived
 *
 * Auto rules:
 * - if status is Archived: keep Archived forever
 * - if now < start_time => Created
 * - if start_time <= now < end_time => Live
 * - if now >= end_time => Completed
 * - if now >= end_time + 7 days => Archived (storage rule)
 */
const computeStatus = (current, start, end) => {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);

  // Keep Archived as final
  if (current === "Archived") return "Archived";

  // If times are invalid, keep current or fallback
  if (isNaN(s.getTime()) || isNaN(e.getTime())) {
    return current || "Created";
  }

  if (now < s) return "Created";

  if (now >= s && now < e) return "Live";

  // now >= end => Completed or Archived (after storage rule)
  const daysAfterEnd = (now - e) / (1000 * 60 * 60 * 24);
  if (daysAfterEnd >= 7) return "Archived";

  return "Completed";
};

// List events for organizer's club (auto transitions)
export const getMyClubEvents = async (req, res) => {
  try {
    const { clubId } = req.user;

    const r = await pool.query(
      `
      SELECT 
        e.*,
        COALESCE(rg.registered_count, 0)::int AS registered_count,
        COALESCE(att.present_total, 0)::int AS present_total
      FROM events e
      LEFT JOIN (
        SELECT event_id, COUNT(*) AS registered_count
        FROM registrations
        GROUP BY event_id
      ) rg ON rg.event_id = e.id
      LEFT JOIN (
        SELECT event_id, COUNT(*) FILTER (WHERE status='Present') AS present_total
        FROM attendance
        GROUP BY event_id
      ) att ON att.event_id = e.id
      WHERE e.club_id=$1
      ORDER BY e.created_at DESC
      `,
      [clubId]
    );

    // auto status transitions
    for (const ev of r.rows) {
      const nextStatus = computeStatus(ev.status, ev.start_time, ev.end_time);
      // after updating ev.status
        if (nextStatus !== ev.status) {
          await pool.query("UPDATE events SET status=$1 WHERE id=$2 AND club_id=$3", [nextStatus, ev.id, clubId]);
          ev.status = nextStatus;

          // ✅ If it just became Completed -> auto issue certificates
          if (nextStatus === "Completed") {
            await issueCertificatesForEventIfCompleted(ev.id);
          }
        }

    }

    return res.json(r.rows);
  } catch (err) {
    console.error("getMyClubEvents error:", err);
    return res.status(500).json({ error: "Failed to fetch events" });
  }
};


// Create event (status must start as Created)
export const createMyClubEvent = async (req, res) => {
  try {
    const { clubId, memberId } = req.user;
    const {
      title,
      description,
      event_type,
      start_time,
      end_time,
      venue,
      image_url,
      capacity,
    } = req.body;

    if (!title || !start_time || !end_time) {
      return res
        .status(400)
        .json({ error: "title, start_time, end_time required" });
    }

    // Basic validation
    if (new Date(end_time) <= new Date(start_time)) {
      return res
        .status(400)
        .json({ error: "end_time must be after start_time" });
    }

    const r = await pool.query(
      `INSERT INTO events 
        (club_id, organizer_id, title, description, event_type, start_time, end_time, status, created_at, venue, image_url, capacity)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Created',NOW(),$8,$9,$10)
       RETURNING *`,
      [
        clubId,
        memberId,
        title,
        description || "",
        event_type || "Workshop",
        start_time,
        end_time,
        venue || "PCCOE Campus",
        image_url || null,
        capacity ?? 200,
      ]
    );

    return res.json({ message: "Event created", event: r.rows[0] });
  } catch (err) {
    console.error("createMyClubEvent error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Manual transitions:
 * Since Created/Live/Completed are automatic by time,
 * we allow ONLY Completed -> Archived (manual or storage rule).
 */
export const updateMyClubEventStatus = async (req, res) => {
  try {
    const { clubId } = req.user;
    const { eventId } = req.params;
    const { status } = req.body;

    const allowed = {
      Created: [],         // auto
      Live: [],            // auto
      Completed: ["Archived"],
      Archived: [],
    };

    const current = await pool.query(
      "SELECT status FROM events WHERE id=$1 AND club_id=$2",
      [eventId, clubId]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const from = current.rows[0].status;

    // Normalize old data: Draft -> Created (if any old rows exist)
    const normalizedFrom = from === "Draft" ? "Created" : from;

    if (!allowed[normalizedFrom] || !allowed[normalizedFrom].includes(status)) {
      return res
        .status(400)
        .json({ error: `Invalid transition: ${from} -> ${status}` });
    }

    // If archiving, clear attendance session too (safe)
    if (status === "Archived") {
      await pool.query(
        `UPDATE events
         SET status=$1,
             attendance_session_code=NULL,
             attendance_session_expires=NULL
         WHERE id=$2 AND club_id=$3`,
        [status, eventId, clubId]
      );
      return res.json({ message: "Status updated" });
    }

    // fallback (not expected)
    await pool.query(
      "UPDATE events SET status=$1 WHERE id=$2 AND club_id=$3",
      [status, eventId, clubId]
    );

    return res.json({ message: "Status updated" });
  } catch (err) {
    console.error("updateMyClubEventStatus error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Delete event only when it's Archived and belongs to organizer's club.
 */
export const deleteMyClubEvent = async (req, res) => {
  try {
    const { clubId } = req.user;
    const { eventId } = req.params;

    const existing = await pool.query(
      "SELECT id, status FROM events WHERE id=$1 AND club_id=$2",
      [eventId, clubId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (existing.rows[0].status !== "Archived") {
      return res.status(400).json({
        error: "Only archived events can be deleted",
      });
    }

    await pool.query("DELETE FROM events WHERE id=$1 AND club_id=$2", [eventId, clubId]);

    return res.json({ message: "Event deleted" });
  } catch (err) {
    console.error("deleteMyClubEvent error:", err);
    return res.status(500).json({ error: "Failed to delete event" });
  }
};
