import React from 'react';
import { BrandMark } from '../components/BrandMark.jsx';
import { OptionButton } from '../components/OptionButton.jsx';
import {
  companies,
  difficulties,
  interviewTypes,
  levels,
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
  const canStart = setup.type && setup.company && setup.level && setup.difficulty && setup.room.trim();
  const statusText = {
    checking: 'Checking matching DSA question...',
    ready: 'Matching DSA question ready.',
    empty: 'No exact DSA question match found. Backend will try fallback questions.',
    unknown: 'Question check unavailable. You can still start.',
  }[questionStatus];

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
                  onClick={() => onSetupChange({ ...setup, type: type.value })}
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
