import express from "express";
import { getDocuments, getDocumentContent, saveDocument, deleteDocument } from "../controllers/documentController.js";

const router = express.Router();

router.get("/", getDocuments);
router.get("/:id/content", getDocumentContent);
router.post("/", saveDocument);
router.delete("/:id", deleteDocument);

export default router;
