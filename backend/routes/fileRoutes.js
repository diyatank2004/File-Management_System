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
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const router = Router();

// Use 'protect' here
router.use(protect);

router.get("/", getFiles);
router.get("/:id", getFileById);

// Ensure 'upload' is imported or removed as we discussed before
router.post('/upload', protect, upload.single('file'), uploadAndIndex);

router.delete("/all", deleteAllFileMetadata);
router.delete("/:id", deleteFileMetadata);

export default router;