import React from 'react';
import { computeRuntime, Track, EnhanceMode } from '@/lib/audio-utils';

interface FooterBarProps {
  tracks: Track[];
  crossfadeDuration: number;
  onCrossfadeChange: (val: number) => void;
  nowPlaying: string | null;
  enhanceMode: EnhanceMode;
  onEnhance: () => void;
  onBuild: () => void;
}

const enhanceLabels: Record<EnhanceMode, string> = {
  off: 'Enhance for YouTube',
  standard: '🔄 Switch to Chill Mode',
  chill: 'Undo enhance',
};

const FooterBar: React.FC<FooterBarProps> = ({
  tracks, crossfadeDuration, onCrossfadeChange,
  nowPlaying, enhanceMode, onEnhance, onBuild,
}) => {
  const runtime = computeRuntime(tracks, crossfadeDuration);

  return (
    <div className="app-footer">
      <div className="fstats">
        <div className="fstat">
          <div className="fval">{tracks.length}</div>
          <div className="flbl">Tracks</div>
        </div>
        <div className="fdiv" />
        <div className="fstat">
          <div className="fval">{runtime}</div>
          <div className="flbl">Runtime</div>
        </div>
      </div>
      <div className="fdiv" />
      <div className="cfade-input">
        <div className="cfade-label">Crossfade</div>
        <input
          type="number"
          className="cfade-val"
          min={0.1}
          max={10}
          step={0.1}
          value={crossfadeDuration}
          onChange={e => onCrossfadeChange(parseFloat(e.target.value) || 3)}
        />
      </div>
      <div className="fdiv" />
      <div className="fnow">
        <div className="fnow-lbl">Now playing</div>
        <div className={`fnow-name ${nowPlaying ? '' : 'muted'}`}>
          {nowPlaying || '— nothing playing'}
        </div>
      </div>
      <button
        className={`enhance-btn ${enhanceMode !== 'off' ? 'enhanced' : ''} ${enhanceMode === 'chill' ? 'chill' : ''}`}
        disabled={!tracks.length}
        onClick={onEnhance}
      >
        {enhanceLabels[enhanceMode]}
      </button>
      <button
        className="build-btn"
        disabled={!tracks.length}
        onClick={onBuild}
      >
        Build Episode →
      </button>
    </div>
  );
};

export default FooterBar;
