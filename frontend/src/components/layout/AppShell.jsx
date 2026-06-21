import React from 'react';

import { BrandMark } from './BrandMark.jsx';

const NAV_ITEMS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'practice', label: 'Practice' },
  { value: 'history', label: 'History' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'questions', label: 'Questions' },
  { value: 'profile', label: 'Profile' },
];

export function AppShell({ activePage, profile, onNavigate, onSignOut, children }) {
  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <BrandMark />
        <nav className="app-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={activePage === item.value ? 'active' : ''}
              onClick={() => onNavigate(item.value)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-profile">
          <span>{profile.name.charAt(0).toUpperCase()}</span>
          <div>
            <strong>{profile.name}</strong>
            <p>{profile.email}</p>
          </div>
        </div>
      </aside>

      <section className="app-main">
        <header className="app-header">
          <div>
            <p>AI interview workspace</p>
            <h1>{NAV_ITEMS.find((item) => item.value === activePage)?.label || 'Dashboard'}</h1>
          </div>
          <button type="button" className="ghost-button" onClick={onSignOut}>Sign out</button>
        </header>
        <div className="app-content">{children}</div>
      </section>
    </main>
  );
}
