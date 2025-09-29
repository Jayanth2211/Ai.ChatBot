const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Try to serve static files
const distPath = path.join(__dirname, '../FrontEnd/vite-project/dist');
console.log('Looking for dist at:', distPath);

if (fs.existsSync(distPath)) {
  console.log('Serving from dist folder');
  app.use(express.static(distPath));
} else {
  console.log(' Dist folder not found, serving basic HTML');
}

// Your API routes (keep your existing chat endpoint)
app.post('/api/chat', async (req, res) => {
  // Your existing chat code here
  try {
    const { message } = req.body;
    console.log('Received message:', message);

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const lowerMessage = message.toLowerCase();
    let aiResponse = "I'm your AI assistant. How can I help you today?";
    const date = new Date();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      aiResponse = "Hello! 👋 How can I assist you today?";
    } else if (lowerMessage.includes('how are you')) {
      aiResponse = "I'm doing great! Ready to help you with anything you need. 😊";
    } else if (lowerMessage.includes('thank')) {
      aiResponse = "You're welcome! Is there anything else I can help with?";
    } else if (lowerMessage.includes('name')) {
      aiResponse = "I'm Progskill AI Assistant! Nice to meet you!";
    } else if (lowerMessage.includes('help')) {
      aiResponse = "I can answer questions, chat with you, or help with various topics. What would you like to know?";
    } else if (lowerMessage.includes('date') && lowerMessage.includes('time')) {
      aiResponse = `Today date is : ${date.toLocaleDateString('en-IN',{timeZone:"Asia/Kolkata"})} and current time is: ${date.toLocaleTimeString('en-IN',{timeZone:"Asia/Kolkata"})}`;
    } else if (lowerMessage.includes('time')) {
      aiResponse = `Current time is: ${date.toLocaleTimeString('en-IN',{timeZone:"Asia/Kolkata"})}`;
    } else if (lowerMessage.includes('date')) {
      aiResponse = `Today date is : ${date.toLocaleDateString('en-IN',{timeZone:"Asia/Kolkata"})} `;
    } else {
      aiResponse = `I understand you're saying: "${message}". That's interesting! Can you tell me more?`;
    }

    res.json({ message: aiResponse });

  } catch (error) {
    console.error('Error:', error);
    res.json({ message: "Hello! I'm here to help. What would you like to know?" });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is healthy', 
    timestamp: new Date().toISOString(),
    distExists: fs.existsSync(distPath)
  });
});

// Serve frontend or basic HTML
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Serve basic HTML if dist doesn't exist
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AI Chatbot</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .chat-container { border: 1px solid #ccc; padding: 20px; border-radius: 10px; }
            .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
            .user { background: #007bff; color: white; text-align: right; }
            .bot { background: #f8f9fa; color: black; }
          </style>
        </head>
        <body>
          <h1>AI Chatbot</h1>
          <div class="chat-container">
            <div id="chat"></div>
            <input type="text" id="message" placeholder="Type your message..." style="width: 70%; padding: 10px;">
            <button onclick="sendMessage()" style="padding: 10px 20px;">Send</button>
          </div>
          
          <script>
            async function sendMessage() {
              const message = document.getElementById('message').value;
              if (!message) return;
              
              const chat = document.getElementById('chat');
              chat.innerHTML += '<div class="message user">' + message + '</div>';
              
              document.getElementById('message').value = '';
              
              try {
                const response = await fetch('/api/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ message })
                });
                const data = await response.json();
                chat.innerHTML += '<div class="message bot">' + data.message + '</div>';
              } catch (error) {
                chat.innerHTML += '<div class="message bot">Error: Could not connect to server</div>';
              }
            }
            
            document.getElementById('message').addEventListener('keypress', function(e) {
              if (e.key === 'Enter') sendMessage();
            });
          </script>
        </body>
      </html>
    `);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});