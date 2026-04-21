import { pool } from "../config/db.js";
import { hasColumn } from "../utils/studentSchema.js";

/* ============================
   GET ALL CLUBS
============================ */
export const getAllClubs = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM clubs ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching clubs:", error);
    res.status(500).json({ error: "Failed to fetch clubs" });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const [clubsResult, eventsResult, activeEventsResult, monthlyEventsResult] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM clubs"),
      pool.query("SELECT COUNT(*)::int AS count FROM events"),
      pool.query("SELECT COUNT(*)::int AS count FROM events WHERE status = 'Live'"),
      pool.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', start_time), 'Mon') AS month,
          COUNT(*)::int AS events
        FROM events
        GROUP BY DATE_TRUNC('month', start_time)
        ORDER BY DATE_TRUNC('month', start_time)
      `),
    ]);

    res.json({
      totalClubs: clubsResult.rows[0]?.count ?? 0,
      totalEvents: eventsResult.rows[0]?.count ?? 0,
      activeEvents: activeEventsResult.rows[0]?.count ?? 0,
      monthlyEvents: monthlyEventsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

/* ============================
   ADD NEW CLUB
============================ */
export const adminCreateClub = async (req, res) => {
  try {
    const { name, category, description } = req.body;

    // ✅ Check if club already exists
    const existingClub = await pool.query(
      "SELECT * FROM clubs WHERE LOWER(name) = LOWER($1)",
      [name]
    );

    if (existingClub.rows.length > 0) {
      return res.status(400).json({
        error: "Club already exists. Duplicate not allowed.",
      });
    }

    // If image uploaded
   const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;


    // ✅ Insert new club
    const result = await pool.query(
      `INSERT INTO clubs (name, category, description, image)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, category, description, imageUrl]
    );
  
    res.json({
      message: "Club added successfully",
      club: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding club:", error);

    res.status(500).json({
      error: "Failed to add club",
    });
  }
};

export const getClubById = async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query("SELECT id, name FROM clubs WHERE id=$1", [id]);
    if (r.rows.length === 0) return res.status(404).json({ error: "Club not found" });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



/* ============================
   TOGGLE CLUB STATUS
============================ */
export const toggleClubStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch current status
    const club = await pool.query(
      "SELECT status FROM clubs WHERE id = $1",
      [id]
    );

    if (club.rows.length === 0) {
      return res.status(404).json({ error: "Club not found" });
    }

    const currentStatus = club.rows[0].status;
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

    await pool.query(
      "UPDATE clubs SET status = $1 WHERE id = $2",
      [newStatus, id]
    );

    res.json({ message: "Club status updated successfully" });
  } catch (error) {
    console.error("Error toggling status:", error);
    res.status(500).json({ error: "Failed to toggle club status" });
  }
};

export const getClubEvents = async (req, res) => {
  try {
    const { clubId } = req.params;
    const result = await pool.query(
      `
      SELECT
        e.id,
        e.title,
        e.description,
        e.event_type,
        e.start_time,
        e.end_time,
        e.status,
        COALESCE(rg.registered_count, 0)::int AS registered_count,
        COALESCE(att.present_total, 0)::int AS present_total
      FROM events e
      LEFT JOIN (
        SELECT event_id, COUNT(*) AS registered_count
        FROM registrations
        GROUP BY event_id
      ) rg ON rg.event_id = e.id
      LEFT JOIN (
        SELECT event_id, COUNT(*) FILTER (WHERE status = 'Present') AS present_total
        FROM attendance
        GROUP BY event_id
      ) att ON att.event_id = e.id
      WHERE e.club_id = $1
      ORDER BY e.start_time DESC
      `,
      [clubId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching club events:", error);
    return res.status(500).json({ error: "Failed to fetch club events" });
  }
};

export const getAdminEventParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const attendanceHasDay = await hasColumn("attendance", "day");
    const snapshotTableExists = await pool.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'event_scan_student_snapshot'
      ) AS exists
      `
    );
    const hasSnapshots = snapshotTableExists.rows[0]?.exists === true;

    const attendanceJoin = attendanceHasDay
      ? `
        LEFT JOIN attendance a
          ON a.event_id = r.event_id
         AND a.student_id = r.student_id
      `
      : `
        LEFT JOIN attendance a
          ON a.event_id = r.event_id
         AND a.student_id = r.student_id
      `;

    const snapshotJoin = hasSnapshots
      ? `
        LEFT JOIN event_scan_student_snapshot ss
          ON ss.event_id = r.event_id
         AND ss.student_id = r.student_id
      `
      : "";

    const result = await pool.query(
      `
      SELECT
        r.student_id,
        u.name,
        u.email,
        MAX(ss.roll_no) AS roll_no,
        MAX(ss.department) AS department,
        MAX(ss.year) AS year,
        MAX(ss.updated_at) AS last_scanned_at,
        COALESCE(MAX(CASE WHEN a.status = 'Present' THEN 'Present' END), 'Absent') AS attendance_status
      FROM registrations r
      JOIN users u ON u.id = r.student_id
      ${attendanceJoin}
      ${snapshotJoin}
      WHERE r.event_id = $1
      GROUP BY r.student_id, u.name, u.email
      ORDER BY u.name ASC
      `,
      [eventId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching admin event participants:", error);
    return res.status(500).json({ error: "Failed to fetch event participants" });
  }
};
