import { useAuthStore } from '../context/store';

// Helper to make API calls with the JWT token
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = useAuthStore.getState().token;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // maybe auto logout
    useAuthStore.getState().logout();
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (!data.message) {
      console.error(`API Fetch Error [${response.status}] for ${endpoint}:`, typeof data === 'string' ? data : JSON.stringify(data));
    }
    throw new Error(data.message || 'API request failed');
  }

  return data;
};
