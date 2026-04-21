// import { pool } from "../config/db.js";

// export const registerForEvent = async (req, res) => {
//   try {
//     const { eventId } = req.params;
//     const studentId = req.user.userId;

//     const { rollNo, department, phone, gender, year } = req.body;

//     if (!rollNo || !department || !phone || !gender || !year) {
//       return res.status(400).json({
//         error: "rollNo, department, phone, gender, year are required",
//       });
//     }

//     // ✅ check student exists
//     const s = await pool.query("SELECT id FROM students WHERE id=$1", [studentId]);
//     if (s.rows.length === 0) return res.status(404).json({ error: "Student not found" });

//     // ✅ Save/update student profile fields
//     await pool.query(
//       `UPDATE students
//        SET roll_no=$1,
//            department=$2,
//            phone=$3,
//            gender=$4,
//            year=$5,
//            updated_at=NOW()
//        WHERE id=$6`,
//       [rollNo, department, phone, gender, year, studentId]
//     );

//     // ✅ insert registration (prevent duplicates)
//     const created = await pool.query(
//       `INSERT INTO registrations (event_id, student_id, created_at)
//        VALUES ($1, $2, NOW())
//        ON CONFLICT (student_id, event_id) DO NOTHING
//        RETURNING id`,
//       [eventId, studentId]
//     );

//     if (created.rows.length === 0) {
//       return res.status(409).json({ error: "Already registered for this event" });
//     }

//     return res.json({
//       message: "Registered successfully",
//       registrationId: created.rows[0].id,
//     });
//   } catch (err) {
//     console.error("registerForEvent error:", err);
//     return res.status(500).json({ error: "Event registration failed" });
//   }
// };
import { pool } from "../config/db.js";
import { getStudentUserTable, hasColumn } from "../utils/studentSchema.js";

const computeStatus = (current, start, end) => {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);

  if (current === "Archived") return "Archived";
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return current || "Created";
  if (now < s) return "Created";
  if (now >= s && now < e) return "Live";

  const daysAfterEnd = (now - e) / (1000 * 60 * 60 * 24);
  if (daysAfterEnd >= 7) return "Archived";
  return "Completed";
};

export const getLiveEventsForStudent = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const eventsRes = await pool.query(
      `
      SELECT
        e.id,
        e.club_id,
        e.title,
        e.description,
        e.start_time,
        e.end_time,
        e.venue,
        e.status,
        e.capacity,
        e.image_url,
        c.name AS club_name,
        COALESCE(rg.registered_count, 0)::int AS registered_count,
        EXISTS (
          SELECT 1
          FROM registrations r_self
          WHERE r_self.event_id = e.id AND r_self.student_id = $1
        ) AS is_registered
      FROM events e
      JOIN clubs c ON c.id = e.club_id
      LEFT JOIN (
        SELECT event_id, COUNT(*) AS registered_count
        FROM registrations
        GROUP BY event_id
      ) rg ON rg.event_id = e.id
      ORDER BY e.start_time ASC
      `,
      [studentId]
    );

    const visibleEvents = [];

    for (const ev of eventsRes.rows) {
      const nextStatus = computeStatus(ev.status, ev.start_time, ev.end_time);

      if (nextStatus !== ev.status) {
        await pool.query("UPDATE events SET status = $1 WHERE id = $2", [nextStatus, ev.id]);
        ev.status = nextStatus;
      }

      if (ev.status === "Live") {
        visibleEvents.push(ev);
      }
    }

    return res.json({ events: visibleEvents });
  } catch (err) {
    console.error("getLiveEventsForStudent error:", err);
    return res.status(500).json({ error: "Failed to fetch live events" });
  }
};

export const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const studentId = req.user.userId;

    const { rollNo, department, phone, gender, year } = req.body;
    const userTable = await getStudentUserTable();
    const hasRollNo = await hasColumn(userTable, "roll_no");
    const hasDepartment = await hasColumn(userTable, "department");
    const hasPhone = await hasColumn(userTable, "phone");
    const hasGender = await hasColumn(userTable, "gender");
    const hasYear = await hasColumn(userTable, "year");
    const hasUpdatedAt = await hasColumn(userTable, "updated_at");
    const hasRegisteredCount = await hasColumn("events", "registered_count");

    /* ================= STUDENT PROFILE ================= */
    const studentRes = await pool.query(
      `SELECT
         ${hasRollNo ? "roll_no" : "NULL::text AS roll_no"},
         ${hasDepartment ? "department" : "NULL::text AS department"},
         ${hasPhone ? "phone" : "NULL::text AS phone"},
         ${hasGender ? "gender" : "NULL::text AS gender"},
         ${hasYear ? "year" : "NULL::text AS year"}
       FROM ${userTable}
       WHERE id=$1`,
      [studentId]
    );

    if (studentRes.rows.length === 0)
      return res.status(404).json({ error: "Student not found" });

    const profileUpdates = [];
    const profileValues = [];

    if (hasRollNo && rollNo) {
      profileValues.push(rollNo);
      profileUpdates.push(`roll_no=$${profileValues.length}`);
    }
    if (hasDepartment && department) {
      profileValues.push(department);
      profileUpdates.push(`department=$${profileValues.length}`);
    }
    if (hasPhone && phone) {
      profileValues.push(phone);
      profileUpdates.push(`phone=$${profileValues.length}`);
    }
    if (hasGender && gender) {
      profileValues.push(gender);
      profileUpdates.push(`gender=$${profileValues.length}`);
    }
    if (hasYear && year) {
      profileValues.push(year);
      profileUpdates.push(`year=$${profileValues.length}`);
    }
    if (hasUpdatedAt && profileUpdates.length > 0) {
      profileUpdates.push("updated_at=NOW()");
    }

    if (profileUpdates.length > 0) {
      profileValues.push(studentId);
      await pool.query(
        `UPDATE ${userTable}
         SET ${profileUpdates.join(", ")}
         WHERE id=$${profileValues.length}`,
        profileValues
      );
    }

    /* ================= EVENT CAPACITY CHECK ================= */
    const eventRes = await pool.query(
      `SELECT club_id, capacity FROM events WHERE id=$1`,
      [eventId]
    );

    if (eventRes.rows.length === 0)
      return res.status(404).json({ error: "Event not found" });

    const capacity = eventRes.rows[0].capacity ?? 200;
    const eventClubId = eventRes.rows[0].club_id;

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM registrations WHERE event_id=$1`,
      [eventId]
    );

    const registeredCount = Number(countRes.rows[0].count);

    if (registeredCount >= capacity) {
      return res.status(409).json({ error: "Event is full" });
    }

    /* ================= CLUB STUDENT PROFILE ================= */
    if (eventClubId) {
      await pool.query(
        `
        INSERT INTO club_student_profiles (
          club_id,
          student_id,
          roll_no,
          department,
          phone,
          gender,
          year,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (club_id, student_id)
        DO UPDATE SET
          roll_no = COALESCE(NULLIF(EXCLUDED.roll_no, ''), club_student_profiles.roll_no),
          department = COALESCE(NULLIF(EXCLUDED.department, ''), club_student_profiles.department),
          phone = COALESCE(NULLIF(EXCLUDED.phone, ''), club_student_profiles.phone),
          gender = COALESCE(NULLIF(EXCLUDED.gender, ''), club_student_profiles.gender),
          year = COALESCE(NULLIF(EXCLUDED.year, ''), club_student_profiles.year),
          updated_at = NOW()
        `,
        [
          eventClubId,
          studentId,
          rollNo || null,
          department || null,
          phone || null,
          gender || null,
          year || null,
        ]
      );
    }

    /* ================= REGISTER EVENT ================= */
    const created = await pool.query(
      `INSERT INTO registrations (event_id, student_id, created_at)
       VALUES ($1,$2,NOW())
       ON CONFLICT (student_id, event_id) DO NOTHING
       RETURNING id`,
      [eventId, studentId]
    );

    if (created.rows.length === 0) {
      return res.status(409).json({ error: "Already registered" });
    }

    /* ================= UPDATE registered_count ================= */
    if (hasRegisteredCount) {
      await pool.query(
        `UPDATE events
         SET registered_count = registered_count + 1
         WHERE id = $1`,
        [eventId]
      );
    }

    return res.json({
      message: "Registered successfully",
      registrationId: created.rows[0].id,
    });
  } catch (err) {
    console.error("registerForEvent error:", err);
    res.status(500).json({ error: "Event registration failed" });
  }
};
