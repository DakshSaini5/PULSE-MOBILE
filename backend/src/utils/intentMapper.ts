/**
 * Intent Mapper Utility
 * Maps patient-oriented symptoms, procedures, treatments, and common terms
 * to clinical specialties in the database.
 */

const INTENT_MAPPING: { [key: string]: string } = {
  // Dental / Dentistry
  'root canal': 'Dental',
  'dentist': 'Dental',
  'dental': 'Dental',
  'tooth': 'Dental',
  'teeth': 'Dental',
  'crown': 'Dental',
  'cavity': 'Dental',
  'filling': 'Dental',
  'braces': 'Dental',
  'orthodontist': 'Dental',
  'extraction': 'Dental',
  'implant': 'Dental',
  'scaling': 'Dental',
  'periodontist': 'Dental',
  
  // Eye Care / Ophthalmology
  'eye': 'Eye Care',
  'optician': 'Eye Care',
  'ophthalmology': 'Eye Care',
  'ophthalmologist': 'Eye Care',
  'vision': 'Eye Care',
  'glasses': 'Eye Care',
  'cataract': 'Eye Care',
  'lasik': 'Eye Care',
  'glaucoma': 'Eye Care',
  'lens': 'Eye Care',
  'cornea': 'Eye Care',
  'retina': 'Eye Care',
  'optometrist': 'Eye Care',
  
  // Pediatrics / Child Care
  'child vaccination': 'Pediatrics',
  'vaccination': 'Pediatrics',
  'vaccine': 'Pediatrics',
  'immunization': 'Pediatrics',
  'child': 'Pediatrics',
  'children': 'Pediatrics',
  'pediatric': 'Pediatrics',
  'pediatrics': 'Pediatrics',
  'baby': 'Pediatrics',
  'infant': 'Pediatrics',
  'newborn': 'Pediatrics',
  'pediatrician': 'Pediatrics',
  'polio': 'Pediatrics',
  'measles': 'Pediatrics',
  'neonatal': 'Pediatrics',
  
  // Hematology (Blood tests)
  'blood test': 'Hematology',
  'blood': 'Hematology',
  'anemia': 'Hematology',
  'haematology': 'Hematology',
  'hematology': 'Hematology',
  'cbc': 'Hematology',
  
  // Cardiology (Heart)
  'heart': 'Cardiology',
  'cardiology': 'Cardiology',
  'cardiologist': 'Cardiology',
  'ecg': 'Cardiology',
  'cardiac': 'Cardiology',
  'chest pain': 'Cardiology',
  
  // Endocrinology (Hormones, Diabetes)
  'thyroid': 'Endocrinology',
  'hormone': 'Endocrinology',
  'diabetes': 'Endocrinology',
  'diabetic': 'Endocrinology',
  'endocrinology': 'Endocrinology',
  'endocrinologist': 'Endocrinology',
  'metabolic': 'Endocrinology',
  
  // Neurology (Brain & Nerves)
  'brain': 'Neurology',
  'neurology': 'Neurology',
  'neurologist': 'Neurology',
  'stroke': 'Neurology',
  'migraine': 'Neurology',
  'seizure': 'Neurology',
  'nerve': 'Neurology',
  
  // General Medicine / Primary Care
  'cough': 'General Medicine',
  'cold': 'General Medicine',
  'flu': 'General Medicine',
  'fever': 'General Medicine',
  'headache': 'General Medicine',
  'stomach ache': 'General Medicine',
  'general medicine': 'General Medicine',
  'general physician': 'General Medicine',
  'physician': 'General Medicine',
  'gp': 'General Medicine',
  'consultation': 'General Medicine',
  'checkup': 'General Medicine',
  'high blood pressure': 'General Medicine',
  'hypertension': 'General Medicine',
  'general': 'General Medicine',

  // Orthopedics
  'ortho': 'Orthopedics',
  'bone': 'Orthopedics',
  'fracture': 'Orthopedics',
  'joint': 'Orthopedics',
  'sprain': 'Orthopedics',
  'orthopedics': 'Orthopedics',
  
  // Gynecology
  'gynecology': 'Gynecology',
  'gynaecologist': 'Gynecology',
  'pregnancy': 'Gynecology',
  'maternity': 'Gynecology',
  'pregnant': 'Gynecology',

  // Oncology
  'cancer': 'Oncology',
  'tumor': 'Oncology',
  'chemo': 'Oncology',
  'oncology': 'Oncology',
  'oncologist': 'Oncology',

  // Gastroenterology
  'gastro': 'Gastroenterology',
  'stomach': 'Gastroenterology',
  'digestive': 'Gastroenterology',
  'acidity': 'Gastroenterology',
  'gastroenterology': 'Gastroenterology',

  // Pulmonology
  'lung': 'Pulmonology',
  'lungs': 'Pulmonology',
  'breathing': 'Pulmonology',
  'asthma': 'Pulmonology',
  'pulmonology': 'Pulmonology',

  // Urology
  'urine': 'Urology',
  'kidney': 'Urology',
  'urinary': 'Urology',
  'urology': 'Urology',

  // Emergency Medicine
  'emergency': 'Emergency Medicine',
  'er': 'Emergency Medicine',
  'icu': 'Emergency Medicine',

  // General Surgery
  'surgery': 'General Surgery',
  'surgeon': 'General Surgery',
  'operation': 'General Surgery',

  // Dermatology
  'skin': 'Dermatology',
  'hair': 'Dermatology',
  'nail': 'Dermatology',
  'rash': 'Dermatology',
  'dermatology': 'Dermatology',
  'dermatologist': 'Dermatology',

  // Psychiatry
  'mental': 'Psychiatry',
  'depression': 'Psychiatry',
  'anxiety': 'Psychiatry',
  'counseling': 'Psychiatry',
  'psychiatry': 'Psychiatry',
  'psychiatrist': 'Psychiatry',

  // ENT
  'ear': 'ENT',
  'nose': 'ENT',
  'throat': 'ENT',
  'ent': 'ENT',
};

/**
 * Searches the queryText for symptoms/treatments and maps it to a database Specialty.
 * Returns the specialty name, or null if no mapping is found.
 */
export function findMappedSpecialty(queryText: string): string | null {
  if (!queryText) return null;
  const normalized = queryText.toLowerCase().trim();
  
  // Sort keys by length descending to match longest phrase first (e.g. "child vaccination" over "vaccination")
  const keys = Object.keys(INTENT_MAPPING).sort((a, b) => b.length - a.length);
  
  for (const key of keys) {
    if (normalized.includes(key)) {
      return INTENT_MAPPING[key];
    }
  }
  
  return null;
}
