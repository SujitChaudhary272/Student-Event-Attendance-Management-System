import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getLiveEventsForStudent,
  registerForEvent,
} from "../controllers/student.eventRegistration.controller.js";

const router = express.Router();

router.get("/events/live", authMiddleware, getLiveEventsForStudent);
router.post(
  "/clubs/:clubId/events/:eventId/register",
  authMiddleware,
  registerForEvent
);

export default router;
