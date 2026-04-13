const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Write a WAV ArrayBuffer to a temp file in chunks.
   * Returns the temp file path.
   */
  writeTempWav: (arrayBuffer) => ipcRenderer.invoke('write-temp-wav', arrayBuffer),

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
   * Get the real filesystem path of a dropped File object.
   * In Electron, File objects from drag-and-drop have a .path property,
   * but it's not accessible from the renderer with contextIsolation.
   * Instead, we pass it through from the renderer directly since
   * Electron's File.path IS available in the renderer even with contextIsolation.
   */
});
