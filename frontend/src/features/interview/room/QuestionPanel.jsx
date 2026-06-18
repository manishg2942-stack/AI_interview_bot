import React from 'react';

function DetailSection({ title, children }) {
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

export function QuestionPanel({
  interviewLabel,
  title,
  statement,
  question,
}) {
  return (
    <section className="question-panel">
      <div className="panel-titlebar"><span>Question</span></div>
      <div className="question-scroll">
        <div className="panel-heading">
          <p>{interviewLabel}</p>
          <h1>{title}</h1>
        </div>

        <div className="question-content">
          <p className="question-text">{statement}</p>
          {question && (
            <div className="question-detail-stack">
              <DetailSection title="Constraints">
                {question.constraints?.length ? (
                  <ul className="constraint-list">
                    {question.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}
                  </ul>
                ) : null}
              </DetailSection>

              <DetailSection title="Examples / Test Cases">
                {question.examples?.length ? (
                  <div className="example-list">
                    {question.examples.map((example, index) => (
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
                ) : null}
              </DetailSection>

              {(question.expected_approach
                || question.time_complexity
                || question.space_complexity) && (
                <DetailSection title="Expected Approach">
                  <div className="approach-block">
                    {question.expected_approach && <p>{question.expected_approach}</p>}
                    <div className="complexity-grid">
                      {question.time_complexity && (
                        <span><strong>Time</strong>{question.time_complexity}</span>
                      )}
                      {question.space_complexity && (
                        <span><strong>Space</strong>{question.space_complexity}</span>
                      )}
                    </div>
                  </div>
                </DetailSection>
              )}

              <DetailSection title="Topics">
                {question.topics?.length ? (
                  <div className="topic-chip-list">
                    {question.topics.map((topic) => <span key={topic}>{topic}</span>)}
                  </div>
                ) : null}
              </DetailSection>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
