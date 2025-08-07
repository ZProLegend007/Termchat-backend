const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');
const http = require('http');

// Initialize Express app
const app = express();
const port = process.env.PORT || 443; // MUST BE HTTPS as to allow in restricted networks

// Create HTTP server (Render handles HTTPS termination)
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// In-memory storage for chat rooms and connections
// Structure: { roomHash: { connections: Set<WebSocket>, users: Map<WebSocket, username> } }
const chatRooms = new Map();

// Utility function to create room hash from chatname + password
function createRoomHash(chatname, password) {
  return crypto.createHash('sha256').update(`${chatname}:${password}`).digest('hex');
}

// Utility function to broadcast message to all users in a room
function broadcastToRoom(roomHash, message, excludeConnection = null) {
  const room = chatRooms.get(roomHash);
  if (!room) return;

  const messageString = JSON.stringify(message);
  room.connections.forEach(connection => {
    if (connection !== excludeConnection && connection.readyState === WebSocket.OPEN) {
      connection.send(messageString);
    }
  });
}

// Utility function to clean up user from room
function removeUserFromRoom(ws) {
  for (const [roomHash, room] of chatRooms.entries()) {
    if (room.connections.has(ws)) {
      const username = room.users.get(ws);
      room.connections.delete(ws);
      room.users.delete(ws);

      // Broadcast leave notification
      if (username) {
        broadcastToRoom(roomHash, {
          type: 'leave',
          username: username
        });
      }

      // Clean up empty rooms
      if (room.connections.size === 0) {
        chatRooms.delete(roomHash);
      }
      break;
    }
  }
}

// Basic health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Termchat Backend Server Running',
    activeRooms: chatRooms.size,
    timestamp: new Date().toISOString()
  });
});

// Health check for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  
  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'join':
          handleJoinRoom(ws, message);
          break;
          
        case 'message':
          handleChatMessage(ws, message);
          break;
          
        default:
          console.log('Unknown message type:', message.type);
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });
  
  // Handle connection close
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    removeUserFromRoom(ws);
  });
  
  // Handle connection errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    removeUserFromRoom(ws);
  });
});

// Handle join room requests
function handleJoinRoom(ws, message) {
  const { username, chatname, password } = message;
  
  // Validate required fields
  if (!username || !chatname || !password) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Username, chatname, and password are required'
    }));
    return;
  }
  
  // Remove user from any existing room first
  removeUserFromRoom(ws);
  
  // Create room hash
  const roomHash = createRoomHash(chatname, password);
  
  // Initialize room if it doesn't exist
  if (!chatRooms.has(roomHash)) {
    chatRooms.set(roomHash, {
      connections: new Set(),
      users: new Map()
    });
  }
  
  const room = chatRooms.get(roomHash);
  
  // Add user to room
  room.connections.add(ws);
  room.users.set(ws, username);
  
  // Send join confirmation to the joining user
  ws.send(JSON.stringify({
    type: 'join',
    username: username
  }));
  
  // Broadcast join notification to all other users in the room
  broadcastToRoom(roomHash, {
    type: 'join',
    username: username
  }, ws);
  
  console.log(`User ${username} joined room ${chatname}`);
}

// Handle chat messages
function handleChatMessage(ws, message) {
  const { content } = message;
  
  if (!content || content.trim() === '') {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Message content cannot be empty'
    }));
    return;
  }
  
  // Find the room this user belongs to
  for (const [roomHash, room] of chatRooms.entries()) {
    if (room.connections.has(ws)) {
      const username = room.users.get(ws);
      
      // Broadcast message to all users in the room (including sender)
      broadcastToRoom(roomHash, {
        type: 'message',
        username: username,
        content: content
      });
      
      console.log(`Message from ${username}: ${content}`);
      return;
    }
  }
  
  // User not in any room
  ws.send(JSON.stringify({
    type: 'error',
    message: 'You must join a room before sending messages'
  }));
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Termchat backend server running on port ${port}`);
  console.log(`WebSocket server ready for connections`);
});

module.exports = { app, server, wss };
