const express = require('express');
const router = express.Router();
const { getBangladeshNews } = require('../controllers/news.controller');
const configService = require('../services/config.service');

// News API Route
router.get('/bangladesh', getBangladeshNews);

// News Configuration Management
router.get('/config', async (req, res) => {
    try {
        const config = await configService.getNewsConfig();
        res.json({
            success: true,
            config: config,
            message: 'News configuration retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to get News configuration',
            message: error.message 
        });
    }
});

router.post('/config/refresh', async (req, res) => {
    try {
        await configService.refreshCache();
        res.json({ 
            success: true, 
            message: 'News configuration cache refreshed successfully',
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