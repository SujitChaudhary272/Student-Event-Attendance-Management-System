function formatDate(dateLike) {
  return new Date(dateLike).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDurationHours(startTime, endTime) {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const rawHours = Math.max(0, (end - start) / (1000 * 60 * 60));
  const rounded = Math.round(rawHours * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatEventDateRange(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const sameDay = start.toISOString().slice(0, 10) === end.toISOString().slice(0, 10);
  if (sameDay) return formatDate(start);

  return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatIssueDateTime(dateLike) {
  return new Date(dateLike).toLocaleString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeAssetUrl(urlLike) {
  const raw = String(urlLike || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;

  const backendBase = String(
    process.env.PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  return raw.startsWith("/") ? `${backendBase}${raw}` : `${backendBase}/${raw}`;
}

const DEFAULT_COLLEGE_LOGO_URL = "https://www.pccoepune.com/images/pccoe-logo-new.webp";
const DEFAULT_COLLEGE_NAME = "Pimpri Chinchwad Education Trust's";
const DEFAULT_COLLEGE_SUBTITLE = "Pimpri Chinchwad College of Engineering";
const DEFAULT_COLLEGE_TAGLINE =
  "NBA Accredited | NAAC Accredited with 'A' Grade | An Autonomous Institute | AICTE Approved";

export function buildCertificateTemplateData(payload) {
  const {
    studentName,
    rollNo,
    department,
    eventTitle,
    clubName,
    startTime,
    endTime,
    issuedAt,
    certificateNo,
    verificationHash,
    verifyUrl,
    clubLogoUrl,
    collegeLogoUrl,
  } = payload;

  return {
    student_name: studentName,
    roll_no: rollNo || "",
    department: department || "",
    event_title: eventTitle,
    club_name: clubName,
    start_date: formatDate(startTime),
    end_date: formatDate(endTime),
    event_date: formatEventDateRange(startTime, endTime),
    issued_at: formatDate(issuedAt),
    certificate_no: certificateNo,
    verification_hash: verificationHash,
    verify_url: verifyUrl,
    event_hours: formatDurationHours(startTime, endTime),
    issued_at_with_time: formatIssueDateTime(issuedAt),
    club_logo_url: normalizeAssetUrl(clubLogoUrl),
    college_logo_url: normalizeAssetUrl(collegeLogoUrl || DEFAULT_COLLEGE_LOGO_URL),
    college_name: DEFAULT_COLLEGE_NAME,
    college_subtitle: DEFAULT_COLLEGE_SUBTITLE,
    college_tagline: DEFAULT_COLLEGE_TAGLINE,
  };
}
