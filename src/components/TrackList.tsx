import React from 'react';
import TrackItem from './TrackItem';
import { Track } from '@/lib/audio-utils';

interface TrackListProps {
  tracks: Track[];
  allTracks: Track[];
  filter: string;
  playingId: string | null;
  scrubPercents: Record<string, number>;
  dragOverId: string | null;
  dragPosition: 'above' | 'below' | null;
  onPlay: (track: Track) => void;
  onDelete: (id: string) => void;
  onGenreCycle: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onScrub: (track: Track, pct: number) => void;
  onDragStart: (track: Track) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, track: Track) => void;
  onDragLeave: (id: string) => void;
  onDrop: (e: React.DragEvent, track: Track) => void;
}

const TrackList: React.FC<TrackListProps> = ({
  tracks, allTracks, filter, playingId, scrubPercents,
  dragOverId, dragPosition,
  onPlay, onDelete, onGenreCycle, onRename, onScrub,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
}) => {
  const visible = tracks.filter(t => filter === 'all' || t.genre === filter);

  return (
    <>
      <div className="tracks-header">
        <span>Tracks ({visible.length})</span>
      </div>
      <div className="tlist">
        {visible.length === 0 ? (
          <div className="empty-state">Load your tracks to begin</div>
        ) : (
          visible.map(t => {
            const actualIdx = allTracks.findIndex(x => x.id === t.id);
            let dropClass = '';
            if (dragOverId === t.id && dragPosition === 'above') dropClass = 'drop-above';
            if (dragOverId === t.id && dragPosition === 'below') dropClass = 'drop-below';

            return (
              <TrackItem
                key={t.id}
                track={t}
                displayNum={actualIdx + 1}
                isPlaying={playingId === t.id}
                scrubPercent={scrubPercents[t.id] || 0}
                onPlay={() => onPlay(t)}
                onDelete={() => onDelete(t.id)}
                onGenreCycle={() => onGenreCycle(t.id)}
                onRename={name => onRename(t.id, name)}
                onScrub={pct => onScrub(t, pct)}
                onDragStart={() => onDragStart(t)}
                onDragEnd={onDragEnd}
                onDragOver={e => onDragOver(e, t)}
                onDragLeave={() => onDragLeave(t.id)}
                onDrop={e => onDrop(e, t)}
                dropClass={dropClass}
              />
            );
          })
        )}
      </div>
    </>
  );
};

export default TrackList;
