import { query } from "../config/db.js";

export const createUser = async (name, email, passwordHash, role) => {
  const result = await query(
    `INSERT INTO users (name, email, password_hash, auth_provider, role, updated_at)
     VALUES ($1,$2,$3,'password',$4,NOW())
     RETURNING id, name, email, role, auth_provider, created_at`,
    [name, email, passwordHash, role]
  );
  return result.rows[0];
};

export const findUserByEmail = async (email) => {
  const result = await query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0];
};

export const findUserById = async (id) => {
  const result = await query(
    `SELECT id, name, email, role, created_at FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

export const getAllUsers = async () => {
  const result = await query(
    `SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`
  );
  return result.rows;
};

export const updateUserRole = async (userId, newRole) => {
  const result = await query(
    `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role`,
    [newRole, userId]
  );
  return result.rows[0];
};
