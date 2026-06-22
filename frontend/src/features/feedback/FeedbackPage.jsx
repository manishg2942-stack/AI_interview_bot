import React, { useEffect, useMemo, useState } from 'react';
import '../../styles/feedback.css';

import { getInterviewFeedback } from '../../services/interviewService.js';
import { getErrorMessage } from '../../utils/helpers.js';

const GENERATION_MESSAGES = [
  'Analyzing your interview...',
  'Evaluating your performance...',
  'Generating personalized feedback...',
  'Preparing recommendations...',
];

export function FeedbackPage({ accessToken, sessions, initialInterviewId, generation }) {
  const [selectedInterviewId, setSelectedInterviewId] = useState(initialInterviewId || '');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [localMessageIndex, setLocalMessageIndex] = useState(0);
  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedInterviewId),
    [selectedInterviewId, sessions],
  );
  const sessionIsGenerating = selectedSession?.feedback_status === 'generating';
  const isGenerating = Boolean(
    sessionIsGenerating
    || (
      generation?.active
      && generation.interviewId
      && generation.interviewId === selectedInterviewId
    ),
  );
  const generationMessage = GENERATION_MESSAGES[
    (generation?.active ? generation.messageIndex : localMessageIndex) % GENERATION_MESSAGES.length
  ];

  useEffect(() => {
    if (initialInterviewId) {
      setSelectedInterviewId(initialInterviewId);
    }
  }, [initialInterviewId]);

  useEffect(() => {
    if (!selectedInterviewId && sessions.length) {
      setSelectedInterviewId(sessions[0].id);
    }
  }, [selectedInterviewId, sessions]);

  useEffect(() => {
    if (!isGenerating || generation?.active) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setLocalMessageIndex((current) => current + 1);
    }, 1800);

    return () => window.clearInterval(timer);
  }, [generation?.active, isGenerating]);

  useEffect(() => {
    if (!selectedInterviewId || isGenerating || selectedSession?.feedback_status === 'failed') {
      setLoading(false);
      setError('');
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError('');
    setFeedback(null);

    getInterviewFeedback({
      accessToken,
      interviewId: selectedInterviewId,
      signal: controller.signal,
    })
      .then(setFeedback)
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(requestError, 'Feedback is not available for this interview yet'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [accessToken, isGenerating, selectedInterviewId, selectedSession?.feedback_status]);

  return (
    <div className="feedback-layout">
      <section className="content-card">
        <div className="card-heading">
          <div>
            <p>Feedback center</p>
            <h3>Select an interview</h3>
          </div>
        </div>

        {!sessions.length && (
          <p className="muted-text">No sessions yet. Start an interview first, then feedback will appear here.</p>
        )}

        <div className="session-list">
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              className={`feedback-session-card${selectedInterviewId === session.id ? ' active' : ''}`}
              onClick={() => setSelectedInterviewId(session.id)}
            >
              <strong>{session.company || 'Practice'} · {String(session.interview_type).toUpperCase()}</strong>
              <span>{session.level || 'Level not set'} · {session.difficulty || 'Difficulty not set'}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="content-card feedback-detail-card">
        <div className="card-heading">
          <div>
            <p>AI report</p>
            <h3>{selectedSession ? `${selectedSession.company} ${String(selectedSession.interview_type).toUpperCase()}` : 'No interview selected'}</h3>
          </div>
          <span className="score-pill">{feedback?.overall_score ?? selectedSession?.overall_score ?? 'Pending'}</span>
        </div>

        {isGenerating && (
          <div className="feedback-loading-state" role="status" aria-live="polite">
            <span className="feedback-spinner" />
            <h4>{generationMessage}</h4>
            <p>Hang tight while Aisha turns your interview into a saved coaching report.</p>
          </div>
        )}
        {!isGenerating && selectedSession?.feedback_status === 'failed' && (
          <div className="empty-state">
            <h4>Feedback generation failed</h4>
            <p>{selectedSession.feedback_error || 'Please try again later.'}</p>
          </div>
        )}
        {!isGenerating && loading && <p className="muted-text">Loading feedback...</p>}
        {!isGenerating && generation?.error && selectedInterviewId === generation.interviewId && (
          <div className="empty-state">
            <h4>Feedback generation needs attention</h4>
            <p>{generation.error}</p>
          </div>
        )}
        {!isGenerating && !loading && error && (
          <div className="empty-state">
            <h4>Feedback not generated yet</h4>
            <p>{error}</p>
          </div>
        )}
        {!isGenerating && !loading && feedback && (
          <div className="feedback-report">
            <p className="summary-text">{feedback.ai_summary}</p>
            <FeedbackList title="Strengths" items={feedback.strengths} />
            <FeedbackList title="Weaknesses" items={feedback.weaknesses} />
            <FeedbackList title="Recommendations" items={feedback.recommendations} />
          </div>
        )}
      </section>
    </div>
  );
}

function FeedbackList({ title, items }) {
  return (
    <div className="feedback-list">
      <h4>{title}</h4>
      {items?.length ? (
        <ul>
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p className="muted-text">No items yet.</p>
      )}
    </div>
  );
}
