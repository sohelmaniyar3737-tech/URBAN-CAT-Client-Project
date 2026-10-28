
import jwt from 'jsonwebtoken';

export function optionalCustomer(req, res, next) {
  const authorization = req.headers.authorization;

  // Guest checkout is still allowed.
  if (!authorization) return next();

  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Invalid authorization.' });
  }

  const token = authorization.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (typeof payload.sub !== 'string' || payload.role !== 'customer') {
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
