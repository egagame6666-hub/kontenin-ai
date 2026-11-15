export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST');
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
            return res.status(500).json({ error: 'API Key belum diatur di Environment Variables Vercel.' });
        }

        const { text, count, durationTotal, voStyle, mainCategory, images } = req.body;

        let parts = [];

        if (images) {
            for (let key in images) {
                if (images[key]) {
                    const base64Data = images[key].split(';base64,').pop();
                    const mimeType = images[key].split(';')[0].replace('data:', '');
                    
                    parts.push({
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    });
                }
            }
        }

        const promptText = `
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

        parts.push({ text: promptText });

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: parts }]
            })
        });

        const data = await geminiResponse.json();

        if (data.error) {
            console.error("Gemini API Error:", data.error);
            return res.status(500).json({ error: data.error.message || 'Gagal dari server Gemini.' });
        }

        const rawText = data.candidates[0].content.parts[0].text.trim();
        const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const storyboardArray = JSON.parse(cleanJsonText);

        return res.status(200).json({ success: true, data: storyboardArray });

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: error.message || 'Gagal memproses AI generator di server.' });
    }
}
