import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// GET /api/emergency/contacts
router.get('/contacts', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const contacts = await prisma.emergencyContact.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(contacts);
  } catch (err) {
    console.error('Error fetching emergency contacts:', err);
    res.status(500).json({ error: 'Failed to fetch emergency contacts' });
  }
});

import { randomUUID } from 'crypto';

// POST /api/emergency/contacts
router.post('/contacts', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, phoneNumber, relationship } = req.body;
    if (!name || !phoneNumber || !relationship) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const contact = await prisma.emergencyContact.create({
      data: {
        id: randomUUID(),
        name,
        phoneNumber,
        relationship,
        userId
      }
    });

    res.json(contact);
  } catch (err) {
    console.error('Error adding emergency contact:', err);
    res.status(500).json({ error: 'Failed to add emergency contact' });
  }
});

// DELETE /api/emergency/contacts/:id
router.delete('/contacts/:id', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await prisma.emergencyContact.deleteMany({
      where: { id, userId }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting emergency contact:', err);
    res.status(500).json({ error: 'Failed to delete emergency contact' });
  }
});

export default router;
