require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./src/db');
const authRoutes = require('./src/routes/auth');
const stickyNotesRoutes = require('./src/modules/sticky-notes/routes');
const promptStoreRoutes = require('./src/modules/prompt-store/routes');
const assetVaultRoutes = require('./src/modules/asset-vault/routes');
const dashboardRoutes = require('./src/modules/dashboard/routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Dynamic CORS configuration to support ALL Vercel preview domains and localhost instantly
app.use(cors({ 
  origin: (origin, callback) => callback(null, origin || true),
  credentials: true 
}));
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
