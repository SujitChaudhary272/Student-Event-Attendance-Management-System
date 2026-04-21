import { query } from "../config/db.js";

// Create student (same as user)
export const createStudent = async (name, email, passwordHash) => {
  const result = await query(
    `INSERT INTO users (name, email, password_hash, auth_provider, role, updated_at)
     VALUES ($1,$2,$3,'password','Student',NOW())
     RETURNING id, name, email, role, created_at`,
    [name, email, passwordHash]
  );
  return result.rows[0];
};

export const findStudentByEmail = async (email) => {
  const result = await query(
    `SELECT * FROM users WHERE LOWER(email)=LOWER($1) AND LOWER(role)='student'`,
    [email]
  );
  return result.rows[0];
};

export const findStudentById = async (id) => {
  const result = await query(
    `SELECT id, name, email, role, created_at FROM users WHERE id=$1 AND LOWER(role)='student'`,
    [id]
  );
  return result.rows[0];
};
