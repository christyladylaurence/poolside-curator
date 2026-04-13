const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const {
  appendTempWavChunk,
  createTempWavFile,
  deleteTempWavFile,
} = require('./temp-file.cjs');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const distDir = path.join(__dirname, '..', 'dist');
let serverPort = 0;

function startLocalServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url);
      filePath = filePath.split('?')[0];

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, data) => {
        if (err) {
          const indexPath = path.join(distDir, 'index.html');
          fs.readFile(indexPath, (err2, indexData) => {
            if (err2) {
              res.writeHead(404);
              res.end('Not found');
              return;
            }
            res.writeHead(200, {
              'Content-Type': 'text/html',
              'Cross-Origin-Opener-Policy': 'same-origin',
              'Cross-Origin-Embedder-Policy': 'require-corp',
            });
            res.end(indexData);
          });
          return;
        }
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp',
        });
        res.end(data);
      });
    });

    server.listen(0, '127.0.0.1', () => {
      serverPort = server.address().port;
      console.log(`Local server running on http://127.0.0.1:${serverPort}`);
      resolve(serverPort);
    });
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Poolside Sessions',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  win.loadURL(`http://127.0.0.1:${serverPort}/`);
  return win;
}

// ── IPC Handlers ──────────────────────────────────────────

ipcMain.handle('create-temp-wav-file', async () => createTempWavFile());

ipcMain.handle('append-temp-wav-chunk', async (_event, { filePath, chunk }) => {
  await appendTempWavChunk(filePath, chunk);
  return { success: true };
});

ipcMain.handle('delete-temp-wav-file', async (_event, filePath) => {
  await deleteTempWavFile(filePath);
  return { success: true };
});

/**
 * mux-video: Spawns native ffmpeg to mux video + audio into MP4.
 * Parses stderr for progress and sends updates to renderer.
 */
ipcMain.handle('mux-video', async (event, { videoPath, audioPath, outputPath }) => {
  return new Promise((resolve) => {
    // First, get total duration from the audio file for progress calculation
    const probe = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      audioPath,
    ]);

    let durationStr = '';
    probe.stdout.on('data', (d) => { durationStr += d.toString(); });

    probe.on('close', () => {
      const totalDuration = parseFloat(durationStr.trim()) || 0;

      const args = [
        '-stream_loop', '-1',
        '-i', videoPath,
        '-i', audioPath,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '320k',
        '-shortest',
        '-movflags', '+faststart',
        '-y',
        outputPath,
      ];

      const ffmpeg = spawn('ffmpeg', args);

      ffmpeg.stderr.on('data', (data) => {
        const str = data.toString();
        // Parse time=HH:MM:SS.xx from ffmpeg output
        const match = str.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
        if (match && totalDuration > 0) {
          const hours = parseInt(match[1], 10);
          const mins = parseInt(match[2], 10);
          const secs = parseInt(match[3], 10);
          const cs = parseInt(match[4], 10);
          const currentTime = hours * 3600 + mins * 60 + secs + cs / 100;
          const percent = Math.min(99, Math.round((currentTime / totalDuration) * 100));
          const timeStr = `${match[1]}:${match[2]}:${match[3]}`;

          try {
            event.sender.send('mux-progress', { percent, timeStr });
          } catch (e) {
            // sender may be destroyed
          }
        }
      });

      ffmpeg.on('close', (code) => {
        // Clean up temp WAV
        try { fs.unlinkSync(audioPath); } catch (e) { /* ignore */ }

        if (code === 0) {
          try {
            event.sender.send('mux-progress', { percent: 100, timeStr: 'done' });
          } catch (e) { /* ignore */ }
          resolve({ success: true });
        } else {
          resolve({ success: false, error: `ffmpeg exited with code ${code}` });
        }
      });

      ffmpeg.on('error', (err) => {
        // Clean up temp WAV
        try { fs.unlinkSync(audioPath); } catch (e) { /* ignore */ }
        resolve({ success: false, error: err.message });
      });
    });

    probe.on('error', () => {
      // ffprobe not found, try without progress
      resolve({ success: false, error: 'ffprobe not found. Make sure ffmpeg is installed and on your PATH.' });
    });
  });
});

/**
 * show-save-dialog: Opens native save dialog for MP4 files.
 */
ipcMain.handle('show-save-dialog', async (_event, defaultName) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: defaultName,
    filters: [{ name: 'MP4 Video', extensions: ['mp4'] }],
  });
  return canceled ? null : filePath;
});

// ── Menu ──────────────────────────────────────────────────

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

app.whenReady().then(async () => {
  await startLocalServer();

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
