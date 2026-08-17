require('dotenv').config();
// POLYFILLS FOR PDF-PARSE ON VERCEL SERVERLESS
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {};
}
if (typeof global.ImageData === 'undefined') {
  global.ImageData = class ImageData {};
}
if (typeof global.Path2D === 'undefined') {
  global.Path2D = class Path2D {};
}

const express = require('express');
const { initDB } = require('./src/db');
const authRoutes = require('./src/routes/auth');
const stickyNotesRoutes = require('./src/modules/sticky-notes/routes');
const promptStoreRoutes = require('./src/modules/prompt-store/routes');
const assetVaultRoutes = require('./src/modules/asset-vault/routes');
const dashboardRoutes = require('./src/modules/dashboard/routes');
const apiPingRoutes = require('./src/modules/api-ping/routes');
const focusRoutes = require('./src/modules/focus/routes');
const whiteboardRoutes = require('./src/modules/whiteboard/routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy to ensure req.ip is correct behind Vercel/proxies (CRITICAL for rate limiting)
app.set('trust proxy', 1);

// Allowed origins whitelist
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL, // e.g. https://my-app.vercel.app
].filter(Boolean);

// Bulletproof Native CORS for Vercel Serverless
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Only set Access-Control-Allow-Origin if the origin is in our whitelist
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Allow same-origin requests (origin is undefined)
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
app.use(express.json());

// Native Security Headers
app.use((req, res, next) => {
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // CRITICAL FIX FOR GOOGLE OAUTH POSTMESSAGE POPUP
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Simple In-Memory Rate Limiter (ponytail: zero-dependency express-rate-limit alternative)
const rateLimitMap = new Map();
setInterval(() => rateLimitMap.clear(), 15 * 60 * 1000); // Clear every 15 mins

app.use('/api', (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const count = (rateLimitMap.get(ip) || 0) + 1;
  if (count > 200) {
    return res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
  rateLimitMap.set(ip, count);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sticky-notes', stickyNotesRoutes);
app.use('/api/prompt-store', promptStoreRoutes);
app.use('/api/assets', assetVaultRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/api-ping', apiPingRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/whiteboard', whiteboardRoutes);

// Root route to prevent 'Cannot GET /'
app.get('/', (req, res) => {
  res.json({ message: 'Mini-Projects API is running.', docs: '/health' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Initialize DB globally for Vercel Serverless caching
initDB().catch(console.error);

// Start server locally (Vercel will ignore this and use the exported app)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

// Export the app for Vercel Serverless
module.exports = app;
