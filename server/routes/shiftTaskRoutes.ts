import express from "express";
import { getShiftTasks, saveShiftTasks } from "../controllers/shiftTaskController.js";

const router = express.Router();

router.get("/", getShiftTasks);
router.post("/", saveShiftTasks);

export default router;
