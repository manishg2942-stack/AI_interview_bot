import React from 'react';


function averageScore(sessions) {
  const scored = sessions.filter((session) => typeof session.overall_score === 'number');
  if (!scored.length) {
    return '-';
  }
  return Math.round(scored.reduce((sum, session) => sum + session.overall_score, 0) / scored.length);
}

function statusText(session) {
  if (session.feedback_status === 'completed') {
    return 'Feedback ready';
  }
  if (session.feedback_status === 'generating') {
    return 'Generating feedback';
  }
  if (session.feedback_status === 'failed') {
    return 'Feedback failed';
  }
  return session.status || 'Pending';
}

export function DashboardPage({ profile, sessions, loading, onNavigate }) {
 
  const recentSessions = sessions.slice(0, 4);
  const completedCount = sessions.filter((session) => session.status === 'completed').length;
  const feedbackCount = sessions.filter((session) => (
    session.feedback_status === 'completed' || session.feedback_id
  )).length;

  return (
    <div className="dashboard-grid">
      <section className="hero-card">
        <p>Welcome back, {profile.name.split(' ')[0]}</p>
        <h2>Train like it is the real interview, review like it is your unfair advantage.</h2>
        <div className="hero-actions">
          <button type="button" className="primary-button" onClick={() => onNavigate('practice')}>
            Start practice
          </button>
          <button type="button" className="ghost-button" onClick={() => onNavigate('feedback')}>
            View feedback
          </button>
        </div>
      </section>

      <section className="metric-card">
        <span>Total interviews</span>
        <strong>{loading ? '...' : sessions.length}</strong>
      </section>
    
      <section
        className="metric-card"
        onClick={() => onNavigate("feedback")}
      >
        <span>Feedback reports</span>
        <strong>{loading ? '...' : feedbackCount}</strong>
      </section>
      <section className="metric-card">
        <span>Average score</span>
        <strong>{loading ? '...' : averageScore(sessions)}</strong>
      </section>

      <section className="content-card wide-card">
        <div className="card-heading">
          <div>
            <p>Recent activity</p>
            <h3>Your latest sessions</h3>
          </div>
          <button type="button" className="text-button" onClick={() => onNavigate('history')}>
            See all
          </button>
        </div>

        {loading && <p className="muted-text">Loading sessions...</p>}
        {!loading && !recentSessions.length && (
          <p className="muted-text">No interviews yet. Start a practice session to build your history.</p>
        )}
        {!loading && Boolean(recentSessions.length) && (
          <div className="session-list">
            {recentSessions.map((session) => (
              <article key={session.id} className="session-row">
                <div>
                  <strong>{session.company || 'Practice'} - {String(session.interview_type).toUpperCase()}</strong>
                  <p>{session.level || 'Level not set'} - {statusText(session)}</p>
                </div>
                <span>{session.overall_score ?? 'Pending'}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
