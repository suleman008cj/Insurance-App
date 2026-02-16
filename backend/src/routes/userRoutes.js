const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.post('/register', userController.createUser);
router.get('/', authenticate, requireRoles('ADMIN'), userController.listUsers);
router.get('/:id', authenticate, requireRoles('ADMIN'), userController.getUser);
router.patch('/:id', authenticate, requireRoles('ADMIN'), userController.updateUser);

module.exports = router;
