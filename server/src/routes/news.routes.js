const express = require('express');
const router = express.Router();
const { getBangladeshNews } = require('../controllers/news.controller');

// News API Route
router.get('/bangladesh', getBangladeshNews);

module.exports = router; 