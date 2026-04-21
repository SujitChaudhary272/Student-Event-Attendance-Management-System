import { pool } from "../config/db.js";
import { evaluateParticipation } from "../utils/participationPolicyEngine.js";
import { hasColumn, hasTable } from "../utils/studentSchema.js";

const safeJson = (v, fallback = {}) => {
  if (!v) return fallback;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};

export const getMyParticipation = async (req, res) => {
  try {
    const studentId = req.user?.userId;
    if (!studentId) return res.status(401).json({ error: "Unauthorized" });

    const eventsHasAttendancePolicy = await hasColumn("events", "attendance_policy");
    const eventsHasCertificatePolicy = await hasColumn("events", "certificate_policy");
    const registrationsHasCertified = await hasColumn("registrations", "certified");
    const registrationsHasCertificateNo = await hasColumn("registrations", "certificate_no");
    const registrationsHasIssuedAt = await hasColumn("registrations", "issued_at");
    const registrationsHasVerificationHash = await hasColumn("registrations", "verification_hash");
    const registrationsHasEligibilitySnapshot = await hasColumn("registrations", "eligibility_snapshot");
    const attendanceHasDay = await hasColumn("attendance", "day");
    const certificatesTableExists = await hasTable("certificates");
    const base = await pool.query(
      `
      SELECT
        r.event_id,
        e.title AS event_title,
        e.start_time,
        e.end_time,
        e.event_type,
        e.venue,
        ${eventsHasAttendancePolicy ? "e.attendance_policy" : "'MANUAL'::text AS attendance_policy"},
        ${eventsHasCertificatePolicy ? "e.certificate_policy" : "'{}'::jsonb AS certificate_policy"},
        c.name AS club_name,
        ${registrationsHasCertified ? "r.certified" : "false AS certified"},
        ${
          registrationsHasCertificateNo
            ? `COALESCE(r.certificate_no, ${certificatesTableExists ? "cert.verification_code" : "NULL::text"}) AS certificate_no`
            : certificatesTableExists
            ? "cert.verification_code AS certificate_no"
            : "NULL::text AS certificate_no"
        },
        ${
          registrationsHasIssuedAt
            ? `COALESCE(r.issued_at, ${certificatesTableExists ? "cert.issued_at" : "NULL::timestamp"}) AS issued_at`
            : certificatesTableExists
            ? "cert.issued_at AS issued_at"
            : "NULL::timestamp AS issued_at"
        },
        ${registrationsHasVerificationHash ? "r.verification_hash" : "NULL::text AS verification_hash"},
        ${registrationsHasEligibilitySnapshot ? "r.eligibility_snapshot" : "'{}'::jsonb AS eligibility_snapshot"},
        (DATE(e.end_time) - DATE(e.start_time) + 1) AS total_days
      FROM registrations r
      JOIN events e ON e.id = r.event_id
      JOIN clubs c ON c.id = e.club_id
      ${
        certificatesTableExists
          ? "LEFT JOIN certificates cert ON cert.event_id = r.event_id AND cert.student_id = r.student_id"
          : ""
      }
      WHERE r.student_id = $1
      ORDER BY e.start_time DESC
      `,
      [studentId]
    );

    const attendance = await pool.query(
      attendanceHasDay
        ? `
          SELECT event_id, day, status
          FROM attendance
          WHERE student_id = $1
        `
        : `
          SELECT
            event_id,
            DATE(COALESCE(check_in_time, check_out_time, created_at))::text AS day,
            status
          FROM attendance
          WHERE student_id = $1
        `,
      [studentId]
    );

    const attendanceByEvent = {};
    for (const row of attendance.rows) {
      attendanceByEvent[row.event_id] ||= [];
      attendanceByEvent[row.event_id].push(row);
    }

    const records = base.rows.map((ev) => {
      const attendanceRows = attendanceByEvent[ev.event_id] || [];

      const result = evaluateParticipation({
        attendanceRows,
        totalDays: Number(ev.total_days),
        attendancePolicy: ev.attendance_policy || "MANUAL",
        certificatePolicy: safeJson(ev.certificate_policy, {}),
      });

      const hasCertificate =
        ev.certified === true || !!ev.certificate_no || !!ev.verification_hash;

      const participation_state = hasCertificate
        ? "Certified"
        : result.attended
        ? "Attended"
        : "Registered";

      return {
        event_id: ev.event_id,
        event_title: ev.event_title,
        club_name: ev.club_name,
        start_time: ev.start_time,
        end_time: ev.end_time,
        event_type: ev.event_type,
        venue: ev.venue,
        participation_state,
        attendance_status: result.attended ? "Present" : "Absent",
        attended_days: result.attendedDays,
        total_days: Number(ev.total_days),
        attendance_percent: result.attendancePercent,
        certified: ev.certified,
        certificate_no: ev.certificate_no,
        issued_at: ev.issued_at,
        verification_hash: ev.verification_hash,
        can_generate_certificate:
          !hasCertificate &&
          result.attended,
        eligibility_snapshot: ev.eligibility_snapshot,
        explanation: [
          "Registered",
          `Attendance: ${result.attendedDays}/${ev.total_days} days (${result.attendancePercent}%)`,
          result.explanation,
          `Certificate: ${
            hasCertificate
              ? "Issued"
              : result.certificateEligible
              ? "Eligible"
              : "Not eligible"
          }`,
        ].join("\n"),
      };
    });

    return res.json({ records });
  } catch (err) {
    console.error("getMyParticipation error:", err?.message);
    console.error(err);
    return res.status(500).json({ error: err?.message || "Failed to fetch participation" });
  }
};
