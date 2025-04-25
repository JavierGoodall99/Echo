/**
 * API service for backend operations that require bypassing RLS
 */

// Base URL for our API
const API_BASE_URL = 'https://echo-api-service.vercel.app/api';

/**
 * Save an echo record by sending it to our serverless API
 * @param echoData The echo data to save
 * @returns A promise that resolves to true if successful
 */
export const saveEchoToAPI = async (echoData: any): Promise<boolean> => {
  try {
    console.log('Saving echo via API service...');
    
    const response = await fetch(`${API_BASE_URL}/echoes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'echo-temp-key-123' // Replace with a real API key in production
      },
      body: JSON.stringify(echoData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status} - ${errorText}`);
      return false;
    }
    
    console.log('Echo saved successfully via API');
    return true;
  } catch (error) {
    console.error('Error in API service:', error);
    return false;
  }
};

/**
 * Fetch all echoes for a user from our serverless API
 * @param userId The user ID to fetch echoes for
 * @returns A promise that resolves to an array of echo data
 */
export const fetchEchoesFromAPI = async (userId: string): Promise<any[]> => {
  try {
    console.log(`Fetching echoes for user ${userId} via API service...`);
    
    const response = await fetch(`${API_BASE_URL}/echoes?userId=${userId}`, {
      method: 'GET',
      headers: {
        'x-api-key': 'echo-temp-key-123' // Replace with a real API key in production
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status} - ${errorText}`);
      return [];
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.length} echoes via API`);
    return data;
  } catch (error) {
    console.error('Error in API service:', error);
    return [];
  }
};