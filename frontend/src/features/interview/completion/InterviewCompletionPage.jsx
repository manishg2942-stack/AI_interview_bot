import React from 'react';

const STATUS_TEXT = {
  pending: 'Feedback is queued',
  generating: 'Feedback is being prepared',
  completed: 'Feedback is ready',
  failed: 'Feedback needs attention',
};

export function InterviewCompletionPage({
  session,
  loading,
  error,
  onViewFeedback,
  onDashboard,
}) {
  const feedbackStatus = session?.feedback_status || 'generating';
  const isFeedbackReady = feedbackStatus === 'completed' || Boolean(session?.feedback_id);

  return (
    <section className="completion-panel">
      <div className="completion-status-mark">
        {isFeedbackReady ? 'Done' : 'Saving'}
      </div>
      <p>Interview complete</p>
      <h2>{session ? `${session.company || 'Practice'} ${String(session.interview_type).toUpperCase()}` : 'Wrapping up your interview'}</h2>
      <span>{STATUS_TEXT[feedbackStatus] || STATUS_TEXT.generating}</span>

      {loading && (
        <div className="completion-progress" role="status" aria-live="polite">
          <span className="feedback-spinner" />
          <strong>Saving transcript and generating feedback...</strong>
        </div>
      )}

      {error && (
        <div className="empty-state completion-error">
          <h4>Completion needs attention</h4>
          <p>{error}</p>
        </div>
      )}

      <div className="completion-actions">
        <button
          type="button"
          className="primary-button"
          onClick={onViewFeedback}
        >
          View interview feedback
        </button>
        <button type="button" className="ghost-button" onClick={onDashboard}>
          Return to dashboard
        </button>
      </div>
    </section>
  );
}
