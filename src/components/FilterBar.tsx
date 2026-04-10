import React, { useRef } from 'react';

interface FilterBarProps {
  filter: string;
  onFilterChange: (f: string) => void;
  onLoadTracks: (files: FileList) => void;
  onClearAll: () => void;
  onLoadDemo?: () => void;
  hasTracks: boolean;
}

const filters = [
  { key: 'all', label: 'All' },
  { key: 'dh', label: 'Deep House' },
  { key: 'lf', label: 'Lo-Fi' },
  { key: 'hy', label: 'Hybrid' },
];

const FilterBar: React.FC<FilterBarProps> = ({ filter, onFilterChange, onLoadTracks, onClearAll, onLoadDemo, hasTracks }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="load-bar">
      <span className="bar-label">Filter</span>
      <div style={{ display: 'flex', gap: 6 }}>
        {filters.map(f => (
          <button
            key={f.key}
            className={`fbtn ${filter === f.key ? 'on' : ''}`}
            data-g={f.key}
            onClick={() => onFilterChange(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <button
        className="action-btn load-btn"
        onClick={() => fileRef.current?.click()}
      >
        + Load tracks
      </button>
      <button className="action-btn clear-btn" onClick={onClearAll}>
        Clear all
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => {
          if (e.target.files?.length) onLoadTracks(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default FilterBar;
