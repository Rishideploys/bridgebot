const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Mock user database (in production, use a real database)
const users = new Map();
const sessions = new Map();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    // Check if user already exists
    if (users.has(username)) {
      return res.status(409).json({
        error: 'Username already exists'
      });
    }

    // Create user (in production, hash the password)
    const user = {
      id: Date.now().toString(),
      username,
      email: email || '',
      createdAt: new Date().toISOString(),
      settings: {
        theme: 'dark',
        defaultModel: 'openai',
        temperature: 0.7
      }
    };

    users.set(username, { ...user, password });

    // Create session
    const sessionToken = generateSessionToken();
    sessions.set(sessionToken, {
      userId: user.id,
      username,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        settings: user.settings
      },
      token: sessionToken,
      expiresAt: sessions.get(sessionToken).expiresAt
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    // Check user credentials
    const user = users.get(username);
    if (!user || user.password !== password) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Create session
    const sessionToken = generateSessionToken();
    sessions.set(sessionToken, {
      userId: user.id,
      username,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        settings: user.settings
      },
      token: sessionToken,
      expiresAt: sessions.get(sessionToken).expiresAt
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// Logout user
router.post('/logout', auth, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token && sessions.has(token)) {
      sessions.delete(token);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: error.message
    });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = users.get(req.user.username);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        settings: user.settings,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

// Update user settings
router.put('/settings', auth, async (req, res) => {
  try {
    const { theme, defaultModel, temperature, apiKeys } = req.body;
    const user = users.get(req.user.username);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Update settings
    user.settings = {
      ...user.settings,
      ...(theme && { theme }),
      ...(defaultModel && { defaultModel }),
      ...(temperature !== undefined && { temperature }),
      ...(apiKeys && { apiKeys })
    };

    users.set(req.user.username, user);

    res.json({
      success: true,
      settings: user.settings,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      error: 'Failed to update settings',
      message: error.message
    });
  }
});

// Verify session
router.get('/verify', auth, async (req, res) => {
  try {
    res.json({
      valid: true,
      user: {
        id: req.user.id,
        username: req.user.username
      },
      expiresAt: req.session.expiresAt
    });
  } catch (error) {
    res.status(401).json({
      valid: false,
      error: 'Invalid session'
    });
  }
});

function generateSessionToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Export sessions for middleware access
module.exports = router;
module.exports.sessions = sessions;
module.exports.users = users;
