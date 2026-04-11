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
  
  playingId: string | null;
  scrubPercents: Record<string, number>;
  onPlay: (track: Track) => void;
  onDelete: (id: string) => void;
  onGenreCycle: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onScrub: (track: Track, pct: number) => void;
  onReorder: (newTracks: Track[]) => void;
  onLoadTracks: (files: FileList) => void;
  onToggleCutoff: (id: string) => void;
  onToggleChecked: (id: string) => void;
  onCycleEnergy: (id: string) => void;
}

const TrackList: React.FC<TrackListProps> = ({
  tracks, allTracks, playingId, scrubPercents,
  onPlay, onDelete, onGenreCycle, onRename, onScrub, onReorder, onLoadTracks, onToggleCutoff, onToggleChecked, onCycleEnergy,
}) => {
  const [fileDragOver, setFileDragOver] = React.useState(false);
  const visible = tracks;

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

  const handleFileDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFileDragOver(false);
    if (e.dataTransfer.files?.length > 0) {
      onLoadTracks(e.dataTransfer.files);
    }
  }, [onLoadTracks]);

  const handleFileDragOver = React.useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      setFileDragOver(true);
    }
  }, []);

  const handleFileDragLeave = React.useCallback((e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setFileDragOver(false);
    }
  }, []);

  return (
    <>
      <div className="tracks-header">
        <span>Tracks ({visible.length})</span>
      </div>
      <div
        className={`tlist ${fileDragOver ? 'file-drag-over' : ''}`}
        onDrop={handleFileDrop}
        onDragOver={handleFileDragOver}
        onDragLeave={handleFileDragLeave}
      >
        {visible.length === 0 ? (
          <div className="empty-state">
            {fileDragOver ? '⬇ Drop audio files here' : 'Load or drop your tracks to begin'}
          </div>
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
                    onToggleCutoff={() => onToggleCutoff(t.id)}
                    onToggleChecked={() => onToggleChecked(t.id)}
                    onCycleEnergy={() => onCycleEnergy(t.id)}
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
                  onToggleCutoff={() => {}}
                  onToggleChecked={() => {}}
                  onCycleEnergy={() => {}}
                  isOverlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
        {fileDragOver && visible.length > 0 && (
          <div className="file-drop-indicator">⬇ Drop audio files to add</div>
        )}
      </div>
    </>
  );
};

export default TrackList;
