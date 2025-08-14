const express = require('express');
const router = express.Router();
const { searchBangladeshNews, getVideosByType } = require('../controllers/youtube.controller');
const configService = require('../services/config.service');

// Legacy route for backward compatibility
router.get('/search', searchBangladeshNews);

// New structured route for different content types
router.get('/videos', getVideosByType);

// YouTube Configuration Management
router.get('/config', async (req, res) => {
    try {
        const config = await configService.getYouTubeConfig();
        res.json({
            success: true,
            config: config,
            message: 'YouTube configuration retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to get YouTube configuration',
            message: error.message 
        });
    }
});

router.post('/config/refresh', async (req, res) => {
    try {
        await configService.refreshCache();
        res.json({ 
            success: true, 
            message: 'YouTube configuration cache refreshed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to refresh cache',
            message: error.message 
        });
    }
});

module.exports = router; 