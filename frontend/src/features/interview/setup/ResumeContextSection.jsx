import React, { useState } from 'react';

import { MAX_RESUME_LENGTH } from '../../../constants/interview.js';

export function ResumeContextSection({ resumeText, onResumeTextChange }) {
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    setFileError('');

    if (!file) {
      setFileName('');
      return;
    }

    try {
      const text = await file.text();
      setFileName(file.name);
      onResumeTextChange(text.slice(0, MAX_RESUME_LENGTH));
    } catch {
      setFileName('');
      setFileError('Unable to read this resume file. Please upload a text-based resume.');
    }
  }

  return (
    <fieldset className="resume-fieldset">
      <legend>Resume context</legend>
      <label>
        Upload resume
        <input type="file" accept=".txt,.md,.text" onChange={handleFileChange} />
      </label>
      <label>
        Resume text
        <textarea
          value={resumeText}
          onChange={(event) => onResumeTextChange(
            event.target.value.slice(0, MAX_RESUME_LENGTH),
          )}
          placeholder="Paste resume highlights, projects, experience, and skills here."
          rows={7}
        />
      </label>
      {fileName && <p className="setup-status ready">Loaded {fileName}</p>}
      {fileError && <p className="error">{fileError}</p>}
    </fieldset>
  );
}
