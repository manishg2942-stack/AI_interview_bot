import React from 'react';
import '../../../styles/history.css';

function formatDate(value) {
  if (!value) {
    return 'Unknown date';
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function feedbackLabel(session) {
  if (session.feedback_status === 'completed') {
    return 'Ready';
  }
  if (session.feedback_status === 'generating') {
    return 'Generating';
  }
  if (session.feedback_status === 'failed') {
    return 'Failed';
  }
  return 'Pending';
}

export function InterviewHistoryPage({ sessions, loading, onOpenFeedback, onStartPractice }) {
  return (
    <section className="content-card">
      <div className="card-heading">
        <div>
          <p>Interview history</p>
          <h3>Every session you have started</h3>
        </div>
        <button type="button" className="primary-button compact-button" onClick={onStartPractice}>
          New session
        </button>
      </div>

      {loading && <p className="muted-text">Loading history...</p>}
      {!loading && !sessions.length && (
        <div className="empty-state">
          <h4>No sessions found</h4>
          <p>Once you start a LiveKit practice interview, it will appear here.</p>
          <button type="button" className="primary-button" onClick={onStartPractice}>Start first interview</button>
        </div>
      )}

      {!loading && Boolean(sessions.length) && (
        <div className="table-card">
          <div className="data-table history-table">
            <span>Type</span>
            <span>Company</span>
            <span>Level</span>
            <span>Date</span>
            <span>Score</span>
            <span>Feedback</span>
            {sessions.map((session) => (
              <React.Fragment key={session.id}>
                <strong>{String(session.interview_type).toUpperCase()}</strong>
                <span>{session.company || '-'}</span>
                <span>{session.level || '-'}</span>
                <span>{formatDate(session.created_at)}</span>
                <span>{session.overall_score ?? 'Pending'}</span>
                <button type="button" className="text-button" onClick={() => onOpenFeedback(session.id)}>
                  {feedbackLabel(session)}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
