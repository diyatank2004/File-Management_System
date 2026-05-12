import { Router } from "express";
import {
	getFiles,
	uploadAndIndex,
	getFileById,
	deleteFileMetadata,
	deleteAllFileMetadata
} from '../controllers/fileController.js';

// CHANGE THIS LINE: Import 'protect' instead of 'authMiddleware'
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Use 'protect' here
router.use(protect);

router.get("/", getFiles);
router.get("/:id", getFileById);

// Ensure 'upload' is imported or removed as we discussed before
router.post('/upload', protect, uploadAndIndex);

router.delete("/all", deleteAllFileMetadata);
router.delete("/:id", deleteFileMetadata);

export default router;