const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('baseId');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const allowRoles = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

const checkBaseAccess = (req, res, next) => {
  const baseId = req.params.baseId || req.body.baseId;
  
  if (req.user.role === 'Admin') {
    return next();
  }
  
  if (req.user.baseId && req.user.baseId._id.toString() === baseId) {
    return next();
  }
  
  return res.status(403).json({ message: 'Access denied to this base' });
};

module.exports = { auth, allowRoles, checkBaseAccess };