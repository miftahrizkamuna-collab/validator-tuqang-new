import { GoogleGenAI } from "@google/genai";
import { ShapeType, Dimensions } from "../types";

const apiKey = process.env.API_KEY || '';
// Initialize conditionally to avoid errors if key is missing during dev, 
// though architecture requires it.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getTuqangAdvice = async (
  shape: ShapeType,
  dimensions: Dimensions,
  isValid: boolean
): Promise<string> => {
  if (!ai) {
    return "API Key tidak ditemukan. Pastikan environment variable API_KEY sudah diset.";
  }

  try {
    const dimsString = JSON.stringify(dimensions);
    const prompt = `
      Bertindaklah sebagai "Mandor TuQang", seorang ahli konstruksi dan bangunan yang berpengalaman namun ramah.
      
      User sedang memvalidasi bentuk: ${shape}.
      Dimensi yang dimasukkan (dalam satuan abstrak/meter): ${dimsString}.
      Status Validasi Geometri: ${isValid ? "VALID secara matematika" : "TIDAK VALID secara matematika"}.

      Tugasmu:
      1. Jika TIDAK VALID: Jelaskan dengan singkat dan lucu mengapa ukuran tersebut mustahil dibangun di dunia nyata.
      2. Jika VALID: Berikan 1 tips praktis "Tukang Bangunan" terkait bentuk ini (misalnya tentang pengukuran siku, penggunaan material, atau kestabilan struktur).
      
      Gunakan bahasa Indonesia yang santai tapi profesional. Maksimal 3 kalimat. Jangan gunakan markdown bold/italic berlebihan.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Maaf, Mandor sedang istirahat (tidak ada respon).";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Gagal menghubungi Mandor AI. Coba lagi nanti.";
  }
};
