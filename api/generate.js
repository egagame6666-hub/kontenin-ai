const { GoogleGenAI } = require('@google/genai');

module.exports = async function handler(req, res) {
    // Izinkan CORS agar bisa diakses dari frontend
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,GET');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API Key belum diset di Environment Variables Vercel.' });
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });
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
            Jika ada gambar referensi di atas, jadikan acuan visual utama.
            Berikan output dalam format JSON murni berupa array tanpa teks pengantar markdown lainnya:
            [
              {
                "scene": 1,
                "timing": "0 - 5 Detik",
                "visual_prompt": "Deskripsi visual gambar",
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
        return res.status(500).json({ error: error.message || 'Gagal memproses AI generator.' });
    }
};
