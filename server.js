import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Google OAuth2 Configuration
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
  process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
  'postmessage' // For server-side flow
);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Google OAuth Express Server is running!',
    status: 'healthy',
    endpoints: {
      'POST /auth/google': 'Exchange authorization code for tokens',
      'POST /auth/refresh': 'Refresh access token using refresh token',
      'POST /auth/validate': 'Validate access token',
      'POST /auth/revoke': 'Revoke tokens',
      'GET /auth/url': 'Get Google authorization URL'
    }
  });
});

// Get Google authorization URL
app.get('/auth/url', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required for refresh tokens
    scope: [
      'openid',
      'email',
      'profile'
    ],
    prompt: 'consent' // Force consent to get refresh token
  });

  res.json({
    success: true,
    authUrl: authUrl,
    instructions: 'Redirect user to this URL to get authorization code'
  });
});

// Exchange authorization code for tokens
app.post('/auth/google', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Authorization code is required'
    });
  }

  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Tokens received:', tokens);

    const {
      access_token,
      refresh_token,
      scope,
      token_type,
      expiry_date
    } = tokens;

    // Check if refresh token was provided
    if (!refresh_token) {
      console.warn('No refresh token received. User may have already authorized this app.');
    }

    res.json({
      success: true,
      message: 'Successfully authenticated with Google!',
      data: {
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenType: token_type,
        scope: scope,
        expiresAt: expiry_date ? new Date(expiry_date).toISOString() : null
      }
    });

  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to exchange authorization code',
      message: error.message
    });
  }
});

// Refresh access token using refresh token
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Refresh token is required'
    });
  }

  try {
    // Set the refresh token
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    // Get new access token
    const { credentials } = await oauth2Client.refreshAccessToken();
    console.log('New access token obtained');

    res.json({
      success: true,
      message: 'Access token refreshed successfully!',
      data: {
        accessToken: credentials.access_token,
        tokenType: credentials.token_type,
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null
      }
    });

  } catch (error) {
    console.error('Error refreshing access token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh access token',
      message: error.message
    });
  }
});

// Validate access token
app.post('/auth/validate', async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({
      success: false,
      error: 'Access token is required'
    });
  }

  try {
    // Validate the access token
    const tokenInfo = await oauth2Client.getTokenInfo(accessToken);

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        scope: tokenInfo.scope,
        expiresIn: tokenInfo.expires_in,
        email: tokenInfo.email,
        emailVerified: tokenInfo.email_verified
      }
    });

  } catch (error) {
    console.error('Error validating token:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      message: error.message
    });
  }
});

// Revoke tokens
app.post('/auth/revoke', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token is required'
    });
  }

  try {
    await oauth2Client.revokeToken(token);

    res.json({
      success: true,
      message: 'Token revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke token',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}`);
  console.log(`🔗 Get auth URL: http://localhost:${PORT}/auth/url`);
  
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.warn('⚠️  Warning: GOOGLE_CLIENT_ID not set in environment variables');
  }
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Warning: GOOGLE_CLIENT_SECRET not set in environment variables');
  }
});

export default app;
