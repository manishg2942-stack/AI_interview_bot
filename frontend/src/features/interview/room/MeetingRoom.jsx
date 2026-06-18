import { ControlBar, RoomAudioRenderer } from '@livekit/components-react';
import React, { useMemo, useState } from 'react';

import { INTERVIEW_DURATION_SECONDS } from '../../../constants/editor.js';
import { formatDuration, useInterviewTimer } from '../hooks/useInterviewTimer.js';
import { useTranscript } from '../hooks/useTranscript.js';
import { CallRail } from './CallRail.jsx';
import { CodeEditorPanel } from './CodeEditorPanel.jsx';
import { QuestionPanel } from './QuestionPanel.jsx';
import { buildStarterCode, getQuestionContent } from './questionContent.js';

export function MeetingRoom({ interview, selectedQuestion }) {
  const [code, setCode] = useState(() => buildStarterCode(selectedQuestion, interview));
  const [messageDraft, setMessageDraft] = useState('');
  const elapsedSeconds = useInterviewTimer(INTERVIEW_DURATION_SECONDS);
  const { messages, liveUserTranscript, transcriptEndRef } = useTranscript();
  const isDsaInterview = interview.type === 'dsa';

  const interviewLabel = useMemo(
    () => `${interview.company} / ${interview.type.toUpperCase()}`,
    [interview.company, interview.type],
  );
  const questionContent = useMemo(
    () => getQuestionContent(interview, selectedQuestion),
    [interview, selectedQuestion],
  );

  return (
    <main className="room-shell">
      <header className="interview-header">
        <div className="interview-clock">
          <span>
            {formatDuration(elapsedSeconds)} / {formatDuration(INTERVIEW_DURATION_SECONDS)}
          </span>
          <strong>{interview.type.toUpperCase()}</strong>
        </div>
        <div className="interview-topic">
          <span>Introduction</span>
          <strong>{interviewLabel}</strong>
        </div>
      </header>

      <div className="room-workspace">
        <QuestionPanel
          interviewLabel={interviewLabel}
          title={questionContent.title}
          statement={questionContent.statement}
          question={selectedQuestion}
        />
        <CodeEditorPanel
          isDsaInterview={isDsaInterview}
          code={code}
          onCodeChange={setCode}
        />
        <CallRail
          messages={messages}
          liveUserTranscript={liveUserTranscript}
          transcriptEndRef={transcriptEndRef}
        />
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
