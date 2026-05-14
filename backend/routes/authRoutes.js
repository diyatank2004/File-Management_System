import express from "express";
import { signup, login } from "../controllers/authController.js";

const router = express.Router();

// Use controller functions with proper validation and consistent token expiry
router.post("/register", signup);
router.post("/login", login);

export default router;