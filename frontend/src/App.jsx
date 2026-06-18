import { LiveKitRoom } from '@livekit/components-react';
import React, { useMemo, useState } from 'react';

import { DEFAULT_INTERVIEW_SETUP } from './constants/interview.js';
import { AuthPage } from './features/auth/AuthPage.jsx';
import { useDsaQuestionPreview } from './features/interview/hooks/useDsaQuestionPreview.js';
import { MeetingRoom } from './features/interview/room/MeetingRoom.jsx';
import { InterviewSetupPage } from './features/interview/setup/InterviewSetupPage.jsx';
import { login, signup } from './services/authService.js';
import { createLiveKitToken, listDsaQuestions } from './services/interviewService.js';
import { createUserIdentity, getErrorMessage } from './utils/helpers.js';

const DEFAULT_AUTH_FORM = {
  name: '',
  email: '',
  password: '',
};

export default function App() {
  const [authMode, setAuthMode] = useState('signin');
  const [authForm, setAuthForm] = useState(DEFAULT_AUTH_FORM);
  const [profile, setProfile] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [setup, setSetup] = useState(DEFAULT_INTERVIEW_SETUP);
  const [joinData, setJoinData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const identity = useMemo(() => createUserIdentity(profile), [profile]);
  const { previewQuestion, questionStatus } = useDsaQuestionPreview({
    enabled: Boolean(profile && accessToken),
    accessToken,
    setup,
  });

  async function submitAuth(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credentials = {
        email: authForm.email.trim(),
        password: authForm.password,
      };
      const data = authMode === 'signup'
        ? await signup({ ...credentials, name: authForm.name.trim() })
        : await login(credentials);

      setAccessToken(data.access_token);
      setProfile(data.user);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to sign in right now'));
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    setProfile(null);
    setAccessToken('');
    setJoinData(null);
    setError('');
  }

  async function startInterview(event) {
    event.preventDefault();
    if (!profile) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await createLiveKitToken({
        accessToken,
        identity: identity || 'practice-user',
        name: profile.name,
        room: setup.room.trim(),
        interview: {
          type: setup.type,
          company: setup.company,
          level: setup.level,
          difficulty: setup.difficulty,
          design_question: setup.designQuestion,
          resume_text: setup.resumeText,
        },
      });

      let selectedQuestion = data.selected_question || previewQuestion;
      if (!selectedQuestion && setup.type === 'dsa') {
        const questions = await listDsaQuestions({
          accessToken,
          company: setup.company,
          difficulty: setup.difficulty,
          level: setup.level,
          limit: 1,
        });
        selectedQuestion = questions[0] || null;
      }

      setJoinData({ ...data, selected_question: selectedQuestion });
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to join right now'));
    } finally {
      setLoading(false);
    }
  }

  if (joinData) {
    return (
      <LiveKitRoom
        token={joinData.token}
        serverUrl={joinData.url}
        connect
        video={false}
        audio
        data-lk-theme="default"
      >
        <MeetingRoom
          interview={setup}
          selectedQuestion={joinData.selected_question || null}
        />
      </LiveKitRoom>
    );
  }

  if (!profile) {
    return (
      <AuthPage
        mode={authMode}
        form={authForm}
        error={error}
        loading={loading}
        onModeChange={setAuthMode}
        onFormChange={setAuthForm}
        onSubmit={submitAuth}
      />
    );
  }

  return (
    <InterviewSetupPage
      profile={profile}
      setup={setup}
      error={error}
      loading={loading}
      questionStatus={questionStatus}
      onSetupChange={setSetup}
      onBack={signOut}
      onStart={startInterview}
    />
  );
}
