import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

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
    message: 'OAuth Express Server is running!',
    status: 'healthy',
    endpoints: {
      // Google OAuth
      'GET /auth/google/url': 'Get Google authorization URL',
      'POST /auth/google': 'Exchange Google authorization code for tokens',
      'POST /auth/google/refresh': 'Refresh Google access token using refresh token',
      'POST /auth/google/validate': 'Validate Google access token',
      'POST /auth/google/revoke': 'Revoke Google tokens',
      
      // Microsoft OAuth
      'GET /auth/microsoft/url': 'Get Microsoft authorization URL',
      'POST /auth/microsoft': 'Exchange Microsoft authorization code for tokens',
      'POST /auth/microsoft/refresh': 'Refresh Microsoft access token using refresh token'
    }
  });
});

// Get Google authorization URL
app.get('/auth/google/url', (req, res) => {
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
      expiry_date,
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
        expiryDate: expiry_date ? expiry_date : null
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
app.post('/auth/google/refresh', async (req, res) => {
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
app.post('/auth/google/validate', async (req, res) => {
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
app.post('/auth/google/revoke', async (req, res) => {
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

// Microsoft OAuth Endpoints using direct OAuth 2.0 calls

// Get Microsoft authorization URL
app.get('/auth/microsoft/url', (req, res) => {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
  const redirectUri = req.query.redirect_uri || 'http://localhost:3001/auth/microsoft/callback';
  const state = req.query.state || 'default_state';

  if (!clientId) {
    return res.status(400).json({
      success: false,
      error: 'Microsoft Client ID not configured'
    });
  }

  // Microsoft OAuth 2.0 authorization endpoint
  const authorizationUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
  
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'openid profile email User.Read offline_access',
    state: state,
    response_mode: 'query'
  });

  const authUrl = `${authorizationUrl}?${params.toString()}`;

  res.json({
    success: true,
    authUrl: authUrl,
    instructions: 'Redirect user to this URL to get authorization code',
    redirectUri: redirectUri,
    state: state
  });
});

// Exchange Microsoft authorization code for tokens
app.post('/auth/microsoft', async (req, res) => {
  const { code, redirectUri, state } = req.body;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';

  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Authorization code is required'
    });
  }

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      success: false,
      error: 'Microsoft OAuth credentials not configured'
    });
  }

  try {
    // Microsoft OAuth 2.0 token endpoint
    const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    
    const tokenData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri || 'http://localhost:3001/auth/microsoft/callback',
      grant_type: 'authorization_code',
      scope: 'openid profile email User.Read offline_access'
    });

    const response = await axios.post(tokenUrl, tokenData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const tokens = response.data;
    
    // Calculate expiry date
    const expiryDate = new Date(Date.now() + (tokens.expires_in * 1000));
    
    res.json({
      success: true,
      message: 'Successfully authenticated with Microsoft!',
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenType: tokens.token_type || 'Bearer',
        scope: tokens.scope,
        expiryDate: expiryDate.toISOString(),
        expiresIn: tokens.expires_in,
        idToken: tokens.id_token,
        state: state
      }
    });

  } catch (error) {
    console.error('Error exchanging Microsoft code for tokens:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to exchange authorization code',
      message: error.response?.data?.error_description || error.message,
      details: error.response?.data
    });
  }
});

// Refresh Microsoft access token using refresh token
app.post('/auth/microsoft/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Refresh token is required'
    });
  }

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      success: false,
      error: 'Microsoft OAuth credentials not configured'
    });
  }

  try {
    // Microsoft OAuth 2.0 token endpoint for refresh
    const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    
    const tokenData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: 'openid profile email User.Read offline_access'
    });

    const response = await axios.post(tokenUrl, tokenData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const tokens = response.data;
    
    // Calculate expiry date
    const expiryDate = new Date(Date.now() + (tokens.expires_in * 1000));

    res.json({
      success: true,
      message: 'Microsoft access token refreshed successfully!',
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || refreshToken, // Some responses don't include new refresh token
        tokenType: tokens.token_type || 'Bearer',
        expiryDate: expiryDate.toISOString(),
        expiresIn: tokens.expires_in,
        scope: tokens.scope
      }
    });

  } catch (error) {
    console.error('Error refreshing Microsoft access token:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh access token',
      message: error.response?.data?.error_description || error.message,
      details: error.response?.data
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
  console.log(`🔗 Google auth URL: http://localhost:${PORT}/auth/google/url`);
  console.log(`🔗 Microsoft auth URL: http://localhost:${PORT}/auth/microsoft/url`);
  
  // Google OAuth warnings
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.warn('⚠️  Warning: GOOGLE_CLIENT_ID not set in environment variables');
  }
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Warning: GOOGLE_CLIENT_SECRET not set in environment variables');
  }
  
  // Microsoft OAuth warnings
  if (!process.env.MICROSOFT_CLIENT_ID) {
    console.warn('⚠️  Warning: MICROSOFT_CLIENT_ID not set in environment variables');
  }
  if (!process.env.MICROSOFT_CLIENT_SECRET) {
    console.warn('⚠️  Warning: MICROSOFT_CLIENT_SECRET not set in environment variables');
  }
});

export default app;
