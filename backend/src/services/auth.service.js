import { createUser, findUserByEmail } from "../models/user.model.js";
import { generateToken } from "../config/jwt.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { adminEmailError, isValidAdminEmail } from "../utils/adminEmail.js";

export const registerUser = async (name, email, password, role) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedRole = role || "Student";

  if (normalizedRole === "Admin" && !isValidAdminEmail(normalizedEmail)) {
    throw new Error(adminEmailError());
  }

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error("Email already exists");
  }

  const hashed = await hashPassword(password);

  return await createUser(name, normalizedEmail, hashed, normalizedRole);
};

export const loginUser = async (email, password) => {
  const user = await findUserByEmail(String(email || "").trim().toLowerCase());
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) throw new Error("Invalid credentials");

  const token = generateToken({ userId: user.id, role: user.role });

  return { token, user };
};
