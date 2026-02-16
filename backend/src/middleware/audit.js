const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

exports.audit = (entityType) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
      const action = req.method === 'POST' ? 'CREATE' : req.method === 'PATCH' || req.method === 'PUT' ? 'UPDATE' : req.method === 'DELETE' ? 'DELETE' : null;
      if (action) {
        const entityId = body?.policy?._id || body?.claim?._id || body?.user?._id || body?._id || req.params.id;
        AuditLog.create({
          _id: new mongoose.Types.ObjectId(),
          entityType,
          entityId: entityId ? (typeof entityId === 'string' ? entityId : entityId.toString()) : undefined,
          action,
          oldValue: req._auditOldValue || undefined,
          newValue: body?.policy || body?.claim || body?.user || body,
          performedBy: req.user._id,
          performedAt: new Date(),
          ipAddress: req.ip || req.connection?.remoteAddress,
        }).catch((err) => console.error('Audit log error:', err));
      }
    }
    return originalJson(body);
  };
  next();
};

exports.captureOld = (getEntityId) => async (req, res, next) => {
  try {
    const id = getEntityId ? getEntityId(req) : req.params.id;
    if (!id) return next();
    const model = req._auditModel;
    if (model) {
      const doc = await model.findById(id).lean();
      if (doc) req._auditOldValue = doc;
    }
  } catch (_) {}
  next();
};
