import express from "express";
import { getEmployees, saveEmployee, deleteEmployee } from "../controllers/employeeController.js";

const router = express.Router();

router.get("/", getEmployees);
router.post("/", saveEmployee);
router.delete("/:id", deleteEmployee);

export default router;
