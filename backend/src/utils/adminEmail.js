const ADMIN_EMAIL_PATTERN = /^[a-z]+(?:\.[a-z]+)+@[a-z0-9_]+\.org$/;

export function isValidAdminEmail(email) {
  return ADMIN_EMAIL_PATTERN.test(String(email || "").trim().toLowerCase());
}

export function adminEmailError() {
  return "Admin email must be in the format name.surname@institute_name.org";
}
