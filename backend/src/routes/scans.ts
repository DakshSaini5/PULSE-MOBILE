import { Router } from 'express';
import { uploadScan } from '../controllers/scanController';
import { upload } from '../services/uploadService';

const router = Router();

// /api/scans/upload
router.post('/upload', upload.single('file'), uploadScan);

export default router;
