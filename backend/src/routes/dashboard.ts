import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// GET /api/dashboard/summary
router.get('/summary', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Run all count queries and data fetching in parallel for performance
    const [
      prescriptionsCount,
      reportsCount,
      savedHospitalsCount,
      trendsCount,
      emergencyContacts
    ] = await Promise.all([
      prisma.prescription.count({ where: { userId } }),
      prisma.medicalReport.count({ where: { userId } }),
      prisma.savedHospital.count({ where: { userId } }),
      prisma.healthTrend.count({ where: { userId } }),
      prisma.emergencyContact.findMany({ 
        where: { userId },
        orderBy: { createdAt: 'asc' } 
      })
    ]);

    res.json({
      summary: {
        scans: prescriptionsCount + reportsCount,
        hospitals: savedHospitalsCount,
        trends: trendsCount
      },
      emergencyContacts
    });

  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
