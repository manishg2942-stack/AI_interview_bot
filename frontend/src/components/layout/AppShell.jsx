import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import '../../styles/layout.css';
import { BrandMark } from './BrandMark.jsx';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/practice', label: 'Practice' },
  { path: '/history', label: 'History' },
  { path: '/feedback', label: 'Feedback' },
  { path: '/questions', label: 'Questions' },
  { path: '/profile', label: 'Profile' },
];

export function AppShell({ profile, onSignOut }) {
  const location = useLocation();
  const activeItem = NAV_ITEMS.find((item) => item.path === location.pathname) || NAV_ITEMS[0];

  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <BrandMark />
        <nav className="app-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-profile">
          <span>{profile?.name?.charAt(0).toUpperCase() || '?'}</span>
          <div>
            <strong>{profile?.name}</strong>
            <p>{profile?.email}</p>
          </div>
        </div>
      </aside>

      <section className="app-main">
        <header className="app-header">
          <div>
            <p>AI interview workspace</p>
            <h1>{activeItem.label}</h1>
          </div>
          <button type="button" className="ghost-button" onClick={onSignOut}>Sign out</button>
        </header>
        <div className="app-content">
          <Outlet />
        </div>
      </section>
    </main>
  );
}
