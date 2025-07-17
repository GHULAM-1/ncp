const express = require('express');
const router = express.Router();
const { searchBangladeshNews } = require('../controllers/youtube.controller');

// YouTube API Route
router.get('/bangladesh-news', searchBangladeshNews);

module.exports = router; 