import React from 'react';

interface AppHeaderProps {
  hasVideo: boolean;
  videoSkipped: boolean;
  onChangeVideo: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ hasVideo, videoSkipped, onChangeVideo }) => {
  const showBtn = hasVideo || videoSkipped;
  return (
    <header className="app-header">
      <div>
        <div className="wordmark">Poolside Sessions</div>
        <h1 className="app-title">Track <em>Curator</em></h1>
      </div>
      {showBtn && (
        <button className="change-video-btn" onClick={onChangeVideo}>
          ↺ {hasVideo ? 'Change video' : 'Add video'}
        </button>
      )}
    </header>
  );
};

export default AppHeader;
