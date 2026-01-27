import express from "express";
import { checkAuth, login, logout, signup, updateProfile,resetPassword,updateUserCredentials  } from "../controllers/authController.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { logActivity } from '../lib/activityLogger.js';
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);   
router.post("/logout", logout);
router.put("/update-credentials", protectRoute, updateUserCredentials);
router.post("/reset-password", resetPassword);
router.put("/update-profile", protectRoute, updateProfile);
router.get("/check", protectRoute, checkAuth);

export default router;
