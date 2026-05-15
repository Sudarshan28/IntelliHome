const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

router.get('/', deviceController.getDevices);
router.post('/', deviceController.addDevice);
router.put('/:id/status', deviceController.updateDeviceStatus);
router.post('/simulate', deviceController.simulateSensor);

module.exports = router;
