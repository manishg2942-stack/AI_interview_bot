import React from 'react';

export function CallRail({
  messages,
  liveUserTranscript,
  transcriptEndRef,
  showTranscript = true,
  onToggleTranscript,
}) {
  return (
    <aside className="call-rail" aria-label="Live interview transcript and controls">
      <div className="participant-card interviewer-card">
        <span>C</span>
        <div><strong>Codingace</strong></div>
      </div>
      <div className="participant-card candidate-card">
        <span>You</span>
        <div><strong>You</strong><p>Candidate</p></div>
      </div>

      {showTranscript ? (
      <section className="transcript-panel" aria-label="Live transcript">
        <div className="transcript-heading">
          <div>
            <span>Live Transcript</span>
            <p>Voice to text</p>
          </div>
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
      ) : (
      <section className="test-case-panel" aria-label="Test case results">
        <div className="test-case-panel-heading">
          <span>Sample test cases</span>
          <span className="test-case-count">2 passed</span>
        </div>

        <div className="test-cases-container">
          <div className="test-case-item">
            <div className="test-case-header">
              <span className="test-case-name">Sample Test Case 1</span>
              <span className="test-case-status passed">✅ Passed</span>
            </div>
            <div className="test-case-output">
              <span className="label">Input:</span> [1, 2, 3, 4, 5]<br />
              <span className="label">Output:</span> [5, 4, 3, 2, 1]
            </div>
          </div>

          <div className="test-case-item">
            <div className="test-case-header">
              <span className="test-case-name">Sample Test Case 2</span>
              <span className="test-case-status passed">✅ Passed</span>
            </div>
            <div className="test-case-output">
              <span className="label">Input:</span> ["a", "b", "c"]<br />
              <span className="label">Output:</span> ["c", "b", "a"]
            </div>
          </div>

          <div className="test-case-divider">Hidden Test Cases</div>

          <div className="test-case-item hidden">
            <div className="test-case-header">
              <span className="test-case-name">Hidden Test Case 1</span>
              <span className="test-case-status">🔒 Locked</span>
            </div>
          </div>
          <div className="test-case-item hidden">
            <div className="test-case-header">
              <span className="test-case-name">Hidden Test Case 2</span>
              <span className="test-case-status">🔒 Locked</span>
            </div>
          </div>
          <div className="test-case-item hidden">
            <div className="test-case-header">
              <span className="test-case-name">Hidden Test Case 3</span>
              <span className="test-case-status">🔒 Locked</span>
            </div>
          </div>
        </div>
      </section>
      )}
    </aside>
  );
}
