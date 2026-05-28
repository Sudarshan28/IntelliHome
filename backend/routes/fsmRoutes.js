const express = require('express');
const router = express.Router();
const fsmController = require('../controllers/fsmController');
const auth = require('../middleware/authMiddleware');

router.get('/state', auth, fsmController.getState);
router.post('/state', auth, fsmController.setState);
router.get('/logs', auth, fsmController.getLogs);

module.exports = router;
