const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const router = express.Router();

router.get('/', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ status: 400, message: 'Parameter q (query) diperlukan.' });
  }

  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'id-ID,id;q=0.9'
      }
    });

    const $ = cheerio.load(html);
    const results = [];

    $('.result__title').each((i, el) => {
      const title = $(el).text().trim();
      const link = $(el).find('a').attr('href');
      if (title && link) {
        results.push({ title, link });
      }
    });

    res.json({ status: 200, result: results });
  } catch (error) {
    console.error('DuckDuckGo Search Error:', error.message);
    res.status(500).json({ status: 500, message: 'Gagal mengambil data dari DuckDuckGo.' });
  }
});

module.exports = router;