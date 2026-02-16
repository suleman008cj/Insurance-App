const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.get('/exposure-by-policy-type', authenticate, dashboardController.exposureByPolicyType);
router.get('/claims-ratio', authenticate, dashboardController.claimsRatio);
router.get('/reinsurer-risk-distribution', authenticate, dashboardController.reinsurerRiskDistribution);
router.get('/loss-ratio-trends', authenticate, dashboardController.lossRatioTrends);

module.exports = router;
