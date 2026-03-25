import express from "express";
import { getSalaries, saveSalary, deleteSalary } from "../controllers/salaryController.js";

const router = express.Router();

router.get("/", getSalaries);
router.post("/", saveSalary);
router.delete("/:id", deleteSalary);

export default router;
