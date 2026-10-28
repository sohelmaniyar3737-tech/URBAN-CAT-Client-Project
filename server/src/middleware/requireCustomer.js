
import jwt from 'jsonwebtoken';

export function requireCustomer(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : '';

  if (!token) {
    return res.status(401).json({ message: 'Please log in.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (
      typeof payload.sub !== 'string' ||
      payload.role !== 'customer'
    ) {
      return res.status(403).json({ message: 'Not allowed.' });
    }

    req.customer = { id: payload.sub };
    next();
  } catch {
    return res.status(401).json({
      message: 'Session expired. Please log in again.'
    });
  }
}
