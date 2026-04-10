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

export function getRotatingSuffix(genre: Genre, index: number): string {
  const pool = seoSuffixes[genre] || seoSuffixes.dh;
  return pool[index % pool.length];
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
