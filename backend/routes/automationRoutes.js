const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');

router.get('/', automationController.getAutomations);
router.post('/', automationController.addAutomation);
router.delete('/:id', automationController.deleteAutomation);
router.put('/:id/toggle', automationController.toggleAutomation);

module.exports = router;
