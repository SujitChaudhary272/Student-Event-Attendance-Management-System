import { pool } from "../config/db.js";
import { issueCertificateForStudent } from "../services/certificateIssuer.js";
import { getStudentUserTable, hasColumn } from "../utils/studentSchema.js";

function formatDayKey(dateLike) {
  const date = new Date(dateLike);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

let studentScanSchemaPromise = null;

async function getStudentScanSchema() {
  if (!studentScanSchemaPromise) {
    studentScanSchemaPromise = (async () => {
      const userTable = await getStudentUserTable();
      const [
        hasRollNo,
        hasDepartment,
        hasPhone,
        hasGender,
        hasYear,
        hasRole,
      ] = await Promise.all([
        hasColumn(userTable, "roll_no"),
        hasColumn(userTable, "department"),
        hasColumn(userTable, "phone"),
        hasColumn(userTable, "gender"),
        hasColumn(userTable, "year"),
        hasColumn(userTable, "role"),
      ]);

      return {
        userTable,
        hasRollNo,
        hasDepartment,
        hasPhone,
        hasGender,
        hasYear,
        hasRole,
      };
    })();
  }

  return studentScanSchemaPromise;
}

export const scanEventQr = async (req, res) => {
  try {
    const authenticatedStudentId = req.user?.userId;
    const { eventId } = req.params;
    const { token, studentDetails = {} } = req.body;

    if (!authenticatedStudentId) return res.status(401).json({ error: "Invalid student token" });
    if (!token) return res.status(400).json({ error: "token required" });

    const eventRes = await pool.query(
      `
      SELECT id, title, start_time, end_time, status
      FROM events
      WHERE id = $1
      `,
      [eventId]
    );

    if (!eventRes.rows.length) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = eventRes.rows[0];
    if (event.status === "Archived") {
      return res.status(400).json({ error: "This event is archived" });
    }

    const sessionRes = await pool.query(
      `
      SELECT event_id, day, qr_type, expires_at, is_active
      FROM event_qr_sessions
      WHERE token = $1
      `,
      [token]
    );

    if (!sessionRes.rows.length) {
      return res.status(400).json({ error: "Invalid QR" });
    }

    const session = sessionRes.rows[0];
    if (!session.is_active) {
      return res.status(400).json({ error: "QR is not active" });
    }
    if (String(session.event_id) !== String(eventId)) {
      return res.status(400).json({ error: "QR does not belong to this event" });
    }
    if (new Date(session.expires_at) < new Date()) {
      await pool.query("UPDATE event_qr_sessions SET is_active=false WHERE token=$1", [token]);
      return res.status(400).json({ error: "QR expired" });
    }

    const {
      userTable,
      hasRollNo,
      hasDepartment,
      hasPhone,
      hasGender,
      hasYear,
      hasRole,
    } = await getStudentScanSchema();

    const studentRes = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        ${hasRollNo ? "roll_no" : "NULL::text AS roll_no"},
        ${hasDepartment ? "department" : "NULL::text AS department"},
        ${hasPhone ? "phone" : "NULL::text AS phone"},
        ${hasGender ? "gender" : "NULL::text AS gender"},
        ${hasYear ? "year" : "NULL::text AS year"}
      FROM ${userTable}
      WHERE id = $1
      `,
      [authenticatedStudentId]
    );

    if (!studentRes.rows.length) {
      return res.status(404).json({ error: "Student not found" });
    }

    const authenticatedStudent = studentRes.rows[0];
    const normalizedEmail = String(
      authenticatedStudent.email || studentDetails.email || ""
    )
      .trim()
      .toLowerCase();

    let student = authenticatedStudent;
    let studentId = authenticatedStudentId;

    if (normalizedEmail) {
      const canonicalStudentRes = await pool.query(
        `
        SELECT
          id,
          name,
          email,
          ${hasRollNo ? "roll_no" : "NULL::text AS roll_no"},
          ${hasDepartment ? "department" : "NULL::text AS department"},
          ${hasPhone ? "phone" : "NULL::text AS phone"},
          ${hasGender ? "gender" : "NULL::text AS gender"},
          ${hasYear ? "year" : "NULL::text AS year"}
        FROM ${userTable}
        WHERE LOWER(email) = LOWER($1)
          ${hasRole ? "AND LOWER(role) = 'student'" : ""}
        ORDER BY id ASC
        LIMIT 1
        `,
        [normalizedEmail]
      );

      if (canonicalStudentRes.rows.length) {
        student = canonicalStudentRes.rows[0];
        studentId = student.id;
      }
    }

    const sessionDayKey = session.day ? formatDayKey(session.day) : null;
    const dayKey = sessionDayKey || formatDayKey(new Date());
    const snapshot = {
      name: studentDetails.name || student.name,
      email: normalizedEmail || student.email,
      roll_no: studentDetails.rollNo || student.roll_no || null,
      department: studentDetails.department || student.department || null,
      phone: studentDetails.phone || student.phone || null,
      gender: studentDetails.gender || student.gender || null,
      year: studentDetails.year || student.year || null,
    };

    const registrationRes = await pool.query(
      `
      SELECT 1
      FROM registrations
      WHERE event_id = $1 AND student_id = $2
      LIMIT 1
      `,
      [eventId, studentId]
    );

    if (!registrationRes.rows.length) {
      return res.status(400).json({
        error: "Please register for this event before scanning attendance.",
      });
    }

    await pool.query(
      `
      INSERT INTO event_qr_scans (event_id, day, student_id, qr_type, scanned_at)
      VALUES ($1, $2::date, $3, $4, NOW())
      ON CONFLICT (event_id, day, student_id, qr_type)
      DO UPDATE SET scanned_at = EXCLUDED.scanned_at
      `,
      [eventId, dayKey, studentId, session.qr_type]
    );

    const scanStateRes = await pool.query(
      `
      SELECT
        COALESCE(BOOL_OR(qr_type = 'ENTRY'), false) AS has_entry_scan,
        COALESCE(BOOL_OR(qr_type = 'EXIT'), false) AS has_exit_scan
      FROM event_qr_scans
      WHERE event_id = $1
        AND day = $2::date
        AND student_id = $3
      `,
      [eventId, dayKey, studentId]
    );

    const hasEntryScan = scanStateRes.rows[0]?.has_entry_scan === true;
    const hasExitScan = scanStateRes.rows[0]?.has_exit_scan === true;
    const isFullyPresent = hasEntryScan && hasExitScan;
    const finalAttendanceStatus = isFullyPresent ? "Present" : "Absent";
    const attendanceColor = isFullyPresent ? "green" : "slate";
    const attendanceNote = isFullyPresent
      ? "Entry and exit QR scanned with the same email. Present confirmed."
      : hasEntryScan
      ? "Entry QR scanned. Exit QR is still pending, so final attendance is absent."
      : hasExitScan
      ? "Exit QR scanned. Entry QR is still pending, so final attendance is absent."
      : "Attendance scan recorded.";

    await pool.query(
      `
      INSERT INTO event_scan_student_snapshot (
        event_id,
        day,
        student_id,
        name,
        email,
        roll_no,
        department,
        phone,
        gender,
        year,
        created_at,
        updated_at
      )
      VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      ON CONFLICT (event_id, day, student_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        roll_no = EXCLUDED.roll_no,
        department = EXCLUDED.department,
        phone = EXCLUDED.phone,
        gender = EXCLUDED.gender,
        year = EXCLUDED.year,
        updated_at = NOW()
      `,
      [
        eventId,
        dayKey,
        studentId,
        snapshot.name,
        snapshot.email,
        snapshot.roll_no,
        snapshot.department,
        snapshot.phone,
        snapshot.gender,
        snapshot.year,
      ]
    );

    await pool.query(
      `
      INSERT INTO attendance (
        event_id,
        student_id,
        day,
        check_in_time,
        check_out_time,
        status,
        method,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3::date,
        CASE WHEN $4 = 'ENTRY' THEN NOW() ELSE NULL END,
        CASE WHEN $4 = 'EXIT' THEN NOW() ELSE NULL END,
        $5,
        'QR',
        NOW(),
        NOW()
      )
      ON CONFLICT (event_id, day, student_id)
      DO UPDATE SET
        status = $5,
        method = 'QR',
        check_in_time = CASE
          WHEN $4 = 'ENTRY' THEN COALESCE(attendance.check_in_time, NOW())
          ELSE attendance.check_in_time
        END,
        check_out_time = CASE
          WHEN $4 = 'EXIT' THEN COALESCE(attendance.check_out_time, NOW())
          ELSE attendance.check_out_time
        END,
        updated_at = NOW()
      `,
      [eventId, studentId, dayKey, session.qr_type, finalAttendanceStatus]
    );

    let certificate = null;
    let certificateWarning = null;
    if (isFullyPresent) {
      try {
        const certificateResult = await issueCertificateForStudent(eventId, studentId, {
          force: false,
        });

        if (certificateResult?.eligible || certificateResult?.alreadyIssued) {
          certificate = {
            certificate_no: certificateResult.certificate_no,
            issued_at: certificateResult.issued_at || null,
            already_issued: certificateResult.alreadyIssued === true,
          };
        }
      } catch (certificateErr) {
        certificateWarning = "Attendance saved, but certificate could not be issued right now.";
        console.error("scanEventQr certificate issue:", certificateErr);
      }
    }

    return res.json({
      message:
        session.qr_type === "EXIT"
          ? "Exit QR scanned successfully"
          : "Entry QR scanned successfully",
      event: {
        id: event.id,
        title: event.title,
      },
      student: snapshot,
      attendance: {
        status: finalAttendanceStatus,
        day: dayKey,
        qr_type: session.qr_type,
        color: attendanceColor,
        note: attendanceNote,
        has_entry_scan: hasEntryScan,
        has_exit_scan: hasExitScan,
      },
      certificate,
      certificateWarning,
    });
  } catch (err) {
    console.error("scanEventQr error:", err);
    res.status(500).json({ error: err.message || "Failed to scan event QR" });
  }
};


