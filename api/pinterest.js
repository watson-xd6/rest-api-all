const express = require('express');
const axios = require('axios');
const https = require('https');

const router = express.Router();

const agent = new https.Agent({
  rejectUnauthorized: true,
  maxVersion: 'TLSv1.3',
  minVersion: 'TLSv1.2'
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
    console.error('Error fetching cookies:', error);
    return null;
  }
}

router.get('/', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ status: 400, error: 'Query parameter `q` is required' });

  try {
    const cookies = await getCookies();
    if (!cookies) return res.status(500).json({ status: 500, error: 'Failed to get cookies' });

    const url = 'https://www.pinterest.com/resource/BaseSearchResource/get/';
    const params = {
      source_url: `/search/pins/?q=${query}`,
      data: JSON.stringify({
        options: {
          isPrefetch: false,
          query,
          scope: 'pins',
          no_fetch_context_on_resource: false
        },
        context: {}
      }),
      _: Date.now()
    };

    const headers = {
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'cookie': cookies,
      'referer': 'https://www.pinterest.com/',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'x-requested-with': 'XMLHttpRequest'
    };

    const { data } = await axios.get(url, { httpsAgent: agent, headers, params });

    const results = data.resource_response?.data?.results?.filter(v => v.images?.orig) || [];
    const mapped = results.map(result => ({
      upload_by: result.pinner?.username,
      caption: result.grid_title,
      image: result.images.orig.url,
      source: `https://id.pinterest.com/pin/${result.id}`
    }));

    res.status(200).json({ status: 200, result: mapped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, error: 'Internal Server Error' });
  }
});

module.exports = router;