import React, { useEffect, useState } from 'react';

import { BrandMark } from '../../../components/layout/BrandMark.jsx';
import { OptionButton } from '../../../components/ui/OptionButton.jsx';
import {
  COMPANIES,
  DIFFICULTIES,
  HLD_QUESTIONS,
  INTERVIEW_TYPES,
  LEVELS,
  LLD_QUESTIONS,
  QUESTION_STATUS_TEXT,
} from '../../../constants/interview.js';
import { ResumeContextSection } from './ResumeContextSection.jsx';

export function InterviewSetupPage({
  profile,
  setup,
  error,
  loading,
  questionStatus,
  onSetupChange,
  onBack,
  onStart,
  onProfileUpdate,
  embedded = false,
}) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(profile.name);
  const isDesignInterview = setup.type === 'lld' || setup.type === 'hld';
  const isBehavioralInterview = setup.type === 'behavioral';
  const designQuestions = setup.type === 'hld' ? HLD_QUESTIONS : LLD_QUESTIONS;
  const statusText = QUESTION_STATUS_TEXT[questionStatus];
  const canStart = Boolean(
    setup.type
    && setup.company
    && setup.level
    && setup.difficulty
    && setup.room.trim()
    && (!isDesignInterview || setup.designQuestion),
  );

  function updateSetup(field, value) {
    onSetupChange({ ...setup, [field]: value });
  }

  useEffect(() => {
    setProfileName(profile.name);
  }, [profile.name]);

  async function submitProfileUpdate(event) {
    event.preventDefault();
    if (!profileName.trim() || profileName.trim() === profile.name) {
      setEditingProfile(false);
      return;
    }

    await onProfileUpdate({ name: profileName });
    setEditingProfile(false);
  }

  function changeInterviewType(nextType) {
    const nextDesignQuestion = nextType === 'hld' ? HLD_QUESTIONS[0] : LLD_QUESTIONS[0];
    onSetupChange({
      ...setup,
      type: nextType,
      designQuestion: nextType === 'lld' || nextType === 'hld'
        ? nextDesignQuestion
        : setup.designQuestion,
    });
  }

  const content = (
      <section className={`setup-grid${embedded ? ' embedded-setup-grid' : ''}`}>
        <aside className="profile-panel">
          <p>Signed in as</p>
          {editingProfile ? (
            <form className="profile-edit-form" onSubmit={submitProfileUpdate}>
              <label>
                Display name
                <input
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  autoComplete="name"
                />
              </label>
              <div className="profile-edit-actions">
                <button type="submit" className="primary-button" disabled={loading || profileName.trim().length < 2}>
                  Save
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    setProfileName(profile.name);
                    setEditingProfile(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1>{profile.name}</h1>
              <button type="button" className="text-button" onClick={() => setEditingProfile(true)}>
                Edit profile
              </button>
            </>
          )}
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
              {INTERVIEW_TYPES.map((type) => (
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
              <select value={setup.company} onChange={(event) => updateSetup('company', event.target.value)}>
                {COMPANIES.map((company) => <option key={company}>{company}</option>)}
              </select>
            </label>
            <label>
              Level
              <select value={setup.level} onChange={(event) => updateSetup('level', event.target.value)}>
                {LEVELS.map((level) => <option key={level}>{level}</option>)}
              </select>
            </label>
            <label>
              Difficulty
              <select
                value={setup.difficulty}
                onChange={(event) => updateSetup('difficulty', event.target.value)}
              >
                {DIFFICULTIES.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}
              </select>
            </label>
            <label>
              Room
              <input
                value={setup.room}
                onChange={(event) => updateSetup('room', event.target.value)}
                placeholder="demo-room"
              />
            </label>
          </div>

          {isDesignInterview && (
            <label>
              Practice problem
              <select
                value={setup.designQuestion}
                onChange={(event) => updateSetup('designQuestion', event.target.value)}
              >
                {designQuestions.map((question) => <option key={question}>{question}</option>)}
              </select>
            </label>
          )}

          {isBehavioralInterview && (
            <ResumeContextSection
              resumeText={setup.resumeText}
              onResumeTextChange={(resumeText) => updateSetup('resumeText', resumeText)}
            />
          )}

          {error && <p className="error">{error}</p>}
          {statusText && <p className={`setup-status ${questionStatus}`}>{statusText}</p>}
          <button className="primary-button" type="submit" disabled={!canStart || loading}>
            {loading ? 'Starting...' : 'Start practice interview'}
          </button>
        </form>
      </section>
  );

  if (embedded) {
    return content;
  }

  return (
    <main className="setup-shell">
      <header className="topbar">
        <BrandMark />
        <button type="button" className="ghost-button" onClick={onBack}>Sign out</button>
      </header>

      {content}
    </main>
  );
}
