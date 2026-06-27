import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const specialties = await prisma.specialty.findMany({
      include: {
        _count: {
          select: { hospitals: true }
        }
      }
    });

    console.log('Specialties and their nationwide hospital counts:');
    specialties.forEach(spec => {
      console.log(`- ${spec.name}: ${spec._count.hospitals} hospitals`);
    });

    const totalHospitals = await prisma.hospital.count();
    console.log('\nTotal hospitals in DB:', totalHospitals);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
