export interface BuildEpisodeManifest {
  videoPath: string;
  outputPath: string;
  crossfadeSeconds: number;
  tracks: { path: string }[];
}

export interface BuildEpisodeProgress {
  percent: number;
  timeStr: string;
}

export interface BuildEpisodeResult {
  success: boolean;
  error?: string;
}

export interface ElectronAPI {
  buildEpisode: (manifest: BuildEpisodeManifest) => Promise<BuildEpisodeResult>;
  onBuildEpisodeProgress: (callback: (data: BuildEpisodeProgress) => void) => () => void;
  saveTrackToTemp: (args: { blob: ArrayBuffer; fileName: string }) => Promise<string>;
  showSaveDialog: (defaultName: string) => Promise<string | null>;
}
