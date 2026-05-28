const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, automationController.getAutomations);
router.post('/', auth, automationController.addAutomation);
router.delete('/:id', auth, automationController.deleteAutomation);
router.put('/:id/toggle', auth, automationController.toggleAutomation);

module.exports = router;
