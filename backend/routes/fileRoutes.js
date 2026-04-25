import { Router } from "express";
import {
	addFileMetadata,
	deleteAllFileMetadata,
	deleteFileMetadata,
	getFileById,
	getFiles
} from "../controllers/fileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", getFiles);
router.get("/:id", getFileById);
router.post("/", addFileMetadata);
router.delete("/all", deleteAllFileMetadata);
router.delete("/:id", deleteFileMetadata);

export default router;
