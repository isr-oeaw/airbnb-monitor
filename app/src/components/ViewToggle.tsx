import type { ViewMode } from '../types/regulation';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export default function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="view-toggle" role="group" aria-label="Kartenansicht">
      <button
        type="button"
        className={mode === 'regulation' ? 'view-toggle__btn view-toggle__btn--active' : 'view-toggle__btn'}
        aria-pressed={mode === 'regulation'}
        onClick={() => onChange('regulation')}
      >
        Regulierung
      </button>
      <button
        type="button"
        className={mode === 'impact' ? 'view-toggle__btn view-toggle__btn--active' : 'view-toggle__btn'}
        aria-pressed={mode === 'impact'}
        onClick={() => onChange('impact')}
      >
        Impact Index
      </button>
    </div>
  );
}
