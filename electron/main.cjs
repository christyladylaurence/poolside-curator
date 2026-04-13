const { app, BrowserWindow, Menu, session } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Poolside Sessions',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the built Vite app
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  return win;
}

// Build custom menu with "New Episode" option
const menuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New Episode',
        accelerator: 'CmdOrCtrl+N',
        click: () => createWindow(),
      },
      { type: 'separator' },
      { role: 'close' },
    ],
  },
  { role: 'editMenu' },
  { role: 'viewMenu' },
  { role: 'windowMenu' },
];

// macOS gets an app-name menu
if (process.platform === 'darwin') {
  menuTemplate.unshift({
    label: 'Poolside Sessions',
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' },
    ],
  });
}

app.whenReady().then(() => {
  // Enable SharedArrayBuffer for FFmpeg WASM
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Cross-Origin-Opener-Policy': ['same-origin'],
        'Cross-Origin-Embedder-Policy': ['require-corp'],
      },
    });
  });

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
