// middleware/adminAuth.js — gates the admin "list all" GET endpoints
module.exports = function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }
  next();
};
