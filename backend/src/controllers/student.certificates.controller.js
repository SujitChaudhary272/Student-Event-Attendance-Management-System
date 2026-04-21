import { pool } from "../config/db.js";
import { renderCertificatePDF } from "../services/certificateRenderer.js";
import { issueCertificateForStudent } from "../services/certificateIssuer.js";
import { getStudentUserTable, hasColumn, hasTable } from "../utils/studentSchema.js";
import { buildCertificateTemplateData } from "../utils/certificateTemplateData.js";

export const generateCertificate = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { eventId } = req.params;

    const result = await issueCertificateForStudent(eventId, studentId, { force: false });

    if (result.eligible === false) {
      return res.status(400).json({ error: "Certificate cannot be generated yet", details: result });
    }

    return res.json({
      message: result.alreadyIssued ? "Certificate already generated" : "Certificate generated successfully",
      ...result,
    });
  } catch (err) {
    console.error("generateCertificate error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate certificate" });
  }
};

export const downloadCertificate = async (req, res) => {
  const studentId = req.user.userId;
  const { certificateNo } = req.params;
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
    registrationsHasCertificateNo ? "r.certificate_no=$2" : null,
    certificatesTableExists ? "cert.verification_code=$2" : null,
  ]
    .filter(Boolean)
    .join(" OR ");

  if (!certificateMatch) {
    return res.status(500).json({ error: "Certificate storage is not configured" });
  }

  const r = await pool.query(
    `
    SELECT
      ${certificateNoSelect},
      ${verificationHashSelect},
      ${issuedAtSelect},
      s.name AS student_name,
      ${hasRollNo ? "s.roll_no" : "NULL::text AS roll_no"},
      ${hasDepartment ? "s.department" : "NULL::text AS department"},
      e.title AS event_title,
      e.start_time,
      e.end_time,
      c.name AS club_name,
      c.image AS club_logo_url
    FROM registrations r
    JOIN ${userTable} s ON s.id=r.student_id
    JOIN events e ON e.id=r.event_id
    JOIN clubs c ON c.id=e.club_id
    ${certificateJoin}
    WHERE r.student_id=$1 AND (${certificateMatch})
    `,
    [studentId, certificateNo]
  );

  if (!r.rows.length)
    return res.status(404).json({ error: "Certificate not found" });

  const d = r.rows[0];
  const publicBackendBase = String(
    process.env.PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const verify_url = d.verification_hash
    ? `${publicBackendBase}/api/public/certificates/verify?no=${d.certificate_no}&hash=${d.verification_hash}`
    : `${publicBackendBase}/api/public/certificates/verify?no=${d.certificate_no}`;

  const pdf = await renderCertificatePDF(
    "",
    buildCertificateTemplateData({
      studentName: d.student_name,
      rollNo: d.roll_no,
      department: d.department,
      eventTitle: d.event_title,
      clubName: d.club_name,
      startTime: d.start_time,
      endTime: d.end_time,
      issuedAt: d.issued_at,
      certificateNo: d.certificate_no,
      verificationHash: d.verification_hash,
      verifyUrl: verify_url,
      clubLogoUrl: d.club_logo_url,
    })
  );

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${d.certificate_no}.pdf"`
  );
  res.send(pdf);
};
