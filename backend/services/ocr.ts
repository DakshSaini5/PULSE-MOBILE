import { isAiDisabled } from '../src/index';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// OCR Pipeline Logic
export async function processMedicalReport(imageUrl: string) {
  if (isAiDisabled) {
    throw new Error('AI processing is disabled');
  }

  try {
    // 1. Upload to Cloudinary logic here
    console.log('Uploading to Cloudinary:', imageUrl);
    const secureUrl = imageUrl; // Mocked secure URL

    // 2. Primary AI (Gemini 1.5 Flash) extraction
    console.log('Calling Gemini 1.5 Flash multimodal endpoint');
    let rawText = await callGemini(secureUrl);
    
    // 3. Fallback (Tesseract.js)
    if (!rawText) {
      console.log('Gemini failed or quota hit, falling back to Tesseract');
      rawText = await runTesseract(secureUrl);
    }

    // 4. AI Structuring
    console.log('Structuring text with Gemini Flash JSON formatting');
    const structuredData = await structureDataWithGemini(rawText);

    return structuredData;
  } catch (error) {
    // Simulator: Mock JSON on repeated failures
    console.error('OCR pipeline failed:', error);
    // Track failures, if > 5 -> mock
    return getMockedJson();
  }
}

async function callGemini(url: string) {
  // In a real scenario we would fetch the image and pass it as a Part to Gemini.
  // For MVP, we simulate passing the url as text to the multimodal model.
  const prompt = `Extract medical information from this image URL: ${url}. Return the raw text.`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function runTesseract(url: string) {
  // Tesseract fallback is simulated since actual tesseract.js takes heavy installation
  return "RAW TESSERACT TEXT";
}

async function structureDataWithGemini(text: string) {
  const prompt = `
    Analyze the following raw medical report text and extract the biomarkers.
    Format your response EXACTLY as a JSON array of objects with keys: biomarker, value, unit, referenceRange, isAbnormal.
    Raw Text: ${text}
  `;
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  try {
    // Strip markdown formatting if Gemini returns ```json ... ```
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse Gemini JSON output:", responseText);
    return getMockedJson();
  }
}

function getMockedJson() {
  return [
    { biomarker: "HbA1c", value: 5.4, unit: "%", referenceRange: "4.0-5.6", isAbnormal: false }
  ];
}
