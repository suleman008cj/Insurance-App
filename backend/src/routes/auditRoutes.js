const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.get('/', authenticate, requireRoles('ADMIN'), auditController.listAuditLogs);

module.exports = router;
