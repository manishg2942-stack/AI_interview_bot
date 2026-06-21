import React, { useEffect, useState } from 'react';

export function ProfilePage({ profile, loading, onSave }) {
  const [name, setName] = useState(profile.name);

  useEffect(() => {
    setName(profile.name);
  }, [profile.name]);

  async function submitProfile(event) {
    event.preventDefault();
    await onSave({ name });
  }

  return (
    <div className="profile-page-grid">
      <section className="content-card profile-summary-card">
        <div className="profile-avatar">{profile.name.charAt(0).toUpperCase()}</div>
        <h3>{profile.name}</h3>
        <p>{profile.email}</p>
        <span>{profile.auth_provider === 'google' ? 'Google account' : 'Email account'}</span>
      </section>

      <section className="content-card">
        <div className="card-heading">
          <div>
            <p>Profile</p>
            <h3>Update your public details</h3>
          </div>
        </div>

        <form className="profile-form" onSubmit={submitProfile}>
          <label>
            Display name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={100}
              autoComplete="name"
            />
          </label>
          <label>
            Email
            <input value={profile.email} disabled />
          </label>
          <button className="primary-button" type="submit" disabled={loading || name.trim().length < 2}>
            {loading ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </section>
    </div>
  );
}
