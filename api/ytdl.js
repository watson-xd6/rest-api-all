const express = require('express');
const axios = require('axios');
const router = express.Router();

async function NoTube(url, format = 'mp4', lang = 'id', subscribed = 'false') {
    try {
        const response = await axios({
            method: 'post',
            url: 'https://s53.notube.lol/recover_weight.php',
            headers: {
                'Accept': 'text/html, */*; q=0.01',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'Connection': 'keep-alive',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Origin': 'https://notube.lol',
                'Referer': 'https://notube.lol/',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
                'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"'
            },
            data: `url=${encodeURIComponent(url)}&format=${encodeURIComponent(format)}&lang=${encodeURIComponent(lang)}&subscribed=${encodeURIComponent(subscribed)}`,
            responseType: 'json'
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching video data:', error);
        throw error;
    }
}

router.get('/', async (req, res) => {
    const url = req.query.url;
    const format = req.query.format || 'mp4';

    if (!url) {
        return res.status(400).json({
            status: 400,
            error: 'Masukkan URL YouTube!'
        });
    }

    try {
        const data = await NoTube(url, format);

        if (!data || !data.dlink) {
            return res.status(500).json({
                status: 500,
                error: "Gagal mendapatkan link video."
            });
        }

        res.json({
            status: 200,
            source: url,
            format,
            download_link: data.dlink
        });
    } catch (err) {
        console.error("Error:", err.message);
        res.status(500).json({
            status: 500,
            error: 'Terjadi kesalahan, coba lagi nanti!'
        });
    }
});

module.exports = router;