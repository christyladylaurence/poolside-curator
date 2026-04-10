import React, { useRef, useState, useCallback } from 'react';

interface VideoDropScreenProps {
  visible: boolean;
  onVideoLoad: (file: File) => void;
  onSkip: () => void;
  onLoadDemo?: () => void;
}

const VideoDropScreen: React.FC<VideoDropScreenProps> = ({ visible, onVideoLoad, onSkip, onLoadDemo }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('video/')) onVideoLoad(f);
  }, [onVideoLoad]);

  return (
    <div
      className={`video-drop ${visible ? '' : 'hidden'}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={e => {
        if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setDragOver(false);
      }}
      onDrop={handleDrop}
    >
      <div className="drop-eyebrow">Poolside Sessions</div>
      <div className="drop-headline">
        Drop your Luma clip<br />to set the scene
      </div>
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        onClick={() => fileRef.current?.click()}
      >
        <p>Drop video here</p>
        <small>mp4 or mov · it'll loop in the background</small>
      </div>
      <button className="skip-link" onClick={onSkip}>
        Skip for now — no video yet
      </button>
      {onLoadDemo && (
        <button
          className="skip-link"
          onClick={onLoadDemo}
          style={{ marginTop: 4, color: 'var(--dh)' }}
        >
          ♫ Load demo tracks & skip
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onVideoLoad(f);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default VideoDropScreen;
