import React from 'react';
import { Track, fmt } from '@/lib/audio-utils';

export interface CommandPanelState {
  open: boolean;
  title: string;
  phase: 'building' | 'ready' | 'error';
  scheduleDate?: string;
  leadInstrument?: string;
  progressText?: string;
  progressPct?: number;
  chapters?: string;
  srtText?: string;
  tracks?: Track[];
  wavBlob?: Blob;
  wavFilename?: string;
  errorMsg?: string;
  hasVideo?: boolean;
  videoLabel?: string;
  mp4Status?: string;
  mp4ProgPct?: number;
  mp4Blob?: Blob;
  mp4Filename?: string;
  mp4Building?: boolean;
  mp4Url?: string;
}

interface CommandPanelProps {
  state: CommandPanelState;
  videoUrl?: string | null;
  onClose: () => void;
  onDownloadWav: () => void;
  onCopyChapters: () => void;
  onDownloadSrt: () => void;
  onBuildMp4: () => void;
  onDownloadMp4: () => void;
}

const CommandPanel: React.FC<CommandPanelProps> = ({
  state, videoUrl, onClose, onDownloadWav, onCopyChapters, onDownloadSrt, onBuildMp4, onDownloadMp4,
}) => {
  if (!state.open) return null;

  return (
    <div className={`cpanel ${state.open ? 'on' : ''}`}>
      {videoUrl && (
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'fixed',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: -1,
            opacity: 0.35,
          }}
        />
      )}
      <div className="cbox">
        <div className="chead">
          <div className="ctitle">{state.title}</div>
          <button className="closex" onClick={onClose}>✕</button>
        </div>
        <div className="cbody">
          {(state.scheduleDate || state.leadInstrument) && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, fontSize: 13, color: '#aaa', fontWeight: 500 }}>
              {state.scheduleDate && <span>{state.scheduleDate}</span>}
              {state.scheduleDate && state.leadInstrument && <span>·</span>}
              {state.leadInstrument && <span>Lead: {state.leadInstrument}</span>}
            </div>
          )}
          {state.phase === 'building' && (
            <>
              <div className="progress-text">{state.progressText}</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${state.progressPct || 0}%` }} />
              </div>
            </>
          )}

          {state.phase === 'error' && (
            <>
              <div className="cmd" style={{ color: '#d97a7a' }}>{state.errorMsg}</div>
              <button className="copy-btn" onClick={onClose}>Close</button>
            </>
          )}

          {state.phase === 'ready' && (
            <>
              <div className="clbl">Track order</div>
              <div className="order-list">
                {state.tracks?.map((t, i) => (
                  <div key={t.id} className="order-item">
                    <span className="num">{i + 1}.</span>
                    <span>{t.name}</span>
                    <span className="dur">{fmt(t.dur)}</span>
                  </div>
                ))}
              </div>

              {state.chapters && (
                <>
                  <div className="clbl">YouTube chapters</div>
                  <div className="cmd" style={{ cursor: 'pointer' }} title="Click to copy"
                    dangerouslySetInnerHTML={{ __html: state.chapters.replace(/\n/g, '<br>') }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="copy-btn" style={{ flex: 1 }} onClick={onCopyChapters}>
                      Copy chapters
                    </button>
                    <button className="copy-btn" style={{ flex: 1 }} onClick={onDownloadSrt}>
                      Download SRT
                    </button>
                  </div>
                </>
              )}

              {state.hasVideo && !state.mp4Blob && !state.mp4Building && (
                <button
                  className="download-btn mp4-btn"
                  onClick={onBuildMp4}
                >
                  🎬 Build video (MP4) at {state.videoLabel} — ready for YouTube
                </button>
              )}

              {state.mp4Status && (
                <div className={`mp4-status on`}>
                  <span>{state.mp4Status}</span>
                  {state.mp4ProgPct !== undefined && state.mp4ProgPct < 100 && (
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${state.mp4ProgPct}%` }} />
                    </div>
                  )}
                </div>
              )}

              {state.mp4Blob && (
                <button className="download-btn" onClick={onDownloadMp4}>
                  ⬇ Download MP4
                </button>
              )}

              <button className="download-btn" onClick={onDownloadWav}>
                ⬇ Download audio only (WAV)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPanel;
