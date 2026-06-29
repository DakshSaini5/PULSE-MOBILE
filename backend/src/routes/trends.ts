import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    // Fetch all lab results for the user by joining DocumentScan
    const labResults = await prisma.labResult.findMany({
      where: {
        documentScan: {
          userId: userId,
          status: 'PROCESSED'
        }
      },
      include: {
        documentScan: true
      },
      orderBy: {
        documentScan: {
          createdAt: 'asc'
        }
      }
    });

    const trends = labResults.map(lr => ({
      markerName: lr.name,
      value: lr.value,
      unit: lr.unit,
      recordedAt: lr.documentScan.createdAt.toISOString()
    }));

    res.json(trends);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

router.get('/insights', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    // Fetch abnormal lab results to generate insights
    const abnormalResults = await prisma.labResult.findMany({
      where: {
        isAbnormal: true,
        documentScan: {
          userId: userId,
          status: 'PROCESSED'
        }
      },
      orderBy: {
        documentScan: {
          createdAt: 'desc'
        }
      },
      take: 5
    });

    if (abnormalResults.length === 0) {
      return res.json([
        {
          id: '1',
          userId,
          title: 'Optimal Health Maintenance',
          description: 'Your recent scans show healthy biomarkers. Maintain a balanced diet, stay hydrated, and continue regular physical activity to sustain this healthy state.',
          category: 'MAINTENANCE',
          severity: 'LOW',
          createdAt: new Date().toISOString()
        }
      ]) as any;
    }

    // Generate dynamic insights based on the abnormal biomarkers
    const insights = abnormalResults.map((lr, index) => {
      let title = `Attention to ${lr.name}`;
      let description = `Your recent ${lr.name} level was ${lr.value} ${lr.unit}, which is outside the standard range (${lr.referenceRange}). Please consult your physician.`;
      
      // Some hardcoded friendly insights based on common markers
      if (lr.name.toLowerCase().includes('cholesterol')) {
        title = 'Heart Health Strategy';
        description = `Your ${lr.name} was elevated (${lr.value}). Consider reducing saturated fats, eating more soluble fiber like oats and beans, and maintaining a regular cardio routine.`;
      } else if (lr.name.toLowerCase().includes('hba1c') || lr.name.toLowerCase().includes('glucose')) {
        title = 'Blood Sugar Management';
        description = `Your ${lr.name} level (${lr.value}) indicates room for improvement. Focus on complex carbohydrates, avoid sugary drinks, and stay physically active after meals.`;
      } else if (lr.name.toLowerCase().includes('hemoglobin') || lr.name.toLowerCase().includes('iron')) {
        title = 'Iron-Rich Diet Recommended';
        description = `Your ${lr.name} was abnormal (${lr.value}). Ensure you're consuming enough iron-rich foods like leafy greens, lentils, and lean meats. Pairing them with Vitamin C helps absorption.`;
      }

      return {
        id: `insight-${index}`,
        userId,
        title,
        description,
        category: 'ACTIONABLE',
        severity: 'MEDIUM',
        createdAt: new Date().toISOString()
      };
    });

    res.json(insights);
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

export default router;
