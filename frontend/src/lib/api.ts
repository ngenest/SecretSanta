const API_URL = '/api';

export async function createDraw(drawData: any) {
  try {
    console.log('Sending request to:', `${API_URL}/draws`);
    const response = await fetch(`${API_URL}/draws`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(drawData),
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create draw');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
