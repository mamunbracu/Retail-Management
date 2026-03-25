import express from "express";
import { getAppSettings, saveAppSettings } from "../controllers/appSettingsController.js";

const router = express.Router();

router.get("/", getAppSettings);
router.post("/", saveAppSettings);

export default router;
