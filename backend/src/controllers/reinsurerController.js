const mongoose = require('mongoose');
const Reinsurer = require('../models/Reinsure');

exports.createReinsurer = async (req, res) => {
  try {
    const { name, code, country, rating, contactEmail, status } = req.body;
    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required' });
    }
    const existing = await Reinsurer.findOne({ code });
    if (existing) return res.status(409).json({ message: 'Reinsurer with this code already exists' });

    const doc = new Reinsurer({
      _id: new mongoose.Types.ObjectId(),
      name,
      code,
      country: country || undefined,
      rating: rating || undefined,
      contactEmail: contactEmail || undefined,
      status: status || 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const saved = await doc.save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error('Create reinsurer error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.listReinsurers = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const list = await Reinsurer.find(filter).sort({ name: 1 }).lean();
    return res.json(list);
  } catch (error) {
    console.error('List reinsurers error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getReinsurer = async (req, res) => {
  try {
    const doc = await Reinsurer.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Reinsurer not found' });
    return res.json(doc);
  } catch (error) {
    console.error('Get reinsurer error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateReinsurer = async (req, res) => {
  try {
    const { name, country, rating, contactEmail, status } = req.body;
    const update = { updatedAt: new Date() };
    if (name !== undefined) update.name = name;
    if (country !== undefined) update.country = country;
    if (rating !== undefined) update.rating = rating;
    if (contactEmail !== undefined) update.contactEmail = contactEmail;
    if (status !== undefined) update.status = status;

    const doc = await Reinsurer.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    if (!doc) return res.status(404).json({ message: 'Reinsurer not found' });
    return res.json(doc);
  } catch (error) {
    console.error('Update reinsurer error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
