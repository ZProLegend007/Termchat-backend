# Termchat Backend Server

A real-time WebSocket chat server for terminal-based chat applications, optimized for Render deployment.

## Features

- **Real-time messaging** via WebSocket connections
- **Isolated chat rooms** based on chatname + password combinations
- **Secure HTTPS** support with flexible port configuration
- **Join/leave notifications** ("A wild Username has appeared")
- **Message formatting** with username prefixes
- **Production-ready** error handling and connection management
- **Render deployment** optimized with proper port handling

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server will run on port 3000 by default, or use the `PORT` environment variable for custom ports.

### Render Deployment

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Render will automatically detect the Node.js application
4. Set the build command to `npm install`
5. Set the start command to `npm start`
6. Deploy - Render will handle HTTPS termination and port assignment automatically

## WebSocket API

### Connect
```javascript
const ws = new WebSocket('wss://your-app.onrender.com');
```

### Join a Room
```javascript
ws.send(JSON.stringify({
  type: 'join',
  username: 'YourUsername',
  chatname: 'room-name',
  password: 'room-password'
}));
```

### Send a Message
```javascript
ws.send(JSON.stringify({
  type: 'message',
  content: 'Hello, world!'
}));
```

### Message Types Received

- **Join notification**: `{"type": "join", "username": "Username"}`
- **Chat message**: `{"type": "message", "username": "Username", "content": "message"}`
- **Leave notification**: `{"type": "leave", "username": "Username"}`
- **Error**: `{"type": "error", "message": "Error description"}`

## Architecture

- **Express.js** for HTTP endpoints and health checks
- **ws library** for WebSocket handling
- **Crypto** for secure room hashing (chatname + password)
- **In-memory storage** for active connections and rooms
- **Graceful shutdown** handling for production deployments

## Health Endpoints

- `GET /` - Server status and active room count
- `GET /health` - Health check for monitoring

## Security

- Room access controlled by hashed chatname + password combinations
- No message persistence - all data is ephemeral
- Clean connection management and resource cleanup
