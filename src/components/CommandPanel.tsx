import React, { useState } from 'react';
import { Track, fmt, YouTubeMetadata } from '@/lib/audio-utils';

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
  ytMeta?: YouTubeMetadata;
  episodeNumber?: number;
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

function CopyButton({ label, getText }: { label: string; getText: () => string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="copy-btn"
      style={{ flex: 1 }}
      onClick={() => {
        navigator.clipboard.writeText(getText());
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
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
          {(state.scheduleDate || state.leadInstrument || state.episodeNumber) && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, fontSize: 13, color: '#aaa', fontWeight: 500 }}>
              {state.episodeNumber && <span>#{state.episodeNumber}</span>}
              {state.episodeNumber && (state.scheduleDate || state.leadInstrument) && <span>·</span>}
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
              {/* YouTube Title */}
              {state.ytMeta && (
                <>
                  <div className="clbl">YouTube title</div>
                  <div className="cmd">{state.ytMeta.title}</div>
                  <CopyButton label="Copy title" getText={() => state.ytMeta!.title} />
                </>
              )}

              {/* Thumbnail suggestion */}
              {state.ytMeta && (
                <>
                  <div className="clbl">Thumbnail text</div>
                  <div className="cmd" style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.08em' }}>
                    {state.ytMeta.thumbnailText}
                  </div>
                  <CopyButton label="Copy thumbnail text" getText={() => state.ytMeta!.thumbnailText} />
                </>
              )}

              {/* Two-column: Tracklist vs YouTube Description preview */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Left: plain tracklist */}
                <div>
                  <div className="clbl" style={{ marginTop: 0 }}>Tracklist</div>
                  <div className="cmd" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 280, overflowY: 'auto', fontSize: 11 }}>
                    {state.tracks?.map((t, i) => `${i + 1}. ${t.name} (${fmt(t.dur)})`).join('\n')}
                  </div>
                  <CopyButton label="Copy tracklist" getText={() =>
                    state.tracks?.map((t, i) => `${i + 1}. ${t.name} (${fmt(t.dur)})`).join('\n') || ''
                  } />

                  {state.chapters && (
                    <>
                      <div className="clbl">YouTube chapters</div>
                      <div className="cmd" style={{ whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto', fontSize: 11 }}>
                        {state.chapters}
                      </div>
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
                </div>

                {/* Right: full YouTube description preview */}
                <div>
                  <div className="clbl" style={{ marginTop: 0 }}>YouTube description preview</div>
                  {state.ytMeta && (
                    <>
                      <div className="cmd" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 400, overflowY: 'auto', fontSize: 11 }}>
                        {state.ytMeta.description}
                      </div>
                      <CopyButton label="Copy full description" getText={() => state.ytMeta!.description} />
                    </>
                  )}

                  {/* YouTube Tags */}
                  {state.ytMeta && (
                    <>
                      <div className="clbl">YouTube tags <span style={{ opacity: 0.5 }}>({state.ytMeta.tags.length}/500)</span></div>
                      <div className="cmd" style={{ fontSize: 11 }}>{state.ytMeta.tags}</div>
                      <CopyButton label="Copy tags" getText={() => state.ytMeta!.tags} />
                    </>
                  )}
                </div>
              </div>

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
