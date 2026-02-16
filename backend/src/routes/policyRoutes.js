const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.post('/', authenticate, requireRoles('UNDERWRITER', 'ADMIN'), policyController.createPolicy);
router.get('/', authenticate, policyController.listPolicies);
router.get('/:id', authenticate, policyController.getPolicy);
router.patch('/:id', authenticate, requireRoles('UNDERWRITER', 'ADMIN'), policyController.updatePolicy);
router.post('/:id/approve', authenticate, requireRoles('UNDERWRITER', 'ADMIN'), policyController.approvePolicy);
router.post('/:id/reject', authenticate, requireRoles('UNDERWRITER', 'ADMIN'), policyController.rejectPolicy);
router.post('/:id/suspend', authenticate, requireRoles('UNDERWRITER', 'ADMIN'), policyController.suspendPolicy);

module.exports = router;
