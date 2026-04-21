import express from "express";
import {
  getDashboardStats,
  getAllClubs,
  adminCreateClub,
  toggleClubStatus,
  getClubById,
  getClubEvents,
  getAdminEventParticipants,
} from "../controllers/admin.controller.js";
import {
  getMembers,
  addMember,
  updateMemberRole,
  toggleMemberStatus,
  getMembersByClub
} from "../controllers/member.controller.js";
import { upload } from "../config/upload.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware("Admin"));

/* Clubs */
router.get("/dashboard/stats", getDashboardStats);
router.get("/clubs", getAllClubs);
router.post("/clubs", upload.single("image"), adminCreateClub);
router.put("/clubs/:id/toggle", toggleClubStatus);
router.get("/clubs/:clubId/events", getClubEvents);
router.get("/events/:eventId/participants", getAdminEventParticipants);

router.get("/members", getMembers);
router.post("/members", addMember);
router.get("/members/club/:clubId", getMembersByClub);
router.put("/members/:id/toggle", toggleMemberStatus);
router.put("/members/:id/role", updateMemberRole);
router.get("/clubs/:id", getClubById);

export default router;
