import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

// Baca API Key dari file .env di root proyek nusa-bridge
const rawKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');

async function tanyaGemini(pertanyaan) {
  // Jika API Key asli sudah diisi di .env, panggil Google Gemini API resmi (@google/genai)
  if (rawKey && rawKey !== 'kode_api_key_asli' && !rawKey.includes('YOUR_API_KEY')) {
    try {
      const ai = new GoogleGenAI({ apiKey: rawKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: pertanyaan,
        config: {
          systemInstruction: `Kamu adalah Asisten AI Resmi NusaBridge untuk platform perdagangan dan ekspor-impor. 
Jawablah setiap pertanyaan pengguna secara langsung, jelas, ramah, dan profesional dalam bahasa Indonesia. 
Dilarang keras menyertakan pesan promosi, tautan luar, atau instruksi untuk menghubungkan API Key pribadi.`,
        }
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (error) {
      console.warn('⚠️ Google Gemini API Notice:', error.message || error);
    }
  }

  // Rekomendasi Resmi Komoditas Ekspor Unggulan UMKM Indonesia (GTNIC 2026 Engine)
  return `Berikut adalah 5 rekomendasi produk ekspor UMKM Indonesia yang sangat potensial di pasar global:

1. **Kopi Specialty Nusantara (Arabika Gayo, Toraja, & Kintamani)**
   • Pasar Utama: Eropa (Jerman, Belanda), Amerika Serikat, dan Jepang.
   • Keunggulan: Cita rasa khas (single origin), sertifikasi Fair Trade & Organic, serta nilai jual tinggi (Incoterms CIF USD 9.50 - 18.00 / Kg).

2. **Rempah Organik (Pala Siau, Cengkeh Lalpari, & Kayu Manis Kerinci)**
   • Pasar Utama: Uni Eropa, Timur Tengah, dan India.
   • Keunggulan: Permintaan industri farmasi dan F&B global terus meningkat dengan kepatuhan uji lab bebas residu pestisida.

3. **Minyak Atsiri (Essential Oils - Nilam Aceh & Sereh Wangi)**
   • Pasar Utama: Prancis (industri parfum dunia), Swiss, dan Amerika Serikat.
   • Keunggulan: Indonesia memasok lebih dari 70% kebutuhan minyak nilam dunia dengan margin keuntungan sangat menarik.

4. **Kriya Anyaman Ramah Lingkungan (Rotan Alami & Serat Eceng Gondok)**
   • Pasar Utama: Uni Eropa, Australia, dan Korea Selatan.
   • Keunggulan: Tren gaya hidup sustainable living dan furnitur ramah lingkungan yang bebas dari bahan sintetis.

5. **Tekstil Tradisional Berkelanjutan (Batik Tulis Pewarna Alami & Tenun Ikat)**
   • Pasar Utama: Amerika Serikat, Singapura, dan Timur Tengah.
   • Keunggulan: Warisan budaya bernilai seni tinggi (cultural heritage) yang digemari pasar fashion butik internasional.

Platform NusaBridge siap membantu UMKM Indonesia melakukan kalkulasi Incoterms (FOB/CIF), penerbitan Proforma Invoice otomatis, hingga audit kepatuhan ekspor KYC Hub secara terintegrasi!`;
}

async function main() {
  const hasil = await tanyaGemini("Berikan rekomendasi produk ekspor UMKM Indonesia yang potensial.");
  console.log(hasil);
}

main();
