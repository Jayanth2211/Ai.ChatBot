import { useState, useEffect } from 'react';
import React from 'react';
import { locationAPI } from '../services/api.js';

export const useLocation = () => {
  const [ipLocation, setIpLocation] = useState(null);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [areaName, setAreaName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Test backend connection on component mount
  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        const response = await locationAPI.checkHealth();
        console.log('✅ Backend connection successful:', response.data);
      } catch (error) {
        console.error('❌ Backend connection failed:', error);
        setError('Cannot connect to backend server');
      }
    };
    
    testBackendConnection();
  }, []);

  // Fetch enhanced IP location
  const fetchIPLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await locationAPI.getIPLocation();
      setIpLocation(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching IP location:', error);
      setError('Failed to fetch IP location');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get device GPS location and convert to area name
  const getDeviceLocation = async () => {
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by this browser.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setLoading(true);
    setError(null);
    
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const locationData = { latitude, longitude, accuracy };
          
          setDeviceLocation(locationData);
          
          try {
            // Send to backend and get area name
            const response = await locationAPI.sendDeviceLocation(locationData);
            setAreaName(response.data.data);
            const result = {
              deviceLocation: locationData,
              areaName: response.data.data
            };
            resolve(result);
          } catch (error) {
            console.error('Error processing location:', error);
            const errorMsg = 'Failed to process device location';
            setError(errorMsg);
            reject(new Error(errorMsg));
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('Error getting device location:', error);
          let errorMessage = 'Error getting location: ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'User denied location access';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out';
              break;
            default:
              errorMessage += 'Unknown error';
          }
          setError(errorMessage);
          setLoading(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  return {
    ipLocation,
    deviceLocation,
    areaName,
    loading,
    error,
    fetchIPLocation,
    getDeviceLocation
  };
};