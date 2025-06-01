import fs from 'fs';
import path from 'path';
import files from '../.cache/files.json';
import { createFile, MP4BoxBuffer, type Movie } from '../entries/all';

const publishedPrefix = 'published/';
const file_groups: Record<string, Array<string>> = {};

function getFilePath(group: string, test: string) {
  const location = path.join(import.meta.dirname, '..', '.cache', 'files', publishedPrefix, group);
  const [...rest] = test.split(path.sep);
  const fileName = rest.pop() || '';
  if (!fileName) throw new Error(`Invalid test name: ${test}`);

  const testFile = path.join(location, ...rest, fileName);
  const [file] = fileName.split('.');
  const gpacFile = path.join(location, ...rest, `${file}_gpac.json`);

  return { testFile, gpacFile };
}

async function getFileRange(
  path: string,
  progress: (data: MP4BoxBuffer) => void,
  start = 0,
  end = Infinity,
) {
  const reader = fs.createReadStream(path, { start, end });
  return new Promise<void>((resolve, reject) => {
    let bytesRead = 0;
    reader.on('data', chunk => {
      if (typeof chunk === 'string') chunk = Buffer.from(chunk);
      const data = MP4BoxBuffer.fromArrayBuffer(chunk.buffer, start + bytesRead);
      bytesRead += chunk.length;
      progress(data);
    });
    reader.on('error', reject);
    reader.on('end', resolve);
  });
}

async function loadAndGetInfo(file_path: string, loadAll = false) {
  const mp4 = createFile();
  const ready = new Promise<Movie>(resolve => {
    mp4.onReady = resolve;
  });

  const populate = getFileRange(file_path, data => mp4.appendBuffer(data))
    .then(() => mp4.flush())
    .then(() => mp4.getInfo());

  if (loadAll) await populate;
  return { info: await Promise.race([ready, populate]), mp4 };
}

Object.values(files.file_metadata).forEach(meta => {
  if (meta.published) {
    const relPath = meta.abs_filepath.slice(publishedPrefix.length);
    const [firstFolder, ...rest] = relPath.split(path.sep);
    if (firstFolder && rest.length) {
      const testName = rest.join(path.sep);
      const file_path = path.join(import.meta.dirname, '..', '.cache', 'files', meta.abs_filepath);
      if (fs.existsSync(file_path) && !file_path.endsWith('.zip')) {
        if (!file_groups[firstFolder]) file_groups[firstFolder] = [];
        file_groups[firstFolder].push(testName);
      }
    }
  }
});

// Sort the groups and tests for consistent output
Object.keys(file_groups).forEach(groupName => {
  file_groups[groupName].sort();
  file_groups[groupName] = file_groups[groupName].sort();
});

describe('Conformance Tests', () => {
  describe.concurrent.for(Object.keys(file_groups))('%s', groupName => {
    test.concurrent.for(file_groups[groupName])('loads %s', async testName => {
      const { testFile } = getFilePath(groupName, testName);
      const { info } = await loadAndGetInfo(testFile);

      // Check the result
      if (info.hasMoov) {
        expect(info.brands.length).toBeGreaterThan(0);
        expect(info.mime).not.toBe('');
        expect(info.tracks.length).toBeGreaterThan(0);
      } else {
        // The test doesn't have a valid moov atom
        expect(info).toBeDefined();
      }
    });
  });
});
