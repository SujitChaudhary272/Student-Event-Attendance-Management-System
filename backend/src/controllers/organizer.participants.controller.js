import { pool } from "../config/db.js";
import fs from "fs";
import puppeteer from "puppeteer";

const schemaCache = new Map();

async function hasTable(tableName) {
  const key = `table:${tableName}`;
  if (schemaCache.has(key)) return schemaCache.get(key);

  const result = await pool.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS exists
    `,
    [tableName]
  );

  const exists = result.rows[0]?.exists === true;
  schemaCache.set(key, exists);
  return exists;
}

async function hasColumn(tableName, columnName) {
  const key = `column:${tableName}.${columnName}`;
  if (schemaCache.has(key)) return schemaCache.get(key);

  const result = await pool.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
    ) AS exists
    `,
    [tableName, columnName]
  );

  const exists = result.rows[0]?.exists === true;
  schemaCache.set(key, exists);
  return exists;
}

async function getParticipantSchema() {
  const userTable = (await hasTable("students")) ? "students" : "users";
  const attendanceHasDay = await hasColumn("attendance", "day");
  const hasSnapshotTable = await hasTable("event_scan_student_snapshot");
  const hasQrScansTable = await hasTable("event_qr_scans");
  const hasClubStudentProfiles = await hasTable("club_student_profiles");
  const userHasRollNo = await hasColumn(userTable, "roll_no");
  const userHasDepartment = await hasColumn(userTable, "department");
  const userHasPhone = await hasColumn(userTable, "phone");
  const userHasGender = await hasColumn(userTable, "gender");
  const userHasYear = await hasColumn(userTable, "year");
  const clubProfilesHasRollNo = hasClubStudentProfiles && (await hasColumn("club_student_profiles", "roll_no"));
  const clubProfilesHasDepartment =
    hasClubStudentProfiles && (await hasColumn("club_student_profiles", "department"));
  const clubProfilesHasPhone = hasClubStudentProfiles && (await hasColumn("club_student_profiles", "phone"));
  const clubProfilesHasGender = hasClubStudentProfiles && (await hasColumn("club_student_profiles", "gender"));
  const clubProfilesHasYear = hasClubStudentProfiles && (await hasColumn("club_student_profiles", "year"));
  const registrationsHasCertified = await hasColumn("registrations", "certified");
  const registrationsHasCertificateNo = await hasColumn("registrations", "certificate_no");
  const registrationsHasVerificationHash = await hasColumn("registrations", "verification_hash");
  const registrationsHasIssuedAt = await hasColumn("registrations", "issued_at");
  const certificatesTableExists = await hasTable("certificates");

  return {
    userTable,
    attendanceHasDay,
    hasSnapshotTable,
    hasQrScansTable,
    hasClubStudentProfiles,
    userHasRollNo,
    userHasDepartment,
    userHasPhone,
    userHasGender,
    userHasYear,
    clubProfilesHasRollNo,
    clubProfilesHasDepartment,
    clubProfilesHasPhone,
    clubProfilesHasGender,
    clubProfilesHasYear,
    registrationsHasCertified,
    registrationsHasCertificateNo,
    registrationsHasVerificationHash,
    registrationsHasIssuedAt,
    certificatesTableExists,
  };
}

function buildAttendanceJoin(attendanceHasDay) {
  if (attendanceHasDay) {
    return `
      LEFT JOIN attendance a
        ON a.event_id = r.event_id
       AND a.student_id = r.student_id
       AND ($2::date IS NULL OR a.day = $2::date)
    `;
  }

  return `
    LEFT JOIN attendance a
      ON a.event_id = r.event_id
     AND a.student_id = r.student_id
     AND (
          $2::date IS NULL
          OR DATE(COALESCE(a.check_in_time, a.check_out_time, a.created_at)) = $2::date
        )
  `;
}

function buildCertificateFields(schema) {
  const certifiedExpr = schema.registrationsHasCertified
    ? "COALESCE(BOOL_OR(r.certified), false)"
    : schema.certificatesTableExists
    ? "CASE WHEN MAX(c.id) IS NOT NULL THEN true ELSE false END"
    : "false";

  const certificateNoExpr = schema.registrationsHasCertificateNo
    ? "MAX(r.certificate_no)"
    : schema.certificatesTableExists
    ? "MAX(c.verification_code)"
    : "NULL";

  const verificationHashExpr = schema.registrationsHasVerificationHash
    ? "MAX(r.verification_hash)"
    : "NULL";

  const issuedAtExpr = schema.registrationsHasIssuedAt
    ? "MAX(r.issued_at)"
    : schema.certificatesTableExists
    ? "MAX(c.issued_at)"
    : "NULL";

  return `
    ${certifiedExpr} AS certified,
    ${certificateNoExpr} AS certificate_no,
    ${verificationHashExpr} AS verification_hash,
    ${issuedAtExpr} AS issued_at
  `;
}

function cleanTextExpr(expr) {
  return `NULLIF(BTRIM(${expr}), '')`;
}

async function getOwnedEvent(eventId, clubId) {
  const result = await pool.query(
    `
    SELECT id, title, start_time, end_time, status, club_id
    FROM events
    WHERE id = $1
    `,
    [eventId]
  );

  if (!result.rows.length) return { error: { status: 404, body: { error: "Event not found" } } };

  const event = result.rows[0];
  if (String(event.club_id) !== String(clubId)) {
    return { error: { status: 403, body: { error: "Not allowed for this club event" } } };
  }

  return { event };
}

function findBrowserExecutable() {
  const configured = String(
    process.env.PUPPETEER_EXECUTABLE_PATH ||
      process.env.CHROME_PATH ||
      process.env.BROWSER_EXECUTABLE_PATH ||
      ""
  ).trim();

  if (configured && fs.existsSync(configured)) return configured;

  try {
    const bundled = puppeteer.executablePath();
    if (bundled && fs.existsSync(bundled)) return bundled;
  } catch {
    // Fall through to common paths.
  }

  const commonPaths =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          `${process.env.LOCALAPPDATA || ""}\\Google\\Chrome\\Application\\chrome.exe`,
          "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
          "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
          `${process.env.LOCALAPPDATA || ""}\\Microsoft\\Edge\\Application\\msedge.exe`,
        ]
      : process.platform === "darwin"
      ? [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ]
      : [
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable",
          "/usr/bin/chromium-browser",
          "/usr/bin/chromium",
          "/usr/bin/microsoft-edge",
        ];

  return commonPaths.find((path) => path && fs.existsSync(path)) || null;
}

function buildAttendancePdfHtml(event, participants) {
  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const rows = participants
    .map(
      (p, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.roll_no || "-")}</td>
          <td>${escapeHtml(p.email)}</td>
          <td>${escapeHtml(p.last_scanned_at ? new Date(p.last_scanned_at).toLocaleString("en-IN") : "-")}</td>
          <td>${p.has_entry_scan ? "Scanned" : "Not Scanned"}</td>
          <td>${p.has_exit_scan ? "Scanned" : "Not Scanned"}</td>
          <td>${p.certified ? "Yes" : "No"}</td>
          <td>${escapeHtml(p.attendance_status)}</td>
        </tr>
      `
    )
    .join("");

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        @page { size: A4 landscape; margin: 18mm 12mm; }
        body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; }
        h1 { margin: 0; font-size: 24px; color: #0f3ea8; }
        .meta { margin: 6px 0 18px; color: #475569; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 6px; text-align: left; vertical-align: top; }
        th { background: #dbeafe; color: #0f3ea8; }
        tbody tr:nth-child(even) { background: #f8fafc; }
      </style>
    </head>
    <body>
      <h1>Event Attendance Report</h1>
      <div class="meta">
        <strong>Event:</strong> ${escapeHtml(event.title)}<br />
        <strong>Date:</strong> ${escapeHtml(new Date(event.start_time).toLocaleString("en-IN"))}<br />
        <strong>Status:</strong> ${escapeHtml(event.status)}
      </div>
      <table>
        <thead>
          <tr>
            <th>Sr No</th>
            <th>Name</th>
            <th>Roll No</th>
            <th>Email</th>
            <th>Last Scan</th>
            <th>Entry QR</th>
            <th>Exit QR</th>
            <th>Certificate</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
  </html>`;
}

async function fetchParticipantsForEvent(eventId, day, clubId) {
  const owned = await getOwnedEvent(eventId, clubId);
  if (owned.error) return owned;

  const schema = await getParticipantSchema();
  const attendanceJoin = buildAttendanceJoin(schema.attendanceHasDay);
  const certificateFields = buildCertificateFields(schema);
  const attendancePresentExpr =
    "COALESCE(MAX(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END), 0)";
  const entryScanExpr = schema.hasQrScansTable
    ? "COALESCE(MAX(CASE WHEN qs.qr_type = 'ENTRY' THEN 1 ELSE 0 END), 0)"
    : "0";
  const exitScanExpr = schema.hasQrScansTable
    ? "COALESCE(MAX(CASE WHEN qs.qr_type = 'EXIT' THEN 1 ELSE 0 END), 0)"
    : "0";
  const attendanceStatusExpr = `
    CASE
      WHEN ${entryScanExpr} = 1 AND ${exitScanExpr} = 1 THEN 'Present'
      WHEN ${attendancePresentExpr} = 1 THEN 'Present'
      ELSE 'Absent'
    END
  `;
  const attendanceColorExpr = `
    CASE
      WHEN ${entryScanExpr} = 1 AND ${exitScanExpr} = 1 THEN 'green'
      WHEN ${attendancePresentExpr} = 1 THEN 'green'
      ELSE 'slate'
    END
  `;
  const attendanceNoteExpr = `
    CASE
      WHEN ${entryScanExpr} = 1 AND ${exitScanExpr} = 1 THEN 'Entry + Exit scanned'
      WHEN ${entryScanExpr} = 1 THEN 'Entry scanned only, final attendance absent'
      WHEN ${exitScanExpr} = 1 THEN 'Exit scanned only, final attendance absent'
      WHEN ${attendancePresentExpr} = 1 THEN 'Present (manual/other)'
      ELSE 'Attendance not marked'
    END
  `;
  const certificateJoin = schema.certificatesTableExists
    ? `
      LEFT JOIN certificates c
        ON c.event_id = r.event_id
       AND c.student_id = r.student_id
    `
    : "";
  const qrScansJoin = schema.hasQrScansTable
    ? `
      LEFT JOIN event_qr_scans qs
        ON qs.event_id = r.event_id
       AND qs.student_id = r.student_id
       AND ($2::date IS NULL OR qs.day = $2::date)
    `
    : "";
  const snapshotJoin = schema.hasSnapshotTable
    ? `
      LEFT JOIN event_scan_student_snapshot ss
        ON ss.event_id = r.event_id
       AND ss.student_id = r.student_id
       AND ($2::date IS NULL OR ss.day = $2::date)
    `
    : "";
  const clubProfileJoin = schema.hasClubStudentProfiles
    ? `
      LEFT JOIN club_student_profiles csp
        ON csp.club_id = $3
       AND csp.student_id = r.student_id
    `
    : "";
  const rollNoExpr = `COALESCE(
    ${schema.hasSnapshotTable ? `MAX(${cleanTextExpr("ss.roll_no")}),` : ""}
    ${schema.clubProfilesHasRollNo ? `MAX(${cleanTextExpr("csp.roll_no")}),` : ""}
    ${schema.userHasRollNo ? `MAX(${cleanTextExpr("u.roll_no")})` : "NULL::text"}
  )`;
  const departmentExpr = `COALESCE(
    ${schema.hasSnapshotTable ? `MAX(${cleanTextExpr("ss.department")}),` : ""}
    ${schema.clubProfilesHasDepartment ? `MAX(${cleanTextExpr("csp.department")}),` : ""}
    ${schema.userHasDepartment ? `MAX(${cleanTextExpr("u.department")})` : "NULL::text"}
  )`;
  const phoneExpr = `COALESCE(
    ${schema.hasSnapshotTable ? `MAX(${cleanTextExpr("ss.phone")}),` : ""}
    ${schema.clubProfilesHasPhone ? `MAX(${cleanTextExpr("csp.phone")}),` : ""}
    ${schema.userHasPhone ? `MAX(${cleanTextExpr("u.phone")})` : "NULL::text"}
  )`;
  const genderExpr = `COALESCE(
    ${schema.hasSnapshotTable ? `MAX(${cleanTextExpr("ss.gender")}),` : ""}
    ${schema.clubProfilesHasGender ? `MAX(${cleanTextExpr("csp.gender")}),` : ""}
    ${schema.userHasGender ? `MAX(${cleanTextExpr("u.gender")})` : "NULL::text"}
  )`;
  const yearExpr = `COALESCE(
    ${schema.hasSnapshotTable ? `MAX(${cleanTextExpr("ss.year")}),` : ""}
    ${schema.clubProfilesHasYear ? `MAX(${cleanTextExpr("csp.year")}),` : ""}
    ${schema.userHasYear ? `MAX(${cleanTextExpr("u.year")})` : "NULL::text"}
  )`;
  const lastScannedExpr = schema.hasQrScansTable
    ? "MAX(qs.scanned_at)"
    : schema.hasSnapshotTable
    ? "MAX(ss.updated_at)"
    : "NULL::timestamp";
  const rollSortExpr = `COALESCE(
    ${schema.hasSnapshotTable ? `MAX(${cleanTextExpr("ss.roll_no")}),` : ""}
    ${schema.clubProfilesHasRollNo ? `MAX(${cleanTextExpr("csp.roll_no")}),` : ""}
    ${schema.userHasRollNo ? `MAX(${cleanTextExpr("u.roll_no")})` : "NULL::text"}
  )`;

  const participants = await pool.query(
    `
    SELECT
      r.student_id,
      u.name,
      u.email,
      ${rollNoExpr} AS roll_no,
      ${departmentExpr} AS department,
      ${phoneExpr} AS phone,
      ${genderExpr} AS gender,
      ${yearExpr} AS year,
      ${lastScannedExpr} AS last_scanned_at,
      ${attendanceStatusExpr} AS attendance_status,
      ${attendanceColorExpr} AS attendance_color,
      ${attendanceNoteExpr} AS attendance_note,
      (${entryScanExpr} = 1) AS has_entry_scan,
      (${exitScanExpr} = 1) AS has_exit_scan,
      ${certificateFields}
    FROM registrations r
    JOIN ${schema.userTable} u ON u.id = r.student_id
    ${attendanceJoin}
    ${qrScansJoin}
    ${snapshotJoin}
    ${clubProfileJoin}
    ${certificateJoin}
    WHERE r.event_id = $1
    GROUP BY r.student_id, u.name, u.email
    ORDER BY
      CASE WHEN ${rollSortExpr} IS NULL THEN 1 ELSE 0 END,
      ${rollSortExpr} ASC,
      u.name ASC
    `,
    [eventId, day || null, clubId]
  );

  return { owned, participants: participants.rows };
}

export const getEventParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { day } = req.query;
    const { clubId } = req.user;
    const { owned, participants } = await fetchParticipantsForEvent(eventId, day, clubId);
    if (owned?.error) return res.status(owned.error.status).json(owned.error.body);

    return res.json({
      eventStatus: owned.event.status,
      event: owned.event,
      participants,
    });
  } catch (err) {
    console.error("getEventParticipants error:", err);
    return res.status(500).json({ error: "Failed to fetch participants" });
  }
};

export const downloadEventAttendancePdf = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { day } = req.query;
    const { clubId } = req.user;

    const { owned, participants } = await fetchParticipantsForEvent(eventId, day, clubId);
    if (owned?.error) return res.status(owned.error.status).json(owned.error.body);

    const presentParticipants = participants.filter((participant) => participant.attendance_status === "Present");

    const sortedParticipants = [...presentParticipants].sort((a, b) => {
      const aRoll = String(a.roll_no || "").trim();
      const bRoll = String(b.roll_no || "").trim();
      if (aRoll && bRoll) return aRoll.localeCompare(bRoll, undefined, { numeric: true, sensitivity: "base" });
      if (aRoll) return -1;
      if (bRoll) return 1;
      return String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" });
    });

    const executablePath = findBrowserExecutable();
    if (!executablePath) {
      return res.status(500).json({ error: "No browser found for PDF generation" });
    }

    const browser = await puppeteer.launch({
      headless: "new",
      executablePath,
      args: ["--no-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(buildAttendancePdfHtml(owned.event, sortedParticipants), {
        waitUntil: "networkidle0",
      });

      const pdf = await page.pdf({
        format: "A4",
        landscape: true,
        printBackground: true,
        margin: {
          top: "10mm",
          right: "8mm",
          bottom: "10mm",
          left: "8mm",
        },
      });

      const safeTitle = String(owned.event.title || "event-attendance").replace(/[^\w.-]+/g, "-");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}-attendance.pdf"`);
      return res.send(pdf);
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.error("downloadEventAttendancePdf error:", err);
    return res.status(500).json({ error: "Failed to download attendance PDF" });
  }
};

export const setAttendanceManual = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { clubId } = req.user;
    const { student_id, status, day } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: "student_id required" });
    }

    if (!["Present", "Absent"].includes(status)) {
      return res.status(400).json({ error: "status must be Present or Absent" });
    }

    const owned = await getOwnedEvent(eventId, clubId);
    if (owned.error) {
      return res.status(owned.error.status).json(owned.error.body);
    }

    const schema = await getParticipantSchema();

    if (schema.attendanceHasDay) {
      const attendanceDay =
        day ||
        new Date(owned.event.start_time).toISOString().slice(0, 10);

      await pool.query(
        `
        INSERT INTO attendance (event_id, day, student_id, status)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (event_id, day, student_id)
        DO UPDATE SET status = EXCLUDED.status
        `,
        [eventId, attendanceDay, student_id, status]
      );

      return res.json({ message: "Attendance updated", day: attendanceDay });
    }

    await pool.query(
      `
      INSERT INTO attendance (event_id, student_id, status, check_in_time, created_at)
      VALUES (
        $1,
        $2,
        $3,
        CASE WHEN $3 = 'Present' THEN NOW() ELSE NULL END,
        NOW()
      )
      ON CONFLICT (event_id, student_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        check_in_time = CASE
          WHEN EXCLUDED.status = 'Present' THEN NOW()
          ELSE attendance.check_in_time
        END
      `,
      [eventId, student_id, status]
    );

    return res.json({ message: "Attendance updated" });
  } catch (err) {
    console.error("setAttendanceManual error:", err);
    return res.status(500).json({ error: "Failed to update attendance" });
  }
};
