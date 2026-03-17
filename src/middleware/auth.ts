import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

export function basicAuth(req: Request, res: Response, next: NextFunction): void {
  // Skip auth for health check
  if (req.path === '/health') { next(); return; }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="BACnet Tagging API"');
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const decoded = Buffer.from(authHeader.slice(6), 'base64').toString();
  const [user, pass] = decoded.split(':');

  if (user === config.auth.user && pass === config.auth.pass) {
    next();
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}
