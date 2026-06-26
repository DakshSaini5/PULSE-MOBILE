import { Router } from 'express';
import prescriptionsRouter from './prescriptions';
import reportsRouter from './reports';
import dashboardRouter from './dashboard';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authenticate middleware to all routes except public ones
router.use(authenticate);

// /api/dashboard
router.use('/dashboard', dashboardRouter);

// /api/prescriptions
router.use('/prescriptions', prescriptionsRouter);

// /api/reports
router.use('/reports', reportsRouter);

// /api/hospitals
router.get('/hospitals', (req, res) => {
  res.json({
    data: [
      { id: '1', name: 'City Hospital', address: '123 Main St', latitude: 28.6139, longitude: 77.2090, rating: 4.5, workingHours: '24/7', emergencyAvailable: true }
    ]
  });
});

export default router;
