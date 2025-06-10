# Log Sink

A simple Node.js/Express/React service for creating temporary log endpoints. Perfect for debugging, webhooks, API testing, and collecting logs from applications.

## Features

- **Instant Log Pages**: Visit `/` to get redirected to a unique UUID-based log page
- **Owner Authentication**: First visitor gets encrypted bearer token stored in localStorage
- **Rich Content Formatting**: Automatic detection and formatting for JSON, HTML, Markdown, and plain text
- **Real-time Updates**: Pages automatically refresh to show new content
- **Individual Databases**: Each UUID gets its own SQLite database
- **Copy & Share**: Easy copy buttons for URLs and bearer tokens
- **Delete Protection**: Only owners can delete their log pages

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (backend on :3001, frontend on :3000)
npm run dev

# Or build and run production
npm run build
npm start
```

Visit `http://localhost:3000` to create your first log page.

## API Usage

Once you have a UUID page and bearer token, you can POST content to it:

### cURL Examples

**Basic text:**
```bash
curl -X POST http://localhost:3001/YOUR_UUID -H "Authorization: Bearer YOUR_BEARER_TOKEN" -H "Content-Type: text/plain" -d "Hello World"
```

**JSON payload:**
```bash
curl -X POST http://localhost:3001/YOUR_UUID -H "Authorization: Bearer YOUR_BEARER_TOKEN" -H "Content-Type: application/json" -d '{"user":"john","status":"active","data":[1,2,3]}'
```

**HTML content:**
```bash
curl -X POST http://localhost:3001/YOUR_UUID -H "Authorization: Bearer YOUR_BEARER_TOKEN" -H "Content-Type: text/html" -d "<h1>Test</h1><p>This is <strong>HTML</strong> content</p>"
```

**Markdown:**
```bash
curl -X POST http://localhost:3001/YOUR_UUID -H "Authorization: Bearer YOUR_BEARER_TOKEN" -H "Content-Type: text/markdown" -d "# Markdown Test

This is **bold** and this is *italic*.

\`\`\`javascript
console.log(\"code block\");
\`\`\`"
```

**Binary data or any content type:**
```bash
curl -X POST http://localhost:3001/YOUR_UUID -H "Authorization: Bearer YOUR_BEARER_TOKEN" --data-binary @file.txt
```

### JavaScript/Node.js Examples

**Basic fetch:**
```javascript
fetch(`http://localhost:3001/${uuid}`, {method: 'POST', headers: {'Authorization': `Bearer ${bearerToken}`, 'Content-Type': 'text/plain'}, body: 'Hello from JS'})
```

**Sending JSON objects:**
```javascript
fetch(`http://localhost:3001/${uuid}`, {method: 'POST', headers: {'Authorization': `Bearer ${bearerToken}`, 'Content-Type': 'application/json'}, body: JSON.stringify({user: 'alice', timestamp: Date.now(), data: {items: [1,2,3], status: 'ok'}})})
```

**Node.js with error handling:**
```javascript
const response = await fetch(`http://localhost:3001/${uuid}`, {method: 'POST', headers: {'Authorization': `Bearer ${bearerToken}`, 'Content-Type': 'application/json'}, body: JSON.stringify({error: 'Something went wrong', stack: error.stack, timestamp: new Date().toISOString()})}); console.log(await response.json());
```

**Sending HTML:**
```javascript
fetch(`http://localhost:3001/${uuid}`, {method: 'POST', headers: {'Authorization': `Bearer ${bearerToken}`, 'Content-Type': 'text/html'}, body: '<div class="alert"><h3>Alert</h3><p>Something happened at ' + new Date().toLocaleString() + '</p></div>'})
```

**Sending plain text with line breaks:**
```javascript
fetch(`http://localhost:3001/${uuid}`, {method: 'POST', headers: {'Authorization': `Bearer ${bearerToken}`, 'Content-Type': 'text/plain'}, body: 'Line 1\nLine 2\nLine 3'})
```

### Python Examples

**Basic requests:**
```python
import requests; requests.post(f'http://localhost:3001/{uuid}', data='Hello from Python', headers={'Authorization': f'Bearer {bearer_token}', 'Content-Type': 'text/plain'})
```

**Sending JSON objects:**
```python
import requests, json; requests.post(f'http://localhost:3001/{uuid}', json={'user': 'bob', 'scores': [85, 92, 78], 'metadata': {'timestamp': '2023-01-01', 'version': '1.0'}}, headers={'Authorization': f'Bearer {bearer_token}'})
```

**Debug logging:**
```python
import requests, json, traceback; requests.post(f'http://localhost:3001/{uuid}', json={'level': 'ERROR', 'message': 'Database connection failed', 'traceback': traceback.format_exc(), 'context': {'user_id': 123, 'request_id': 'abc-def'}}, headers={'Authorization': f'Bearer {bearer_token}'})
```

**Sending structured data:**
```python
import requests, json; data = {'users': [{'id': 1, 'name': 'Alice'}, {'id': 2, 'name': 'Bob'}], 'total': 2, 'page': 1}; requests.post(f'http://localhost:3001/{uuid}', data=json.dumps(data, indent=2), headers={'Authorization': f'Bearer {bearer_token}', 'Content-Type': 'application/json'})
```

**Sending plain text:**
```python
import requests; requests.post(f'http://localhost:3001/{uuid}', data='Line 1\nLine 2\nTab:\tvalue', headers={'Authorization': f'Bearer {bearer_token}', 'Content-Type': 'text/plain'})
```

### One-liner Templates

Replace `YOUR_UUID` and `YOUR_BEARER_TOKEN` with your actual values:

**cURL:**
```bash
curl -X POST http://localhost:3001/YOUR_UUID -H "Authorization: Bearer YOUR_BEARER_TOKEN" -d "YOUR_CONTENT"
```

**JavaScript:**
```javascript
fetch('http://localhost:3001/YOUR_UUID', {method: 'POST', headers: {'Authorization': 'Bearer YOUR_BEARER_TOKEN'}, body: 'YOUR_CONTENT'})
```

**Python:**
```python
import requests; requests.post('http://localhost:3001/YOUR_UUID', data='YOUR_CONTENT', headers={'Authorization': 'Bearer YOUR_BEARER_TOKEN'})
```

## Environment Variables

Create a `.env` file:

```
SECRET_KEY=your-secret-key-change-this-in-production
PORT=3001
```

## Use Cases

- **Webhook Testing**: Create a log page and use the URL as a webhook endpoint
- **API Debugging**: Log API responses and errors in real-time
- **Application Monitoring**: Send structured logs from your applications
- **Data Collection**: Collect form submissions or analytics data
- **Development**: Quick logging during development without setting up complex logging infrastructure

## Content Formatting

The service automatically detects and formats different content types:

- **JSON**: Collapsible tree view with syntax highlighting
- **HTML**: Switchable between rendered view and source code
- **Markdown**: Rendered with syntax highlighting for code blocks
- **Plain Text**: Preserved formatting with proper line breaks and tabs

## Security

- Bearer tokens are encrypted using AES encryption
- HTML content is sanitized before rendering
- Each UUID gets its own isolated database
- CORS is enabled for all origins (configure as needed for production)

## Production Deployment

1. Set a strong `SECRET_KEY` in your environment
2. Configure proper CORS origins for your domain
3. Set up reverse proxy (nginx) for SSL termination
4. Consider rate limiting for the POST endpoints

## API Endpoints

- `GET /` - Redirects to new UUID page
- `GET /:uuid` - Serves the React app for the UUID page
- `POST /:uuid` - Posts new content (requires Authorization header with bearer token)
- `DELETE /:uuid` - Deletes UUID database (requires Authorization header with bearer token)
- `POST /:uuid/bearer` - Generates bearer token for UUID
- `GET /:uuid/content` - Gets all content for UUID (used by React app)

## File Structure

```
├── server.js          # Express server
├── client/            # React frontend
├── dbs/              # SQLite databases (auto-created)
├── .env              # Environment variables
└── package.json      # Dependencies and scripts
```