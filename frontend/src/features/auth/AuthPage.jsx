import React, { useEffect, useRef, useState } from 'react';

import { BrandMark } from '../../components/layout/BrandMark.jsx';
//const googleClientId = "341855789128-dub710ttmqudn0hfr2s59d6ovq331iu9.apps.googleusercontent.com";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;



export function AuthPage({
  mode,
  form,
  error,
  loading,
  onModeChange,
  onFormChange,
  onSubmit,
  onGoogleCredential,
}) {
  const isSignup = mode === 'signup';
  const googleButtonRef = useRef(null);
  const [googleUnavailable, setGoogleUnavailable] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const canContinue = Boolean(
    form.email.trim()
    && form.password.trim().length >= 6
    && (!isSignup || form.name.trim()),
  );

  useEffect(() => {
    if (!googleClientId) {
      return undefined;
    }

    let cancelled = false;

    function renderGoogleButton() {
      if (cancelled || !window.google || !googleButtonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (response.credential) {
            onGoogleCredential(response.credential);
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: googleButtonRef.current.offsetWidth || 320,
      });
    }

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => setGoogleUnavailable(true);
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [googleClientId, onGoogleCredential]);

  function updateField(field, value) {
    onFormChange({ ...form, [field]: value });
  }

  return (
    <main className="auth-shell">
      <section className="auth-visual" aria-label="Interview practice workspace">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80"
        // src="https://www.magnific.com/free-photos-vectors/ai-job-interview?auto=format&fit=crop&w=1400&q=80"
          alt=""
        />
       
        <div className="visual-copy">
           
          <h1>CODINGACE </h1>
          <h2>AI INTERVIEW PLATFORM</h2>

          <h2>
            Practice Real Technical Interviews with AI.
          </h2>

          <p>
            Sharpen your coding, system design, and behavioral skills through
            realistic AI-powered interview simulations designed for software engineers.
          </p>
        </div>
      </section>

      <section className="auth-panel" aria-label={isSignup ? 'Create account' : 'Sign in'}>
        <BrandMark />
        <div className="auth-card">
          <div className="segmented" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={mode === 'signin' ? 'active' : ''}
              onClick={() => onModeChange('signin')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={isSignup ? 'active' : ''}
              onClick={() => onModeChange('signup')}
            >
              Sign up
            </button>
          </div>

          <form className="stack-form" onSubmit={onSubmit}>
            <div>
              <h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2>
              <p>{isSignup ? 'Set up your practice profile.' : 'Continue to your practice setup.'}</p>
            </div>

            {isSignup && (
              <label>
                Full name
                <input
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Manish Gupta"
                  autoComplete="name"
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder="Minimum 6 characters"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
            </label>

            {error && <p className="error">{error}</p>}
            <button className="primary-button" type="submit" disabled={!canContinue || loading}>
              {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
            </button>

            {googleClientId && (
              <div className="google-auth-section">
                <div className="auth-divider"><span>or</span></div>
                <div ref={googleButtonRef} className="google-button-slot" />
                {googleUnavailable && (
                  <p className="auth-help">Google sign-in could not load. Use email/password for now.</p>
                )}
              </div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
