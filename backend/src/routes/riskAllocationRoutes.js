const express = require('express');
const router = express.Router();
const riskAllocationController = require('../controllers/riskAllocationController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.get('/policy/:policyId', authenticate, riskAllocationController.getByPolicyId);
router.post('/policy/:policyId/recalculate', authenticate, requireRoles('REINSURANCE_MANAGER', 'UNDERWRITER', 'ADMIN'), riskAllocationController.recalculate);

module.exports = router;
