export type Genre = 'dh' | 'lf' | 'hy';

export interface Track {
  id: string;
  name: string;
  raw: string;
  genre: Genre;
  date: string;
  dur: number;
  url: string;
  file: File;
  originalName?: string | null;
  cutoff?: boolean;
  checked?: boolean;
  energy?: 0 | 1 | 2 | 3;
}

export function cleanName(n: string): string {
  return n
    .replace(/\.(mp3|wav|flac|m4a|aac)$/i, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/^(dh|lf|hy)-\d+-?/, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || n;
}

export function cleanNameForYouTube(n: string): string {
  return n
    .replace(/^\d+_(SPARE_)?(hook|build|peak|exit)_\d+_/i, '')
    .replace(/\s*\(\d+\)\s*$/, '')
    .trim();
}

export function detectGenre(n: string): Genre {
  const l = n.toLowerCase();
  if (l.includes('-dh-') || l.includes('deep')) return 'dh';
  if (l.includes('-lf-') || l.includes('lofi') || l.includes('lo-fi')) return 'lf';
  if (l.includes('-hy-') || l.includes('hybrid')) return 'hy';
  return 'dh';
}

export function dateOf(n: string): string {
  const m = n.match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : '';
}

export function fmt(s: number): string {
  if (!s || isNaN(s)) return '–:––';
  const m = Math.floor(s / 60);
  const ss = String(Math.floor(s % 60)).padStart(2, '0');
  return `${m}:${ss}`;
}

export function fmtSRT(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export function getResLabel(w: number, h: number): string {
  const p = Math.max(w, h);
  if (p >= 3840) return '4K';
  if (p >= 2560) return '1440p';
  if (p >= 1920) return '1080p';
  if (p >= 1280) return '720p';
  return `${w}×${h}`;
}

export function sortTracksByPrefix(tracks: Track[]): Track[] {
  return [...tracks].sort((a, b) => {
    const numA = parseInt((a.raw || '').match(/^(\d+)/)?.[1] ?? '9999', 10);
    const numB = parseInt((b.raw || '').match(/^(\d+)/)?.[1] ?? '9999', 10);
    return numA - numB;
  });
}

export function computeRuntime(tracks: Track[], crossfadeDuration: number): string {
  const totalS = tracks.reduce((s, t) => s + (t.dur || 0), 0);
  const overlapS = Math.max(0, (tracks.length - 1) * crossfadeDuration);
  const effectiveDur = Math.max(0, totalS - overlapS);
  const h = Math.floor(effectiveDur / 3600);
  const m = Math.floor((effectiveDur % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  return `${m}:${String(Math.floor(effectiveDur % 60)).padStart(2, '0')}`;
}

export const seoSuffixes: Record<Genre, string[]> = {
  dh: ['Deep House Mix', 'Deep House Chill', 'Deep House Vibes', 'Deep House Sunset', 'Deep House Lounge', 'Deep House Session'],
  lf: ['Lofi Chill Beats', 'Lofi Study Mix', 'Lofi Vibes', 'Lofi Ambient', 'Lofi Relaxing', 'Lofi Chillhop'],
  hy: ['Chillout Mix', 'Ambient House', 'Electronic Chill', 'Downtempo Vibes', 'Chill Electronic', 'Sunset Beats'],
};

export const chillSeoSuffixes: Record<Genre, string[]> = {
  dh: ['Chill Deep House & Melodic Vibes', 'Deep House & Late Night Chill', 'Deep Feelings & Melodic House', 'Deep House Lounge & Chill Vibes', 'Melodic Deep House & Vocal Chill', 'Deep House & Sunset Grooves'],
  lf: ['Lofi Chill Beats & Deep Focus', 'Lofi Mellow Grooves & Study Vibes', 'Lofi Calm Tape & Late Night', 'Lofi Gentle Waves & Focus Flow', 'Lofi Warm Session & Chill Beats', 'Lofi Deep Focus & Ambient Drift'],
  hy: ['Melodic House & Chill Grooves', 'Deep Ambient & Downtempo Vibes', 'Chill House & Melodic Journey', 'Electronic Chill & Deep Feelings', 'Melodic Sunset & Deep Drift', 'Ambient House & Late Night Chill'],
};

export type EnhanceMode = 'off' | 'standard' | 'chill';

export function getRotatingSuffix(genre: Genre, index: number, mode: EnhanceMode = 'standard'): string {
  const pool = mode === 'chill'
    ? (chillSeoSuffixes[genre] || chillSeoSuffixes.dh)
    : (seoSuffixes[genre] || seoSuffixes.dh);
  return pool[index % pool.length];
}

export interface YouTubeMetadata {
  title: string;
  description: string;
  tags: string;
  thumbnailText: string;
}

const genreLabels: Record<Genre, string> = { dh: 'Deep House', lf: 'Lofi', hy: 'Chillout' };

const genreHashtags: Record<Genre, string[]> = {
  dh: ['#DeepHouse', '#ChillMix', '#HouseMusic', '#DeepHouseVibes', '#ChillHouse'],
  lf: ['#Lofi', '#LofiBeats', '#StudyMusic', '#ChillBeats', '#LofiHipHop'],
  hy: ['#Chillout', '#AmbientHouse', '#ElectronicChill', '#Downtempo', '#ChillVibes'],
};

const genreHooks: Record<Genre, string[]> = {
  dh: [
    'deep house for focus & relaxation',
    'smooth deep house vibes to unwind',
    'deep house grooves for your evening',
  ],
  lf: [
    'lofi beats to study and relax to',
    'chill lofi vibes for focus',
    'mellow lofi tunes for your day',
  ],
  hy: [
    'chillout electronic for calm moments',
    'ambient house to drift away',
    'downtempo vibes for deep relaxation',
  ],
};

export function generateYouTubeMetadata(
  tracks: Track[],
  genre: Genre,
  crossfadeDuration: number,
  episodeNumber: number,
  leadInstrument?: string,
  scheduleDate?: Date,
  chapters?: string,
): YouTubeMetadata {
  // Runtime
  const totalS = tracks.reduce((s, t) => s + (t.dur || 0), 0);
  const overlapS = Math.max(0, (tracks.length - 1) * crossfadeDuration);
  const effectiveDur = Math.max(0, totalS - overlapS);
  const runtimeH = Math.floor(effectiveDur / 3600);
  const runtimeM = Math.floor((effectiveDur % 3600) / 60);
  const runtimeLabel = runtimeH >= 1 ? `${runtimeH} Hour${runtimeH > 1 ? 's' : ''}` : `${runtimeM} Min`;

  const year = (scheduleDate ?? new Date()).getFullYear();
  const genreLabel = genreLabels[genre];
  const suffix = getRotatingSuffix(genre, episodeNumber);
  const instrPart = leadInstrument ? ` · ${leadInstrument} Edition` : '';

  // Title
  const title = `${genreLabel} Mix ${year} · ${suffix}${instrPart} [${runtimeLabel}]`;

  // Description
  const hookPool = genreHooks[genre];
  const hook = hookPool[episodeNumber % hookPool.length];
  const hashtags = genreHashtags[genre].join(' ');

  const descParts: string[] = [
    `${runtimeLabel} of ${hook}.`,
    '',
    `🎧 Poolside Sessions #${episodeNumber}`,
    leadInstrument ? `🎵 Lead instrument: ${leadInstrument}` : '',
    '',
    '⏱️ Tracklist:',
    chapters || '',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '🔔 Subscribe for weekly mixes',
    '👍 Like & share if you enjoy these vibes',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    hashtags,
  ];
  const description = descParts.filter(line => line !== undefined).join('\n');

  // Tags (max 500 chars)
  const baseTags = [
    `${genreLabel.toLowerCase()} mix`, `${genreLabel.toLowerCase()} mix ${year}`,
    'chill mix', 'relaxing music', `${genreLabel.toLowerCase()}`,
    `${genreLabel.toLowerCase()} music`, 'study music', 'focus music',
    'background music', 'poolside sessions',
  ];
  if (leadInstrument) {
    baseTags.push(`${leadInstrument.toLowerCase()} music`, `${genreLabel.toLowerCase()} ${leadInstrument.toLowerCase()}`);
  }
  // Add track name keywords
  tracks.forEach(t => {
    const words = t.name.split(/[\s-]+/).filter(w => w.length > 3);
    words.forEach(w => baseTags.push(w.toLowerCase()));
  });
  // Dedupe and trim to 500 chars
  const unique = [...new Set(baseTags)];
  let tags = '';
  for (const tag of unique) {
    const next = tags ? `${tags}, ${tag}` : tag;
    if (next.length > 500) break;
    tags = next;
  }

  // Thumbnail text
  const thumbParts = [genreLabel.toUpperCase()];
  if (leadInstrument) thumbParts.push(leadInstrument.toUpperCase());
  thumbParts.push(runtimeLabel.toUpperCase());
  const thumbnailText = thumbParts.join(' · ');

  return { title, description, tags, thumbnailText };
}

export function createWAVFile(audioBuffer: AudioBuffer): ArrayBuffer {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;

  const samples: Float32Array[] = [];
  for (let i = 0; i < numberOfChannels; i++) {
    samples.push(audioBuffer.getChannelData(i));
  }

  const subChunk2Size = audioBuffer.length * numberOfChannels * bytesPerSample;
  const chunkSize = 36 + subChunk2Size;
  const arrayBuffer = new ArrayBuffer(44 + subChunk2Size);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, chunkSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, subChunk2Size, true);

  let index = 44;
  const length = audioBuffer.length;
  for (let sampleIdx = 0; sampleIdx < length; sampleIdx++) {
    for (let ch = 0; ch < numberOfChannels; ch++) {
      let s = Math.max(-1, Math.min(1, samples[ch][sampleIdx]));
      s = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(index, s, true);
      index += 2;
    }
  }

  return arrayBuffer;
}
