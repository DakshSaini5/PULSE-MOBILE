import { Router } from 'express';
import { upload, uploadToCloudinary } from '../services/uploadService';
import { analyzeMedicalDocument } from '../services/geminiService';
import { prisma } from '../index';

const router = Router();

// POST /upload - Upload and analyze a prescription image
router.post('/upload', upload.single('file'), async (req: any, res: any) => {
  console.log("--> Hit POST /api/prescriptions/upload!");
  try {
    const file = req.file;
    if (!file) {
      console.log("--> No file uploaded!");
      return res.status(400).json({ message: 'No file uploaded' });
    }
    console.log(`--> Received file: ${file.originalname} (${file.size} bytes)`);

    // 1 & 2. Upload to Cloudinary and OCR using Gemini Flash in parallel
    const mimeType = file.mimetype || 'image/jpeg';
    const [cloudinaryUrl, aiData] = await Promise.all([
      uploadToCloudinary(file.buffer, 'pulse_prescriptions'),
      analyzeMedicalDocument(file.buffer, mimeType, 'prescription')
    ]);

    // 3. Get authenticated user ID
    const userId = req.user?.id || req.body?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: No user ID found' });
    }

    // 4. Save to Prisma DB using the REAL schema columns
    const prescription = await prisma.prescription.create({
      data: {
        userId,
        fileUrl: cloudinaryUrl,       // website's existing column
        imageUrl: cloudinaryUrl,      // our new column (same URL)
        status: 'COMPLETED',
        prescriptionAnalysis: {
          create: (aiData.medicines || []).map((med: any) => ({
            medicineName: med.medicineName || 'UNREADABLE',
            dosage: med.dosage || 'UNREADABLE',
            instructions: med.instructions || 'Not provided',
            simplifiedExplanation: med.simplifiedExplanation || '',
            sideEffects: Array.isArray(med.sideEffects) ? med.sideEffects.join(', ') : (med.sideEffects || ''),
            drugInteractions: Array.isArray(med.drugInteractions) ? med.drugInteractions.join(', ') : (med.drugInteractions || ''),
          }))
        }
      },
      include: {
        prescriptionAnalysis: true,
      }
    });

    // 5. Return 200 OK with the full record
    return res.status(200).json(prescription);

  } catch (error) {
    console.error("Prescription Upload Error:", error);
    return res.status(500).json({ message: 'Failed to analyze prescription. Please try again.' });
  }
});

// GET / - Fetch all prescriptions for authenticated user
router.get('/', async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { userId },
      include: { prescriptionAnalysis: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: prescriptions });
  } catch (error) {
    console.error("Fetch Prescriptions Error:", error);
    res.status(500).json({ message: 'Failed to fetch prescriptions' });
  }
});

export default router;
