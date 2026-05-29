const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const seedAutomations = require('./utils/seedAutomations');
const { startMonitoring } = require('./services/monitoringService');
const { startPowerCalculator } = require('./services/powerCalculationService');
const { initDeviceManager } = require('./deviceManager');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://IntelliHomeadmin:Krish9435@cluster0.ksv6ar5.mongodb.net/intellihome?appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then((conn) => {
  console.log(`MongoDB Connected: ${conn.connection.host}`);
  seedAutomations();
  startMonitoring(io);
  startPowerCalculator(io);
})
.catch(err => console.error('MongoDB Connection Error:', err));

app.set('io', io);
initDeviceManager(io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/devices', require('./routes/deviceRoutes'));
app.use('/api/automations', require('./routes/automationRoutes'));
app.use('/api/fsm', require('./routes/fsmRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Root route for Render deployment health check
app.get('/', (req, res) => {
  res.send('IntelliHome Backend Running');
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
