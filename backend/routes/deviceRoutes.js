const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, deviceController.getDevices);
router.get('/discover', auth, deviceController.discoverDevices);
router.post('/', auth, deviceController.addDevice);
router.delete('/:id', auth, deviceController.disconnectDevice);
router.put('/:id/status', auth, deviceController.updateDeviceStatus);
router.post('/simulate', auth, deviceController.simulateSensor);

module.exports = router;
