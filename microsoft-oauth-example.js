// Microsoft OAuth Direct API Usage Example
// This demonstrates how to use the Microsoft OAuth endpoints with direct OAuth 2.0 calls

const baseUrl = 'http://localhost:3001';

// Example: Get Microsoft Authorization URL
async function getMicrosoftAuthUrl(redirectUri = 'http://localhost:3001/auth/microsoft/callback', state = 'random_state_123') {
  try {
    const response = await fetch(`${baseUrl}/auth/microsoft/url?redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Microsoft Auth URL Generated Successfully:');
      console.log('🔗 Authorization URL:', data.authUrl);
      console.log('📍 Redirect URI:', data.redirectUri);
      console.log('🔒 State:', data.state);
      console.log('📝 Instructions:', data.instructions);
      return data;
    } else {
      console.error('❌ Error getting auth URL:', data.error);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Example: Exchange Authorization Code for Tokens
async function exchangeMicrosoftCode(authorizationCode, redirectUri = 'http://localhost:3001/auth/microsoft/callback', state = null) {
  try {
    const response = await fetch(`${baseUrl}/auth/microsoft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: authorizationCode,
        redirectUri: redirectUri,
        state: state
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Microsoft OAuth Token Exchange Successful!');
      console.log('🔑 Access Token:', data.data.accessToken.substring(0, 50) + '...');
      console.log('🔄 Refresh Token:', data.data.refreshToken ? data.data.refreshToken.substring(0, 50) + '...' : 'Not provided');
      console.log('🎫 Token Type:', data.data.tokenType);
      console.log('⏰ Expires In:', data.data.expiresIn, 'seconds');
      console.log('📅 Expiry Date:', data.data.expiryDate);
      console.log('🎯 Scope:', data.data.scope);
      console.log('🆔 ID Token:', data.data.idToken ? 'Provided' : 'Not provided');
      
      return {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        expiryDate: data.data.expiryDate,
        tokenType: data.data.tokenType,
        scope: data.data.scope,
        idToken: data.data.idToken
      };
    } else {
      console.error('❌ Error exchanging code:', data.error);
      console.error('📄 Details:', data.details);
      console.error('💬 Message:', data.message);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Example: Refresh Access Token
async function refreshMicrosoftToken(refreshToken) {
  try {
    const response = await fetch(`${baseUrl}/auth/microsoft/refresh`, {
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
      console.log('✅ Microsoft Token Refresh Successful!');
      console.log('🔑 New Access Token:', data.data.accessToken.substring(0, 50) + '...');
      console.log('🔄 Refresh Token:', data.data.refreshToken ? data.data.refreshToken.substring(0, 50) + '...' : 'Same as before');
      console.log('⏰ Expires In:', data.data.expiresIn, 'seconds');
      console.log('📅 New Expiry Date:', data.data.expiryDate);
      console.log('🎯 Scope:', data.data.scope);
      
      return {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        expiryDate: data.data.expiryDate
      };
    } else {
      console.error('❌ Error refreshing token:', data.error);
      console.error('📄 Details:', data.details);
      console.error('💬 Message:', data.message);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Example: Use Access Token to call Microsoft Graph API
async function getUserProfileFromMicrosoft(accessToken) {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const userData = await response.json();
      console.log('✅ Microsoft Graph User Profile Retrieved:');
      console.log('👤 Display Name:', userData.displayName);
      console.log('📧 Email:', userData.mail || userData.userPrincipalName);
      console.log('🆔 User ID:', userData.id);
      console.log('🏢 Job Title:', userData.jobTitle || 'Not specified');
      console.log('🏢 Company:', userData.companyName || 'Not specified');
      return userData;
    } else {
      const errorData = await response.text();
      console.error('❌ Error fetching user profile:', response.status, response.statusText);
      console.error('📄 Error details:', errorData);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Complete OAuth Flow Example
async function completeMicrosoftOAuthFlow() {
  console.log('🚀 Microsoft OAuth 2.0 Direct API Flow Example\n');
  console.log('Using Microsoft OAuth 2.0 endpoints:');
  console.log('📡 Authorization: https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
  console.log('🎫 Token Exchange: https://login.microsoftonline.com/common/oauth2/v2.0/token\n');
  
  // Step 1: Get authorization URL
  console.log('Step 1: Getting Microsoft authorization URL...');
  const authData = await getMicrosoftAuthUrl();
  
  if (authData && authData.success) {
    console.log('\n📋 To complete the OAuth flow:');
    console.log('1. Copy the authorization URL above');
    console.log('2. Open it in your browser');
    console.log('3. Sign in with your Microsoft account');
    console.log('4. Grant the requested permissions');
    console.log('5. Copy the "code" parameter from the callback URL');
    console.log('6. Use exchangeMicrosoftCode(authorizationCode) to get tokens');
    console.log('7. Use refreshMicrosoftToken(refreshToken) to refresh when needed');
    console.log('8. Use getUserProfileFromMicrosoft(accessToken) to test the access token\n');

    console.log('💡 Example callback URL format:');
    console.log('http://localhost:3001/auth/microsoft/callback?code=AUTHORIZATION_CODE&state=random_state_123\n');
    
    console.log('🔧 Required scopes in this implementation:');
    console.log('• openid - OpenID Connect authentication');
    console.log('• profile - Basic profile information');
    console.log('• email - Email address');
    console.log('• User.Read - Read user profile from Microsoft Graph');
    console.log('• offline_access - Refresh token capability\n');
  }
}

// Test with actual authorization code (if provided)
async function testWithAuthCode(authCode, redirectUri) {
  if (!authCode) {
    console.log('❌ No authorization code provided. Please run completeMicrosoftOAuthFlow() first.');
    return;
  }

  console.log('🧪 Testing complete OAuth flow with provided code...\n');
  
  // Exchange code for tokens
  const tokens = await exchangeMicrosoftCode(authCode, redirectUri);
  
  if (tokens && tokens.accessToken) {
    console.log('\n🧪 Testing access token with Microsoft Graph API...');
    await getUserProfileFromMicrosoft(tokens.accessToken);
    
    if (tokens.refreshToken) {
      console.log('\n🧪 Testing refresh token...');
      await refreshMicrosoftToken(tokens.refreshToken);
    }
  }
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getMicrosoftAuthUrl,
    exchangeMicrosoftCode,
    refreshMicrosoftToken,
    getUserProfileFromMicrosoft,
    completeMicrosoftOAuthFlow,
    testWithAuthCode
  };
}

// Run example if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  // Check if authorization code was passed as command line argument
  const authCode = process.argv[2];
  const redirectUri = process.argv[3] || 'http://localhost:3001/auth/microsoft/callback';
  
  if (authCode) {
    testWithAuthCode(authCode, redirectUri);
  } else {
    completeMicrosoftOAuthFlow();
  }
}

// Additional utilities
console.log('\n📚 Additional API endpoints you can test:');
console.log('GET  /auth/microsoft/url - Get authorization URL');
console.log('POST /auth/microsoft - Exchange code for tokens');
console.log('POST /auth/microsoft/refresh - Refresh access token');
console.log('\n🔗 Microsoft Graph API endpoints you can try:');
console.log('• GET https://graph.microsoft.com/v1.0/me - User profile');
console.log('• GET https://graph.microsoft.com/v1.0/me/photo/$value - Profile photo');
console.log('• GET https://graph.microsoft.com/v1.0/me/messages - Recent emails');
console.log('• GET https://graph.microsoft.com/v1.0/me/calendars - Calendars');
console.log('• GET https://graph.microsoft.com/v1.0/me/drive - OneDrive files');
