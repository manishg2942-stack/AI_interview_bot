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

export function listMyInterviewSessions({ accessToken, limit = 50, signal }) {
  const params = new URLSearchParams({ limit: String(limit) });

  return apiRequest(`/livekit/sessions?${params.toString()}`, {
    headers: createAuthHeaders(accessToken),
    signal,
  });
}

export function getInterviewFeedback({ accessToken, interviewId, signal }) {
  return apiRequest(`/interview-feedback/interview/${interviewId}`, {
    headers: createAuthHeaders(accessToken),
    signal,
  });
}

export function getInterviewTranscript({ accessToken, interviewId, signal }) {
  return apiRequest(`/transcripts/interview/${interviewId}`, {
    headers: createAuthHeaders(accessToken),
    signal,
  });
}

export function completeLiveKitSession({
  accessToken,
  sessionId,
  duration,
  transcriptMessages,
}) {
  return apiRequest(`/livekit/sessions/${sessionId}/complete`, {
    method: 'POST',
    headers: createAuthHeaders(accessToken),
    keepalive: true,
    body: JSON.stringify({
      duration,
      transcript_messages: transcriptMessages,
    }),
  });
}

export function listQuestionAttempts({ accessToken, interviewId, signal }) {
  return apiRequest(`/question-attempts/interview/${interviewId}`, {
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
