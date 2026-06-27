import { prisma } from '../index';
import * as fs from 'fs';
import * as path from 'path';

const specialtiesToCreate = [
  { name: 'Cardiology', description: 'Expert heart valves and cardiac diagnostics.', category: 'HEART' },
  { name: 'Endocrinology', description: 'Thyroid panel adjustments, hormones and diabetes.', category: 'METABOLIC' },
  { name: 'Hematology', description: 'Blood indices, anemia, cell structures.', category: 'BLOOD' },
  { name: 'Neurology', description: 'Neurological assessments and central nervous systems.', category: 'BRAIN' },
  { name: 'Pediatrics', description: 'Infant healthcare, immunization, and growth metrics.', category: 'CHILDREN' },
  { name: 'General Medicine', description: 'Primary health consultations and checkups.', category: 'GENERAL' },
  { name: 'Dental', description: 'Comprehensive oral hygiene, root canals, and orthodontic care.', category: 'DENTAL' },
  { name: 'Eye Care', description: 'Vision correction, cataract surgeries, and ophthalmic diagnostics.', category: 'EYE' },
  
  // Additional specialties from website verified-hospitals list
  { name: 'Orthopedics', description: 'Expert bone care, joint replacements, fracture healing, and orthopedic surgeries.', category: 'BONE' },
  { name: 'Gynecology', description: 'Comprehensive female reproductive health, pregnancy care, and maternity support.', category: 'PREGNANCY' },
  { name: 'Dermatology', description: 'Expert skin, hair, nail diagnostic care, and dermatological therapies.', category: 'SKIN' },
  { name: 'Gastroenterology', description: 'Comprehensive digestive tract care, stomach issues, and liver health.', category: 'STOMACH' },
  { name: 'Oncology', description: 'Cancer diagnostic matrices, chemotherapy, and tumor therapies.', category: 'CANCER' },
  { name: 'Urology', description: 'Urinary tract health, kidney care, and male reproductive system solutions.', category: 'KIDNEY' },
  { name: 'Psychiatry', description: 'Expert mental health consultations, counseling, and behavioral therapies.', category: 'MENTAL' },
  { name: 'ENT', description: 'Ear, nose, and throat diagnostics, surgical treatments, and therapy.', category: 'EAR' },
  { name: 'Pulmonology', description: 'Respiratory system checkups, asthma management, and lung therapies.', category: 'LUNGS' },
  { name: 'General Surgery', description: 'Comprehensive surgical treatments, operation theater services, and post-op care.', category: 'SURGERY' },
  { name: 'Emergency Medicine', description: 'Critical care diagnostics, intensive care units, and 24/7 emergency response.', category: 'EMERGENCY' }
];

export async function syncSpecialties() {
  console.log('🔄 [SYNC] Starting database clinical specialty synchronization...');
  try {
    // 1. Upsert all specialties
    const specMap = new Map<string, string>();
    for (const spec of specialtiesToCreate) {
      const dbSpec = await prisma.specialty.upsert({
        where: { name: spec.name },
        update: { description: spec.description, category: spec.category },
        create: { name: spec.name, description: spec.description, category: spec.category }
      });
      specMap.set(dbSpec.name.toLowerCase(), dbSpec.id);
    }
    console.log(`✅ [SYNC] Successfully synchronized ${specialtiesToCreate.length} core and additional specialties.`);

    // 2. Read verified hospitals dataset
    const jsonPath = path.join(__dirname, '../data/verified-hospitals.json');
    if (!fs.existsSync(jsonPath)) {
      console.warn(`⚠️ [SYNC] verified-hospitals.json not found at ${jsonPath}. Skipping mapping.`);
      return;
    }

    const verifiedData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`🔄 [SYNC] Loading landmark mappings for ${verifiedData.length} facilities...`);

    for (const h of verifiedData) {
      // Find hospital by name (contains match)
      const dbHospital = await prisma.hospital.findFirst({
        where: { name: { contains: h.name, mode: 'insensitive' } }
      });

      if (!dbHospital) {
        console.warn(`⚠️ [SYNC] Landmark hospital '${h.name}' not found in database. Skipping relation mapping.`);
        continue;
      }

      // Link each specialty
      for (const specName of h.specialties || []) {
        const specId = specMap.get(specName.toLowerCase());
        if (!specId) {
          console.warn(`⚠️ [SYNC] Specialty '${specName}' not found in DB map. Skipping connection for '${dbHospital.name}'.`);
          continue;
        }

        const linkExists = await prisma.hospitalSpecialty.findUnique({
          where: {
            hospitalId_specialtyId: {
              hospitalId: dbHospital.id,
              specialtyId: specId
            }
          }
        });

        if (!linkExists) {
          console.log(`🔗 [SYNC] Linking specialty '${specName}' to verified facility '${dbHospital.name}'...`);
          await prisma.hospitalSpecialty.create({
            data: {
              hospitalId: dbHospital.id,
              specialtyId: specId,
              departments: `${specName} Department`,
              averageCost: h.averageCost || 0.0,
              opdTimings: h.opdTimings || '09:00 AM - 05:00 PM (Mon - Sat)'
            }
          });
        }
      }
    }
    console.log('✅ [SYNC] Specialty mapping synchronization finished successfully.');
  } catch (error) {
    console.error('❌ [SYNC] Error synchronizing clinical specialties:', error);
  }
}
