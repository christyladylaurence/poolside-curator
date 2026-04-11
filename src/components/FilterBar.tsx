import React, { useRef } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface FilterBarProps {
  scheduleDate: Date | undefined;
  onScheduleDateChange: (d: Date | undefined) => void;
  onLoadTracks: (files: FileList) => void;
  onClearAll: () => void;
  onLoadDemo?: () => void;
  hasTracks: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ scheduleDate, onScheduleDateChange, onLoadTracks, onClearAll, onLoadDemo, hasTracks }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="load-bar">
      <span className="bar-label">Schedule</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[200px] justify-start text-left font-normal",
              !scheduleDate && "text-muted-foreground"
            )}
            style={{ height: 32, fontSize: 13 }}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {scheduleDate ? format(scheduleDate, 'dd/MM/yyyy') : 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={scheduleDate}
            onSelect={onScheduleDateChange}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      <button
        className="action-btn load-btn"
        onClick={() => fileRef.current?.click()}
      >
        + Load tracks
      </button>
      <button className="action-btn clear-btn" onClick={onClearAll}>
        Clear all
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => {
          if (e.target.files?.length) onLoadTracks(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default FilterBar;
