# Microsoft OAuth 2.0 Direct API Implementation

This implementation uses direct HTTP calls to Microsoft OAuth 2.0 endpoints for authentication, providing access tokens, refresh tokens, and expiry information.

## Microsoft OAuth 2.0 Endpoints Used

- **Authorization URL**: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
- **Token Exchange URL**: `https://login.microsoftonline.com/common/oauth2/v2.0/token`

## Quick Setup

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Microsoft OAuth Configuration
MICROSOFT_CLIENT_ID=your-microsoft-client-id-here
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret-here
MICROSOFT_TENANT_ID=common
```

### 2. Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com/) → Azure Active Directory → App registrations
2. Click "New registration"
3. Configure:
   - **Name**: Your app name
   - **Supported account types**: Multi-tenant + personal Microsoft accounts
   - **Redirect URI**: `http://localhost:3001/auth/microsoft/callback`
4. Copy the **Application (client) ID** and **Directory (tenant) ID**
5. Create a **Client Secret** in "Certificates & secrets"
6. Add API permissions: `openid`, `profile`, `email`, `User.Read`, `offline_access`

## API Endpoints

### Get Authorization URL
```http
GET /auth/microsoft/url?redirect_uri=http://localhost:3001/auth/microsoft/callback&state=random_state
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=...",
  "instructions": "Redirect user to this URL to get authorization code",
  "redirectUri": "http://localhost:3001/auth/microsoft/callback",
  "state": "random_state"
}
```

### Exchange Code for Tokens
```http
POST /auth/microsoft
Content-Type: application/json

{
  "code": "authorization_code_from_callback",
  "redirectUri": "http://localhost:3001/auth/microsoft/callback",
  "state": "random_state"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully authenticated with Microsoft!",
  "data": {
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...",
    "refreshToken": "0.AXoA-HgOZwt5vEOJp0Uv...",
    "tokenType": "Bearer",
    "scope": "openid profile email User.Read offline_access",
    "expiryDate": "2024-01-15T10:30:00.000Z",
    "expiresIn": 3600,
    "idToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...",
    "state": "random_state"
  }
}
```

### Refresh Access Token
```http
POST /auth/microsoft/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Microsoft access token refreshed successfully!",
  "data": {
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...",
    "refreshToken": "0.AXoA-HgOZwt5vEOJp0Uv...",
    "tokenType": "Bearer",
    "expiryDate": "2024-01-15T11:30:00.000Z",
    "expiresIn": 3600,
    "scope": "openid profile email User.Read offline_access"
  }
}
```

## OAuth 2.0 Flow

1. **Get Authorization URL**: `GET /auth/microsoft/url`
2. **Redirect User**: Send user to the returned authorization URL
3. **User Authorizes**: User signs in and grants permissions
4. **Receive Code**: Microsoft redirects back with authorization code
5. **Exchange Code**: `POST /auth/microsoft` with the authorization code
6. **Store Tokens**: Save access token, refresh token, and expiry date
7. **Use Access Token**: Make Microsoft Graph API calls
8. **Refresh When Needed**: Use refresh token to get new access token

## Using Access Tokens

```javascript
// Get user profile from Microsoft Graph
const response = await fetch('https://graph.microsoft.com/v1.0/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

const userProfile = await response.json();
```

## Testing

### Run the Example
```bash
# Get authorization URL
node microsoft-oauth-example.js

# Test with authorization code (after getting it from browser)
node microsoft-oauth-example.js "your_authorization_code_here"
```

### Test the Server
```bash
npm install
npm start

# Server will be available at:
# - Health check: http://localhost:3001
# - Microsoft auth URL: http://localhost:3001/auth/microsoft/url
```

## Key Features

✅ **Direct OAuth 2.0 calls** - No external libraries needed  
✅ **Access tokens** - For API authentication  
✅ **Refresh tokens** - For token renewal without re-authentication  
✅ **Expiry tracking** - Know exactly when tokens expire  
✅ **State parameter** - CSRF protection  
✅ **Error handling** - Detailed error responses  
✅ **Multiple scopes** - Access to user profile and Microsoft Graph  

## Common Microsoft Graph Endpoints

- `GET /v1.0/me` - User profile
- `GET /v1.0/me/photo/$value` - Profile photo
- `GET /v1.0/me/messages` - Emails
- `GET /v1.0/me/calendars` - Calendar access
- `GET /v1.0/me/drive` - OneDrive files

## Security Notes

- Always use HTTPS in production
- Store refresh tokens securely (encrypted)
- Validate state parameters
- Monitor token expiration
- Implement proper error handling
- Use appropriate scopes only

## Troubleshooting

1. **"Invalid client"** - Check client ID and secret
2. **"Redirect URI mismatch"** - Ensure URI matches Azure registration
3. **"Invalid scope"** - Verify requested scopes are granted in Azure
4. **Token refresh fails** - Check if refresh token is valid and not expired

The implementation provides all the essential OAuth 2.0 functionality you need for Microsoft account authentication with proper token management!
