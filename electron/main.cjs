const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');
const { spawn, execFile } = require('child_process');

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
const tempDir = path.resolve(os.tmpdir());
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

// ── Helpers ──────────────────────────────────────────────

function checkFfmpeg() {
  return new Promise((resolve) => {
    execFile('which', ['ffmpeg'], (err) => {
      resolve(!err);
    });
  });
}

function getTempPath(fileName) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(tempDir, `poolside-${Date.now()}-${safe}`);
}

/**
 * Build the ffmpeg filter_complex string for N tracks with pairwise crossfades + loudnorm.
 * Inputs are numbered 1..N (0 is video).
 */
function buildFilterComplex(trackCount, crossfadeSec) {
  if (trackCount === 1) {
    return { filter: '[1:a]loudnorm=I=-14:TP=-1.5:LRA=11[out]', outputLabel: '[out]' };
  }

  const parts = [];
  let prevLabel = '[1:a]';

  for (let i = 2; i <= trackCount; i++) {
    const outLabel = i === trackCount ? '[amix]' : `[a${i}]`;
    parts.push(`${prevLabel}[${i}:a]acrossfade=d=${crossfadeSec}:c1=tri:c2=tri${outLabel}`);
    prevLabel = outLabel;
  }

  parts.push(`${prevLabel.replace(';', '')}loudnorm=I=-14:TP=-1.5:LRA=11[out]`);

  return { filter: parts.join('; '), outputLabel: '[out]' };
}

// ── IPC Handlers ──────────────────────────────────────────

/**
 * save-track-to-temp: Write an ArrayBuffer to a temp file and return the path.
 */
ipcMain.handle('save-track-to-temp', async (_event, { blob, fileName }) => {
  const tempPath = getTempPath(fileName);
  await fs.promises.writeFile(tempPath, Buffer.from(blob));
  return tempPath;
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

/**
 * build-episode: Construct and run an ffmpeg command to mix all tracks
 * with crossfades and loudnorm, muxed with the looping background video.
 */
ipcMain.handle('build-episode', async (event, manifest) => {
  const { videoPath, outputPath, crossfadeSeconds, tracks } = manifest;

  // 1. Check ffmpeg is available
  const hasFfmpeg = await checkFfmpeg();
  if (!hasFfmpeg) {
    return {
      success: false,
      error: 'ffmpeg not found. Please install it:\n\n  brew install ffmpeg\n\nThen restart the app and try again.',
    };
  }

  // 2. Get total duration for progress calculation
  let totalDuration = 0;
  for (const t of tracks) {
    try {
      const dur = await new Promise((resolve) => {
        const probe = spawn('ffprobe', [
          '-v', 'error',
          '-show_entries', 'format=duration',
          '-of', 'default=noprint_wrappers=1:nokey=1',
          t.path,
        ]);
        let out = '';
        probe.stdout.on('data', (d) => { out += d.toString(); });
        probe.on('close', () => resolve(parseFloat(out.trim()) || 0));
        probe.on('error', () => resolve(0));
      });
      totalDuration += dur;
    } catch {
      // skip
    }
  }
  // Subtract crossfades
  totalDuration -= Math.max(0, (tracks.length - 1) * crossfadeSeconds);

  // 3. Build ffmpeg command
  const { filter, outputLabel } = buildFilterComplex(tracks.length, crossfadeSeconds);

  const args = [
    '-stream_loop', '-1',
    '-i', videoPath,
  ];

  for (const t of tracks) {
    args.push('-i', t.path);
  }

  args.push(
    '-filter_complex', filter,
    '-map', '0:v',
    '-map', outputLabel,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '320k',
    '-shortest',
    '-movflags', '+faststart',
    '-y',
    outputPath,
  );

  // 4. Spawn ffmpeg
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', args);

    ffmpeg.stderr.on('data', (data) => {
      const str = data.toString();
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
          event.sender.send('build-episode-progress', { percent, timeStr });
        } catch (e) {
          // sender may be destroyed
        }
      }
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        try {
          event.sender.send('build-episode-progress', { percent: 100, timeStr: 'done' });
        } catch (e) { /* ignore */ }
        resolve({ success: true });
      } else {
        resolve({ success: false, error: `ffmpeg exited with code ${code}` });
      }
    });

    ffmpeg.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
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
