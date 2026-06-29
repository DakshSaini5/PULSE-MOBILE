const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export const analyzeMedicalDocument = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<string> => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is missing. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `
You are an expert medical AI assistant. Analyze this medical document (prescription or lab report).
1. Transcribe the contents accurately.
2. Structure the data (e.g., list of medications with dosages, or list of lab values with normal ranges if available).
3. Do not invent any data not present in the image.
Please format the output cleanly in plain text or simple markdown.
  `;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image
            }
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API Error:", errorData);
      throw new Error(`Failed to analyze document: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      const text = data.candidates[0].content.parts[0].text;
      return text;
    } else {
      throw new Error("No analysis returned from Gemini.");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

export const summarizeMedicalData = async (extractedText: string): Promise<string> => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is missing.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `
You are an expert medical AI. Analyze this extracted medical data:

${extractedText}

Provide a simple, patient-friendly summary. 
Use clear headers:
- **Summary**: A one sentence overview.
- **Normal Findings**: Bullet points of what looks good/normal.
- **Attention Needed**: Bullet points of what is abnormal or needs care.
- **Precautions**: Any general lifestyle precautions or instructions based on this data.

Do not give definitive medical advice, add a small disclaimer at the end.
  `;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API Error:", errorData);
      throw new Error(`Failed to summarize data: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      const text = data.candidates[0].content.parts[0].text;
      return text;
    } else {
      throw new Error("No summary returned from Gemini.");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};
