import express from "express";
import authRoutes from "./authRoutes.js";
import employeeRoutes from "./employeeRoutes.js";
import salaryRoutes from "./salaryRoutes.js";
import salesRoutes from "./salesRoutes.js";
import transactionRoutes from "./transactionRoutes.js";
import rosterRoutes from "./rosterRoutes.js";
import instructionRoutes from "./instructionRoutes.js";
import resourceRoutes from "./resourceRoutes.js";
import orderRoutes from "./orderRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import documentRoutes from "./documentRoutes.js";
import shiftTaskRoutes from "./shiftTaskRoutes.js";
import appSettingsRoutes from "./appSettingsRoutes.js";
import dbRoutes from "./dbRoutes.js";
import ecommerceRoutes from "./ecommerceRoutes.js";

const router = express.Router();

router.use("/", authRoutes);
router.use("/employees", employeeRoutes);
router.use("/salaries", salaryRoutes);
router.use("/sales", salesRoutes);
router.use("/transactions", transactionRoutes);
router.use("/roster", rosterRoutes);
router.use("/instructions", instructionRoutes);
router.use("/resources", resourceRoutes);
router.use("/order-list", orderRoutes);
router.use("/notifications", notificationRoutes);
router.use("/documents", documentRoutes);
router.use("/shift-tasks", shiftTaskRoutes);
router.use("/app-settings", appSettingsRoutes);
router.use("/db", dbRoutes);
router.use("/ecommerce", ecommerceRoutes);

export default router;
