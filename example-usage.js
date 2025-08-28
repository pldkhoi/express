// Example usage of the Google OAuth Express server
// This demonstrates the complete flow from getting authorization URL to using refresh tokens

const API_BASE = 'http://localhost:3001';

// Step 1: Get the authorization URL
async function getAuthorizationUrl() {
  try {
    const response = await fetch(`${API_BASE}/auth/url`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Authorization URL generated:');
      console.log(data.authUrl);
      console.log('\n📝 Instructions:');
      console.log('1. Open this URL in your browser');
      console.log('2. Complete Google OAuth flow');
      console.log('3. Copy the authorization code from the response');
      console.log('4. Use exchangeCodeForTokens() function with the code\n');
      return data.authUrl;
    } else {
      console.error('❌ Failed to get authorization URL:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    return null;
  }
}

// Step 2: Exchange authorization code for tokens
async function exchangeCodeForTokens(authorizationCode) {
  try {
    const response = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: authorizationCode
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Successfully exchanged code for tokens!');
      console.log('📋 Token Information:');
      console.log(`   Access Token: ${data.data.accessToken?.substring(0, 20)}...`);
      console.log(`   Refresh Token: ${data.data.refreshToken ? data.data.refreshToken.substring(0, 20) + '...' : 'Not provided'}`);
      console.log(`   Token Type: ${data.data.tokenType}`);
      console.log(`   Scope: ${data.data.scope}`);
      console.log(`   Expires At: ${data.data.expiresAt}`);
      
      // Store these tokens securely in your application
      return data.data;
    } else {
      console.error('❌ Failed to exchange code:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    return null;
  }
}

// Step 3: Use refresh token to get new access token
async function refreshAccessToken(refreshToken) {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: refreshToken
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Successfully refreshed access token!');
      console.log('📋 New Token Information:');
      console.log(`   New Access Token: ${data.data.accessToken?.substring(0, 20)}...`);
      console.log(`   Token Type: ${data.data.tokenType}`);
      console.log(`   Expires At: ${data.data.expiresAt}`);
      
      return data.data;
    } else {
      console.error('❌ Failed to refresh token:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    return null;
  }
}

// Step 4: Validate access token
async function validateAccessToken(accessToken) {
  try {
    const response = await fetch(`${API_BASE}/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken: accessToken
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Token is valid!');
      console.log('👤 User Information:');
      console.log(`   Email: ${data.data.email}`);
      console.log(`   Email Verified: ${data.data.emailVerified}`);
      console.log(`   Scope: ${data.data.scope}`);
      console.log(`   Expires In: ${data.data.expiresIn} seconds`);
      
      return data.data;
    } else {
      console.error('❌ Token validation failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    return null;
  }
}

// Step 5: Revoke token
async function revokeToken(token) {
  try {
    const response = await fetch(`${API_BASE}/auth/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Token revoked successfully!');
      return true;
    } else {
      console.error('❌ Failed to revoke token:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    return false;
  }
}

// Complete example flow
async function completeOAuthFlow() {
  console.log('🚀 Starting Google OAuth Flow Example\n');
  
  // Step 1: Get authorization URL
  const authUrl = await getAuthorizationUrl();
  
  if (authUrl) {
    console.log('🔗 Next steps:');
    console.log('1. Visit the authorization URL above');
    console.log('2. Complete the OAuth flow');
    console.log('3. Get the authorization code');
    console.log('4. Use the exchangeCodeForTokens() function\n');
    
    console.log('💡 Example usage after getting the code:');
    console.log(`
const tokens = await exchangeCodeForTokens('your_auth_code_here');
if (tokens && tokens.refreshToken) {
  // Later, when access token expires:
  const newTokens = await refreshAccessToken(tokens.refreshToken);
}
    `);
  }
}

// Export functions for use in other modules
export {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  validateAccessToken,
  revokeToken,
  completeOAuthFlow
};

// Run example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  completeOAuthFlow();
}
