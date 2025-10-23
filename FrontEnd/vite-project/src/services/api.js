import axios from 'axios';

const API_BASE_URL = 'https://ai-chatbot-backend-server.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


export const locationAPI = {
  // Get enhanced IP location with area names
  getIPLocation: () => api.get('/location/ip-enhanced'),
  
  // Convert coordinates to address
  reverseGeocode: (latitude, longitude) => 
    api.get(`/location/reverse-geocode?latitude=${latitude}&longitude=${longitude}`),
  
  // Send device location to backend
  sendDeviceLocation: (locationData) => 
    api.post('/location/device', locationData),
  
  // Get complete location info
  getCompleteLocation: (latitude, longitude) => 
    api.get(`/location/complete?latitude=${latitude}&longitude=${longitude}`),
  
  // Health check
  checkHealth: () => api.get('/health')
};

export default api;