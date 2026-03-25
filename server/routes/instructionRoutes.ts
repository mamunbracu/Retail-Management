import express from "express";
import { getInstructions, saveInstruction, deleteInstruction } from "../controllers/instructionController.js";

const router = express.Router();

router.get("/", getInstructions);
router.post("/", saveInstruction);
router.delete("/:id", deleteInstruction);

export default router;
