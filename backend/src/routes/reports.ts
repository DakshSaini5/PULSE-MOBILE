import { Router } from 'express';
import { upload, uploadToCloudinary } from '../services/uploadService';
import { randomUUID } from 'crypto';
import { analyzeMedicalDocument, generateMedicalReportSummary } from '../services/geminiService';
import { prisma } from '../index';

const router = Router();

// POST /upload - Upload and analyze a medical report image
router.post('/upload', upload.single('file'), async (req: any, res: any) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // 1 & 2. Upload to Cloudinary and OCR using Gemini Flash in parallel
    const mimeType = file.mimetype || 'image/jpeg';
    const [cloudinaryUrl, aiData] = await Promise.all([
      uploadToCloudinary(file.buffer, 'pulse_reports'),
      analyzeMedicalDocument(file.buffer, mimeType, 'report')
    ]);

    // 3. Get authenticated user ID
    const userId = req.user?.id || req.body?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: No user ID found' });
    }

    // 4. Save to Prisma DB using the REAL schema columns
    const report = await prisma.medicalReport.create({
      data: {
        userId,
        fileUrl: cloudinaryUrl,        // website's existing column
        imageUrl: cloudinaryUrl,       // our new column (same URL)
        reportType: 'LAB_REPORT',
        status: 'COMPLETED',
        MedicalReportValue: {
          create: aiData.biomarkers.map((bm: any) => ({
            key: bm.key || '',
            biomarker: bm.key || '',           // our added column
            value: parseFloat(bm.value) || 0,
            unit: bm.unit || '',
            referenceRange: bm.referenceRange || '',
            isAbnormal: bm.isAbnormal === true,
            category: 'Lab Result',
          }))
        }
      },
      include: {
        MedicalReportValue: true,
      }
    });

    // 5. Return 200 OK with the full record
    const mappedReport = { ...report, values: report.MedicalReportValue };
    return res.status(200).json(mappedReport);

  } catch (error) {
    console.error("Report Upload Error:", error);
    return res.status(500).json({ message: 'Failed to analyze report. Please try again.' });
  }
});

// GET / - Fetch all reports for authenticated user
router.get('/', async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const reports = await prisma.medicalReport.findMany({
      where: { userId },
      include: { 
        MedicalReportValue: true,
        MedicalReportSummary: true,
        SpecialistRecommendation: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const mappedReports = reports.map((r: any) => ({ 
      ...r, 
      values: r.MedicalReportValue,
      summary: r.MedicalReportSummary,
      specialists: r.SpecialistRecommendation
    }));

    res.json({ data: mappedReports });
  } catch (error) {
    console.error("Fetch Reports Error:", error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

// POST /:id/verify - Submit verified lab values, generate summary and specialist referrals
router.post('/:id/verify', async (req: any, res: any) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { values } = req.body.verifiedData || req.body;

    if (!values || !Array.isArray(values)) {
      return res.status(400).json({ message: 'Invalid values provided' });
    }

    // 1. Validate report belongs to user
    const existingReport = await prisma.medicalReport.findUnique({ where: { id } });
    if (!existingReport || existingReport.userId !== userId) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // 2. Delete old values and insert new values
    await prisma.medicalReportValue.deleteMany({ where: { medicalReportId: id } });
    await prisma.medicalReportValue.createMany({
      data: values.map((val: any) => ({
        medicalReportId: id,
        key: val.key || '',
        biomarker: val.key || '',
        value: parseFloat(val.value) || 0,
        unit: val.unit || '',
        referenceRange: val.referenceRange || '',
        isAbnormal: val.isAbnormal === true,
        category: 'Lab Result',
      }))
    });

    // 3. Generate summary and specialists via Gemini
    const aiAnalysis = await generateMedicalReportSummary(values);
    
    // 4. Update the DB with summary and specialists
    await prisma.medicalReportSummary.upsert({
      where: { medicalReportId: id },
      update: {
        healthSummary: aiAnalysis.summary?.healthSummary || '',
        overallStatus: aiAnalysis.summary?.overallStatus || 'STABLE',
        normalFindingsCount: values.filter(v => !v.isAbnormal).length,
        abnormalFindingsCount: values.filter(v => v.isAbnormal).length,
      },
      create: {
        id: randomUUID(),
        medicalReportId: id,
        healthSummary: aiAnalysis.summary?.healthSummary || '',
        overallStatus: aiAnalysis.summary?.overallStatus || 'STABLE',
        normalFindingsCount: values.filter(v => !v.isAbnormal).length,
        abnormalFindingsCount: values.filter(v => v.isAbnormal).length,
      }
    });

    await prisma.specialistRecommendation.deleteMany({ where: { medicalReportId: id } });
    if (aiAnalysis.specialists && Array.isArray(aiAnalysis.specialists)) {
      await prisma.specialistRecommendation.createMany({
        data: aiAnalysis.specialists.map((spec: any) => ({
          id: randomUUID(),
          medicalReportId: id,
          specialtyName: spec.specialtyName || '',
          confidenceScore: parseFloat(spec.confidenceScore) || 0.0,
          reason: spec.reason || '',
          recommendedHospitalsJson: '[]',
        }))
      });
    }

    await prisma.medicalReport.update({
      where: { id },
      data: { status: 'ANALYZED' }
    });

    // 5. Fetch and return the updated report
    const updatedReport = await prisma.medicalReport.findUnique({
      where: { id },
      include: { 
        MedicalReportValue: true,
        MedicalReportSummary: true,
        SpecialistRecommendation: true
      }
    });

    const mappedReport = { 
      ...updatedReport, 
      values: updatedReport?.MedicalReportValue,
      summary: updatedReport?.MedicalReportSummary,
      specialists: updatedReport?.SpecialistRecommendation
    };

    return res.status(200).json(mappedReport);

  } catch (error) {
    console.error("Verification Error:", error);
    return res.status(500).json({ message: 'Failed to verify and analyze report' });
  }
});

export default router;
