import { apiRequest } from "./apiClient";

const persistAdminSession = (data) => {
  if (data?.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role || "Admin");
    localStorage.setItem("adminName", data.name || "Admin");
  }
};

export async function adminLogin(email, password) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });

  if (data?.role !== "Admin") {
    throw new Error("This account is not an admin account");
  }

  persistAdminSession(data);
  return data;
}

export async function adminRegister(name, email, password) {
  const data = await apiRequest("/auth/signup", {
    method: "POST",
    body: { name, email, password, role: "Admin" },
    auth: false,
  });

  return data;
}

export function adminLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("adminName");
}

export function isAdminAuthenticated() {
  return Boolean(localStorage.getItem("token")) && localStorage.getItem("role") === "Admin";
}
