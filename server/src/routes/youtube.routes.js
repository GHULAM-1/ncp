const express = require('express');
const router = express.Router();
const { searchBangladeshNews, getVideosByType } = require('../controllers/youtube.controller');

// Legacy route for backward compatibility
router.get('/search', searchBangladeshNews);

// New structured route for different content types
router.get('/videos', getVideosByType);

module.exports = router; 