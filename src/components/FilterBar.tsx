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
  leadInstrument: string;
  onLeadInstrumentChange: (v: string) => void;
  onLoadTracks: (files: FileList) => void;
  onClearAll: () => void;
  onLoadDemo?: () => void;
  hasTracks: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ scheduleDate, onScheduleDateChange, leadInstrument, onLeadInstrumentChange, onLoadTracks, onClearAll, onLoadDemo, hasTracks }) => {
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
      <span className="bar-label">Lead</span>
      <input
        type="text"
        className="lead-instrument-input"
        placeholder="e.g. flute, nylon guitar"
        value={leadInstrument}
        onChange={e => onLeadInstrumentChange(e.target.value)}
        style={{ height: 32, fontSize: 13, width: 180, borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'inherit', padding: '0 8px' }}
      />
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
