import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// GET /api/user/profile
router.get('/profile', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            prescriptions: true,
            reports: true,
          }
        }
      }
    });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Remap reports to medicalReports to match frontend expectation
    const responseData = {
      ...user,
      _count: {
        prescriptions: user._count.prescriptions,
        medicalReports: user._count.reports
      }
    };

    res.json(responseData);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/user/profile
router.put('/profile', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, age, gender, weight, bloodGroup, medicalConditions } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(age !== undefined && { age: age === '' ? null : parseInt(age) }),
        ...(gender !== undefined && { gender }),
        ...(weight !== undefined && { weight }),
        ...(bloodGroup !== undefined && { bloodGroup }),
        ...(medicalConditions !== undefined && { medicalConditions }),
      }
    });

    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
