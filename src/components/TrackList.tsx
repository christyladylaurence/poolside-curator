import React, { useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import SortableTrackItem from './SortableTrackItem';
import TrackItem from './TrackItem';
import { Track } from '@/lib/audio-utils';

interface TrackListProps {
  tracks: Track[];
  allTracks: Track[];
  filter: string;
  playingId: string | null;
  scrubPercents: Record<string, number>;
  onPlay: (track: Track) => void;
  onDelete: (id: string) => void;
  onGenreCycle: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onScrub: (track: Track, pct: number) => void;
  onReorder: (newTracks: Track[]) => void;
  onLoadTracks: (files: FileList) => void;
}

const TrackList: React.FC<TrackListProps> = ({
  tracks, allTracks, filter, playingId, scrubPercents,
  onPlay, onDelete, onGenreCycle, onRename, onScrub, onReorder,
}) => {
  const visible = useMemo(
    () => tracks.filter(t => filter === 'all' || t.genre === filter),
    [tracks, filter]
  );

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const activeTrack = useMemo(
    () => visible.find(t => t.id === activeId) || null,
    [visible, activeId]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tracks.findIndex(t => t.id === active.id);
    const newIndex = tracks.findIndex(t => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(tracks, oldIndex, newIndex));
  };

  const itemIds = useMemo(() => visible.map(t => t.id), [visible]);

  return (
    <>
      <div className="tracks-header">
        <span>Tracks ({visible.length})</span>
      </div>
      <div className="tlist">
        {visible.length === 0 ? (
          <div className="empty-state">Load your tracks to begin</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              {visible.map(t => {
                const actualIdx = allTracks.findIndex(x => x.id === t.id);
                return (
                  <SortableTrackItem
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
                  />
                );
              })}
            </SortableContext>
            <DragOverlay>
              {activeTrack ? (
                <TrackItem
                  track={activeTrack}
                  displayNum={allTracks.findIndex(x => x.id === activeTrack.id) + 1}
                  isPlaying={playingId === activeTrack.id}
                  scrubPercent={scrubPercents[activeTrack.id] || 0}
                  onPlay={() => {}}
                  onDelete={() => {}}
                  onGenreCycle={() => {}}
                  onRename={() => {}}
                  onScrub={() => {}}
                  isOverlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </>
  );
};

export default TrackList;
