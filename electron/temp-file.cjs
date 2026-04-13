const fs = require('fs');
const os = require('os');
const path = require('path');

const TEMP_WAV_PREFIX = 'poolside-audio-';
const tempDir = path.resolve(os.tmpdir());

function createTempWavFile() {
  const tempPath = path.join(
    tempDir,
    `${TEMP_WAV_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}.wav`,
  );

  fs.writeFileSync(tempPath, Buffer.alloc(0));
  return tempPath;
}

function isValidTempWavPath(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;

  const resolved = path.resolve(filePath);
  return (
    resolved.startsWith(`${tempDir}${path.sep}`) &&
    path.basename(resolved).startsWith(TEMP_WAV_PREFIX) &&
    resolved.endsWith('.wav')
  );
}

async function appendTempWavChunk(filePath, arrayBuffer) {
  if (!isValidTempWavPath(filePath)) {
    throw new Error('Invalid temp audio path.');
  }

  await fs.promises.appendFile(filePath, Buffer.from(arrayBuffer));
}

async function deleteTempWavFile(filePath) {
  if (!isValidTempWavPath(filePath)) return;

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = {
  appendTempWavChunk,
  createTempWavFile,
  deleteTempWavFile,
};