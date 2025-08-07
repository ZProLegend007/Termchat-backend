const WebSocket = require('ws');

// Create two clients to test the chat functionality
const client1 = new WebSocket('ws://localhost:3000');
const client2 = new WebSocket('ws://localhost:3000');

let client1Messages = [];
let client2Messages = [];

client1.on('open', () => {
  console.log('Client 1 connected');
  // Join a room
  client1.send(JSON.stringify({
    type: 'join',
    username: 'Alice',
    chatname: 'testroom',
    password: 'testpass'
  }));
});

client1.on('message', (data) => {
  const message = JSON.parse(data.toString());
  client1Messages.push(message);
  console.log('Client 1 received:', message);
});

client2.on('open', () => {
  console.log('Client 2 connected');
  // Wait a bit then join the same room
  setTimeout(() => {
    client2.send(JSON.stringify({
      type: 'join',
      username: 'Bob',
      chatname: 'testroom',
      password: 'testpass'
    }));
  }, 500);
});

client2.on('message', (data) => {
  const message = JSON.parse(data.toString());
  client2Messages.push(message);
  console.log('Client 2 received:', message);
});

// Test slash commands after both users have joined
setTimeout(() => {
  console.log('\n--- Testing /help command ---');
  client1.send(JSON.stringify({
    type: 'message',
    content: '/help'
  }));
}, 1000);

setTimeout(() => {
  console.log('\n--- Testing /active command ---');
  client1.send(JSON.stringify({
    type: 'message',
    content: '/active'
  }));
}, 1500);

setTimeout(() => {
  console.log('\n--- Testing /roll command ---');
  client1.send(JSON.stringify({
    type: 'message',
    content: '/roll'
  }));
}, 2000);

setTimeout(() => {
  console.log('\n--- Testing regular message ---');
  client1.send(JSON.stringify({
    type: 'message',
    content: 'Hello everyone!'
  }));
}, 2500);

// Close connections after testing
setTimeout(() => {
  console.log('\n--- Summary ---');
  console.log('Client 1 messages:', client1Messages.length);
  console.log('Client 2 messages:', client2Messages.length);
  client1.close();
  client2.close();
  process.exit(0);
}, 3000);