import express from "express";
import { getOrders, saveOrder, deleteOrder } from "../controllers/orderController.js";

const router = express.Router();

router.get("/", getOrders);
router.post("/", saveOrder);
router.delete("/:id", deleteOrder);

export default router;
