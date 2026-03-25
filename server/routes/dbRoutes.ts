import express from "express";
import { getTableData, updateTableData, deleteTableData } from "../controllers/dbController.js";

const router = express.Router();

router.get("/:table", getTableData);
router.put("/:table/:id", updateTableData);
router.delete("/:table/:id", deleteTableData);

export default router;
