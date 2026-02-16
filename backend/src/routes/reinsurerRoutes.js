const express = require('express');
const router = express.Router();
const reinsurerController = require('../controllers/reinsurerController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.post('/', authenticate, requireRoles('REINSURANCE_MANAGER', 'ADMIN'), reinsurerController.createReinsurer);
router.get('/', authenticate, reinsurerController.listReinsurers);
router.get('/:id', authenticate, reinsurerController.getReinsurer);
router.patch('/:id', authenticate, requireRoles('REINSURANCE_MANAGER', 'ADMIN'), reinsurerController.updateReinsurer);

module.exports = router;
