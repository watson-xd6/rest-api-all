const express = require('express');
const axios = require('axios');
const FormData = require('form-data');

const router = express.Router();

async function getVideoData(url, format = 'mp4') {
  try {
    const formDataInfo = new FormData();
    formDataInfo.append('url', url);

    const infoResponse = await axios.post('https://ytdown.siputzx.my.id/api/get-info', formDataInfo, {
      headers: formDataInfo.getHeaders()
    });

    const info = infoResponse.data;

    const formDataDownload = new FormData();
    formDataDownload.append('id', info.id);
    formDataDownload.append('format', format);
    formDataDownload.append('info', JSON.stringify(info));

    const downloadResponse = await axios.post('https://ytdown.siputzx.my.id/api/download', formDataDownload, {
      headers: formDataDownload.getHeaders()
    });

    if (!downloadResponse.data.download_url) throw new Error('Gagal mendapatkan link unduhan');

    return {
      title: info.title,
      thumbnail: info.thumbnail,
      format,
      download_url: `https://ytdown.siputzx.my.id${downloadResponse.data.download_url}`
    };
  } catch (e) {
    throw new Error(`Gagal mengambil data video: ${e.message}`);
  }
}

router.post('/', async (req, res) => {
  const { url, format } = req.body;
  if (!url) return res.status(400).json({ status: 400, error: 'Parameter "url" wajib diisi.' });

  const chosenFormat = ['mp3', 'mp4'].includes((format || '').toLowerCase()) ? format.toLowerCase() : 'mp4';

  try {
    const result = await getVideoData(url, chosenFormat);
    res.status(200).json({ status: 200, result });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message });
  }
});

module.exports = router;