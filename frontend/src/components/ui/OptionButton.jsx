import React from 'react';

export function OptionButton({ selected, title, detail, onClick }) {
  return (
    <button
      type="button"
      className={`option-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <span>{title}</span>
      <small>{detail}</small>
    </button>
  );
}
