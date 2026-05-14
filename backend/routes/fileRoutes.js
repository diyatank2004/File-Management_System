import { Router } from "express";
import {
	getFiles,
	uploadAndIndex,
	getFileById,
	deleteFileMetadata,
	deleteAllFileMetadata
} from '../controllers/fileController.js';
import { protect } from '../middleware/authMiddleware.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
	storage,
	limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit [cite: 277]
});

const router = Router();

// Apply protection middleware to all routes [cite: 278]
router.use(protect);

// Standard File Retrieval
router.get("/", getFiles);

// FIX: Added Search Route explicitly for the frontend's searchFiles() call
router.get("/search", getFiles);

router.get("/:id", getFileById);

// Upload and Indexing
router.post('/upload', upload.single('file'), uploadAndIndex);

// Metadata Management
router.delete("/all", deleteAllFileMetadata);
router.delete("/:id", deleteFileMetadata);

export default router;