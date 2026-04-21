import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";
import { comparePassword, hashPassword } from "../utils/hash.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const register = async (req, res) => {
  const { club_id, name, email, password } = req.body;

  try {
    if (!club_id || !name || !email || !password) {
      return res.status(400).json({ error: "club_id, name, email and password are required" });
    }

    const club = await pool.query("SELECT id FROM clubs WHERE id = $1", [club_id]);
    if (club.rows.length === 0) {
      return res.status(400).json({ error: "Selected club does not exist" });
    }

    const existing = await pool.query(
      "SELECT id FROM members WHERE LOWER(email) = LOWER($1)",
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Organizer account already exists for this email" });
    }

    const hashedPassword = await hashPassword(password);

    const result = await pool.query(
      `INSERT INTO members (club_id, name, email, password, role, status)
       VALUES ($1, $2, $3, $4, 'Member', 'Active')
       RETURNING id, name, email, role, club_id, status`,
      [club_id, name, email, hashedPassword]
    );

    return res.status(201).json({
      message: "Organizer account created successfully",
      member: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("LOGIN ATTEMPT:", email, password);


  try {
    const result = await pool.query(
      "SELECT * FROM members WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const member = result.rows[0];

    if (member.status && member.status !== "Active") {
      return res.status(403).json({ error: "Member account is inactive" });
    }
    
    const isMatch = await comparePassword(password, member.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { memberId: member.id, clubId: member.club_id, role: member.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      member: {
        id: member.id,
        name: member.name,
        role: member.role,
        clubId: member.club_id,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { memberId } = req.user;
    const result = await pool.query(
      "SELECT id, name, email, role, club_id, status FROM members WHERE id=$1",
      [memberId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
