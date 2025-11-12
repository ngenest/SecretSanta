const API_TIMEOUT_MS = 30000; // 30 seconds

interface FetchOptions extends RequestInit {
  timeout?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiFetch = async (url: string, options: FetchOptions = {}) => {
  const { timeout = API_TIMEOUT_MS, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error('API returned non-JSON response:', text.substring(0, 200));
      throw new ApiError(
        'The server returned an invalid response. Please try again.',
        response.status
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse API response as JSON', jsonError);
      throw new ApiError(
        'The server returned an invalid response. Please try again.',
        response.status
      );
    }

    if (!response.ok) {
      const message = data?.error || data?.message || `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, data);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        'The request took too long to complete. Please check your internet connection and try again.',
        504
      );
    }
    
    if (error instanceof Error) {
      throw new ApiError(
        error.message || 'An unexpected error occurred. Please try again.',
        undefined,
        error
      );
    }
    
    throw new ApiError('An unexpected error occurred. Please try again.');
  }
};
