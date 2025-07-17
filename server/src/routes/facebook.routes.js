const express = require('express');
const router = express.Router();
const { getFacebookPosts } = require('../controllers/facebook.controller');

// Facebook Apify API Route
router.get('/posts', getFacebookPosts);

module.exports = router; 