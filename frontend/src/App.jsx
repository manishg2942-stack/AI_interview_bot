import React, { useEffect, useMemo, useState } from 'react';
import { LiveKitRoom } from '@livekit/components-react';

import { createLiveKitToken, listDsaQuestions, login, signup } from './api/client.js';
import { MeetingRoom } from './components/MeetingRoom.jsx';
import { defaultInterviewSetup } from './config/interviewOptions.js';
import { AuthScreen } from './screens/AuthScreen.jsx';
import { PracticeSetup } from './screens/PracticeSetup.jsx';

const defaultAuthForm = {
  name: '',
  email: '',
  password: '',
};

function toIdentity(profile) {
  const source = profile?.email || profile?.name || '';
  return source.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function App() {
  const [authMode, setAuthMode] = useState('signin');
  const [authForm, setAuthForm] = useState(defaultAuthForm);
  const [profile, setProfile] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [setup, setSetup] = useState(defaultInterviewSetup);
  const [joinData, setJoinData] = useState(null);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionStatus, setQuestionStatus] = useState('idle');

  const identity = useMemo(() => toIdentity(profile), [profile]);

  useEffect(() => {
    if (!profile || !accessToken || setup.type !== 'dsa') {
      setQuestionStatus('idle');
      setPreviewQuestion(null);
      return undefined;
    }

    const controller = new AbortController();

    async function checkDsaQuestions() {
      setQuestionStatus('checking');

      try {
        const questions = await listDsaQuestions({
          accessToken,
          company: setup.company,
          difficulty: setup.difficulty,
          level: setup.level,
          limit: 1,
        });
        if (!controller.signal.aborted) {
          setQuestionStatus(questions.length ? 'ready' : 'empty');
          setPreviewQuestion(questions[0] || null);
        }
      } catch {
        if (!controller.signal.aborted) {
          setQuestionStatus('unknown');
          setPreviewQuestion(null);
        }
      }
    }

    checkDsaQuestions();
    return () => controller.abort();
  }, [accessToken, profile, setup.company, setup.difficulty, setup.level, setup.type]);

  async function submitAuth(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: authForm.name.trim(),
        email: authForm.email.trim(),
        password: authForm.password,
      };
      const data = authMode === 'signup'
        ? await signup(payload)
        : await login(payload);

      setAccessToken(data.access_token);
      setProfile(data.user);
    } catch (err) {
      setError(err.message || 'Unable to sign in right now');
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

      setJoinData({
        ...data,
        selected_question: selectedQuestion,
      });
    } catch (err) {
      setError(err.message || 'Unable to join right now');
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
        video
        audio
        data-lk-theme="default"
      >
        <MeetingRoom
          interview={setup}
          selectedQuestion={joinData.selected_question}
        />
      </LiveKitRoom>
    );
  }

  if (!profile) {
    return (
      <AuthScreen
        authMode={authMode}
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
    <PracticeSetup
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
