const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

//path
const path=require('path')

// Import node-fetch correctly
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

//date and time
const date=new Date()


// Simple chatbot endpoint (Option 2)
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    console.log('Received message:', message);

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Simple AI responses
    const lowerMessage = message.toLowerCase();
    let aiResponse = "I'm your AI assistant. How can I help you today?";

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
    }else if (lowerMessage.includes('date') && lowerMessage.includes('time')) {
      aiResponse = `Today date is : ${date.toLocaleDateString()} and currnt time is: ${date.toLocaleTimeString()}`;
    } else if (lowerMessage.includes('time')) {
      aiResponse = `Currnt time is: ${date.toLocaleTimeString()}`;
    }else if (lowerMessage.includes('date') ) {
      aiResponse = `Today date is : ${date.toLocaleDateString()} `;
    } else {
      aiResponse = `I understand you're saying: "${message}". That's interesting! Can you tell me more?`;
    }

    console.log('Sending AI response:', aiResponse);
    res.json({ message: aiResponse });

  } catch (error) {
    console.error('Error:', error);
    res.json({ message: "Hello! I'm here to help. What would you like to know?" });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is healthy', timestamp: new Date().toISOString() });
});

app.get('*',function (req,res){
  res.sendFile(path.join(__dirname,'../FrontEnd/vite-project/dict','index.html'))
 
})
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

