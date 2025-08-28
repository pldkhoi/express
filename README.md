# Express Google OAuth Server

A complete Express.js server that handles Google OAuth2 authentication and refresh token management.

## Features

- 🔐 Google OAuth2 authentication
- 🔄 Refresh token support
- ✅ Token validation
- 🚫 Token revocation
- 🌐 CORS enabled
- 📋 Comprehensive error handling
- 🔧 Environment variable configuration

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file:
```bash
cp env.example .env
```

Edit `.env` and add your Google OAuth credentials:
```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
PORT=3001
```

### 3. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized redirect URI: `postmessage`
7. Copy the Client ID and Client Secret to your `.env` file

### 4. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Health Check
```http
GET /
```

### Get Authorization URL
```http
GET /auth/url
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "instructions": "Redirect user to this URL to get authorization code"
}
```

### Exchange Code for Tokens
```http
POST /auth/google
Content-Type: application/json

{
  "code": "authorization_code_from_google"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully authenticated with Google!",
  "data": {
    "accessToken": "ya29.a0ARrd...",
    "refreshToken": "1//04...",
    "tokenType": "Bearer",
    "scope": "openid email profile",
    "expiresAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Refresh Access Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token_here"
}
```

### Validate Access Token
```http
POST /auth/validate
Content-Type: application/json

{
  "accessToken": "your_access_token_here"
}
```

### Revoke Token
```http
POST /auth/revoke
Content-Type: application/json

{
  "token": "token_to_revoke"
}
```

## Usage Example

### Step 1: Get Authorization URL
```bash
curl http://localhost:3000/auth/url
```

### Step 2: Redirect User
Redirect the user to the returned `authUrl`. After they authorize, Google will provide an authorization code.

### Step 3: Exchange Code for Tokens
```bash
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{"code": "your_authorization_code"}'
```

### Step 4: Use Refresh Token (when access token expires)
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your_refresh_token"}'
```

## Important Notes for Refresh Tokens

To ensure you receive refresh tokens:

1. **Include `access_type=offline`** in your authorization request (automatically handled)
2. **Include `prompt=consent`** to force consent screen (automatically handled)
3. **First-time authorization**: Refresh tokens are only provided on the first authorization or when `prompt=consent` is used

## Project Structure

```
express/
├── server.js           # Main Express server
├── package.json        # Dependencies and scripts
├── env.example         # Environment variables template
└── README.md          # This documentation
```

## Dependencies

- **express**: Web framework
- **google-auth-library**: Google OAuth2 client
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management
- **nodemon**: Development auto-restart (dev dependency)

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Security Notes

- Store refresh tokens securely in your database
- Never expose client secrets in frontend code
- Use HTTPS in production
- Implement proper user session management
- Consider token rotation policies

## Development

The server includes comprehensive logging and error handling. Check the console for detailed information about token exchanges and errors.

## License

MIT