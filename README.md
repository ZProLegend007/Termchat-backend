# Termchat Backend Server

A real-time WebSocket chat server for terminal-based chat applications, designed for Railway deployment.

## Features

- **Real-time messaging** via WebSocket connections
- **Isolated chat rooms** based on chatname + password combinations
- **HTTPS support** on port 443 for restricted networks
- **Join/leave notifications** ("A wild Username has appeared")
- **Message formatting** with username prefixes
- **Production-ready** error handling and connection management
- **Railway deployment** ready with proper port handling

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server will run on port 443 by default, or use the `PORT` environment variable for custom ports.

### Railway Deployment

1. Connect your GitHub repository to Railway
2. Deploy automatically - no additional configuration needed
3. Railway will handle HTTPS termination and port assignment

## WebSocket API

### Connect
```javascript
const ws = new WebSocket('wss://your-server.railway.app');
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
