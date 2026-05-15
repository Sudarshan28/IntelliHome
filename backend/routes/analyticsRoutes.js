const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/energy', authMiddleware, analyticsController.getEnergyStats);
router.get('/activity', authMiddleware, analyticsController.getActivityStats);

module.exports = router;
