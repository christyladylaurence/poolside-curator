export interface MuxProgress {
  percent: number;
  timeStr: string;
}

export interface ElectronMuxResult {
  success: boolean;
  error?: string;
}

export interface ElectronAPI {
  muxVideo: (args: { videoPath: string; audioPath: string; outputPath: string }) => Promise<ElectronMuxResult>;
  onMuxProgress: (callback: (data: MuxProgress) => void) => () => void;
  showSaveDialog: (defaultName: string) => Promise<string | null>;
  createTempWavFile: () => Promise<string>;
  appendTempWavChunk: (args: { filePath: string; chunk: ArrayBuffer }) => Promise<void>;
  deleteTempWavFile: (filePath: string) => Promise<void>;
}

const WAV_CHUNK_SIZE = 4 * 1024 * 1024;

export async function writeBlobToTempWav(
  api: ElectronAPI,
  blob: Blob,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const filePath = await api.createTempWavFile();

  try {
    let offset = 0;

    while (offset < blob.size) {
      const end = Math.min(offset + WAV_CHUNK_SIZE, blob.size);
      const chunk = await blob.slice(offset, end).arrayBuffer();
      await api.appendTempWavChunk({ filePath, chunk });
      offset = end;
      onProgress?.(Math.round((offset / blob.size) * 100));
    }

    return filePath;
  } catch (error) {
    await api.deleteTempWavFile(filePath).catch(() => undefined);
    throw error;
  }
}