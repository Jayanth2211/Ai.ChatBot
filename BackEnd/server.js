const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const geoip = require('geoip-lite');
const requestIp = require('request-ip');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

dotenv.config();
const app = express();

// Security middleware
app.use(helmet());
// Update CORS to allow Vite frontend
app.use(cors());
app.use(express.json());
app.use(requestIp.mw());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Try to serve static files
const distPath = path.join(__dirname, '../FrontEnd/vite-project/dist');
console.log('Looking for dist at:', distPath);

if (fs.existsSync(distPath)) {
  console.log('Serving from dist folder');
  app.use(express.static(distPath));
} else {
  console.log(' Dist folder not found, serving basic HTML');
}

// ========== LOCATION SERVICES ========== //

// Utility function for reverse geocoding
// Simple reverse geocoding function
// Reliable reverse geocoding function
// Alternative using PositionStack (free 25k requests/month)
const reverseGeocode = async (latitude, longitude) => {
  try {
    // You can get free API key from positionstack.com
    const API_KEY = 'YOUR_FREE_API_KEY'; // Get from positionstack.com
    const response = await fetch(
      `http://api.positionstack.com/v1/reverse?access_key=${API_KEY}&query=${latitude},${longitude}`
    );
    
    const data = await response.json();
    
    if (data && data.data && data.data[0]) {
      const location = data.data[0];
      return {
        success: true,
        address: location.label,
        details: {
          area: location.neighbourhood || location.locality,
          locality: location.locality,
          city: location.locality,
          state: location.region,
          country: location.country,
          postcode: location.postal_code
        }
      };
    }
    
  } catch (error) {
    console.log('PositionStack error:', error.message);
  }
  
  // Final fallback
  return {
    success: true,
    address: `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    details: {
      latitude: latitude,
      longitude: longitude
    }
  };
};

// Utility function for IP location
const getEnhancedIPLocation = async (ip) => {
  try {
    // Handle localhost IPs
    let testIP = ip;
    if (ip === '::1' || ip === '127.0.0.1') {
      // Use a public IP for testing or fetch external IP
      try {
        const externalIPResponse = await axios.get('https://api.ipify.org?format=json');
        testIP = externalIPResponse.data.ip;
      } catch {
        testIP = '8.8.8.8'; // Fallback to Google DNS
      }
    }

    // Get IP details from ipapi.co
    const ipResponse = await axios.get(`https://ipapi.co/${testIP}/json/`);
    const ipData = ipResponse.data;

    return {
      success: true,
      ip: ip,
      public_ip: testIP,
      city: ipData.city,
      region: ipData.region,
      country: ipData.country_name,
      country_code: ipData.country_code,
      latitude: ipData.latitude,
      longitude: ipData.longitude,
      timezone: ipData.timezone,
      isp: ipData.org,
      postal: ipData.postal,
      area: `${ipData.city}, ${ipData.region}, ${ipData.country_name}`,
      full_address: `${ipData.city}, ${ipData.region}, ${ipData.country_name} - ${ipData.postal}`
    };
  } catch (error) {
    // Fallback to geoip-lite if external service fails
    const geo = geoip.lookup(ip);
    if (geo) {
      return {
        success: true,
        ip: ip,
        city: geo.city,
        region: geo.region,
        country: geo.country,
        latitude: geo.ll[0],
        longitude: geo.ll[1],
        timezone: geo.timezone,
        area: `${geo.city}, ${geo.region}, ${geo.country}`,
        source: 'geoip-lite'
      };
    }
    
    return {
      success: false,
      error: 'Failed to fetch IP location'
    };
  }
};

// ========== LOCATION API ROUTES ========== //

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is healthy', 
    timestamp: new Date().toISOString(),
    distExists: fs.existsSync(distPath),
    service: 'Orvix AI Backend with Location Services'
  });
});

// Basic IP location (simple)
app.get('/api/location/ip', (req, res) => {
  try {
    const clientIP = req.clientIp;
    const geo = geoip.lookup(clientIP);
    
    res.json({
      ip: clientIP,
      country: geo?.country,
      region: geo?.region,
      city: geo?.city,
      latitude: geo?.ll?.[0],
      longitude: geo?.ll?.[1],
      timezone: geo?.timezone
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

// Enhanced IP location with area names
app.get('/api/location/ip-enhanced', async (req, res) => {
  try {
    const clientIP = req.clientIp;
    const ipLocation = await getEnhancedIPLocation(clientIP);
    
    if (ipLocation.success) {
      res.json(ipLocation);
    } else {
      res.status(500).json({ error: ipLocation.error });
    }
  } catch (error) {
    console.error('Enhanced IP location error:', error);
    res.status(500).json({ error: 'Failed to fetch enhanced location' });
  }
});

// Reverse geocoding - coordinates to address
app.get('/api/location/reverse-geocode', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }


    const geocodeResult = await reverseGeocode(latitude, longitude);
    
    if (geocodeResult.success) {
      res.json({
        coordinates: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
        ...geocodeResult
      });
    } else {
      res.status(500).json({ error: geocodeResult.error });
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ error: 'Reverse geocoding failed' });
  }
});

// Device location storage with reverse geocoding
// Device location storage with reverse geocoding
app.post('/api/location/device', async (req, res) => {
  try {
    const { latitude, longitude, accuracy, timestamp = new Date().toISOString() } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Get address from coordinates
    const geocodeResult = await reverseGeocode(latitude, longitude);
    
    const locationData = {
      coordinates: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null
      },
      timestamp,
      ...geocodeResult
    };

    console.log('Device location received:', locationData);

    res.json({
      success: true,
      message: 'Location received and processed',
      data: locationData
    });
    
  } catch (error) {
    console.error('Device location error:', error);
    
    // Even if error, return the coordinates
    res.json({
      success: true,
      message: 'Location received (address lookup failed)',
      data: {
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          accuracy: accuracy ? parseFloat(accuracy) : null
        },
        timestamp: new Date().toISOString(),
        success: true,
        address: `Location: ${latitude}, ${longitude}`,
        details: {
          latitude: latitude,
          longitude: longitude
        }
      }
    });
  }
});

// Complete location info (IP + reverse geocode if coordinates provided)
app.get('/api/location/complete', async (req, res) => {
  try {
    const clientIP = req.clientIp;
    const { latitude, longitude } = req.query;
    
    // Get IP location
    const ipLocation = await getEnhancedIPLocation(clientIP);
    
    let deviceLocation = null;
    
    // If coordinates provided, get reverse geocode
    if (latitude && longitude) {
      const geocodeResult = await reverseGeocode(latitude, longitude);
      if (geocodeResult.success) {
        deviceLocation = {
          coordinates: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
          ...geocodeResult
        };
      }
    }

    res.json({
      ip_location: ipLocation.success ? ipLocation : { error: ipLocation.error },
      device_location: deviceLocation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Complete location error:', error);
    res.status(500).json({ error: 'Failed to fetch complete location data' });
  }
});

// Get client IP info
app.get('/api/ip-info', (req, res) => {
  try {
    const clientIP = req.clientIp;
    const headers = req.headers;
    
    res.json({
      ip: clientIP,
      headers: {
        'user-agent': headers['user-agent'],
        'accept-language': headers['accept-language'],
        'x-forwarded-for': headers['x-forwarded-for']
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get IP info' });
  }
});

// ========== YOUR EXISTING CHAT CODE (UNMODIFIED) ========== //

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
      aiResponse = "I'm Orvix AI Assistant! Nice to meet you!";
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

// ========== SERVE FRONTEND ========== //

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
          <title>Orvix AI Chatbot</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .chat-container { border: 1px solid #ccc; padding: 20px; border-radius: 10px; }
            .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
            .user { background: #007bff; color: white; text-align: right; }
            .bot { background: #f8f9fa; color: black; }
          </style>
        </head>
        <body>
          <h1>Orvix AI Chatbot</h1>
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

const PORT = process.env.PORT || 8000; // Changed from 3000 to 5000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Orvix AI Server running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/api/health`);
  console.log(`📍 IP Location: http://localhost:${PORT}/api/location/ip-enhanced`);
  console.log(`📍 Chat API: http://localhost:${PORT}/api/chat`);
});