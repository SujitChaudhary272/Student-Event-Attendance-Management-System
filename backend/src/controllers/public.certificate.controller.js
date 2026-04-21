// controllers/public.certificate.controller.js
import { pool } from "../config/db.js";
import { buildVerificationHash } from "../utils/certificates.js";
import { getStudentUserTable, hasColumn, hasTable } from "../utils/studentSchema.js";

export const verifyCertificatePublic = async (req, res) => {
  try {
    const { no, hash } = req.query;
    if (!no) return res.status(400).json({ error: "no is required" });
    const userTable = await getStudentUserTable();
    const hasRollNo = await hasColumn(userTable, "roll_no");
    const hasDepartment = await hasColumn(userTable, "department");
    const registrationsHasCertificateNo = await hasColumn("registrations", "certificate_no");
    const registrationsHasVerificationHash = await hasColumn("registrations", "verification_hash");
    const registrationsHasIssuedAt = await hasColumn("registrations", "issued_at");
    const certificatesTableExists = await hasTable("certificates");

    const certificateNoSelect = registrationsHasCertificateNo
      ? `COALESCE(r.certificate_no, ${certificatesTableExists ? "cert.verification_code" : "NULL::text"}) AS certificate_no`
      : certificatesTableExists
      ? "cert.verification_code AS certificate_no"
      : "NULL::text AS certificate_no";
    const verificationHashSelect = registrationsHasVerificationHash
      ? "r.verification_hash"
      : "NULL::text AS verification_hash";
    const issuedAtSelect = registrationsHasIssuedAt
      ? `COALESCE(r.issued_at, ${certificatesTableExists ? "cert.issued_at" : "NULL::timestamp"}) AS issued_at`
      : certificatesTableExists
      ? "cert.issued_at AS issued_at"
      : "NULL::timestamp AS issued_at";
    const certificateJoin = certificatesTableExists
      ? "LEFT JOIN certificates cert ON cert.event_id = r.event_id AND cert.student_id = r.student_id"
      : "";
    const certificateMatch = [
      registrationsHasCertificateNo ? "r.certificate_no = $1" : null,
      certificatesTableExists ? "cert.verification_code = $1" : null,
    ]
      .filter(Boolean)
      .join(" OR ");

    if (!certificateMatch) {
      return res.status(500).json({ verified: false, error: "Certificate storage is not configured" });
    }

    const r = await pool.query(
      `
      SELECT
        ${certificateNoSelect},
        ${verificationHashSelect},
        ${issuedAtSelect},
        r.student_id,
        r.event_id,
        s.name AS student_name,
        ${hasRollNo ? "s.roll_no" : "NULL::text AS roll_no"},
        ${hasDepartment ? "s.department" : "NULL::text AS department"},
        e.title AS event_title,
        e.start_time,
        c.name AS club_name
      FROM registrations r
      JOIN ${userTable} s ON s.id = r.student_id
      JOIN events e ON e.id = r.event_id
      JOIN clubs c ON c.id = e.club_id
      ${certificateJoin}
      WHERE ${certificateMatch}
      `,
      [no]
    );

    if (!r.rows.length) return res.status(404).json({ verified: false, error: "Certificate not found" });

    const row = r.rows[0];
    if (!row.issued_at) return res.status(400).json({ verified: false, error: "Certificate not issued" });

    if (row.verification_hash) {
      if (!hash) {
        return res.status(400).json({ verified: false, error: "hash is required for this certificate" });
      }

      const issuedAtISO = new Date(row.issued_at).toISOString();
      const expected = buildVerificationHash({
        certificateNo: row.certificate_no,
        studentId: row.student_id,
        eventId: row.event_id,
        issuedAtISO,
      });

      if (expected !== hash || row.verification_hash !== hash) {
        return res.status(400).json({ verified: false, error: "Invalid hash" });
      }
    }

    return res.json({
      verified: true,
      certificate_no: row.certificate_no,
      issued_at: row.issued_at,
      student: {
        name: row.student_name,
        roll_no: row.roll_no,
        department: row.department,
      },
      event: {
        id: row.event_id,
        title: row.event_title,
        start_time: row.start_time,
        club: row.club_name,
      },
    });
  } catch (err) {
    return res.status(500).json({ verified: false, error: err.message });
  }
};
