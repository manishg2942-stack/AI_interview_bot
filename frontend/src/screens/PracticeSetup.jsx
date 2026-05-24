import React, { useState } from 'react';
import { BrandMark } from '../components/BrandMark.jsx';
import { OptionButton } from '../components/OptionButton.jsx';
import {
  companies,
  difficulties,
  hldQuestions,
  interviewTypes,
  levels,
  lldQuestions,
} from '../config/interviewOptions.js';

export function PracticeSetup({
  profile,
  setup,
  error,
  loading,
  questionStatus,
  onSetupChange,
  onBack,
  onStart,
}) {
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeFileError, setResumeFileError] = useState('');
  const isDesignInterview = setup.type === 'lld' || setup.type === 'hld';
  const isBehavioralInterview = setup.type === 'behavioral';
  const designQuestions = setup.type === 'hld' ? hldQuestions : lldQuestions;
  const canStart = (
    setup.type
    && setup.company
    && setup.level
    && setup.difficulty
    && setup.room.trim()
    && (!isDesignInterview || setup.designQuestion)
  );
  const statusText = {
    checking: 'Checking matching DSA question...',
    ready: 'Matching DSA question ready.',
    empty: 'No exact DSA question match found. Backend will try fallback questions.',
    unknown: 'Question check unavailable. You can still start.',
  }[questionStatus];

  async function handleResumeFileChange(event) {
    const file = event.target.files?.[0];
    setResumeFileError('');

    if (!file) {
      setResumeFileName('');
      return;
    }

    try {
      const text = await file.text();
      setResumeFileName(file.name);
      onSetupChange({ ...setup, resumeText: text.slice(0, 8000) });
    } catch {
      setResumeFileName('');
      setResumeFileError('Unable to read this resume file. Please upload a text-based resume.');
    }
  }

  function changeInterviewType(nextType) {
    const nextDesignQuestion = nextType === 'hld' ? hldQuestions[0] : lldQuestions[0];
    onSetupChange({
      ...setup,
      type: nextType,
      designQuestion: nextType === 'lld' || nextType === 'hld' ? nextDesignQuestion : setup.designQuestion,
    });
  }

  return (
    <main className="setup-shell">
      <header className="topbar">
        <BrandMark />
        <button type="button" className="ghost-button" onClick={onBack}>Sign out</button>
      </header>

      <section className="setup-grid">
        <aside className="profile-panel">
          <p>Signed in as</p>
          <h1>{profile.name}</h1>
          <span>{profile.email}</span>
        </aside>

        <form className="setup-panel" onSubmit={onStart}>
          <div className="section-heading">
            <p>Practice interview</p>
            <h2>Choose what you want to prepare.</h2>
          </div>

          <fieldset>
            <legend>Interview type</legend>
            <div className="option-grid">
              {interviewTypes.map((type) => (
                <OptionButton
                  key={type.value}
                  selected={setup.type === type.value}
                  title={type.label}
                  detail={type.detail}
                  onClick={() => changeInterviewType(type.value)}
                />
              ))}
            </div>
          </fieldset>

          <div className="form-grid">
            <label>
              Company
              <select
                value={setup.company}
                onChange={(event) => onSetupChange({ ...setup, company: event.target.value })}
              >
                {companies.map((company) => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </label>

            <label>
              Level
              <select
                value={setup.level}
                onChange={(event) => onSetupChange({ ...setup, level: event.target.value })}
              >
                {levels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </label>

            <label>
              Difficulty
              <select
                value={setup.difficulty}
                onChange={(event) => onSetupChange({ ...setup, difficulty: event.target.value })}
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            </label>

            <label>
              Room
              <input
                value={setup.room}
                onChange={(event) => onSetupChange({ ...setup, room: event.target.value })}
                placeholder="demo-room"
              />
            </label>
          </div>

          {isDesignInterview && (
            <label>
              Practice problem
              <select
                value={setup.designQuestion}
                onChange={(event) => onSetupChange({ ...setup, designQuestion: event.target.value })}
              >
                {designQuestions.map((question) => (
                  <option key={question} value={question}>{question}</option>
                ))}
              </select>
            </label>
          )}

          {isBehavioralInterview && (
            <fieldset className="resume-fieldset">
              <legend>Resume context</legend>
              <label>
                Upload resume
                <input
                  type="file"
                  accept=".txt,.md,.text"
                  onChange={handleResumeFileChange}
                />
              </label>
              <label>
                Resume text
                <textarea
                  value={setup.resumeText}
                  onChange={(event) => onSetupChange({ ...setup, resumeText: event.target.value.slice(0, 8000) })}
                  placeholder="Paste resume highlights, projects, experience, and skills here."
                  rows="7"
                />
              </label>
              {resumeFileName && <p className="setup-status ready">Loaded {resumeFileName}</p>}
              {resumeFileError && <p className="error">{resumeFileError}</p>}
            </fieldset>
          )}

          {error && <p className="error">{error}</p>}
          {statusText && <p className={`setup-status ${questionStatus}`}>{statusText}</p>}

          <button className="primary-button" type="submit" disabled={!canStart || loading}>
            {loading ? 'Starting...' : 'Start practice interview'}
          </button>
        </form>
      </section>
    </main>
  );
}
