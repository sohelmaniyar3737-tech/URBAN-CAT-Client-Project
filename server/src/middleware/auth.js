import jwt from 'jsonwebtoken';

export function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : '';

  if (!token) {
    return res.status(401).json({ message: 'Please log in.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Allow only explicitly authorized admin/owner tokens.
    if (payload.role !== 'admin' && payload.role !== 'owner') {
      return res.status(403).json({ message: 'Not allowed.' });
    }

    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({
      message: 'Session expired. Please log in again.'
    });
  }
}