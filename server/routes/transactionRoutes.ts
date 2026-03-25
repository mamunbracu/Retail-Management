import express from "express";
import { getTransactions, saveTransaction, deleteTransaction } from "../controllers/transactionController.js";

const router = express.Router();

router.get("/", getTransactions);
router.post("/", saveTransaction);
router.delete("/:id", deleteTransaction);

export default router;
