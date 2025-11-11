const API_URL = '/api';

export async function createDraw(drawData: any) {
  try {
    console.log('Sending request to:', `${API_URL}/draw`);
    const response = await fetch(`${API_URL}/draw`, {
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

export async function sendNotifications(batchId: string) {
  const response = await fetch(`${API_URL}/notifications/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ batchId })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send notifications');
  }
  
  return data;
}

export async function acknowledgeAssignment(token: string) {
  const response = await fetch(`${API_URL}/acknowledgements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to acknowledge assignment');
  }
  
  return data;
}
