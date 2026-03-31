import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
  console.warn("GEMINI_API_KEY is missing. Please set VITE_GEMINI_API_KEY in your local .env file.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export interface MarketAdvice {
  fairPrice: string;
  bestDay: string;
  reasoning: string;
  marketTrends: string;
}

export async function getMarketAdvice(crop: string, location: string, language: 'English' | 'Sheng'): Promise<string> {
  const systemInstruction = `
    You are "Mkulima AI", a expert market negotiator and agricultural advisor for small-scale farmers in Kenya.
    Your goal is to help farmers get the best price for their produce.
    
    Current Language: ${language}
    
    Instructions:
    1. Use Google Search to find the latest market prices for ${crop} in ${location} or general Kenyan markets (like Muthurwa, Wakulima, etc.).
    2. Provide a "Fair Price" (Ksh per unit) based on current trends.
    3. Suggest the "Best Day to Sell" in the coming week based on typical market cycles or current news.
    4. Provide a brief explanation of the market trends.
    5. If the user asks in Sheng, respond in Sheng. If in English, respond in English.
    6. Be encouraging, respectful, and practical.
    
    Format your response clearly with headings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `I have ${crop} in ${location}. What is the fair price and when should I sell?`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    return response.text || "Samahani, siwezi kupata habari hiyo kwa sasa. (Sorry, I can't get that info right now.)";
  } catch (error) {
    console.error("Gemini API Error:", error);
    if (error instanceof Error && error.message.includes("API_KEY_INVALID")) {
      throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
}

export async function getSpeech(text: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}
