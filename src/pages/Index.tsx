import React, { useState, useRef, useCallback, useEffect } from 'react';
import BackgroundVideo from '@/components/BackgroundVideo';
import VideoDropScreen from '@/components/VideoDropScreen';
import AppHeader from '@/components/AppHeader';
import FilterBar from '@/components/FilterBar';
import TrackList from '@/components/TrackList';
import FooterBar from '@/components/FooterBar';
import CommandPanel, { CommandPanelState } from '@/components/CommandPanel';
import { saveVideo, loadVideo, clearVideo, saveTracks, loadTracks, clearTracks } from '@/lib/video-store';
import {
  Track, Genre, cleanName, cleanNameForYouTube, detectGenre, dateOf,
  fmt, fmtSRT, getResLabel, sortTracksByPrefix, getRotatingSuffix, createWAVFile,
} from '@/lib/audio-utils';

const DEMO_TRACKS: Omit<Track, 'url' | 'file'>[] = [
  { id: 'demo-1', name: 'Golden Hour Drift', raw: '01-dh-golden-hour-drift.mp3', genre: 'dh', date: '2025-06-12', dur: 245, originalName: null },
  { id: 'demo-2', name: 'Midnight Pool', raw: '02-dh-midnight-pool.mp3', genre: 'dh', date: '2025-06-12', dur: 312, originalName: null },
  { id: 'demo-3', name: 'Soft Focus', raw: '03-lf-soft-focus.mp3', genre: 'lf', date: '2025-06-14', dur: 198, originalName: null },
  { id: 'demo-4', name: 'Palm Shade', raw: '04-dh-palm-shade.mp3', genre: 'dh', date: '2025-06-14', dur: 276, originalName: null },
  { id: 'demo-5', name: 'Coral Reef Sunset', raw: '05-hy-coral-reef-sunset.mp3', genre: 'hy', date: '2025-06-15', dur: 340, originalName: null },
  { id: 'demo-6', name: 'Lazy Afternoon Tape', raw: '06-lf-lazy-afternoon-tape.mp3', genre: 'lf', date: '2025-06-15', dur: 224, originalName: null },
  { id: 'demo-7', name: 'Terrace Lights', raw: '07-dh-terrace-lights.mp3', genre: 'dh', date: '2025-06-16', dur: 289, originalName: null },
  { id: 'demo-8', name: 'Vapor Cascade', raw: '08-hy-vapor-cascade.mp3', genre: 'hy', date: '2025-06-16', dur: 261, originalName: null },
];

const Index: React.FC = () => {
  const isDemo = new URLSearchParams(window.location.search).has('demo');

  const [tracks, setTracks] = useState<Track[]>([]);
  const [filter, setFilter] = useState('all');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoRes, setVideoRes] = useState<{ w: number; h: number; label: string } | null>(null);
  const [showDrop, setShowDrop] = useState(!isDemo);
  const [videoSkipped, setVideoSkipped] = useState(isDemo);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);
  const [scrubPercents, setScrubPercents] = useState<Record<string, number>>({});
  const [crossfadeDuration, setCrossfadeDuration] = useState(3);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [cpanel, setCpanel] = useState<CommandPanelState>({ open: false, title: '', phase: 'building' });

  // Restore video from IndexedDB on mount
  useEffect(() => {
    loadVideo().then(file => {
      if (file) {
        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
        setShowDrop(false);
        setVideoSkipped(false);
        const v = document.createElement('video');
        v.src = url;
        v.onloadedmetadata = () => {
          setVideoRes({ w: v.videoWidth, h: v.videoHeight, label: getResLabel(v.videoWidth, v.videoHeight) });
        };
      }
    });
    // Restore tracks from IndexedDB on mount
    loadTracks().then(loaded => {
      if (loaded?.length) {
        setTracks(loaded as Track[]);
      }
    });
  }, []);

  // Auto-save tracks to IndexedDB whenever they change
  const tracksLoadedRef = useRef(false);
  useEffect(() => {
    // Skip the initial empty state before restoration
    if (!tracksLoadedRef.current && tracks.length === 0) return;
    tracksLoadedRef.current = true;
    if (!isDemo) {
      saveTracks(tracks);
    }
  }, [tracks, isDemo]);

  useEffect(() => {
    if (isDemo && tracks.length === 0) {
      const dummyFile = new File([], 'demo.mp3', { type: 'audio/mpeg' });
      setTracks(DEMO_TRACKS.map(t => ({ ...t, url: '', file: dummyFile } as Track)));
    }
  }, [isDemo]);

  // Prevent browser from opening dropped files anywhere on the page
  useEffect(() => {
    const prevent = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => {
      window.removeEventListener('dragover', prevent);
      window.removeEventListener('drop', prevent);
    };
  }, []);

  const curAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Use tracks directly — sorting happens at load time only
  const sorted = tracks;

  // Video handling
  const handleVideoLoad = useCallback((file: File) => {
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setShowDrop(false);
    setVideoSkipped(false);
    saveVideo(file); // persist to IndexedDB

    const v = document.createElement('video');
    v.src = url;
    v.onloadedmetadata = () => {
      setVideoRes({ w: v.videoWidth, h: v.videoHeight, label: getResLabel(v.videoWidth, v.videoHeight) });
    };
  }, []);

  const handleSkip = useCallback(() => {
    setShowDrop(false);
    setVideoSkipped(true);
  }, []);

  const handleChangeVideo = useCallback(() => {
    setShowDrop(true);
    setVideoUrl(null);
    clearVideo();
  }, []);

  // Track loading — sort by prefix at load time
  const handleLoadTracks = useCallback((files: FileList) => {
    const newTracks: Track[] = [];
    let loaded = 0;
    const fileArr = Array.from(files).filter(f => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|aac|m4a|wma|aiff?)$/i.test(f.name));
    if (!fileArr.length) return;
    fileArr.forEach(file => {
      const url = URL.createObjectURL(file);
      const a = new Audio(url);
      a.onloadedmetadata = () => {
        newTracks.push({
          id: Math.random().toString(36).slice(2),
          name: cleanName(file.name),
          raw: file.name,
          genre: detectGenre(file.name),
          date: dateOf(file.name),
          dur: a.duration,
          url,
          file,
        });
        loaded++;
        if (loaded === fileArr.length) {
          // Sort new batch by prefix, then append
          const sortedNew = sortTracksByPrefix(newTracks);
          setTracks(prev => [...prev, ...sortedNew]);
        }
      };
    });
  }, []);

  const handleClearAll = useCallback(() => {
    if (!tracks.length) return;
    if (confirm('Clear all tracks? This cannot be undone.')) {
      if (curAudioRef.current) { curAudioRef.current.pause(); curAudioRef.current = null; }
      setTracks([]);
      setPlayingId(null);
      setNowPlaying(null);
      setScrubPercents({});
      setIsEnhanced(false);
      clearTracks();
    }
  }, [tracks.length]);

  // Playback
  const handlePlay = useCallback((track: Track) => {
    if (curAudioRef.current) {
      curAudioRef.current.pause();
      curAudioRef.current = null;
    }

    if (playingId === track.id) {
      setPlayingId(null);
      setNowPlaying(null);
      setScrubPercents(prev => ({ ...prev, [track.id]: 0 }));
      return;
    }

    const a = new Audio(track.url);
    curAudioRef.current = a;
    setPlayingId(track.id);
    setNowPlaying(track.name);
    a.play();
    a.ontimeupdate = () => {
      if (a.duration) {
        setScrubPercents(prev => ({ ...prev, [track.id]: (a.currentTime / a.duration) * 100 }));
      }
    };
    a.onended = () => {
      setPlayingId(null);
      setNowPlaying(null);
      setScrubPercents(prev => ({ ...prev, [track.id]: 0 }));
      curAudioRef.current = null;
    };
  }, [playingId]);

  const handleScrub = useCallback((track: Track, pct: number) => {
    if (curAudioRef.current && playingId === track.id) {
      curAudioRef.current.currentTime = pct * curAudioRef.current.duration;
    } else {
      handlePlay(track);
      setTimeout(() => {
        if (curAudioRef.current) {
          curAudioRef.current.currentTime = pct * curAudioRef.current.duration;
        }
      }, 100);
    }
  }, [playingId, handlePlay]);

  // Track mutations
  const handleDelete = useCallback((id: string) => {
    if (playingId === id) {
      curAudioRef.current?.pause();
      curAudioRef.current = null;
      setPlayingId(null);
      setNowPlaying(null);
    }
    setTracks(prev => prev.filter(t => t.id !== id));
  }, [playingId]);

  const handleGenreCycle = useCallback((id: string) => {
    const cycle: Genre[] = ['dh', 'lf', 'hy'];
    setTracks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const idx = cycle.indexOf(t.genre);
      return { ...t, genre: cycle[(idx + 1) % cycle.length] };
    }));
  }, []);

  const handleRename = useCallback((id: string, name: string) => {
    setTracks(prev => prev.map(t =>
      t.id === id ? { ...t, name, originalName: null } : t
    ));
  }, []);

  const handleToggleCutoff = useCallback((id: string) => {
    setTracks(prev => prev.map(t =>
      t.id === id ? { ...t, cutoff: !t.cutoff } : t
    ));
  }, []);

  const handleToggleChecked = useCallback((id: string) => {
    setTracks(prev => prev.map(t =>
      t.id === id ? { ...t, checked: !t.checked } : t
    ));
  }, []);

  const handleCycleEnergy = useCallback((id: string) => {
    setTracks(prev => prev.map(t =>
      t.id === id ? { ...t, energy: (((t.energy || 0) + 1) % 4) as 0 | 1 | 2 | 3 } : t
    ));
  }, []);

  // Reorder tracks (from dnd-kit)
  const handleReorder = useCallback((newTracks: Track[]) => {
    setTracks(newTracks);
  }, []);

  // YouTube enhance
  const handleEnhance = useCallback(() => {
    if (isEnhanced) {
      setTracks(prev => prev.map(t =>
        t.originalName ? { ...t, name: t.originalName, originalName: null } : t
      ));
      setIsEnhanced(false);
    } else {
      let lastSuffix = '';
      setTracks(prev => prev.map((t, i) => {
        const cleaned = cleanNameForYouTube(t.name);
        let suffix = getRotatingSuffix(t.genre, i);
        if (suffix === lastSuffix) suffix = getRotatingSuffix(t.genre, i + 1);
        lastSuffix = suffix;
        return { ...t, originalName: t.name, name: `${cleaned} - ${suffix}` };
      }));
      setIsEnhanced(true);
    }
  }, [isEnhanced]);

  // Build episode
  const handleBuild = useCallback(async () => {
    if (!tracks.length) return;
    const sortedTracks = sortTracksByPrefix(tracks);

    setCpanel({ open: true, title: 'Building episode...', phase: 'building', progressText: 'Fetching and decoding tracks...', progressPct: 0 });

    try {
      if (!audioContextRef.current) audioContextRef.current = new AudioContext();

      let totalDuration = 0;
      sortedTracks.forEach((t, i) => {
        totalDuration += t.dur;
        if (i < sortedTracks.length - 1) totalDuration -= crossfadeDuration;
      });

      const offlineCtx = new OfflineAudioContext(2, Math.ceil(totalDuration * 44100), 44100);
      const masterGain = offlineCtx.createGain();
      masterGain.connect(offlineCtx.destination);

      const decodedTracks: AudioBuffer[] = [];
      for (let i = 0; i < sortedTracks.length; i++) {
        setCpanel(prev => ({ ...prev, progressText: `Decoding track ${i + 1} of ${sortedTracks.length}...`, progressPct: (i / sortedTracks.length) * 50 }));
        const resp = await fetch(sortedTracks[i].url);
        const ab = await resp.arrayBuffer();
        const decoded = await audioContextRef.current!.decodeAudioData(ab);
        decodedTracks.push(decoded);
      }

      let currentTime = 0;
      for (let i = 0; i < decodedTracks.length; i++) {
        setCpanel(prev => ({ ...prev, progressText: `Stitching track ${i + 1} of ${sortedTracks.length}...`, progressPct: 50 + (i / sortedTracks.length) * 50 }));

        const source = offlineCtx.createBufferSource();
        source.buffer = decodedTracks[i];
        const gain = offlineCtx.createGain();
        source.connect(gain);
        gain.connect(masterGain);

        if (i > 0) {
          gain.gain.setValueAtTime(0, currentTime);
          gain.gain.linearRampToValueAtTime(1, currentTime + crossfadeDuration);
        } else {
          gain.gain.setValueAtTime(1, 0);
        }

        const trackDuration = decodedTracks[i].duration;
        const fadeOutStart = currentTime + trackDuration - crossfadeDuration;
        if (i < decodedTracks.length - 1) {
          gain.gain.setValueAtTime(1, fadeOutStart);
          gain.gain.linearRampToValueAtTime(0, fadeOutStart + crossfadeDuration);
        }

        source.start(currentTime);
        currentTime += trackDuration - (i < decodedTracks.length - 1 ? crossfadeDuration : 0);
      }

      setCpanel(prev => ({ ...prev, progressText: 'Rendering audio...' }));
      const rendered = await offlineCtx.startRendering();
      const wavData = createWAVFile(rendered);
      const wavBlob = new Blob([wavData], { type: 'audio/wav' });
      const today = new Date().toISOString().slice(0, 10);

      // Build chapters
      let chapterTime = 0;
      const chapters: string[] = [];
      const srtEntries: string[] = [];
      sortedTracks.forEach((t, i) => {
        const h = Math.floor(chapterTime / 3600);
        const m = Math.floor((chapterTime % 3600) / 60);
        const s = Math.floor(chapterTime % 60);
        const stamp = h > 0
          ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
          : `${m}:${String(s).padStart(2, '0')}`;
        chapters.push(`${stamp} ${t.name}`);

        const startS = chapterTime;
        const endS = chapterTime + t.dur - (i < sortedTracks.length - 1 ? crossfadeDuration : 0);
        srtEntries.push(`${i + 1}\n${fmtSRT(startS)} --> ${fmtSRT(endS)}\n${t.name}\n`);
        chapterTime += t.dur - (i < sortedTracks.length - 1 ? crossfadeDuration : 0);
      });

      setCpanel({
        open: true,
        title: 'Episode ready!',
        phase: 'ready',
        tracks: sortedTracks,
        chapters: chapters.join('\n'),
        srtText: srtEntries.join('\n'),
        wavBlob,
        wavFilename: `poolside-episode-${today}.wav`,
        hasVideo: !!videoFile,
        videoLabel: videoRes ? `${videoRes.label} (${videoRes.w}×${videoRes.h})` : 'unknown res',
      });
    } catch (err: any) {
      setCpanel({ open: true, title: 'Build failed', phase: 'error', errorMsg: err.message });
    }
  }, [tracks, crossfadeDuration, videoFile, videoRes]);

  // Download helpers
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadWav = useCallback(() => {
    if (cpanel.wavBlob && cpanel.wavFilename) downloadBlob(cpanel.wavBlob, cpanel.wavFilename);
  }, [cpanel]);

  const handleCopyChapters = useCallback(() => {
    if (cpanel.chapters) navigator.clipboard.writeText(cpanel.chapters);
  }, [cpanel.chapters]);

  const handleDownloadSrt = useCallback(() => {
    if (cpanel.srtText) {
      const blob = new Blob([cpanel.srtText], { type: 'text/srt' });
      const today = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `poolside-episode-${today}.srt`);
    }
  }, [cpanel.srtText]);

  const handleBuildMp4 = useCallback(async () => {
    if (!cpanel.wavBlob || !videoFile) return;

    setCpanel(prev => ({
      ...prev,
      mp4Building: true,
      mp4Status: 'Initializing FFmpeg…',
      mp4ProgPct: 2,
    }));

    try {
      // Use installed packages instead of CDN imports
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

      const ffmpeg = new FFmpeg();

      ffmpeg.on('progress', ({ progress }: { progress: number }) => {
        if (progress > 0) {
          setCpanel(prev => ({
            ...prev,
            mp4Status: `Muxing video + audio… ${Math.round(progress * 100)}%`,
            mp4ProgPct: Math.min(95, 30 + progress * 65),
          }));
        }
      });

      ffmpeg.on('log', ({ message }: { message: string }) => {
        console.log('[FFmpeg]', message);
      });

      setCpanel(prev => ({ ...prev, mp4Status: 'Downloading FFmpeg core…', mp4ProgPct: 8 }));

      // Load the single-threaded core (no SharedArrayBuffer required)
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setCpanel(prev => ({ ...prev, mp4Status: 'Preparing video file…', mp4ProgPct: 18 }));
      const vExt = videoFile.name.toLowerCase().endsWith('.mov') ? 'mov' : 'mp4';
      await ffmpeg.writeFile(`input.${vExt}`, await fetchFile(videoFile));

      setCpanel(prev => ({ ...prev, mp4Status: 'Preparing audio…', mp4ProgPct: 24 }));
      const wavArray = new Uint8Array(await cpanel.wavBlob!.arrayBuffer());
      await ffmpeg.writeFile('audio.wav', wavArray);

      setCpanel(prev => ({ ...prev, mp4Status: 'Muxing video + audio… 0%', mp4ProgPct: 30 }));
      await ffmpeg.exec([
        '-stream_loop', '-1', '-i', `input.${vExt}`,
        '-i', 'audio.wav', '-c:v', 'copy', '-c:a', 'aac',
        '-b:a', '192k', '-shortest', '-movflags', '+faststart', 'output.mp4',
      ]);

      setCpanel(prev => ({ ...prev, mp4Status: 'Reading output…', mp4ProgPct: 96 }));
      const data = await ffmpeg.readFile('output.mp4');
      const mp4Blob = new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' });
      ffmpeg.terminate();

      const today = new Date().toISOString().slice(0, 10);
      setCpanel(prev => ({
        ...prev,
        mp4Building: false,
        mp4Blob,
        mp4Filename: `poolside-episode-${today}.mp4`,
        mp4Status: '✅ MP4 ready — click Download below.',
        mp4ProgPct: 100,
      }));
    } catch (err: any) {
      console.error('MP4 build error:', err);
      const msg = err?.message || String(err) || 'Unknown error';
      setCpanel(prev => ({
        ...prev,
        mp4Building: false,
        mp4Status: `❌ MP4 build failed: ${msg}. You can still download the WAV and combine it with your video in any editor.`,
        mp4ProgPct: undefined,
      }));
    }
  }, [cpanel.wavBlob, videoFile]);

  const handleDownloadMp4 = useCallback(() => {
    if (cpanel.mp4Blob && cpanel.mp4Filename) downloadBlob(cpanel.mp4Blob, cpanel.mp4Filename);
  }, [cpanel]);

  return (
    <>
      <BackgroundVideo videoUrl={videoUrl} />
      <VideoDropScreen
        visible={showDrop}
        onVideoLoad={handleVideoLoad}
        onSkip={handleSkip}
        onLoadDemo={() => {
          const dummyFile = new File([], 'demo.mp3', { type: 'audio/mpeg' });
          setTracks(DEMO_TRACKS.map(t => ({ ...t, url: '', file: dummyFile } as Track)));
          setShowDrop(false);
          setVideoSkipped(true);
        }}
      />

      <div className="app-container">
        <AppHeader
          hasVideo={!!videoUrl}
          videoSkipped={videoSkipped}
          onChangeVideo={handleChangeVideo}
        />
        <FilterBar
          filter={filter}
          onFilterChange={setFilter}
          onLoadTracks={handleLoadTracks}
          onClearAll={handleClearAll}
          hasTracks={tracks.length > 0}
          onLoadDemo={() => {
            const dummyFile = new File([], 'demo.mp3', { type: 'audio/mpeg' });
            setTracks(DEMO_TRACKS.map(t => ({ ...t, url: '', file: dummyFile } as Track)));
          }}
        />
        <TrackList
          tracks={sorted}
          allTracks={sorted}
          filter={filter}
          playingId={playingId}
          scrubPercents={scrubPercents}
          onPlay={handlePlay}
          onDelete={handleDelete}
          onGenreCycle={handleGenreCycle}
          onRename={handleRename}
          onScrub={handleScrub}
          onToggleCutoff={handleToggleCutoff}
          onToggleChecked={handleToggleChecked}
          onCycleEnergy={handleCycleEnergy}
          onReorder={handleReorder}
          onLoadTracks={handleLoadTracks}
        />
      </div>

      <FooterBar
        tracks={sorted}
        crossfadeDuration={crossfadeDuration}
        onCrossfadeChange={setCrossfadeDuration}
        nowPlaying={nowPlaying}
        isEnhanced={isEnhanced}
        onEnhance={handleEnhance}
        onBuild={handleBuild}
      />

      <CommandPanel
        state={cpanel}
        onClose={() => setCpanel(prev => ({ ...prev, open: false }))}
        onDownloadWav={handleDownloadWav}
        onCopyChapters={handleCopyChapters}
        onDownloadSrt={handleDownloadSrt}
        onBuildMp4={handleBuildMp4}
        onDownloadMp4={handleDownloadMp4}
      />
    </>
  );
};

export default Index;
