const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
const ACCESS_EXPIRY = process.env.JWT_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

exports.JWT_SECRET = JWT_SECRET;
exports.JWT_REFRESH_SECRET = JWT_REFRESH_SECRET;
exports.ACCESS_EXPIRY = ACCESS_EXPIRY;
exports.REFRESH_EXPIRY = REFRESH_EXPIRY;

exports.generateAccessToken = (userId, role) =>
  jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });

exports.generateRefreshToken = (userId) =>
  jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const ROLES = ['UNDERWRITER', 'CLAIMS_ADJUSTER', 'REINSURANCE_MANAGER', 'ADMIN'];

exports.requireRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  const hasRole = allowedRoles.includes(req.user.role);
  if (!hasRole) return res.status(403).json({ message: 'Insufficient permissions' });
  next();
};

exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return next();
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (user && user.status === 'ACTIVE') req.user = user;
    next();
  } catch {
    next();
  }
};
