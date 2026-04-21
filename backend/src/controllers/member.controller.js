import {pool} from "../config/db.js";
import { hashPassword } from "../utils/hash.js";

const ALLOWED_MEMBER_ROLES = ["President", "Secretary", "Member"];

const normalizeMemberRole = (role) => {
  if (!role) return "Member";
  const normalized = String(role).trim();
  return ALLOWED_MEMBER_ROLES.includes(normalized) ? normalized : null;
};

// Get all members
export const getMembers = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM members ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get members by club
export const getMembersByClub = async (req, res) => {
  try {
    const { clubId } = req.params;
    const result = await pool.query("SELECT * FROM members WHERE club_id=$1 ORDER BY created_at DESC", [clubId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add member
export const addMember = async (req, res) => {
  try {
    const { club_id, name, email, role, password } = req.body;
    const memberRole = normalizeMemberRole(role);

    if (!club_id) return res.status(400).json({ error: "club_id is required" });
    if (!name) return res.status(400).json({ error: "name is required" });
    if (!email) return res.status(400).json({ error: "email is required" });
    if (!password) return res.status(400).json({ error: "password is required" });
    if (!memberRole) {
      return res.status(400).json({ error: "role must be President, Secretary, or Member" });
    }

    const club = await pool.query("SELECT id FROM clubs WHERE id=$1", [club_id]);
    if (club.rows.length === 0) {
      return res.status(400).json({ error: "Invalid club_id (club not found)" });
    }

    const existing = await pool.query(
      "SELECT id FROM members WHERE LOWER(email)=LOWER($1)",
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Member with this email already exists" });
    }

    const hashedPassword = await hashPassword(password);

    await pool.query(
      `INSERT INTO members (club_id, name, email, role, password)
       VALUES ($1, $2, $3, $4, $5)`,
      [club_id, name, email, memberRole, hashedPassword]
    );

    res.json({ message: "Member added successfully" });
  } catch (err) {
    console.error("addMember failed:", err);
    res.status(500).json({
      error: "Failed to add member",
      detail: err.message,
    });
  }
};

// Update role
export const updateMemberRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const memberRole = normalizeMemberRole(role);

    if (!memberRole) {
      return res.status(400).json({ error: "role must be President, Secretary, or Member" });
    }

    await pool.query("UPDATE members SET role=$1 WHERE id=$2", [memberRole, id]);
    res.json({ message: "Role updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Toggle status
export const toggleMemberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await pool.query("SELECT status FROM members WHERE id=$1", [id]);
    const newStatus = member.rows[0].status === "Active" ? "Inactive" : "Active";
    await pool.query("UPDATE members SET status=$1 WHERE id=$2", [newStatus, id]);
    res.json({ message: `Member ${newStatus}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
