import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

export function basicAuth(req: Request, res: Response, next: NextFunction): void {
  // Skip auth for health check and static files (UI)
  if (req.path === '/health' || req.path === '/' || req.path.startsWith('/index.html') || req.path.match(/\.(css|js|ico|png|svg|jpg|woff2?)$/)) { next(); return; }

  // Support auth via header or query param (needed for EventSource/SSE)
  let user = '', pass = '';

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString();
    [user, pass] = decoded.split(':');
  } else if (req.query.auth) {
    // Query param auth: ?auth=base64(user:pass)
    const decoded = Buffer.from(req.query.auth as string, 'base64').toString();
    [user, pass] = decoded.split(':');
  }

  if (user === config.auth.user && pass === config.auth.pass) {
    next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="BACnet Tagging API"');
    res.status(401).json({ error: 'Authentication required' });
  }
}
