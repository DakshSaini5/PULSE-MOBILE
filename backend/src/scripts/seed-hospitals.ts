import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TOTAL_HOSPITALS = 70000;
const BATCH_SIZE = 5000;

const SPECIALTIES = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology', 'Dentistry', 'Dermatology', 'Psychiatry', 'Urology', 'Ophthalmology'];
const SERVICES = ['ICU', 'Emergency', 'Surgery', 'Pharmacy', 'Laboratory', 'Ambulance', 'Blood Bank', 'Cafeteria', 'Parking', 'WiFi'];

const generateHospital = (index: number) => {
  const lat = 20.5937 + (Math.random() - 0.5) * 10;
  const lng = 78.9629 + (Math.random() - 0.5) * 10;
  
  const numSpecialties = Math.floor(Math.random() * 4) + 1;
  const shuffledSpecialties = [...SPECIALTIES].sort(() => 0.5 - Math.random());
  
  const numServices = Math.floor(Math.random() * 6) + 2;
  const shuffledServices = [...SERVICES].sort(() => 0.5 - Math.random());
  return {
    name: `Pulse Hospital ${index}`,
    address: `Street ${index}, Medical District`,
    latitude: lat,
    longitude: lng,
    rating: Number((Math.random() * 2 + 3).toFixed(1))
  };
};

const seedHospitals = async () => {
  console.log(`Starting generation and seeding of ${TOTAL_HOSPITALS} hospitals...`);

  let currentBatch = [];
  let insertedCount = 0;

  for (let i = 0; i < TOTAL_HOSPITALS; i++) {
    currentBatch.push(generateHospital(i));

    if (currentBatch.length === BATCH_SIZE || i === TOTAL_HOSPITALS - 1) {
      try {
        await prisma.hospital.createMany({
          data: currentBatch,
          skipDuplicates: true,
        });
        insertedCount += currentBatch.length;
        console.log(`Inserted chunk... Total: ${insertedCount} / ${TOTAL_HOSPITALS}`);
      } catch (error) {
        console.error(`Error inserting chunk:`, error);
      }
      currentBatch = [];
    }
  }

  console.log('Seeding completed successfully!');
  await prisma.$disconnect();
};

seedHospitals().catch((e) => {
  console.error(e);
  prisma.$disconnect();
});
