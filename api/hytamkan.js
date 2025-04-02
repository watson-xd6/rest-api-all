const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();
const genAI = new GoogleGenerativeAI('AIzaSyDdfNNmvphdPdHSbIvpO5UkHdzBwx7NVm0');

router.post('/', async (req, res) => {
    try {
        const { image, mimeType } = req.body;
        if (!image || !mimeType) return res.status(400).json({ error: 'Gambar dan mimeType diperlukan' });

        const contents = [
            { text: 'Ubahlah karakter dari gambar tersebut diubah kulitnya menjadi hitam' },
            {
                inlineData: {
                    mimeType,
                    data: image
                }
            }
        ];

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp-image-generation',
            generationConfig: {
                responseModalities: ['Text', 'Image']
            }
        });

        const response = await model.generateContent(contents);
        let resultImage;
        for (const part of response.response.candidates[0].content.parts) {
            if (part.inlineData) resultImage = part.inlineData.data;
        }

        if (resultImage) return res.json({ image: resultImage });
        res.status(500).json({ error: 'Gagal mengubah gambar' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;