import fs from 'fs';
import path from 'path';
import { createFile, MP4BoxBuffer, type Movie } from '../entries/all';

export const publishedPrefix = 'published/';

export function getFilePath(group: string, test: string) {
  const location = path.join(import.meta.dirname, '..', '.cache', 'files', publishedPrefix, group);
  const [...rest] = test.split(path.sep);
  const fileName = rest.pop() || '';
  if (!fileName) throw new Error(`Invalid test name: ${test}`);

  const testFile = path.join(location, ...rest, fileName);
  const [file] = fileName.split('.');
  const gpacFile = path.join(location, ...rest, `${file}_gpac.json`);

  return { testFile, gpacFile };
}

export async function getFileRange(
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

export async function loadAndGetInfo(file_path: string, loadAll = false, keepMdat = false) {
  const mp4 = createFile(keepMdat);
  const ready = new Promise<Movie>(resolve => {
    mp4.onReady = resolve;
  });

  const populate = getFileRange(file_path, data => mp4.appendBuffer(data))
    .then(() => mp4.flush())
    .then(() => mp4.getInfo());

  if (loadAll) await populate;
  return { info: await Promise.race([ready, populate]), mp4 };
}
