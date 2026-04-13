import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TrackItem, { TrackItemProps } from './TrackItem';

type SortableTrackItemProps = Omit<TrackItemProps, 'isOverlay' | 'sortableProps'>;

const SortableTrackItem: React.FC<SortableTrackItemProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.track.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 0 : 'auto',
    willChange: isDragging ? 'transform' : undefined,
  };

  return (
    <TrackItem
      {...props}
      sortableProps={{ ref: setNodeRef, style, ...attributes, ...listeners }}
    />
  );
};

export default SortableTrackItem;
