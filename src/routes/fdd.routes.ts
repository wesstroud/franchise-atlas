import { Router } from "express";
import multer from "multer";
import { ingestFdd } from "../services/ingestion.service.js";

const upload = multer({ storage: multer.memoryStorage() });

export const fddRouter = Router();

fddRouter.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }

    const brandName = String(req.body.brandName ?? "").trim();
    const year = String(req.body.year ?? "").trim();
    const category = req.body.category ? String(req.body.category).trim() : undefined;

    if (!brandName || !year) {
      return res.status(400).json({ error: "brandName and year are required" });
    }

    const result = await ingestFdd({
      fileBuffer: req.file.buffer,
      brandName,
      year,
      category
    });

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
});