import { apiRequest, createAuthHeaders } from '../api/httpClient.js';

export function signup(payload) {
  return apiRequest('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function login(payload) {
  return apiRequest('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function loginWithGoogle(idToken) {
  return apiRequest('/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });
}

export function updateProfile({ accessToken, name }) {
  return apiRequest('/auth/me', {
    method: 'PATCH',
    headers: createAuthHeaders(accessToken),
    body: JSON.stringify({ name }),
  });
}

export function getProfile(accessToken) {
  return apiRequest('/auth/me', {
    headers: createAuthHeaders(accessToken),
  });
}
