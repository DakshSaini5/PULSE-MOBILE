import fs from 'fs';
import path from 'path';

const TOTAL_HOSPITALS = 70000;
const BATCH_SIZE = 10000;
const DATA_DIR = path.join(__dirname, '../data');
const FILE_PATH = path.join(DATA_DIR, 'pulse-hospitals.json');

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
    rating: Number((Math.random() * 2 + 3).toFixed(1)),
    totalBeds: Math.floor(Math.random() * 400) + 50,
    waitTimes: Math.floor(Math.random() * 120) + 10,
    specialtyTags: shuffledSpecialties.slice(0, numSpecialties),
    services: shuffledServices.slice(0, numServices)
  };
};

const generateDataset = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  console.log(`Generating ${TOTAL_HOSPITALS} hospitals...`);
  const stream = fs.createWriteStream(FILE_PATH);
  
  stream.write('[\n');
  
  let i = 0;
  
  const writeBatch = () => {
    let ok = true;
    while (i < TOTAL_HOSPITALS && ok) {
      const hospital = generateHospital(i);
      const isLast = i === TOTAL_HOSPITALS - 1;
      const data = JSON.stringify(hospital) + (isLast ? '\n' : ',\n');
      
      ok = stream.write(data);
      i++;
      
      if (i % BATCH_SIZE === 0) {
        console.log(`Generated ${i} hospitals...`);
      }
    }
    
    if (i < TOTAL_HOSPITALS) {
      stream.once('drain', writeBatch);
    } else {
      stream.write(']\n');
      stream.end();
      console.log(`Successfully generated dataset at ${FILE_PATH}`);
    }
  };
  
  writeBatch();
};

generateDataset();
