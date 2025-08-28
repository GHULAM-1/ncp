const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const rateLimit = require("express-rate-limit");
// const http = require('http');

// Facebook refresh function (commented out for now)
// const { refreshFacebookData } = require('./controllers/facebook.controller');

dotenv.config();
connectDB();

const app = express();

const corsOptions = {
  origin: ["http://localhost:3000", "https://ncp-client.vercel.app"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "User-Agent", // Allow User-Agent header for Apify client
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],
};

// TEMPORARILY DISABLE ALL MIDDLEWARE TO ISOLATE THE ISSUE
console.log('🧪 TEMPORARILY DISABLED ALL MIDDLEWARE TO ISOLATE APIFY ISSUE');

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure Helmet to be less restrictive for Apify client
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP temporarily
  crossOriginEmbedderPolicy: false, // Disable COEP temporarily
}));

// Allow User-Agent headers specifically for Apify client
app.use((req, res, next) => {
  // Allow User-Agent header for Apify client requests
  res.setHeader('Access-Control-Allow-Headers', 'User-Agent, Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  
  // Remove any User-Agent restrictions for Apify
  if (req.headers['user-agent'] && req.headers['user-agent'].includes('apify')) {
    res.setHeader('X-Allow-User-Agent', 'true');
  }
  
  next();
});

app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

app.use(passport.initialize());

require("./config/passport")(passport);

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/youtube", require("./routes/youtube.routes"));
app.use("/api/news", require("./routes/news.routes"));
app.use("/api/facebook", require("./routes/facebook.routes"));
app.use("/api/comments", require("./routes/comment.routes"));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Authentication API" });
});
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});
app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Cron job setup (commented out for now)
let facebookRefreshInterval = null;

// Function to start Facebook refresh interval (data preparation only)
const startFacebookRefresh = () => {
  if (facebookRefreshInterval) {
    clearInterval(facebookRefreshInterval);
  }
  
  // Prepare fresh data every 2 hours for next ISR cycle
  facebookRefreshInterval = setInterval(async () => {
    try {
      console.log('🕐 [TIMER] Preparing fresh Facebook data for next ISR cycle...');
      const startTime = Date.now();
      
      // Use Node.js HTTP instead of global fetch to avoid browser environment
      const serverUrl = process.env.SERVER_URL || 'http://localhost:5001';
      const url = new URL('/api/facebook/posts?maxPosts=50&batch=true', serverUrl);
      
      const response = await new Promise((resolve, reject) => {
        const req = http.request(url, { method: 'GET' }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const jsonData = JSON.parse(data);
              resolve({ ok: res.statusCode < 400, status: res.statusCode, json: () => jsonData });
            } catch (e) {
              reject(new Error('Invalid JSON response'));
            }
          });
        });
        req.on('error', reject);
        req.end();
      });
      
      if (response.ok) {
        const data = response.json();
        console.log(`✅ [TIMER] Fresh Facebook data prepared: ${data.count} posts in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
        console.log('🔄 [TIMER] Data is now ready for next ISR revalidation cycle');
      } else {
        console.warn('⚠️ [TIMER] Facebook data preparation failed with status:', response.status);
      }
    } catch (error) {
      console.error('❌ [TIMER] Facebook data preparation error:', error.message);
    }
  }, 2 * 60 * 60 * 1000); // 2 hours
  
  console.log('⏰ [TIMER] Facebook data preparation scheduled every 2 hours');
};

// Start the interval when server starts
startFacebookRefresh();

// Add cron job to trigger Next.js ISR revalidation every 2.5 hours
let revalidationInterval = null;

const startRevalidationCron = () => {
  if (revalidationInterval) {
    clearInterval(revalidationInterval);
  }
  
  // Trigger Next.js ISR revalidation every 2.5 hours (9000000 ms)
  revalidationInterval = setInterval(async () => {
    try {
      console.log('🔄 [CRON] Triggering Next.js ISR revalidation...');
      const startTime = Date.now();
      
      // Call the Next.js revalidation API
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const response = await fetch(`${clientUrl}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: process.env.REVALIDATION_SECRET || 'your-secret-key',
          path: '/'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ [CRON] ISR revalidation triggered successfully in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
        console.log('🔄 [CRON] Next.js will now rebuild the page with fresh data');
      } else {
        console.warn('⚠️ [CRON] ISR revalidation failed with status:', response.status);
      }
    } catch (error) {
      console.error('❌ [CRON] ISR revalidation error:', error.message);
    }
  }, 9000000); // 2.5 hours
  
  console.log('⏰ [CRON] ISR revalidation scheduled every 2.5 hours');
};

// Start the revalidation cron job
startRevalidationCron();

app.get('/api/refresh/facebook', async (req, res) => {
  try {
    console.log('🔄 Manual Facebook refresh requested...');
    const startTime = Date.now();
    
    // Use Node.js HTTP instead of global fetch to avoid browser environment
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5001';
    const url = new URL('/api/facebook/posts?maxPosts=50&batch=true', serverUrl);
    
    const response = await new Promise((resolve, reject) => {
      const req = http.request(url, { method: 'GET' }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ ok: res.statusCode < 400, status: res.statusCode, json: () => jsonData });
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    if (response.ok) {
      const data = response.json();
      const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      res.json({
        success: true,
        message: 'Facebook data refreshed successfully',
        count: data.count,
        executionTime: `${executionTime}s`,
        note: 'This data will be used for the next ISR revalidation cycle'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to refresh Facebook data',
        status: response.status
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Facebook refresh failed',
      message: error.message
    });
  }
});

module.exports = app;
