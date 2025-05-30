import fs from 'fs';
import path from 'path';
import files from '../.cache/files.json';
import { createFile, MP4BoxBuffer, type Movie } from '../entries/all';

const publishedPrefix = 'published/';
const file_groups: Record<string, Array<string>> = {};

function getFilePath(group: string, test: string): string {
  return path.join(import.meta.dirname, '..', '.cache', 'files', publishedPrefix, group, test);
}

async function getFileRange(
  path: string,
  progress: (data: MP4BoxBuffer) => void,
  start = 0,
  end = Infinity,
) {
  const reader = fs.createReadStream(path, { start, end });
  return new Promise<void>((resolve, reject) => {
    reader.on('data', chunk => {
      if (typeof chunk === 'string') chunk = Buffer.from(chunk);
      progress(MP4BoxBuffer.fromArrayBuffer(chunk.buffer));
    });
    reader.on('error', reject);
    reader.on('end', resolve);
  });
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
      const file_path = getFilePath(groupName, testName);
      const mp4 = createFile();

      // Attach a promise to wait for the file to be ready
      const ready = new Promise<Movie>(resolve => {
        mp4.onReady = resolve;
      });

      // Start reading the file
      const populate = await getFileRange(file_path, data => mp4.appendBuffer(data))
        .then(() => mp4.flush())
        .then(() => mp4.getInfo());

      // Race the population and the ready promise
      const result = await Promise.race([ready, populate]);

      // Check the result
      if (result.hasMoov) {
        expect(result.brands.length).toBeGreaterThan(0);
        expect(result.mime).not.toBe('');
        expect(result.tracks.length).toBeGreaterThan(0);
      } else {
        // The test doesn't have a valid moov atom
        expect(result).toBeDefined();
      }
    });
  });
});
