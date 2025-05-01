import express from "express";

import { getStreamToken } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/token", protect, getStreamToken);

export default router;