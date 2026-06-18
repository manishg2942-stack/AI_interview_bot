const DEFAULT_API_ORIGIN = 'https://api.codingace.online';
const API_BASE_URL = `${(import.meta.env.VITE_API_ORIGIN || DEFAULT_API_ORIGIN).replace(/\/+$/, '')}/api`;

export async function apiRequest(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || 'Request failed');
  }

  return data;
}

export function createAuthHeaders(accessToken) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}
