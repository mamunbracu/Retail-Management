import express from "express";
import { getSales, saveSale, deleteSale } from "../controllers/salesController.js";

const router = express.Router();

router.get("/", getSales);
router.post("/", saveSale);
router.delete("/:id", deleteSale);

export default router;
