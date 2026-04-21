import express from "express";
import {
  registerStudent,
  loginStudent,
  getMyProfile,
  deleteMyAccount,
} from "../controllers/student.auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", authRateLimiter, registerStudent);
router.post("/login", authRateLimiter, loginStudent);
router.get("/me", authMiddleware, getMyProfile);
router.delete("/me", authMiddleware, deleteMyAccount);
router.post("/me/delete", authMiddleware, deleteMyAccount);

export default router;
