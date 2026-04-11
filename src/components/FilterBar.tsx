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
  episodeNumber: number;
  onEpisodeNumberChange: (n: number) => void;
  onLoadTracks: (files: FileList) => void;
  onClearAll: () => void;
  onLoadDemo?: () => void;
  hasTracks: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ scheduleDate, onScheduleDateChange, leadInstrument, onLeadInstrumentChange, episodeNumber, onEpisodeNumberChange, onLoadTracks, onClearAll, onLoadDemo, hasTracks }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="load-bar">
      <span className="bar-label">Schedule</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-8 w-[180px] justify-start text-left text-[13px] font-normal rounded-md border-input bg-background",
              !scheduleDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-60" />
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
        className="h-8 w-[180px] rounded-md border border-input bg-background text-[13px] text-foreground placeholder:text-muted-foreground px-3 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
        placeholder="e.g. flute, nylon guitar"
        value={leadInstrument}
        onChange={e => onLeadInstrumentChange(e.target.value)}
      />
      <span className="bar-label">Ep #</span>
      <input
        type="number"
        className="h-8 w-[60px] rounded-md border border-input bg-background text-[13px] text-foreground placeholder:text-muted-foreground px-3 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background text-center"
        value={episodeNumber}
        min={1}
        onChange={e => onEpisodeNumberChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
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
