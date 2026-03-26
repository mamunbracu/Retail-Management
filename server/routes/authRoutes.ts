import express from "express";
import { login, resetPassword, signup, socialLogin } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/social-login", socialLogin);
router.post("/reset-password", resetPassword);

export default router;
