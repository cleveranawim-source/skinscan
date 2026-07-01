import { ArrowLeft } from 'lucide-react';

export function AppHeader({ title, onBack, rightAction }) {
  return (
    <header className="app-header">
      {onBack ? (
        <button className="icon-button" onClick={onBack} aria-label="뒤로">
          <ArrowLeft />
        </button>
      ) : (
        <span />
      )}
      <h1>{title}</h1>
      {rightAction || <span className="header-dot" aria-hidden="true" />}
    </header>
  );
}
