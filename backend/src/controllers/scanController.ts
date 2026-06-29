import { Request, Response } from 'express';
import { prisma, io } from '../index';
import { uploadToCloudinary } from '../services/uploadService';
import { analyzeMedicalDocument } from '../services/geminiService';

export const uploadScan = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    const userId = req.body.userId;
    const typeStr = req.body.type || 'UNKNOWN';

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }

    let type: 'PRESCRIPTION' | 'LAB_REPORT' | 'UNKNOWN' = 'UNKNOWN';
    if (typeStr === 'PRESCRIPTION' || typeStr === 'LAB_REPORT') {
      type = typeStr;
    }

    // Ensure user exists (for local testing with mock users)
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: userId,
          email: `test-${userId}@pulse.com`,
          name: 'UI Tester'
        }
      });
    }

    // 1. Upload to Cloudinary
    const fileUrl = await uploadToCloudinary(file.buffer);

    // 2. Save PENDING status in Prisma
    const documentScan = await prisma.documentScan.create({
      data: {
        userId,
        fileUrl,
        type,
        status: 'PENDING'
      }
    });

    // 3. Return immediately so frontend shows "Processing..."
    res.json({
      scanId: documentScan.id,
      status: documentScan.status,
      fileUrl
    });

    // 4. Run Gemini extraction asynchronously
    processDocumentAsync(documentScan.id, file.buffer, file.mimetype, type);

  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
};

const processDocumentAsync = async (
  scanId: string, 
  fileBuffer: Buffer, 
  mimeType: string,
  expectedType: string
) => {
  try {
    // Map the DocumentScan type to the AI Service expected type
    const aiType = expectedType === 'PRESCRIPTION' ? 'prescription' : 'report';
    
    // Using the geminiService that enforces strict JSON!
    const aiData = await analyzeMedicalDocument(fileBuffer, mimeType, aiType);

    // Parse data and save to DB
    if (aiType === 'prescription' && aiData.medicines) {
      for (const med of aiData.medicines) {
        await prisma.medication.create({
          data: {
            documentScanId: scanId,
            name: med.medicineName || 'Unknown',
            dosage: med.dosage || 'Unknown',
            frequency: med.instructions || 'Unknown',
            durationDays: 0, // Mock duration or extract it if added to prompt
            simplifiedExplanation: med.simplifiedExplanation || null,
            sideEffects: Array.isArray(med.sideEffects) ? med.sideEffects.join(', ') : (med.sideEffects || null),
            drugInteractions: Array.isArray(med.drugInteractions) ? med.drugInteractions.join(', ') : (med.drugInteractions || null)
          }
        });
      }
    } else if (aiType === 'report' && aiData.biomarkers) {
      for (const marker of aiData.biomarkers) {
        await prisma.labResult.create({
          data: {
            documentScanId: scanId,
            name: marker.key || 'Unknown',
            value: parseFloat(marker.value) || 0,
            unit: marker.unit || '',
            referenceRange: marker.referenceRange || '',
            isAbnormal: marker.isAbnormal || false
          }
        });
      }
    }

    // Mark as PROCESSED and attach the full summary JSON if it exists
    const updatedScan = await prisma.documentScan.update({
      where: { id: scanId },
      data: { 
        status: 'PROCESSED',
        aiSummaryJson: aiData.summary ? JSON.stringify(aiData.summary) : null
      },
      include: {
        medications: true,
        labResults: true
      }
    });

    // Emit realtime event via Socket.io!
    io.emit('scan_processed', {
      scanId,
      data: updatedScan
    });

  } catch (error) {
    console.error('Async Processing Error:', error);
    await prisma.documentScan.update({
      where: { id: scanId },
      data: { status: 'FAILED' }
    });
    
    io.emit('scan_failed', { scanId });
  }
};
