import React from 'react';

export function CallRail({
  messages,
  liveUserTranscript,
  transcriptEndRef,
}) {
  return (
    <aside className="call-rail" aria-label="Live interview transcript and controls">
      <div className="participant-card interviewer-card">
        <span>A</span>
        <div><strong>Aisha</strong><p>Interviewer</p></div>
      </div>
      <div className="participant-card candidate-card">
        <span>You</span>
        <div><strong>You</strong><p>Candidate</p></div>
      </div>

      <section className="transcript-panel" aria-label="Live transcript">
        <div className="transcript-heading">
          <span>Live Transcript</span>
          <p>Voice to text</p>
        </div>
        <div className="transcript-list">
          {messages.length === 0 && !liveUserTranscript && (
            <p className="transcript-empty">Transcript will appear here as you speak.</p>
          )}
          {messages.map((message) => (
            <div key={message.id} className={`transcript-message ${message.role}`}>
              <span>{message.role === 'assistant' ? 'Aisha' : 'You'}</span>
              <p>{message.text}</p>
            </div>
          ))}
          {liveUserTranscript && (
            <div className="transcript-message user live">
              <span>You</span>
              <p>{liveUserTranscript}</p>
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>
      </section>
    </aside>
  );
}
