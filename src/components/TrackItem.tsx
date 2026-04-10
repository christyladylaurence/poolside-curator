import React, { useState, useRef, useCallback } from 'react';
import { Track, Genre, fmt } from '@/lib/audio-utils';

export interface TrackItemProps {
  track: Track;
  displayNum: number;
  isPlaying: boolean;
  scrubPercent: number;
  onPlay: () => void;
  onDelete: () => void;
  onGenreCycle: () => void;
  onRename: (newName: string) => void;
  onScrub: (pct: number) => void;
  onToggleCutoff: () => void;
  isOverlay?: boolean;
  sortableProps?: Record<string, any>;
}

const genreLabels: Record<Genre, string> = { dh: 'DH', lf: 'LF', hy: 'HY' };

const TrackItem: React.FC<TrackItemProps> = ({
  track, displayNum, isPlaying, scrubPercent,
  onPlay, onDelete, onGenreCycle, onRename, onScrub, onToggleCutoff,
  isOverlay, sortableProps,
}) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(track.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(track.name);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }, [track.name]);

  const commitEdit = useCallback(() => {
    const v = editValue.trim() || track.name;
    onRename(v);
    setEditing(false);
  }, [editValue, track.name, onRename]);

  const handleScrubClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onScrub(pct);
  }, [onScrub]);

  return (
    <div
      {...(sortableProps || {})}
      ref={sortableProps?.ref}
      className={`track-row ${track.cutoff ? 'cutoff-active' : ''}`}
    >
      <div className={`track ${isPlaying ? 'playing' : ''} ${isOverlay ? 'drag-overlay' : ''}`}>
        <div className="track-main">
          <div className="tnum">{displayNum}.</div>
          <div className="handle" style={{ cursor: 'grab', touchAction: 'none' }}>⠿</div>
          <button className="pbtn" onClick={e => { e.stopPropagation(); onPlay(); }}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <div className="tinfo">
            {editing ? (
              <input
                ref={inputRef}
                className="tname-input"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  if (e.key === 'Escape') { setEditValue(track.name); setEditing(false); }
                }}
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <div className="tname" onClick={startEdit}>{track.name}</div>
            )}
            <div className="tmeta">{track.date || track.genre.toUpperCase()}</div>
          </div>
          <div className="vis">
            {[0, 1, 2, 3, 4].map(i => <div key={i} className="vb" />)}
          </div>
          <div
            className={`gpip ${track.genre}`}
            title={`Click to change genre: ${genreLabels[track.genre]}`}
            onClick={e => { e.stopPropagation(); onGenreCycle(); }}
          />
          <div className="tdur">{fmt(track.dur)}</div>
          <button className="del-btn" onClick={e => { e.stopPropagation(); onDelete(); }} title="Remove track">
            ✕
          </button>
        </div>
        <div className="scrub-bar-container" onClick={handleScrubClick}>
          <div className="scrub-bar-fill" style={{ width: `${scrubPercent}%` }} />
        </div>
      </div>
      <button
        className={`cutoff-side-btn ${track.cutoff ? 'active' : ''}`}
        onClick={e => { e.stopPropagation(); onToggleCutoff(); }}
        title={track.cutoff ? 'Marked as cut off — click to clear' : 'Mark as cut off'}
      >
        ✂
      </button>
    </div>
  );
};

export default TrackItem;
