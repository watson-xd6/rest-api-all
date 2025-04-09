const express = require('express');
const axios = require('axios');
const https = require('https');
const router = express.Router();

const agent = new https.Agent({
  rejectUnauthorized: true,
  maxVersion: 'TLSv1.3',
  minVersion: 'TLSv1.2',
});

async function getCookies() {
  try {
    const response = await axios.get('https://www.pinterest.com/csrf_error/', { httpsAgent: agent });
    const setCookieHeaders = response.headers['set-cookie'];
    if (setCookieHeaders) {
      const cookies = setCookieHeaders.map(cookieString => cookieString.split(';')[0].trim());
      return cookies.join('; ');
    }
    return null;
  } catch (error) {
    console.error('Gagal ambil cookie:', error.message);
    return null;
  }
}

async function pinterest(query) {
  try {
    const cookies = await getCookies();
    if (!cookies) throw new Error('Tidak bisa ambil cookies');

    const url = 'https://www.pinterest.com/resource/BaseSearchResource/get/';
    const params = {
      source_url: `/search/pins/?q=${encodeURIComponent(query)}`,
      data: JSON.stringify({
        options: {
          isPrefetch: false,
          query,
          scope: 'pins',
          no_fetch_context_on_resource: false,
        },
        context: {},
      }),
      _: Date.now(),
    };

    const headers = {
      'accept': 'application/json, text/javascript, */*, q=0.01',
      'accept-language': 'en-US,en;q=0.9',
      'cookie': cookies,
      'referer': 'https://www.pinterest.com/',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/133.0.0.0 Safari/537.36',
      'x-requested-with': 'XMLHttpRequest',
    };

    const { data } = await axios.get(url, {
      httpsAgent: agent,
      headers,
      params,
    });

    const results = data?.resource_response?.data?.results || [];
    return results
      .filter(v => v.images?.orig)
      .map(v => ({
        upload_by: v.pinner?.username || 'unknown',
        caption: v.grid_title || '',
        image: v.images.orig.url,
        source: `https://id.pinterest.com/pin/${v.id}`,
      }));
  } catch (err) {
    console.error('Pinterest error:', err.message);
    throw new Error('Gagal mengambil data dari Pinterest.');
  }
}

router.get('/', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ status: 400, message: 'Masukkan parameter q' });

  try {
    const results = await pinterest(query);
    res.json({
      status: 200,
      results,
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
});

module.exports = router;