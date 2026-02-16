const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, (req, res) => {
  const { passwordHash, ...user } = req.user.toObject();
  res.json(user);
});

module.exports = router;
