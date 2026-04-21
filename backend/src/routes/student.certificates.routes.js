import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  downloadCertificate,
  generateCertificate,
} from "../controllers/student.certificates.controller.js";

const router = express.Router();
router.use(authMiddleware);

router.post("/events/:eventId/certificates/generate", generateCertificate);
router.get("/certificates/:certificateNo/download", downloadCertificate);

export default router;
