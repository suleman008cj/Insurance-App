const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');

function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
  return null;
}

exports.log = async (opts) => {
  const { entityType, entityId, action, oldValue, newValue, performedBy, ipAddress } = opts;
  try {
    await AuditLog.create({
      _id: new mongoose.Types.ObjectId(),
      entityType,
      entityId: toObjectId(entityId),
      action,
      oldValue: oldValue || undefined,
      newValue: newValue || undefined,
      performedBy: toObjectId(performedBy),
      performedAt: new Date(),
      ipAddress: ipAddress || undefined,
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
};
