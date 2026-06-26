import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Use Gemini Flash as requested for fast OCR and reasoning tasks
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: "application/json" }
});

export const analyzeMedicalDocument = async (
  fileBuffer: Buffer,
  mimeType: string,
  type: 'prescription' | 'report'
): Promise<any> => {
  const inlineData = {
    inlineData: {
      data: fileBuffer.toString('base64'),
      mimeType,
    },
  };

  let prompt = '';

  if (type === 'prescription') {
    prompt = `You are a highly precise clinical pharmacist AI. Your ONLY job is to extract and structure data from the provided prescription image.
STRICT RULES:
1. NO HALLUCINATIONS: You must NEVER invent, assume, or guess a medicine name, dosage, or instruction. 
2. UNREADABLE TEXT: If a medicine name or dosage is completely illegible, output 'UNREADABLE' for that specific field. Do not guess.
3. MISSING DATA: If instructions are not written, output 'Not provided'.
4. ABBREVIATIONS: Expand standard medical abbreviations (e.g., 'BD' to 'Twice a day') ONLY if clearly visible.

Return strictly in this JSON format:
{
  "medicines": [
    {
      "medicineName": "exact string",
      "dosage": "exact string",
      "instructions": "exact string",
      "simplifiedExplanation": "1-sentence plain-English explanation of the drug's purpose.",
      "sideEffects": ["Effect 1"],
      "drugInteractions": ["Interaction 1"]
    }
  ]
}`;
  } else if (type === 'report') {
    prompt = `You are a highly precise clinical lab technician AI. Your ONLY job is to extract biomarker data from the provided lab report image.
STRICT RULES:
1. NO HALLUCINATIONS: Do not invent biomarkers not listed on the page.
2. ACCURACY: Extract the exact numerical value, unit, and reference range printed.
3. ABNORMAL FLAG: Compare 'value' against 'referenceRange'. If outside the range, set 'isAbnormal' to true. Otherwise, false.

Return strictly in this JSON format:
{
  "biomarkers": [
    {
      "key": "e.g., Hemoglobin",
      "value": "e.g., 13.8",
      "unit": "e.g., g/dL",
      "referenceRange": "e.g., 12.0 - 15.5",
      "isAbnormal": false
    }
  ]
}`;
  } else {
    throw new Error('Invalid document type provided for analysis.');
  }

  try {
    const result = await model.generateContent([inlineData, prompt]);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown formatting from Gemini response (e.g. ```json ... ```)
    const cleanedText = text.replace(/```json\n?|```/g, '').trim();
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw new Error('Failed to analyze the medical document using Gemini AI.');
  }
};

export const generateMedicalReportSummary = async (verifiedValues: any[]): Promise<any> => {
  const prompt = `You are a highly advanced Medical AI Assistant. Analyze the following verified lab report values and generate a patient-friendly summary and any necessary specialist referrals.

VERIFIED LAB VALUES:
${JSON.stringify(verifiedValues, null, 2)}

STRICT RULES:
1. ONLY return a JSON object, no markdown blocks.
2. healthSummary should be a brief, easy-to-understand paragraph summarizing what the results mean.
3. overallStatus MUST be exactly "STABLE" or "CRITICAL".
4. If there are severely abnormal values, include specialist referrals.

Return strictly in this JSON format:
{
  "summary": {
    "healthSummary": "string",
    "overallStatus": "STABLE"
  },
  "specialists": [
    {
      "specialtyName": "e.g., Cardiologist",
      "confidenceScore": 0.95,
      "reason": "string"
    }
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleanedText = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    throw new Error('Failed to generate summary using Gemini AI.');
  }
};
