import { Router } from "express";
import { addFileMetadata, deleteFileMetadata, getFiles } from "../controllers/fileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", getFiles);
router.post("/", addFileMetadata);
router.delete("/:id", deleteFileMetadata);

export default router;
