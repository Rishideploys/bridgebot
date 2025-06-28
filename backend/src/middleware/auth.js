const { sessions, users } = require('../routes/auth');

// Authentication middleware
function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid authentication token'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const session = sessions.get(token);

    if (!session) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Authentication token is invalid or expired'
      });
    }

    // Check if session is expired
    if (new Date() > new Date(session.expiresAt)) {
      sessions.delete(token);
      return res.status(401).json({
        error: 'Token expired',
        message: 'Authentication token has expired. Please log in again.'
      });
    }

    // Get user data
    const user = users.get(session.username);
    if (!user) {
      sessions.delete(token);
      return res.status(401).json({
        error: 'User not found',
        message: 'Associated user account no longer exists'
      });
    }

    // Add user and session to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      settings: user.settings
    };
    req.session = session;
    req.token = token;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'Internal authentication error'
    });
  }
}

// Optional authentication (doesn't fail if no token)
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.session = null;
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    const session = sessions.get(token);

    if (!session || new Date() > new Date(session.expiresAt)) {
      req.user = null;
      req.session = null;
      return next();
    }

    const user = users.get(session.username);
    if (!user) {
      req.user = null;
      req.session = null;
      return next();
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      settings: user.settings
    };
    req.session = session;
    req.token = token;

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    req.session = null;
    next();
  }
}

// Rate limiting per user
function userRateLimit(maxRequests = 100, windowMinutes = 15) {
  const userRequestCounts = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    if (!userRequestCounts.has(userId)) {
      userRequestCounts.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    const userRequests = userRequestCounts.get(userId);

    // Reset counter if window expired
    if (now > userRequests.resetTime) {
      userRequests.count = 1;
      userRequests.resetTime = now + windowMs;
      return next();
    }

    // Check if limit exceeded
    if (userRequests.count >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${maxRequests} per ${windowMinutes} minutes`,
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
    }

    userRequests.count++;
    next();
  };
}

// Admin authentication
function adminAuth(req, res, next) {
  // First check regular auth
  auth(req, res, (err) => {
    if (err) return next(err);

    // Check if user is admin
    if (!req.user.settings?.isAdmin) {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'This endpoint requires administrator privileges'
      });
    }

    next();
  });
}

// API key validation for external integrations
function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide a valid API key in the x-api-key header'
    });
  }

  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }

  next();
}

module.exports = {
  auth,
  optionalAuth,
  userRateLimit,
  adminAuth,
  validateApiKey
};
