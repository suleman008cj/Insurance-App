const AuditLog = require('../models/AuditLog');

exports.listAuditLogs = async (req, res) => {
  try {
    const { entityType, entityId, action, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;
    if (action) filter.action = action;
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(limit, 10)));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ performedAt: -1 }).skip(skip).limit(limitNum).populate('performedBy', 'username role').lean(),
      AuditLog.countDocuments(filter),
    ]);
    return res.json({ logs, total, page: parseInt(page, 10), limit: limitNum });
  } catch (error) {
    console.error('List audit logs error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
