import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { generateToken } from "../config/jwt.js";
import { getStudentUserTable, hasColumn } from "../utils/studentSchema.js";

const AUTH_TABLE = "users";

async function getAuthTableMeta() {
  const hasUpdatedAt = await hasColumn(AUTH_TABLE, "updated_at");
  const hasAuthProvider = await hasColumn(AUTH_TABLE, "auth_provider");

  return {
    userTable: AUTH_TABLE,
    usesUsersTable: true,
    hasUpdatedAt,
    hasAuthProvider,
  };
}

function authWhereClause(usesUsersTable, startIndex = 1) {
  return usesUsersTable
    ? `WHERE LOWER(email)=LOWER($${startIndex}) AND LOWER(role)='student'`
    : `WHERE LOWER(email)=LOWER($${startIndex})`;
}

export const registerStudent = async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();

  try {
    const name = String(req.body?.name || "").trim();
    const rollNo = String(req.body?.rollNo || req.body?.roll_no || "").trim();
    const password = String(req.body?.password || "");

    if (!name || !email || !rollNo || !password) {
      return res.status(400).json({ error: "name,email,rollNo,password required" });
    }

    const meta = await getAuthTableMeta();
    const hasRollNo = await hasColumn(meta.userTable, "roll_no");

    const existing = await pool.query(
      `
      SELECT id, role
      FROM ${meta.userTable}
      WHERE LOWER(email)=LOWER($1)
      `,
      [email]
    );

    if (existing.rows.length > 0) {
      const existingUser = existing.rows[0];
      const existingRole = String(existingUser.role || "").toLowerCase();

      if (existingRole !== "student") {
        return res.status(409).json({
          error: `Email ${email} is already registered for another account type.`,
          email,
        });
      }

      return res.status(409).json({
        error: `Email ${email} already exists. Please login.`,
        email,
      });
    }

    const passHash = await bcrypt.hash(password, 10);

    const columns = ["name", "email", "password_hash", "role"];
    const values = ["$1", "$2", "$3", "'Student'"];
    const params = [name, email, passHash];

    if (hasRollNo) {
      columns.push("roll_no");
      values.push(`$${params.length + 1}`);
      params.push(rollNo);
    }

    if (meta.hasAuthProvider) {
      columns.push("auth_provider");
      values.push("'password'");
    }

    if (meta.hasUpdatedAt) {
      columns.push("updated_at");
      values.push("NOW()");
    }

    const created = await pool.query(
      `
      INSERT INTO ${meta.userTable}
        (${columns.join(", ")})
      VALUES (${values.join(", ")})
      RETURNING id, name, email, ${hasRollNo ? "roll_no" : "NULL::text AS roll_no"}
      `,
      params
    );

    const student = created.rows[0];
    const token = generateToken({ userId: student.id, role: "Student" });

    return res.json({
      message: "Student registered successfully",
      token,
      role: "Student",
      name: student.name,
      email: student.email,
      roll_no: student.roll_no || null,
    });
  } catch (err) {
    console.error("registerStudent error:", err);
    if (err?.code === "23505") {
      return res.status(409).json({
        error: `Email ${email} already exists. Please login.`,
        email,
      });
    }
    return res.status(500).json({ error: "Registration failed. Server error." });
  }
};

export const loginStudent = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    const meta = await getAuthTableMeta();

    const result = await pool.query(
      `
      SELECT id, name, email, password_hash
      FROM ${meta.userTable}
      ${authWhereClause(meta.usesUsersTable)}
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const student = result.rows[0];

    const match = await bcrypt.compare(password, student.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken({
      userId: student.id,
      role: "Student",
    });

    return res.json({
      token,
      role: "Student",
      name: student.name,
      email: student.email,
    });
  } catch (err) {
    console.error("loginStudent error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const userTable = await getStudentUserTable();
    const hasPhone = await hasColumn(userTable, "phone");
    const hasRollNo = await hasColumn(userTable, "roll_no");
    const hasDepartment = await hasColumn(userTable, "department");
    const hasGender = await hasColumn(userTable, "gender");
    const hasYear = await hasColumn(userTable, "year");

    const result = await pool.query(
      `SELECT
        name,
        email,
        ${hasPhone ? "phone" : "NULL::text AS phone"},
        ${hasRollNo ? "roll_no" : "NULL::text AS roll_no"},
        ${hasDepartment ? "department" : "NULL::text AS department"},
        ${hasGender ? "gender" : "NULL::text AS gender"},
        ${hasYear ? "year" : "NULL::text AS year"}
       FROM ${userTable}
       WHERE id = $1`,
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("getMyProfile error:", err);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
};

export const deleteMyAccount = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const userRole = String(req.user.role || "").toLowerCase();

    if (userRole && userRole !== "student") {
      return res.status(403).json({ error: "Only student accounts can be deleted here" });
    }

    const result = await pool.query(
      `
      DELETE FROM users
      WHERE id = $1 AND LOWER(role) = 'student'
      RETURNING id
      `,
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student account not found" });
    }

    return res.json({ message: "Student account deleted permanently" });
  } catch (err) {
    console.error("deleteMyAccount error:", err);
    return res.status(500).json({ error: "Failed to delete student account" });
  }
};
