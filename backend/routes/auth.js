const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Base = require('../models/Base');
const { auth } = require('../middleware/auth');
const { writeLog } = require('../middleware/logging');

const router = express.Router();

// Login
router.post('/login', writeLog('login', 'user'), async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username/email and password are required' });
    }

    console.log(`[LOGIN ATTEMPT] User: ${username}`);

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
      isActive: true
    }).populate('baseId');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Build JWT payload
    const payload = {
      userId: user._id,
      role: user.role
    };
    if (user.baseId) {
      payload.baseId = user.baseId._id;
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    // Return user info without password
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        base: user.baseId || null,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Seed admin user
router.post('/seed-admin', async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: 'Admin' });
    if (adminExists) {
      return res.json({ message: 'Admin user already exists' });
    }

    const passwordHash = await User.hashPassword('admin123');
    const admin = new User({
      username: 'admin',
      email: 'admin@mams.mil',
      passwordHash,
      role: 'Admin'
    });

    await admin.save();
    res.json({ message: 'Admin user created successfully', username: 'admin', password: 'admin123' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating admin user', error: error.message });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('baseId').select('-passwordHash');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create user
router.post('/users', auth, async (req, res) => {
  try {
    const { username, email, password, role, baseId } = req.body;
    
    const passwordHash = await User.hashPassword(password);
    const user = new User({
      username,
      email,
      passwordHash,
      role,
      baseId: role !== 'Admin' ? baseId : undefined
    });

    await user.save();
    await user.populate('baseId');
    
    res.status(201).json({ 
      message: 'User created successfully',
      user: { ...user.toObject(), passwordHash: undefined }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

module.exports = router;