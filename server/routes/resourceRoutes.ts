import express from "express";
import { getResources, saveResource, deleteResource } from "../controllers/resourceController.js";

const router = express.Router();

router.get("/", getResources);
router.post("/", saveResource);
router.delete("/:id", deleteResource);

export default router;
