const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.post('/', authenticate, requireRoles('CLAIMS_ADJUSTER', 'ADMIN'), claimController.createClaim);
router.get('/', authenticate, claimController.listClaims);
router.get('/:id', authenticate, claimController.getClaim);
router.patch('/:id/status', authenticate, requireRoles('CLAIMS_ADJUSTER', 'ADMIN'), claimController.updateClaimStatus);

module.exports = router;
