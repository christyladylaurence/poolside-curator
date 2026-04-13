const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Mux video + audio into MP4 using native ffmpeg.
   * All args are file paths on disk.
   * Returns { success: true } or { success: false, error: string }.
   */
  muxVideo: ({ videoPath, audioPath, outputPath }) =>
    ipcRenderer.invoke('mux-video', { videoPath, audioPath, outputPath }),

  /**
   * Listen for mux progress updates.
   * callback receives { percent: number, timeStr: string }
   */
  onMuxProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('mux-progress', handler);
    // Return cleanup function
    return () => ipcRenderer.removeListener('mux-progress', handler);
  },

  /**
   * Show native save dialog. Returns chosen file path or null if cancelled.
   */
  showSaveDialog: (defaultName) => ipcRenderer.invoke('show-save-dialog', defaultName),

  /**
   * Create an empty temp WAV file and return its path.
   */
  createTempWavFile: () => ipcRenderer.invoke('create-temp-wav-file'),

  /**
   * Append a WAV chunk to a temp file without loading the full blob into memory.
   */
  appendTempWavChunk: ({ filePath, chunk }) =>
    ipcRenderer.invoke('append-temp-wav-chunk', { filePath, chunk }),

  /**
   * Delete a temp WAV file if export is cancelled or fails.
   */
  deleteTempWavFile: (filePath) => ipcRenderer.invoke('delete-temp-wav-file', filePath),
});
