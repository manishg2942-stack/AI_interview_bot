import { ControlBar, RoomAudioRenderer, useRoomContext } from '@livekit/components-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../../../styles/room.css';

import { INTERVIEW_DURATION_SECONDS } from '../../../constants/editor.js';
import { formatDuration, useInterviewTimer } from '../hooks/useInterviewTimer.js';
import { useTranscript } from '../hooks/useTranscript.js';
import { CallRail } from './CallRail.jsx';
import { CodeEditorPanel } from './CodeEditorPanel.jsx';
import { QuestionPanel } from './QuestionPanel.jsx';
import { buildStarterCode, getQuestionContent } from './questionContent.js';

export function MeetingRoom({ interview, selectedQuestion, onInterviewSnapshot }) {
  const [code, setCode] = useState(() => buildStarterCode(selectedQuestion, interview));
  const [messageDraft, setMessageDraft] = useState('');
  const [showTranscript, setShowTranscript] = useState(true);
  const elapsedSeconds = useInterviewTimer(INTERVIEW_DURATION_SECONDS);
  const { messages, liveUserTranscript, transcriptEndRef } = useTranscript();
  const room = useRoomContext();
  const autoEndedRef = useRef(false);
  const isDsaInterview = interview.type === 'dsa';

  const interviewLabel = useMemo(
    () => `${interview.company} / ${interview.type.toUpperCase()}`,
    [interview.company, interview.type],
  );
  const questionContent = useMemo(
    () => getQuestionContent(interview, selectedQuestion),
    [interview, selectedQuestion],
  );

  useEffect(() => {
    onInterviewSnapshot?.({
      duration: elapsedSeconds,
      messages,
    });
  }, [elapsedSeconds, messages, onInterviewSnapshot]);

  useEffect(() => {
    if (elapsedSeconds < INTERVIEW_DURATION_SECONDS || autoEndedRef.current) {
      return;
    }

    autoEndedRef.current = true;
    room.disconnect();
  }, [elapsedSeconds, room]);

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
          showTranscript={showTranscript}
          onToggleTranscript={() => setShowTranscript(!showTranscript)}
        />
        <CallRail
          messages={messages}
          liveUserTranscript={liveUserTranscript}
          transcriptEndRef={transcriptEndRef}
          showTranscript={showTranscript}
          onToggleTranscript={() => setShowTranscript(!showTranscript)}
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
