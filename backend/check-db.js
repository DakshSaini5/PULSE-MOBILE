const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.hospital.count();
  console.log('=== HOSPITAL COUNT ===');
  console.log('Total hospitals:', count);

  const sample = await prisma.hospital.findMany({
    take: 5,
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      rating: true,
      emergencyAvailable: true,
      recommendationScore: true,
    },
    orderBy: { rating: 'desc' }
  });

  console.log('\n=== TOP 5 HOSPITALS BY RATING ===');
  sample.forEach((h, i) => {
    console.log(`${i+1}. ${h.name}`);
    console.log(`   📍 ${h.address}`);
    console.log(`   ⭐ Rating: ${h.rating} | Score: ${h.recommendationScore} | Emergency: ${h.emergencyAvailable}`);
    console.log(`   🌐 lat: ${h.latitude}, lng: ${h.longitude}`);
  });

  // Check specialty count
  const specialtyCount = await prisma.specialty.count();
  const hospitalSpecialtyCount = await prisma.hospitalSpecialty.count();
  console.log('\n=== SPECIALTY STATS ===');
  console.log('Specialties:', specialtyCount);
  console.log('Hospital-Specialty links:', hospitalSpecialtyCount);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
