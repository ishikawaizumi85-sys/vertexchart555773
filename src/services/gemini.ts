import { GoogleGenAI, Type } from "@google/genai";

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

export interface TradingAnalysis {
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  entry: string;
  tp: string;
  sl: string;
  reasoning: string;
  confidence: number;
}

export const analyzeChart = async (imageBase64: string): Promise<TradingAnalysis | null> => {
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64.split(',')[1],
          },
        },
        {
          text: "Analyze this trading chart. Use SMC (Smart Money Concepts), SNR (Support & Resistance), Fundamental Macro, Alchemist, and STD (Standard Deviation) methods. Provide a direct trading signal (BUY/SELL/NEUTRAL) with Entry, TP, and SL. Be extremely concise and professional.",
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            signal: { type: Type.STRING, enum: ['BUY', 'SELL', 'NEUTRAL'] },
            entry: { type: Type.STRING },
            tp: { type: Type.STRING },
            sl: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ['signal', 'entry', 'tp', 'sl', 'reasoning', 'confidence'],
        },
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as TradingAnalysis;
    }
    return null;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};

export const getChatResponse = async (prompt: string) => {
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are Vertex AI, a professional trading assistant. You help users understand SMC, SNR, Macro fundamentals, and quantitative trading strategies. Be concise, technical, and professional.",
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I'm having trouble connecting right now.";
  }
};
