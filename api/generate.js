import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const { text, count, durationTotal, voStyle, mainCategory, images } = req.body;

        let contents = [];

        if (images) {
            for (let key in images) {
                if (images[key]) {
                    const base64Data = images[key].split(';base64,').pop();
                    const mimeType = images[key].split(';')[0].replace('data:', '');
                    
                    contents.push({
                        inlineData: {
                            data: base64Data,
                            mimeType: mimeType
                        }
                    });
                }
            }
        }

        const prompt = `
            Bertindaklah sebagai Sutradara AI dan Copywriting Profesional untuk konten ${mainCategory}.
            Buatkan ${count} scene storyboard video berdurasi total ${durationTotal} detik berdasarkan ide berikut: "${text}".
            Gaya bahasa Voiceover (VO) menggunakan nada: ${voStyle}.
            Jika ada gambar referensi yang disertakan di atas, jadikan acuan visual utama untuk karakter, latar, atau produknya.
            Berikan output dalam format JSON murni berupa array tanpa teks pengantar markdown lainnya:
            [
              {
                "scene": 1,
                "timing": "0 - 5 Detik",
                "visual_prompt": "Deskripsi visual gambar yang sinematik",
                "voiceover": "Teks naskah voiceover"
              }
            ]
        `;

        contents.push(prompt);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
        });

        const rawText = response.text.trim();
        const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const storyboardArray = JSON.parse(cleanJsonText);

        return res.status(200).json({ success: true, data: storyboardArray });

    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ error: 'Gagal memproses AI generator.' });
    }
}
