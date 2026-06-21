import { LiveKitRoom } from '@livekit/components-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AppShell } from './components/layout/AppShell.jsx';
import { DEFAULT_INTERVIEW_SETUP } from './constants/interview.js';
import { AuthPage } from './features/auth/AuthPage.jsx';
import { DashboardPage } from './features/dashboard/DashboardPage.jsx';
import { FeedbackPage } from './features/feedback/FeedbackPage.jsx';
import { InterviewCompletionPage } from './features/interview/completion/InterviewCompletionPage.jsx';
import { InterviewHistoryPage } from './features/interview/history/InterviewHistoryPage.jsx';
import { useDsaQuestionPreview } from './features/interview/hooks/useDsaQuestionPreview.js';
import { MeetingRoom } from './features/interview/room/MeetingRoom.jsx';
import { InterviewSetupPage } from './features/interview/setup/InterviewSetupPage.jsx';
import { ProfilePage } from './features/profile/ProfilePage.jsx';
import { QuestionBankPage } from './features/questions/QuestionBankPage.jsx';
import { login, loginWithGoogle, signup, updateProfile } from './services/authService.js';
import {
  completeLiveKitSession,
  createLiveKitToken,
  listDsaQuestions,
  listMyInterviewSessions,
} from './services/interviewService.js';
import { createUserIdentity, getErrorMessage } from './utils/helpers.js';

const DEFAULT_AUTH_FORM = {
  name: '',
  email: '',
  password: '',
};

function upsertSession(sessions, nextSession) {
  if (!nextSession?.id) {
    return sessions;
  }

  const exists = sessions.some((session) => session.id === nextSession.id);
  if (!exists) {
    return [nextSession, ...sessions];
  }
  return sessions.map((session) => (
    session.id === nextSession.id ? { ...session, ...nextSession } : session
  ));
}

export default function App() {
  const [authMode, setAuthMode] = useState('signin');
  const [authForm, setAuthForm] = useState(DEFAULT_AUTH_FORM);
  const [profile, setProfile] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [setup, setSetup] = useState(DEFAULT_INTERVIEW_SETUP);
  const [joinData, setJoinData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedFeedbackInterviewId, setSelectedFeedbackInterviewId] = useState('');
  const [feedbackGeneration, setFeedbackGeneration] = useState({
    active: false,
    messageIndex: 0,
    error: '',
    interviewId: '',
  });
  const [completionState, setCompletionState] = useState({
    session: null,
    loading: false,
    error: '',
  });
  const interviewSnapshotRef = useRef({ duration: 0, messages: [] });
  const completionInFlightRef = useRef(false);

  const identity = useMemo(() => createUserIdentity(profile), [profile]);
  const { previewQuestion, questionStatus } = useDsaQuestionPreview({
    enabled: Boolean(profile && accessToken),
    accessToken,
    setup,
  });

  const refreshSessions = useCallback(() => {
    if (!accessToken) {
      setSessions([]);
      return undefined;
    }

    const controller = new AbortController();
    setSessionsLoading(true);
    listMyInterviewSessions({
      accessToken,
      limit: 50,
      signal: controller.signal,
    })
      .then(setSessions)
      .catch(() => {
        if (!controller.signal.aborted) {
          setSessions([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSessionsLoading(false);
        }
      });

    return () => controller.abort();
  }, [accessToken]);

  useEffect(() => {
    if (!profile || !accessToken) {
      return undefined;
    }
    return refreshSessions();
  }, [accessToken, profile, refreshSessions]);

  useEffect(() => {
    if (!accessToken || !sessions.some((session) => session.feedback_status === 'generating')) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      refreshSessions();
    }, 4000);

    return () => window.clearInterval(timer);
  }, [accessToken, refreshSessions, sessions]);

  useEffect(() => {
    if (!completionState.session?.id) {
      return;
    }

    const latestSession = sessions.find((session) => session.id === completionState.session.id);
    if (!latestSession) {
      return;
    }

    setCompletionState((current) => ({
      ...current,
      session: latestSession,
    }));

    if (latestSession.feedback_status !== 'generating') {
      setFeedbackGeneration((current) => (
        current.interviewId === latestSession.id
          ? { ...current, active: false }
          : current
      ));
    }
  }, [completionState.session?.id, sessions]);

  useEffect(() => {
    if (!feedbackGeneration.active) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setFeedbackGeneration((current) => ({
        ...current,
        messageIndex: current.messageIndex + 1,
      }));
    }, 1800);

    return () => window.clearInterval(timer);
  }, [feedbackGeneration.active]);

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
      setActivePage('dashboard');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to sign in right now'));
    } finally {
      setLoading(false);
    }
  }

  const submitGoogleAuth = useCallback(async (idToken) => {
    setError('');
    setLoading(true);

    try {
      const data = await loginWithGoogle(idToken);
      setAccessToken(data.access_token);
      setProfile(data.user);
      setActivePage('dashboard');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to sign in with Google right now'));
    } finally {
      setLoading(false);
    }
  }, []);

  async function saveProfile(nextProfile) {
    if (!accessToken) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      const user = await updateProfile({
        accessToken,
        name: nextProfile.name.trim(),
      });
      setProfile(user);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to update profile right now'));
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    setProfile(null);
    setAccessToken('');
    setJoinData(null);
    setError('');
    setSessions([]);
    setSelectedFeedbackInterviewId('');
    setFeedbackGeneration({ active: false, messageIndex: 0, error: '', interviewId: '' });
    setCompletionState({ session: null, loading: false, error: '' });
    setActivePage('dashboard');
  }

  const updateInterviewSnapshot = useCallback((snapshot) => {
    interviewSnapshotRef.current = snapshot;
  }, []);

  const finishCurrentInterview = useCallback(async () => {
    if (!joinData?.session_id || completionInFlightRef.current) {
      return;
    }

    const sessionId = joinData.session_id;
    const snapshot = interviewSnapshotRef.current;
    const transcriptMessages = (snapshot.messages || [])
      .filter((message) => message.text?.trim())
      .map((message) => ({
        role: message.role,
        text: message.text.trim(),
      }));

    completionInFlightRef.current = true;
    setJoinData(null);
    setSelectedFeedbackInterviewId(sessionId);
    setActivePage('completion');
    setCompletionState({
      session: {
        id: sessionId,
        company: setup.company,
        interview_type: setup.type,
        level: setup.level,
        difficulty: setup.difficulty,
        status: 'completed',
        feedback_status: 'generating',
        duration: snapshot.duration || 0,
      },
      loading: true,
      error: '',
    });
    setFeedbackGeneration({
      active: true,
      messageIndex: 0,
      error: '',
      interviewId: sessionId,
    });

    try {
      const completedSession = await completeLiveKitSession({
        accessToken,
        sessionId,
        duration: snapshot.duration || 0,
        transcriptMessages,
      });
      setSessions((current) => upsertSession(current, completedSession));
      setCompletionState({
        session: completedSession,
        loading: false,
        error: '',
      });
      refreshSessions();
      setFeedbackGeneration({
        active: completedSession.feedback_status === 'generating',
        messageIndex: 0,
        error: '',
        interviewId: sessionId,
      });
    } catch (requestError) {
      const errorMessage = getErrorMessage(requestError, 'Unable to complete this interview');
      setCompletionState((current) => ({
        ...current,
        loading: false,
        error: errorMessage,
      }));
      setFeedbackGeneration({
        active: false,
        messageIndex: 0,
        error: errorMessage,
        interviewId: sessionId,
      });
    } finally {
      completionInFlightRef.current = false;
      interviewSnapshotRef.current = { duration: 0, messages: [] };
    }
  }, [accessToken, joinData, refreshSessions, setup]);

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
      refreshSessions();
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
        onDisconnected={finishCurrentInterview}
        data-lk-theme="default"
      >
        <MeetingRoom
          interview={setup}
          selectedQuestion={joinData.selected_question || null}
          onInterviewSnapshot={updateInterviewSnapshot}
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
        onGoogleCredential={submitGoogleAuth}
      />
    );
  }

  function openFeedback(interviewId) {
    setSelectedFeedbackInterviewId(interviewId);
    setActivePage('feedback');
  }

  function openCompletionFeedback() {
    if (completionState.session?.id) {
      openFeedback(completionState.session.id);
      return;
    }
    setActivePage('feedback');
  }

  const pageContent = {
    dashboard: (
      <DashboardPage
        profile={profile}
        sessions={sessions}
        loading={sessionsLoading}
        onNavigate={setActivePage}
      />
    ),
    practice: (
      <InterviewSetupPage
        profile={profile}
        setup={setup}
        error={error}
        loading={loading}
        questionStatus={questionStatus}
        onSetupChange={setSetup}
        onBack={signOut}
        onStart={startInterview}
        onProfileUpdate={saveProfile}
        embedded
      />
    ),
    history: (
      <InterviewHistoryPage
        sessions={sessions}
        loading={sessionsLoading}
        onOpenFeedback={openFeedback}
        onStartPractice={() => setActivePage('practice')}
      />
    ),
    completion: (
      <InterviewCompletionPage
        session={completionState.session}
        loading={completionState.loading}
        error={completionState.error}
        onViewFeedback={openCompletionFeedback}
        onDashboard={() => setActivePage('dashboard')}
      />
    ),
    feedback: (
      <FeedbackPage
        accessToken={accessToken}
        sessions={sessions}
        initialInterviewId={selectedFeedbackInterviewId}
        generation={feedbackGeneration}
      />
    ),
    questions: <QuestionBankPage accessToken={accessToken} />,
    profile: (
      <ProfilePage
        profile={profile}
        loading={loading}
        onSave={saveProfile}
      />
    ),
  };

  return (
    <AppShell
      activePage={activePage}
      profile={profile}
      onNavigate={setActivePage}
      onSignOut={signOut}
    >
      {pageContent[activePage] || pageContent.dashboard}
    </AppShell>
  );
}
