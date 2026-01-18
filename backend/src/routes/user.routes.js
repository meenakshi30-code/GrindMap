import express from "express";
import { updateUserProfile } from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.put("/profile", protect, updateUserProfile);

export default router;
