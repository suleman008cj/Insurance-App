const express = require('express');
const router = express.Router();
const treatyController = require('../controllers/treatyController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.post('/', authenticate, requireRoles('REINSURANCE_MANAGER', 'ADMIN'), treatyController.createTreaty);
router.get('/', authenticate, treatyController.listTreaties);
router.get('/:id', authenticate, treatyController.getTreaty);
router.patch('/:id', authenticate, requireRoles('REINSURANCE_MANAGER', 'ADMIN'), treatyController.updateTreaty);

module.exports = router;
