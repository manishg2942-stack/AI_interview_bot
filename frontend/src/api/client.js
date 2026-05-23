const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || 'Request failed');
  }

  return data;
}

function authHeaders(accessToken) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function signup({ name, email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  return parseJsonResponse(response);
}

export async function login({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  return parseJsonResponse(response);
}

export async function listDsaQuestions({ accessToken, company, difficulty, level, limit = 1 }) {
  const params = new URLSearchParams({
    company,
    difficulty,
    level,
    limit: String(limit),
  });

  const response = await fetch(`${API_BASE_URL}/dsa-questions?${params.toString()}`, {
    headers: authHeaders(accessToken),
  });

  return parseJsonResponse(response);
}

export async function createLiveKitToken({ accessToken, identity, name, room, interview }) {
  const response = await fetch(`${API_BASE_URL}/livekit/token`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({
      identity,
      name,
      room,
      interview,
    }),
  });

  return parseJsonResponse(response);
}
