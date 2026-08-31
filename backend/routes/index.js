/**
 * Master API Router
 * Aggregates all modular domain routes under /api
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const studentRoutes = require('./studentRoutes');
const reportRoutes = require('./reportRoutes');
const chatRoutes = require('./chatRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const archiveRoutes = require('./archiveRoutes');
const telemetryController = require('../controllers/telemetryController');

// Mount Domain Routes
router.use('/', authRoutes);
router.use('/', studentRoutes);
router.use('/', reportRoutes);
router.use('/', chatRoutes);
router.use('/', attendanceRoutes);
router.use('/', archiveRoutes);

// Telemetry & Health Endpoints
router.post('/telemetry/ping', telemetryController.pingTelemetry);
router.get('/telemetry/stats', telemetryController.getTelemetryStats);

module.exports = router;
