const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  buildEpisode: (manifest) =>
    ipcRenderer.invoke('build-episode', manifest),

  onBuildEpisodeProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('build-episode-progress', handler);
    return () => ipcRenderer.removeListener('build-episode-progress', handler);
  },

  saveTrackToTemp: ({ blob, fileName }) =>
    ipcRenderer.invoke('save-track-to-temp', { blob, fileName }),

  showSaveDialog: (defaultName) => ipcRenderer.invoke('show-save-dialog', defaultName),
});
