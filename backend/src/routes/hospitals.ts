import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// GET /api/hospitals/search?query=x
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const hospitals = await prisma.hospital.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5,
      select: {
        id: true,
        name: true,
        specialtyTags: true,
        address: true,
        rating: true
      }
    });

    res.json(hospitals);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search hospitals' });
  }
});

// GET /api/hospitals/nearby?lat=x&lng=y&radius=z
router.get('/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 5;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Valid lat and lng are required' });
    }

    // Using raw SQL Haversine formula to calculate distance in km
    const nearbyHospitals = await prisma.$queryRaw`
      SELECT 
        id, 
        name, 
        latitude, 
        longitude, 
        rating,
        (
          6371 * acos(
            cos(radians(${lat})) * 
            cos(radians(latitude)) * 
            cos(radians(longitude) - radians(${lng})) + 
            sin(radians(${lat})) * 
            sin(radians(latitude))
          )
        ) AS distance
      FROM "Hospital"
      HAVING (
        6371 * acos(
          cos(radians(${lat})) * 
          cos(radians(latitude)) * 
          cos(radians(longitude) - radians(${lng})) + 
          sin(radians(${lat})) * 
          sin(radians(latitude))
        )
      ) < ${radius}
      ORDER BY distance ASC
      LIMIT 20;
    `;

    res.json(nearbyHospitals);
  } catch (error) {
    console.error('Nearby hospitals error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby hospitals' });
  }
});

export default router;
