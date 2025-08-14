const express = require('express');
const router = express.Router();
const { getFacebookPosts } = require('../controllers/facebook.controller');
// const configService = require('../services/config.service');

// Facebook Apify API Route
router.get('/posts', getFacebookPosts);

// Facebook Configuration Management
// router.get('/config', async (req, res) => {
//     try {
//         const config = await configService.getFacebookConfig();
//         res.json({
//             success: true,
//             config: config,
//             message: 'Facebook configuration retrieved successfully'
//         });
//     } catch (error) {
//         res.status(500).json({ 
//             error: 'Failed to get Facebook configuration',
//             message: error.message 
//         });
//     }
// });

// router.post('/config/refresh', async (req, res) => {
//     try {
//         await configService.refreshCache();
//         res.json({ 
//             success: true, 
//             message: 'Facebook configuration cache refreshed successfully',
//             timestamp: new Date().toISOString()
//         });
//     } catch (error) {
//         res.status(500).json({ 
//             error: 'Failed to refresh cache',
//             message: error.message 
//         });
//     }
// });

module.exports = router; 