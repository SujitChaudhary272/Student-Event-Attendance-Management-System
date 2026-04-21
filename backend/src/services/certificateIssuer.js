// services/certificateIssuer.js
import { pool } from "../config/db.js";
import { buildCertificateNo, buildVerificationHash } from "../utils/certificates.js";
import { hasColumn, hasTable } from "../utils/studentSchema.js";
import { checkEligibility } from "./certificateEligibility.js";

export async function issueCertificateForStudent(eventId, studentId, { force = false } = {}) {
  const eventsHasEventSeq = await hasColumn("events", "event_seq");
  const registrationsHasCertified = await hasColumn("registrations", "certified");
  const registrationsHasCertificateNo = await hasColumn("registrations", "certificate_no");
  const registrationsHasIssuedAt = await hasColumn("registrations", "issued_at");
  const registrationsHasVerificationHash = await hasColumn("registrations", "verification_hash");
  const registrationsHasEligibilitySnapshot = await hasColumn("registrations", "eligibility_snapshot");
  const certificatesTableExists = await hasTable("certificates");

  // get event meta
  const ev = await pool.query(
    `SELECT
       id,
       start_time,
       status,
       ${eventsHasEventSeq ? "event_seq" : "NULL::int AS event_seq"}
     FROM events
     WHERE id=$1`,
    [eventId]
  );
  if (!ev.rows.length) throw new Error("Event not found");

  const event = ev.rows[0];
  const year = new Date(event.start_time).getFullYear();
  const eventSeq = Number(event.event_seq || event.id);

  // ensure registration exists
  const registrationFields = [
    registrationsHasCertified ? "certified" : "false AS certified",
    registrationsHasCertificateNo ? "certificate_no" : "NULL::text AS certificate_no",
    registrationsHasIssuedAt ? "issued_at" : "NULL::timestamp AS issued_at",
    registrationsHasVerificationHash ? "verification_hash" : "NULL::text AS verification_hash",
  ];
  const reg = await pool.query(
    `SELECT ${registrationFields.join(", ")}
     FROM registrations
     WHERE event_id=$1 AND student_id=$2`,
    [eventId, studentId]
  );
  if (!reg.rows.length) throw new Error("Student is not registered");

  let legacyCertificate = null;
  if (certificatesTableExists) {
    const legacyRes = await pool.query(
      `
      SELECT verification_code, issued_at
      FROM certificates
      WHERE event_id = $1 AND student_id = $2
      `,
      [eventId, studentId]
    );
    legacyCertificate = legacyRes.rows[0] || null;
  }

  const existingCertificateNo =
    reg.rows[0].certificate_no || legacyCertificate?.verification_code || null;
  const existingIssuedAt =
    reg.rows[0].issued_at || legacyCertificate?.issued_at || null;

  // If already issued and not forcing -> return existing
  if (existingCertificateNo && !force) {
    return {
      alreadyIssued: true,
      certificate_no: existingCertificateNo,
      verification_hash: reg.rows[0].verification_hash || null,
      issued_at: existingIssuedAt,
    };
  }

  // eligibility check (policy-ready)
  const eligibility = await checkEligibility(eventId, studentId);
  if (!eligibility.eligible && !force) {
    return { eligible: false, ...eligibility };
  }

  // serial per event
  const serialSourceColumn = registrationsHasCertificateNo
    ? "certificate_no"
    : certificatesTableExists
    ? "verification_code"
    : null;

  if (!serialSourceColumn) {
    throw new Error("Certificate storage is not configured in the database");
  }

  const serialSourceTable = registrationsHasCertificateNo ? "registrations" : "certificates";
  const serialRes = await pool.query(
    `SELECT COALESCE(MAX(
        NULLIF(split_part(${serialSourceColumn}, '-', 5), '')::int
     ), 0) + 1 AS next_serial
     FROM ${serialSourceTable}
     WHERE event_id=$1 AND ${serialSourceColumn} IS NOT NULL`,
    [eventId]
  );
  const nextSerial = Number(serialRes.rows[0]?.next_serial || 1);

  const certificateNo = buildCertificateNo({ year, eventSeq, serial: nextSerial });
  const issuedAt = new Date();
  const issuedAtISO = issuedAt.toISOString();
  const vHash = registrationsHasVerificationHash
    ? buildVerificationHash({
        certificateNo,
        studentId,
        eventId,
        issuedAtISO,
      })
    : null;

  const registrationAssignments = [];
  const registrationValues = [];
  let param = 1;

  if (registrationsHasCertified) {
    registrationAssignments.push(`certified=true`);
  }
  if (registrationsHasCertificateNo) {
    registrationAssignments.push(`certificate_no=$${param++}`);
    registrationValues.push(certificateNo);
  }
  if (registrationsHasIssuedAt) {
    registrationAssignments.push(`issued_at=$${param++}`);
    registrationValues.push(issuedAt);
  }
  if (registrationsHasVerificationHash) {
    registrationAssignments.push(`verification_hash=$${param++}`);
    registrationValues.push(vHash);
  }
  if (registrationsHasEligibilitySnapshot) {
    registrationAssignments.push(`eligibility_snapshot=$${param++}`);
    registrationValues.push(JSON.stringify(eligibility));
  }

  if (registrationAssignments.length > 0) {
    registrationValues.push(eventId, studentId);
    await pool.query(
      `UPDATE registrations
       SET ${registrationAssignments.join(", ")}
       WHERE event_id=$${param++} AND student_id=$${param}`,
      registrationValues
    );
  }

  if (certificatesTableExists) {
    await pool.query(
      `
      INSERT INTO certificates (event_id, student_id, certificate_type, verification_code, issued_at)
      VALUES ($1, $2, 'Participation', $3, $4)
      ON CONFLICT (event_id, student_id)
      DO UPDATE SET
        certificate_type = EXCLUDED.certificate_type,
        verification_code = EXCLUDED.verification_code,
        issued_at = EXCLUDED.issued_at
      `,
      [eventId, studentId, certificateNo, issuedAt]
    );
  }

  return {
    eligible: true,
    certificate_no: certificateNo,
    verification_hash: vHash,
    issued_at: issuedAtISO,
    eligibility,
  };
}
