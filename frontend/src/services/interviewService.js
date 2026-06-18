import { apiRequest, createAuthHeaders } from '../api/httpClient.js';

export function listDsaQuestions({
  accessToken,
  company,
  difficulty,
  level,
  limit = 1,
  signal,
}) {
  const params = new URLSearchParams({
    company,
    difficulty,
    level,
    limit: String(limit),
  });

  return apiRequest(`/dsa-questions?${params.toString()}`, {
    headers: createAuthHeaders(accessToken),
    signal,
  });
}

export function createLiveKitToken({
  accessToken,
  identity,
  name,
  room,
  interview,
}) {
  return apiRequest('/livekit/token', {
    method: 'POST',
    headers: createAuthHeaders(accessToken),
    body: JSON.stringify({ identity, name, room, interview }),
  });
}
