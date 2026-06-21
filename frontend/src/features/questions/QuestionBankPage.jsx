import React, { useEffect, useState } from 'react';

import { COMPANIES, DIFFICULTIES, LEVELS } from '../../constants/interview.js';
import { listDsaQuestions } from '../../services/interviewService.js';
import { getErrorMessage } from '../../utils/helpers.js';

export function QuestionBankPage({ accessToken }) {
  const [filters, setFilters] = useState({
    company: COMPANIES[0],
    difficulty: DIFFICULTIES[1],
    level: LEVELS[1],
  });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    listDsaQuestions({
      accessToken,
      ...filters,
      limit: 20,
      signal: controller.signal,
    })
      .then(setQuestions)
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(requestError, 'Unable to load questions'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [accessToken, filters]);

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  return (
    <section className="content-card">
      <div className="card-heading">
        <div>
          <p>Question bank</p>
          <h3>DSA questions from your backend</h3>
        </div>
      </div>

      <div className="filter-bar">
        <label>
          Company
          <select value={filters.company} onChange={(event) => updateFilter('company', event.target.value)}>
            {COMPANIES.map((company) => <option key={company}>{company}</option>)}
          </select>
        </label>
        <label>
          Level
          <select value={filters.level} onChange={(event) => updateFilter('level', event.target.value)}>
            {LEVELS.map((level) => <option key={level}>{level}</option>)}
          </select>
        </label>
        <label>
          Difficulty
          <select value={filters.difficulty} onChange={(event) => updateFilter('difficulty', event.target.value)}>
            {DIFFICULTIES.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}
          </select>
        </label>
      </div>

      {loading && <p className="muted-text">Loading questions...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && !questions.length && (
        <p className="muted-text">No matching questions found. Try another company, level, or difficulty.</p>
      )}

      <div className="question-grid">
        {questions.map((question) => (
          <article key={question.id} className="question-card">
            <div>
              <span>{question.difficulty}</span>
              <h4>{question.title}</h4>
              <p>{question.question}</p>
            </div>
            <div className="topic-chip-list">
              {(question.topics || []).slice(0, 4).map((topic) => <span key={topic}>{topic}</span>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
