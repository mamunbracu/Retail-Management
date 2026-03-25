import express from "express";
import { getRoster, saveRoster, deleteRoster } from "../controllers/rosterController.js";

const router = express.Router();

router.get("/", getRoster);
router.post("/", saveRoster);
router.delete("/:id", deleteRoster);

export default router;
