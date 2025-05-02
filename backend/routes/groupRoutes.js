// routes/groupRoutes.js
import express from "express";
import { 
  createGroup, 
  getUserGroups, 
  getGroupById, 
  addGroupMember, 
  removeGroupMember, 
  deleteGroup 
} from "../controllers/groupController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Group routes
router.post("/create", createGroup);
router.get("/", getUserGroups);
router.get("/:groupId", getGroupById);
router.post("/member", addGroupMember);
router.delete("/member", removeGroupMember);
router.delete("/:groupId", deleteGroup);

export default router;