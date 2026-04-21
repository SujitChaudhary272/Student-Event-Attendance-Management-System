import { apiRequest } from "./apiClient";

function persistStudentSession(data) {
  if (data?.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", "Student");
    localStorage.setItem("studentName", data.name);
    localStorage.setItem("studentEmail", data.email);
    if (data.roll_no) localStorage.setItem("studentRollNo", data.roll_no);
  }
}

export async function studentLogin(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const data = await apiRequest("/students/auth/login", {
    method: "POST",
    body: { email: normalizedEmail, password },
    auth: false,
  });

  persistStudentSession(data);

  return data;
}

export async function studentSignup(name, email, rollNo, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const data = await apiRequest("/students/auth/register", {
    method: "POST",
    body: { name, email: normalizedEmail, rollNo, password },
    auth: false
  });

  persistStudentSession(data);
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("studentName");
  localStorage.removeItem("studentEmail");
  localStorage.removeItem("studentRollNo");
}

export const fetchMyProfile = () =>
  apiRequest("/students/auth/me", { method: "GET" });

export async function deleteMyAccount() {
  try {
    return await apiRequest("/students/auth/me", { method: "DELETE" });
  } catch (err) {
    if (!String(err?.message || "").includes("404")) {
      throw err;
    }

    return apiRequest("/students/auth/me/delete", { method: "POST" });
  }
}

