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
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(helmet());

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
      
      // Fetch fresh data from Facebook API and cache it
      const response = await fetch(`${process.env.SERVER_URL || 'http://localhost:5001'}/api/facebook/posts?maxPosts=50&batch=true`);
      
      if (response.ok) {
        const data = await response.json();
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

app.get('/api/refresh/facebook', async (req, res) => {
  try {
    console.log('🔄 Manual Facebook refresh requested...');
    const startTime = Date.now();
    
    // Make a request to your Facebook API
    const response = await fetch(`${process.env.SERVER_URL || 'http://localhost:5001'}/api/facebook/posts?maxPosts=50&batch=true`);
    
    if (response.ok) {
      const data = await response.json();
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
