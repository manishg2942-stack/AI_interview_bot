import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ControlBar,
  RoomAudioRenderer,
  useDataChannel,
} from '@livekit/components-react';

const TRANSCRIPT_TOPIC = 'aisha.transcript';
const INTERVIEW_DURATION_SECONDS = 5 * 60;

function buildStarterCode(question, interview) {
  const designQuestion = interview?.designQuestion;

  if (designQuestion && (interview?.type === 'lld' || interview?.type === 'hld')) {
    return [
      `// ${designQuestion}`,
      '// Use this space for requirements, APIs, data model, components, and tradeoffs.',
      '',
    ].join('\n');
  }

  if (!question) {
    return '// Write your notes or code here.\n';
  }

  return [
    `// ${question.title}`,
    '// Talk through your approach with Aisha, then write your solution here.',
    '',
    'function solve() {',
    '  ',
    '}',
    '',
  ].join('\n');
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

function QuestionDetailSection({ title, children }) {
  if (!children) {
    return null;
  }

  return (
    <section className="question-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function MeetingRoom({ interview, selectedQuestion }) {
  const [code, setCode] = useState(() => buildStarterCode(selectedQuestion, interview));
  const [messageDraft, setMessageDraft] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [transcriptMessages, setTranscriptMessages] = useState([]);
  const [liveUserTranscript, setLiveUserTranscript] = useState('');
  const transcriptEndRef = useRef(null);
  const typewriterTimersRef = useRef(new Set());
  const isDesignInterview = interview?.type === 'lld' || interview?.type === 'hld';
  const isBehavioralInterview = interview?.type === 'behavioral';
  const designQuestion = interview?.designQuestion || '';
  const hasQuestion = Boolean(selectedQuestion);
  const hasDesignQuestion = Boolean(isDesignInterview && designQuestion);
  const interviewLabel = useMemo(() => {
    if (!interview) {
      return 'Practice interview';
    }
    return `${interview.company} / ${interview.type?.toUpperCase() || 'Interview'}`;
  }, [interview]);
  const interviewTitle = hasQuestion
    ? selectedQuestion.title
    : hasDesignQuestion
      ? designQuestion
      : isBehavioralInterview
        ? 'Behavioral interview'
        : 'Live interview';
  const questionStatement = hasQuestion
    ? selectedQuestion.question
    : hasDesignQuestion
      ? `Design problem selected for this session: ${designQuestion}. Aisha will use this exact problem for the interview.`
      : isBehavioralInterview
        ? 'Behavioral interview session. Aisha will use your selected company, level, and resume context if provided.'
        : 'Aisha is ready. Use the notepad for rough work during the interview.';

  const addAssistantTranscript = useCallback((text) => {
    const id = `${Date.now()}-${Math.random()}`;
    const chunkSize = 4;
    let cursor = 0;

    setTranscriptMessages((messages) => [
      ...messages,
      { id, role: 'assistant', text: '', finalText: text },
    ]);

    const timer = window.setInterval(() => {
      cursor += chunkSize;
      setTranscriptMessages((messages) => messages.map((message) => (
        message.id === id
          ? { ...message, text: text.slice(0, cursor) }
          : message
      )));

      if (cursor >= text.length) {
        window.clearInterval(timer);
        typewriterTimersRef.current.delete(timer);
      }
    }, 24);

    typewriterTimersRef.current.add(timer);
  }, []);

  const handleTranscriptMessage = useCallback((message) => {
    try {
      const rawText = new TextDecoder().decode(message.payload);
      const payload = JSON.parse(rawText);

      if (payload.type !== 'transcript' || !payload.text) {
        return;
      }

      if (payload.role === 'user') {
        if (payload.is_final) {
          setLiveUserTranscript('');
          setTranscriptMessages((messages) => [
            ...messages,
            {
              id: `${payload.ts || Date.now()}-user`,
              role: 'user',
              text: payload.text,
            },
          ]);
        } else {
          setLiveUserTranscript(payload.text);
        }
        return;
      }

      if (payload.role === 'assistant' && payload.is_final) {
        addAssistantTranscript(payload.text);
      }
    } catch {
      // Ignore non-transcript data messages from other LiveKit features.
    }
  }, [addAssistantTranscript]);

  useDataChannel(TRANSCRIPT_TOPIC, handleTranscriptMessage);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ block: 'end' });
  }, [transcriptMessages, liveUserTranscript]);

  useEffect(() => () => {
    typewriterTimersRef.current.forEach((timer) => window.clearInterval(timer));
    typewriterTimersRef.current.clear();
  }, []);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setElapsedSeconds(Math.min(elapsed, INTERVIEW_DURATION_SECONDS));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  function formatTimer(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  return (
    <main className="room-shell">
      <header className="interview-header">
        <div className="interview-clock">
          <span>{formatTimer(elapsedSeconds)} / {formatTimer(INTERVIEW_DURATION_SECONDS)}</span>
          <strong>{interview?.type?.toUpperCase() || 'INTERVIEW'}</strong>
        </div>
        <div className="interview-topic">
          <span>Introduction</span>
          <strong>{interviewLabel}</strong>
        </div>
      </header>

      <div className="room-workspace">
        <section className="question-panel">
          <div className="panel-titlebar">
            <span>Question</span>
          </div>

          <div className="question-scroll">
            <div className="panel-heading">
              <p>{interviewLabel}</p>
              <h1>{interviewTitle}</h1>
            </div>

            <div className="question-content">
              <p className="question-text">{questionStatement}</p>

              {hasQuestion && (
                <div className="question-detail-stack">
                  <QuestionDetailSection title="Constraints">
                    {hasItems(selectedQuestion.constraints) && (
                      <ul className="constraint-list">
                        {selectedQuestion.constraints.map((constraint) => (
                          <li key={constraint}>{constraint}</li>
                        ))}
                      </ul>
                    )}
                  </QuestionDetailSection>

                  <QuestionDetailSection title="Examples / Test Cases">
                    {hasItems(selectedQuestion.examples) && (
                      <div className="example-list">
                        {selectedQuestion.examples.map((example, index) => (
                          <dl className="example-block" key={`${example.input}-${index}`}>
                            <dt>Input</dt>
                            <dd>{example.input}</dd>
                            <dt>Output</dt>
                            <dd>{example.output}</dd>
                            {example.explanation && (
                              <>
                                <dt>Explanation</dt>
                                <dd>{example.explanation}</dd>
                              </>
                            )}
                          </dl>
                        ))}
                      </div>
                    )}
                  </QuestionDetailSection>

                  {(selectedQuestion.expected_approach
                    || selectedQuestion.time_complexity
                    || selectedQuestion.space_complexity) && (
                    <QuestionDetailSection title="Expected Approach">
                      <div className="approach-block">
                        {selectedQuestion.expected_approach && (
                          <p>{selectedQuestion.expected_approach}</p>
                        )}
                        <div className="complexity-grid">
                          {selectedQuestion.time_complexity && (
                            <span>
                              <strong>Time</strong>
                              {selectedQuestion.time_complexity}
                            </span>
                          )}
                          {selectedQuestion.space_complexity && (
                            <span>
                              <strong>Space</strong>
                              {selectedQuestion.space_complexity}
                            </span>
                          )}
                        </div>
                      </div>
                    </QuestionDetailSection>
                  )}

                  {hasItems(selectedQuestion.topics) && (
                    <QuestionDetailSection title="Topics">
                      <div className="topic-chip-list">
                        {selectedQuestion.topics.map((topic) => (
                          <span key={topic}>{topic}</span>
                        ))}
                      </div>
                    </QuestionDetailSection>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="code-panel">
          <div className="code-toolbar">
            <select aria-label="Language" defaultValue="notes">
              <option value="notes">Notepad</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>
            <div className="code-actions">
              <button type="button" className="run-button">
                Run
              </button>
              <button type="button" className="submit-button" onClick={() => navigator.clipboard?.writeText(code)}>
                Send notes
              </button>
            </div>
          </div>
          <textarea
            aria-label="Coding notepad"
            spellCheck="false"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </section>

        <aside className="call-rail" aria-label="Live interview transcript and controls">
          <div className="participant-card interviewer-card">
            <span>A</span>
            <div>
              <strong>Aisha</strong>
              <p>Interviewer</p>
            </div>
          </div>
          <div className="participant-card candidate-card">
            <span>You</span>
            <div>
              <strong>You</strong>
              <p>Candidate</p>
            </div>
          </div>

          <section className="transcript-panel" aria-label="Live transcript">
            <div className="transcript-heading">
              <span>Live Transcript</span>
              <p>Voice to text</p>
            </div>
            <div className="transcript-list">
              {transcriptMessages.length === 0 && !liveUserTranscript && (
                <p className="transcript-empty">Transcript will appear here as you speak.</p>
              )}
              {transcriptMessages.map((message) => (
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
      </div>

      <form className="floating-composer" onSubmit={(event) => event.preventDefault()}>
        <span>Mic</span>
        <input
          value={messageDraft}
          onChange={(event) => setMessageDraft(event.target.value)}
          placeholder="Speak or type a message..."
        />
        <button type="submit" aria-label="Send message">Send</button>
      </form>

      <div className="floating-controls">
        <ControlBar variation="minimal" />
      </div>
      <RoomAudioRenderer />
    </main>
  );
}
