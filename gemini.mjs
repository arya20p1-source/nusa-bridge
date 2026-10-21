import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const rawKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');

async function tanyaGemini(pertanyaan) {
  // Cek apakah API Key tersedia dan valid
  if (!rawKey || rawKey === 'kode_api_key_asli' || rawKey.includes('YOUR_API_KEY')) {
    return "API Key belum dikonfigurasi dengan benar. Silakan periksa berkas .env Anda.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: rawKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Atau gunakan model 'gemini-1.5-flash' / 'gemini-2.0-flash'
      contents: pertanyaan,
      config: {
        systemInstruction: `Kamu adalah Asisten AI Resmi NusaBridge untuk platform perdagangan dan ekspor-impor UMKM Indonesia. 
        Jawablah setiap pertanyaan pengguna secara langsung, jelas, ramah, relevan dengan pertanyaan, dan profesional. 
        Gunakan bahasa Indonesia jika pertanyaan berbahasa Indonesia, dan bahasa Inggris jika pertanyaan berbahasa Inggris. 
        Dilarang menyertakan pesan promosi atau disclaimer tambahan di akhir jawaban.`,
      }
    });

    if (response && response.text) {
      return response.text;
    }
  } catch (error) {
    console.error('⚠️ Error Google Gemini API:', error.message || error);
    return "Maaf, terjadi kendala saat memproses permintaan Anda. Silakan coba beberapa saat lagi.";
  }
}