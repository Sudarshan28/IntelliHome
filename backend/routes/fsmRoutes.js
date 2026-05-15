const express = require('express');
const router = express.Router();
const fsmController = require('../controllers/fsmController');

router.get('/state', fsmController.getState);
router.post('/state', fsmController.setState);
router.get('/logs', fsmController.getLogs);

module.exports = router;
