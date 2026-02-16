const bcrypt = require('bcrypt');
const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  JWT_REFRESH_SECRET,
} = require('../middleware/auth');

const REFRESH_TOKENS = new Map(); // In production use Redis or DB

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'Account is inactive' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    await User.updateOne(
      { _id: user._id },
      { lastLoginAt: new Date(), updatedAt: new Date() }
    );
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());
    REFRESH_TOKENS.set(refreshToken, { userId: user._id.toString(), createdAt: Date.now() });
    const { passwordHash: _, ...userWithoutPassword } = user.toObject();
    return res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRY || '15m',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }
    const stored = REFRESH_TOKENS.get(refreshToken);
    if (!stored) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'ACTIVE') {
      REFRESH_TOKENS.delete(refreshToken);
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    REFRESH_TOKENS.delete(refreshToken);
    const newAccess = generateAccessToken(user._id.toString(), user.role);
    const newRefresh = generateRefreshToken(user._id.toString());
    REFRESH_TOKENS.set(newRefresh, { userId: user._id.toString(), createdAt: Date.now() });
    return res.json({
      accessToken: newAccess,
      refreshToken: newRefresh,
      expiresIn: process.env.JWT_EXPIRY || '15m',
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) REFRESH_TOKENS.delete(refreshToken);
  return res.json({ message: 'Logged out' });
};
