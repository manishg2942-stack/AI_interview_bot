import React from 'react';

export function OptionButton({ selected, title, detail, onClick, badge = 0, active = false }) {
  return (
    <button
      type="button"
      className={`option-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ position: 'relative' }}
    >
      {active && <span className="option-card-dot" aria-hidden />}
      <span className="option-card-badge" aria-hidden>
        {badge}
      </span>
      <span>{title}</span>
      <small>{detail}</small>
    </button>
  );
}
