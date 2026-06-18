import React from 'react';

import { BrandMark } from '../../components/layout/BrandMark.jsx';

export function AuthPage({
  mode,
  form,
  error,
  loading,
  onModeChange,
  onFormChange,
  onSubmit,
}) {
  const isSignup = mode === 'signup';
  const canContinue = Boolean(
    form.email.trim()
    && form.password.trim().length >= 6
    && (!isSignup || form.name.trim()),
  );

  function updateField(field, value) {
    onFormChange({ ...form, [field]: value });
  }

  return (
    <main className="auth-shell">
      <section className="auth-visual" aria-label="Interview practice workspace">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80"
          alt=""
        />
        <div className="visual-copy">
          <p>AI interview practice</p>
          <h1>Prepare with a focused voice interview before the real one.</h1>
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
          </form>
        </div>
      </section>
    </main>
  );
}
