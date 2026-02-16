const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const hashPassword = (plain) => bcrypt.hash(plain, 10);

// CREATE USER (register – hashes password)
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, role, permissions, status } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: 'Username, email, password and role are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email or username' });
    }

    const passwordHash = await hashPassword(password);
    const newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      username,
      email,
      passwordHash,
      role,
      permissions: permissions || [],
      status: status || 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await newUser.save();
    const { passwordHash: _, ...user } = saved.toObject();
    return res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// LIST USERS (exclude passwordHash)
exports.listUsers = async (req, res) => {
  try {
    const { status, role } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (role) filter.role = role;
    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    console.error('Error listing users:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET USER BY ID
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// UPDATE USER (optional password change)
exports.updateUser = async (req, res) => {
  try {
    const { username, email, role, permissions, status, password } = req.body;
    const update = { updatedAt: new Date() };
    if (username !== undefined) update.username = username;
    if (email !== undefined) update.email = email;
    if (role !== undefined) update.role = role;
    if (permissions !== undefined) update.permissions = permissions;
    if (status !== undefined) update.status = status;
    if (password) update.passwordHash = await hashPassword(password);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
