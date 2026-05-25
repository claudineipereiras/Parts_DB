module.exports = function (req, res, next) {
  // Check if user is authenticated and is an Admin
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  }
  next();
};
