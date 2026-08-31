/**
 * Archive & Batch Routes
 */

const express = require('express');
const router = express.Router();
const archiveController = require('../controllers/archiveController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/archives', authenticateToken, archiveController.getArchives);
router.get('/archives/:year', authenticateToken, archiveController.getArchiveByYear);
router.post('/archives', authenticateToken, requireAdmin, archiveController.createArchive);
router.delete('/archives/:year', authenticateToken, requireAdmin, archiveController.deleteArchive);

router.get('/current-batch', archiveController.getCurrentBatch);
router.put('/current-batch', authenticateToken, requireAdmin, archiveController.updateCurrentBatch);

module.exports = router;
