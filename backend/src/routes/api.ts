import { Router } from 'express';
import prescriptionsRouter from './prescriptions';
import reportsRouter from './reports';
import dashboardRouter from './dashboard';
import emergencyRouter from './emergency';
import userRouter from './user';
import notificationsRouter from './notifications';
import { authenticate } from '../middleware/auth';
import { prisma } from '../index';
import { findMappedSpecialty } from '../utils/intentMapper';
import { randomUUID } from 'crypto';


const router = Router();

// Apply authenticate middleware to all routes except public ones
router.use(authenticate);

// /api/user
router.use('/user', userRouter);

// /api/dashboard
router.use('/dashboard', dashboardRouter);

// /api/emergency
router.use('/emergency', emergencyRouter);

// /api/prescriptions
router.use('/prescriptions', prescriptionsRouter);

// /api/reports
router.use('/reports', reportsRouter);

// /api/notifications
router.use('/notifications', notificationsRouter);

// /api/hospitals/search
router.get('/hospitals/search', async (req, res) => {
  try {
    const { q, specialty, lat, lng, radius = 50, limit = 20 } = req.query;

    const queryStr = q && String(q).trim() ? String(q).trim() : null;
    const specialtyStr = specialty && String(specialty).trim() ? String(specialty).trim() : null;

    const targetSpecialty = specialtyStr ? (findMappedSpecialty(specialtyStr) || specialtyStr) : null;
    const querySpecialty = queryStr ? findMappedSpecialty(queryStr) : null;

    let whereClause: any = {};
    const andConditions: any[] = [];

    if (targetSpecialty) {
      const isUniversalTarget = targetSpecialty === 'Hematology' || targetSpecialty === 'Pediatrics';
      const specialtyOrConditions: any[] = [
        { specialty: { name: { equals: targetSpecialty, mode: 'insensitive' } } }
      ];

      if (isUniversalTarget) {
        // Broaden search to general hospitals since they inherently provide vaccinations and blood tests
        specialtyOrConditions.push({ specialty: { name: { contains: 'General', mode: 'insensitive' } } });
        specialtyOrConditions.push({ specialty: { name: { contains: 'Internal', mode: 'insensitive' } } });
      }

      andConditions.push({
        specialties: {
          some: {
            OR: specialtyOrConditions
          }
        }
      });
    } else if (queryStr) {
      const isUniversalService = queryStr.toLowerCase().includes('vaccination') || queryStr.toLowerCase().includes('blood test');

      if (querySpecialty || isUniversalService) {
        const specialtyOrConditions: any[] = [];
        
        if (querySpecialty) {
          specialtyOrConditions.push({ specialty: { name: { equals: querySpecialty, mode: 'insensitive' } } });
        }
        
        if (isUniversalService) {
          // Broaden search to general hospitals since they inherently provide vaccinations and blood tests
          specialtyOrConditions.push({ specialty: { name: { contains: 'General', mode: 'insensitive' } } });
          specialtyOrConditions.push({ specialty: { name: { contains: 'Internal', mode: 'insensitive' } } });
        }

        andConditions.push({
          OR: [
            { name: { contains: queryStr, mode: 'insensitive' } },
            { address: { contains: queryStr, mode: 'insensitive' } },
            {
              specialties: {
                some: {
                  OR: specialtyOrConditions
                }
              }
            }
          ]
        });
      } else {
        andConditions.push({
          OR: [
            { name: { contains: queryStr, mode: 'insensitive' } },
            { address: { contains: queryStr, mode: 'insensitive' } }
          ]
        });
      }
    }

    // Geographic bounding box filter to ensure local results ONLY
    if (lat && lng) {
      const userLat = parseFloat(String(lat));
      const userLng = parseFloat(String(lng));
      const r = Number(radius) || 50; // 50km default
      
      // 1 degree of latitude is ~111km
      const latDelta = r / 111;
      // 1 degree of longitude varies based on latitude
      const lngDelta = r / (111 * Math.cos(userLat * (Math.PI / 180)));

      andConditions.push({
        latitude: {
          gte: userLat - latDelta,
          lte: userLat + latDelta
        }
      });
      andConditions.push({
        longitude: {
          gte: userLng - lngDelta,
          lte: userLng + lngDelta
        }
      });
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    console.log(`\n[SEARCH API] Incoming query: lat=${lat}, lng=${lng}, radius=${radius}, specialty=${specialty}`);
    console.log(`[SEARCH API] Prisma whereClause:`, JSON.stringify(whereClause, null, 2));

    // Only apply hard pagination limit if NO geographic filter is active to prevent crashing from full 70k dump
    const queryOptions: any = {
      where: whereClause,
      include: {
        specialties: { include: { specialty: true } }
      },
      orderBy: { rating: 'desc' },
    };

    if (!lat || !lng) {
      queryOptions.take = Number(limit);
    }

    let hospitals = await prisma.hospital.findMany(queryOptions);

    // FALLBACK: If user is in a city with NO hospitals in the database, return top nationwide hospitals
    if (hospitals.length === 0 && lat && lng) {
      console.log(`[SEARCH API] No hospitals found within radius. Falling back to nationwide search.`);
      
      let fallbackClause: any = {};
      if (specialty && String(specialty).trim()) {
        fallbackClause.specialties = {
          some: { specialty: { name: { equals: String(specialty).trim(), mode: 'insensitive' } } }
        };
      }
      if (q && String(q).trim()) {
        fallbackClause.OR = [
          { name: { contains: String(q), mode: 'insensitive' } },
          { address: { contains: String(q), mode: 'insensitive' } },
        ];
      }

      hospitals = await prisma.hospital.findMany({
        where: fallbackClause,
        include: { specialties: { include: { specialty: true } } },
        take: Number(limit),
        orderBy: { rating: 'desc' },
      });
    }

    console.log(`[SEARCH API] Prisma returned ${hospitals.length} hospitals.`);

    let result = hospitals;

    // Compute simple distance if lat/lng provided, attach as virtual field
    if (lat && lng) {
      const userLat = parseFloat(String(lat));
      const userLng = parseFloat(String(lng));
      const r = Number(radius) || 50;
      (result as any[]).forEach(h => {
        const dLat = (h.latitude - userLat) * (Math.PI / 180);
        const dLng = (h.longitude - userLng) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(userLat * Math.PI / 180) * Math.cos(h.latitude * Math.PI / 180) *
          Math.sin(dLng / 2) ** 2;
        h.distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        h.recommendationScore = Math.max(0, Math.round(
          (h.rating / 5) * 50 +
          Math.max(0, 50 - h.distance)
        ));
      });
      // Filter strictly within the selected radius in kilometers
      result = result.filter((h: any) => h.distance <= r);
      result.sort((a: any, b: any) => a.distance - b.distance);
      result = result.slice(0, 200); // Capped at 200 so you can easily see at least 100 hospitals at large distances like 50km
    }

    res.json(result);
  } catch (error) {
    console.error("Error searching hospitals:", error);
    res.status(500).json({ message: "Failed to search hospitals" });
  }
});

// GET /api/hospitals/autocomplete (Public - real-time matching suggestions)
router.get('/hospitals/autocomplete', async (req, res) => {
  try {
    const { q, lat, lng, city } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.json({ hospitals: [], specialties: [] });
    }

    const queryText = q.trim();
    let hospitalWhereClause: any = {
      name: { contains: queryText, mode: 'insensitive' }
    };

    if (lat && lng) {
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      if (!isNaN(userLat) && !isNaN(userLng)) {
        const boundRadius = 50;
        const latDiff = boundRadius / 111;
        const cosLat = Math.cos((userLat * Math.PI) / 180);
        const lngDiff = boundRadius / (111 * (cosLat > 0.1 ? cosLat : 0.1));
        hospitalWhereClause = {
          AND: [
            { name: { contains: queryText, mode: 'insensitive' } },
            { latitude: { gte: userLat - latDiff, lte: userLat + latDiff } },
            { longitude: { gte: userLng - lngDiff, lte: userLng + lngDiff } },
          ]
        };
      }
    } else if (city && typeof city === 'string' && city.trim().length > 0) {
      hospitalWhereClause = {
        AND: [
          { name: { contains: queryText, mode: 'insensitive' } },
          { address: { contains: city.trim(), mode: 'insensitive' } },
        ]
      };
    }

    const hospitals = await prisma.hospital.findMany({
      where: hospitalWhereClause,
      select: { id: true, name: true },
      take: 5
    });

    const dbSpecialties = await prisma.specialty.findMany({
      where: { name: { contains: queryText, mode: 'insensitive' } },
      select: { name: true },
      take: 5
    });

    const specialties = [...dbSpecialties];
    const mappedSpecialtyName = findMappedSpecialty(queryText);
    if (mappedSpecialtyName && !specialties.some(s => s.name.toLowerCase() === mappedSpecialtyName.toLowerCase())) {
      specialties.unshift({ name: mappedSpecialtyName });
    }

    res.json({ hospitals, specialties: specialties.slice(0, 5) });
  } catch (err) {
    console.error('Error in autocomplete route:', err);
    res.status(500).json({ message: 'Error performing autocomplete search.' });
  }
});

// GET /api/hospitals/compare (Public - side-by-side matrices)
router.get('/hospitals/compare', async (req, res) => {
  try {
    const { ids, lat, lng } = req.query;
    if (!ids) {
      return res.status(400).json({ message: 'Please provide comma-separated hospital ids.' });
    }

    const idsArray = (ids as string).split(',').map(id => id.trim());
    const userLat = lat ? parseFloat(lat as string) : 28.6139;
    const userLng = lng ? parseFloat(lng as string) : 77.2090;

    const hospitals = await prisma.hospital.findMany({
      where: { id: { in: idsArray } },
      include: {
        specialties: {
          include: {
            specialty: true,
          },
        },
      },
    });

    // Score dynamically based on user's location
    const scored = hospitals.map(hosp => {
      const dLat = (hosp.latitude - userLat) * (Math.PI / 180);
      const dLng = (hosp.longitude - userLng) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(userLat * Math.PI / 180) * Math.cos(hosp.latitude * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
      const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const score = Math.max(0, Math.round(
        (hosp.rating / 5) * 50 +
        Math.max(0, 50 - distance)
      ));

      return {
        ...hosp,
        distance,
        recommendationScore: score,
      };
    });

    res.json(scored);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error loading comparison datasets.' });
  }
});

// GET /api/hospitals/saved
router.get('/hospitals/saved', async (req: any, res: any) => {
  try {
    const saved = await prisma.savedHospital.findMany({
      where: { userId: req.user.id },
      include: { Hospital: { include: { specialties: { include: { specialty: true } } } } },
      orderBy: { createdAt: 'desc' }
    });

    const lat = req.query.lat ? parseFloat(String(req.query.lat)) : null;
    const lng = req.query.lng ? parseFloat(String(req.query.lng)) : null;

    const formatted = saved.map(s => {
      const h = s.Hospital;
      let distance = null;
      if (lat && lng) {
        // Approximate distance calculation
        const dx = h.latitude - lat;
        const dy = h.longitude - lng;
        distance = Math.sqrt(dx * dx + dy * dy) * 111.32;
      }
      return {
        ...h,
        distance,
        isSaved: true
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching saved hospitals:', error);
    res.status(500).json({ error: 'Failed to fetch saved hospitals' });
  }
});

// GET /api/hospitals/:id
router.get('/hospitals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.query;

    const hospital = await prisma.hospital.findUnique({
      where: { id },
      include: {
        specialties: {
          include: {
            specialty: true
          }
        }
      }
    });

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    let result: any = { ...hospital };

    // Attach virtual fields distance and recommendationScore if lat/lng are provided
    if (lat && lng) {
      const userLat = parseFloat(String(lat));
      const userLng = parseFloat(String(lng));
      const dLat = (hospital.latitude - userLat) * (Math.PI / 180);
      const dLng = (hospital.longitude - userLng) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(userLat * Math.PI / 180) * Math.cos(hospital.latitude * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
      const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      result.distance = distance;
      result.recommendationScore = Math.max(0, Math.round(
        (hospital.rating / 5) * 50 +
        Math.max(0, 50 - distance)
      ));
    } else {
      result.distance = 0;
      result.recommendationScore = Math.max(0, Math.round((hospital.rating / 5) * 100));
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching hospital:', error);
    res.status(500).json({ message: 'Failed to fetch hospital details' });
  }
});

// GET /api/hospitals/:id/reviews
router.get('/hospitals/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(String(req.query.page || '1'));
    const limit = parseInt(String(req.query.limit || '10'));
    const skip = (page - 1) * limit;

    const [reviews, totalCount] = await Promise.all([
      prisma.hospitalReview.findMany({
        where: { hospitalId: id },
        include: {
          User: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.hospitalReview.count({
        where: { hospitalId: id }
      })
    ]);

    const mappedReviews = reviews.map(rev => ({
      ...rev,
      user: {
        name: rev.User?.name || 'Anonymous'
      }
    }));

    res.json({
      reviews: mappedReviews,
      pagination: {
        total: totalCount,
        page,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// POST /api/hospitals/:id/reviews
router.post('/hospitals/:id/reviews', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id: hospitalId } = req.params;
    const { rating, reviewText } = req.body;

    if (!rating || !reviewText) {
      return res.status(400).json({ message: 'Rating and review text are required.' });
    }

    const newReview = await prisma.hospitalReview.create({
      data: {
        id: randomUUID(),
        hospitalId,
        userId,
        rating: parseInt(rating),
        reviewText
      },
      include: {
        User: {
          select: {
            name: true
          }
        }
      }
    });

    const mappedReview = {
      ...newReview,
      user: {
        name: newReview.User?.name || 'Anonymous'
      }
    };

    // Update hospital average rating
    const reviews = await prisma.hospitalReview.findMany({
      where: { hospitalId }
    });
    
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await prisma.hospital.update({
        where: { id: hospitalId },
        data: { rating: avgRating }
      });
    }

    res.status(201).json(mappedReview);
  } catch (error) {
    console.error('Error posting review:', error);
    res.status(500).json({ message: 'Failed to post review' });
  }
});

// ==========================================
// SAVED HOSPITALS
// ==========================================
// (moved to top)

router.post('/hospitals/:id/save', async (req: any, res: any) => {
  try {
    const hospitalId = req.params.id;
    const existing = await prisma.savedHospital.findUnique({
      where: { userId_hospitalId: { userId: req.user.id, hospitalId } }
    });
    
    if (existing) {
      return res.json({ message: 'Hospital already saved' });
    }

    await prisma.savedHospital.create({
      data: {
        id: randomUUID(),
        userId: req.user.id,
        hospitalId
      }
    });

    res.json({ message: 'Hospital saved successfully' });
  } catch (error) {
    console.error('Error saving hospital:', error);
    res.status(500).json({ error: 'Failed to save hospital' });
  }
});

router.delete('/hospitals/:id/save', async (req: any, res: any) => {
  try {
    const hospitalId = req.params.id;
    await prisma.savedHospital.deleteMany({
      where: { userId: req.user.id, hospitalId }
    });

    res.json({ message: 'Hospital unsaved successfully' });
  } catch (error) {
    console.error('Error unsaving hospital:', error);
    res.status(500).json({ error: 'Failed to unsave hospital' });
  }
});

export default router;
