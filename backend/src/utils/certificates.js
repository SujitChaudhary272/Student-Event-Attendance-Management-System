// utils/certificates.js
import crypto from "crypto";

const SECRET = process.env.CERTIFICATE_SECRET;
const PREFIX = process.env.CERT_PREFIX || "PCCOE";

export function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function buildCertificateNo({ year, eventSeq, serial }) {
  const serialStr = String(serial).padStart(5, "0");
  return `${PREFIX}-${year}-EVT-${eventSeq}-${serialStr}`;
}

export function buildVerificationHash({ certificateNo, studentId, eventId, issuedAtISO }) {
  if (!SECRET) throw new Error("CERTIFICATE_SECRET missing");
  const raw = `${certificateNo}|${studentId}|${eventId}|${issuedAtISO}|${SECRET}`;
  return sha256(raw);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderOptionalLogo(src, alt, className = "") {
  const normalizedSrc = String(src || "").trim();
  if (!normalizedSrc) return "";
  return `<img src="${escapeHtml(normalizedSrc)}" alt="${escapeHtml(alt)}" class="${className}" />`;
}

export function buildCertificateHtml(data) {
  const studentName = escapeHtml(data.student_name);
  const eventTitle = escapeHtml(data.event_title);
  const clubName = escapeHtml(data.club_name);
  const eventDate = escapeHtml(data.event_date);
  const eventHours = escapeHtml(data.event_hours);
  const department = escapeHtml(data.department);
  const rollNo = escapeHtml(data.roll_no);
  const certificateNo = escapeHtml(data.certificate_no);
  const issuedAt = escapeHtml(data.issued_at_with_time || data.issued_at);
  const verificationHash = escapeHtml(data.verification_hash);
  const verifyUrl = escapeHtml(data.verify_url);
  const collegeName = escapeHtml(data.college_name);
  const collegeSubtitle = escapeHtml(data.college_subtitle);
  const collegeTagline = escapeHtml(data.college_tagline);
  const collegeLogo = renderOptionalLogo(
    data.college_logo_url,
    `${data.college_subtitle || "College"} logo`,
    "brand-logo brand-logo--college"
  );
  const clubLogo = renderOptionalLogo(
    data.club_logo_url,
    `${data.club_name || "Club"} logo`,
    "brand-logo brand-logo--club"
  );
  const studentMeta = [rollNo && `Roll No: ${rollNo}`, department && department]
    .filter(Boolean)
    .join(" | ");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Certificate - ${certificateNo}</title>
    <style>
      @page {
        size: A4 landscape;
        margin: 0;
      }

      :root {
        --ink: #14213d;
        --muted: #516079;
        --gold: #c89b3c;
        --gold-soft: #f5e5bd;
        --blue-soft: #eef5ff;
        --brand-blue: #163ea8;
        --brand-blue-soft: #d5e4ff;
        --brand-blue-deep: #0f2f82;
      }

      * { box-sizing: border-box; }
      html, body {
        width: 297mm;
        height: 210mm;
      }

      body {
        margin: 0;
        background: #ffffff;
        font-family: "Georgia", "Times New Roman", serif;
        color: var(--ink);
      }

      .sheet {
        width: 297mm;
        height: 210mm;
        margin: 0 auto;
        padding: 0;
        background: #ffffff;
      }

      .certificate {
        position: relative;
        width: 100%;
        height: 100%;
        padding: 34px 38px 28px;
        border: 2px solid rgba(29, 78, 216, 0.34);
        background:
          radial-gradient(circle at top left, rgba(219, 234, 254, 0.7), transparent 22%),
          radial-gradient(circle at bottom right, rgba(191, 219, 254, 0.45), transparent 20%),
          linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,255,0.98)),
          repeating-linear-gradient(
            45deg,
            rgba(200, 155, 60, 0.03) 0,
            rgba(200, 155, 60, 0.03) 10px,
            transparent 10px,
            transparent 20px
          );
        box-shadow:
          inset 0 0 0 8px rgba(219, 234, 254, 0.7),
          inset 0 0 0 16px rgba(22, 62, 168, 0.1),
          0 18px 48px rgba(20, 33, 61, 0.08);
        overflow: hidden;
      }

      .certificate::before,
      .certificate::after {
        content: "";
        position: absolute;
        pointer-events: none;
      }

      .certificate::before {
        inset: 14px;
        border: 2px solid rgba(22, 62, 168, 0.28);
        box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.08);
      }

      .certificate::after {
        inset: 24px;
        border: 1px solid rgba(15, 47, 130, 0.24);
      }

      .header {
        display: grid;
        grid-template-columns: 118px 1fr 118px;
        align-items: center;
        gap: 18px;
      }

      .brand-logo {
        display: block;
        object-fit: contain;
        background: #fff;
      }

      .brand-logo--college {
        width: 94px;
        height: 94px;
        margin: 0 auto;
      }

      .brand-logo--club {
        width: 94px;
        height: 94px;
        margin-left: auto;
      }

      .brand-logo--club:empty { display: none; }

      .institution {
        text-align: center;
      }

      .institution__name {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        letter-spacing: 0.02em;
      }

      .institution__subtitle {
        margin: 4px 0 0;
        font-size: 35px;
        font-weight: 700;
        line-height: 1.08;
      }

      .institution__tagline {
        margin: 8px 0 0;
        color: var(--muted);
        font-family: Arial, sans-serif;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .divider {
        margin: 18px auto 14px;
        width: 320px;
        height: 3px;
        background: linear-gradient(90deg, transparent, var(--brand-blue), #60a5fa, transparent);
        border-radius: 999px;
      }

      .club-line {
        text-align: center;
        font-family: Arial, sans-serif;
        font-size: 14px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--brand-blue-deep);
      }

      .title-block {
        margin-top: 24px;
        text-align: center;
      }

      .title-block__label {
        font-family: Arial, sans-serif;
        font-size: 32px;
        font-weight: 700;
        letter-spacing: 0.04em;
        color: #8a6a23;
      }

      .title-block__title {
        display: none;
        margin: 0;
        font-family: Arial, sans-serif;
        font-size: 58px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #111827;
      }

      .title-block__subtitle {
        display: none;
        margin: 0;
        font-family: Arial, sans-serif;
        font-size: 17px;
        letter-spacing: 0.35em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .body {
        margin-top: 28px;
        text-align: center;
      }

      .body__lead {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: #334155;
      }

      .student-name {
        margin: 20px auto 10px;
        padding-bottom: 12px;
        max-width: 760px;
        border-bottom: 2px solid #6fc3f7;
        font-family: Arial, sans-serif;
        font-size: 46px;
        font-weight: 800;
        color: #1f2937;
        text-transform: capitalize;
      }

      .student-meta {
        margin: 0;
        min-height: 20px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .body__copy {
        margin: 22px auto 0;
        max-width: 900px;
        font-family: Arial, sans-serif;
        font-size: 22px;
        line-height: 1.6;
        color: #27364d;
      }

      .body__copy strong {
        color: #0f172a;
      }

      .details {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
        margin-top: 28px;
      }

      .detail-card {
        padding: 14px 16px;
        border: 1px solid rgba(111, 195, 247, 0.35);
        border-radius: 14px;
        background: var(--blue-soft);
      }

      .detail-card__label {
        margin: 0;
        font-family: Arial, sans-serif;
        font-size: 11px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .detail-card__value {
        margin: 8px 0 0;
        font-family: Arial, sans-serif;
        font-size: 16px;
        font-weight: 700;
        color: #10213d;
        line-height: 1.35;
        word-break: break-word;
      }

      .footer {
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: end;
        gap: 18px;
        margin-top: 38px;
      }

      .signature {
        text-align: center;
      }

      .signature__line {
        width: 220px;
        margin: 0 auto;
        border-top: 2px solid rgba(20, 33, 61, 0.65);
      }

      .signature__name {
        margin: 10px 0 0;
        font-family: Arial, sans-serif;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .signature__role {
        margin: 4px 0 0;
        font-family: Arial, sans-serif;
        font-size: 12px;
        color: var(--muted);
      }

      .verification {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 18px;
        margin-top: 26px;
        padding-top: 18px;
        border-top: 1px solid rgba(20, 33, 61, 0.12);
      }

      .verification__text {
        flex: 1;
        font-family: Arial, sans-serif;
        font-size: 13px;
        line-height: 1.65;
        color: #3c4b64;
      }

      .verification__text strong {
        display: block;
        margin-bottom: 4px;
        color: #10213d;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 12px;
      }

      .verification__hint {
        margin-top: 8px;
        font-size: 11px;
        color: #64748b;
      }

      .verification__qr {
        width: 106px;
        height: 106px;
        padding: 8px;
        border: 1px solid rgba(20, 33, 61, 0.14);
        border-radius: 12px;
        background: #fff;
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="certificate">
        <div class="header">
          <div>${collegeLogo}</div>
          <div class="institution">
            <p class="institution__name">${collegeName}</p>
            <p class="institution__subtitle">${collegeSubtitle}</p>
            <p class="institution__tagline">${collegeTagline}</p>
          </div>
          <div>${clubLogo}</div>
        </div>

        <div class="divider"></div>
        <div class="club-line">${clubName}</div>

        <div class="title-block">
          <div class="title-block__label">Certificate of Participation</div>
        </div>

        <div class="body">
          <p class="body__lead">Awarded to</p>
          <div class="student-name">${studentName}</div>
          <p class="student-meta">${escapeHtml(studentMeta)}</p>

          <p class="body__copy">
            in recognition of successful participation in <strong>${eventTitle}</strong>, organized by
            <strong>${clubName}</strong> at <strong>${collegeSubtitle}</strong>.
            This acknowledges sincere involvement, completion of the event requirements, and commendable professional spirit.
          </p>

          <div class="details">
            <div class="detail-card">
              <p class="detail-card__label">Event Date</p>
              <p class="detail-card__value">${eventDate}</p>
            </div>
            <div class="detail-card">
              <p class="detail-card__label">Duration</p>
              <p class="detail-card__value">${eventHours} hours</p>
            </div>
            <div class="detail-card">
              <p class="detail-card__label">Issued On</p>
              <p class="detail-card__value">${issuedAt}</p>
            </div>
            <div class="detail-card">
              <p class="detail-card__label">Certificate No</p>
              <p class="detail-card__value">${certificateNo}</p>
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="signature">
            <div class="signature__line"></div>
            <p class="signature__name">Mrs. Shraddha Ovale</p>
            <p class="signature__role">Event Coordinator</p>
          </div>

          <div class="signature">
            <div class="signature__line"></div>
            <p class="signature__name">Dr. Sonali Patil</p>
            <p class="signature__role">Head of the Department (Computer Engineering)</p>
          </div>
        </div>

        <div class="verification">
          <div class="verification__text">
            <strong>Digital Verification</strong>
            Certificate No: ${certificateNo}<br />
            ${verificationHash ? `Verification Hash: ${verificationHash}<br />` : ""}
            Verify at: ${verifyUrl}
            <div class="verification__hint">Scan the QR code to validate this certificate online.</div>
          </div>
          <img src="${escapeHtml(data.qr_data_url)}" alt="Certificate verification QR" class="verification__qr" />
        </div>
      </div>
    </div>
  </body>
</html>`;
}
