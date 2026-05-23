import React, { useMemo, useState } from 'react';
import {
  ControlBar,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';

function buildStarterCode(question) {
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

export function MeetingRoom({ interview, selectedQuestion }) {
  const [code, setCode] = useState(() => buildStarterCode(selectedQuestion));
  const [activeQuestionTab, setActiveQuestionTab] = useState('statement');
  const examples = selectedQuestion?.examples || [];
  const constraints = selectedQuestion?.constraints || [];
  const topics = selectedQuestion?.topics || [];
  const hasQuestion = Boolean(selectedQuestion);
  const interviewLabel = useMemo(() => {
    if (!interview) {
      return 'Practice interview';
    }
    return `${interview.company} / ${interview.level} / ${interview.difficulty}`;
  }, [interview]);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.Microphone, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <main className="room-shell">
      <header className="interview-header">
        <div>
          <span>Aisha Interview</span>
          <strong>{interviewLabel}</strong>
        </div>
        <p>{hasQuestion ? selectedQuestion.title : 'Live practice room'}</p>
      </header>

      <div className="room-workspace">
        <aside className="call-rail" aria-label="LiveKit meeting room">
          <section className="stage">
            <GridLayout tracks={tracks}>
              <ParticipantTile />
            </GridLayout>
          </section>
          <div className="controls">
            <ControlBar variation="minimal" />
          </div>
        </aside>

        <section className="practice-workbench" aria-label="Interview question and coding notes">
          <section className="question-panel">
            <div className="panel-heading">
              <p>{interviewLabel}</p>
              <h1>{hasQuestion ? selectedQuestion.title : 'Live interview'}</h1>
            </div>

            {hasQuestion ? (
              <>
                <div className="question-meta">
                  <span>{selectedQuestion.difficulty}</span>
                  {topics.slice(0, 4).map((topic) => (
                    <span key={topic}>{topic}</span>
                  ))}
                </div>

                <div className="question-tabs" role="tablist" aria-label="Question details">
                  <button
                    type="button"
                    className={activeQuestionTab === 'statement' ? 'active' : ''}
                    onClick={() => setActiveQuestionTab('statement')}
                  >
                    Question
                  </button>
                  <button
                    type="button"
                    className={activeQuestionTab === 'examples' ? 'active' : ''}
                    onClick={() => setActiveQuestionTab('examples')}
                  >
                    Examples
                  </button>
                  <button
                    type="button"
                    className={activeQuestionTab === 'constraints' ? 'active' : ''}
                    onClick={() => setActiveQuestionTab('constraints')}
                  >
                    Constraints
                  </button>
                </div>

                <div className="question-content">
                  {activeQuestionTab === 'statement' && (
                    <p className="question-text">{selectedQuestion.question}</p>
                  )}

                  {activeQuestionTab === 'examples' && (
                    <div className="question-section">
                      {examples.length > 0 ? examples.slice(0, 3).map((example, index) => (
                        <dl key={`${example.input}-${index}`} className="example-block">
                          <dt>Input</dt>
                          <dd>{example.input}</dd>
                          <dt>Output</dt>
                          <dd>{example.output}</dd>
                          {example.explanation && (
                            <>
                              <dt>Why</dt>
                              <dd>{example.explanation}</dd>
                            </>
                          )}
                        </dl>
                      )) : <p className="question-text">No examples available for this question.</p>}
                    </div>
                  )}

                  {activeQuestionTab === 'constraints' && (
                    <div className="question-section">
                      {constraints.length > 0 ? (
                        <ul className="constraint-list">
                          {constraints.map((constraint) => (
                            <li key={constraint}>{constraint}</li>
                          ))}
                        </ul>
                      ) : <p className="question-text">No constraints available for this question.</p>}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="question-text">
                Aisha is ready. Use the notepad for rough work during the interview.
              </p>
            )}
          </section>

          <section className="code-panel">
            <div className="code-toolbar">
              <div>
                <span>Code Notepad</span>
                <p>JavaScript draft</p>
              </div>
              <div className="code-actions">
                <button type="button" onClick={() => navigator.clipboard?.writeText(code)}>
                  Copy
                </button>
                <button type="button" onClick={() => setCode('')}>
                  Clear
                </button>
                <button type="button" onClick={() => setCode(buildStarterCode(selectedQuestion))}>
                  Reset
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
        </section>
      </div>
      <RoomAudioRenderer />
    </main>
  );
}
