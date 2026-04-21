import express from "express";
import { register, login, getProfile } from "../controllers/organizer.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { organizerOnly } from "../middleware/organizerOnly.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.get("/profile", authMiddleware, organizerOnly, getProfile);

export default router;
