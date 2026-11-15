import { GoogleGenAI } from "@google/genai";
export default async function handler(req, res) {
// Pastikan hanya menerima method POST
if (req.method !== 'POST') {
return res.status(405).json({ success: false, error: 'Method not allowed' });
}
try {
// Inisialisasi Google Gen AI menggunakan API Key rahasia dari Environment Variables Vercel
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const { text, count, durationTotal, voStyle, mainCategory } = req.body;
if (!text) {
return res.status(400).json({ success: false, error: 'Alur cerita kosong.' });
}
const prompt = ⁠Bertindaklah sebagai Sutradara AI dan Copywriter Profesional untuk konten ${mainCategory}. Buatkan ${count} scene storyboard video berdurasi total ${durationTotal} detik berdasarkan ide berikut: "${text}". Gaya bahasa Voiceover (VO) menggunakan nada: ${voStyle}. Berikan output dalam format JSON murni berupa array objek dengan struktur persis seperti ini tanpa teks pengantar atau markdown tambahan lainnya: [ { "scene": 1, "timing": "0 - 6 Detik", "visual_prompt": "Deskripsi visual gambar yang sinematik dan detail", "voiceover": "Teks naskah voiceover yang sesuai" } ]⁠;
// Panggil model gemini-2.5-flash
const response = await ai.models.generateContent({
model: 'gemini-2.5-flash',
contents: prompt,
});
const rawText = response.text.trim();
const cleanJsonText = rawText.replace(/⁠json/g, '').replace(/⁠/g, '').trim();
const storyboardArray = JSON.parse(cleanJsonText);
return res.status(200).json({ success: true, data: storyboardArray });
} catch (error) {
console.error("Backend AI Error:", error);
return res.status(500).json({ success: false, error: 'Gagal memproses AI generator di server.' });
}
}
