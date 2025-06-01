import fs from 'fs';
import path from 'path';
import files from '../.cache/files.json';
import { Box, createFile, Log, MP4BoxBuffer, type Movie } from '../entries/all';
import { BoxRegistry } from '../src/registry';

const publishedPrefix = 'published/';
const file_groups: Record<string, Array<string>> = {};

function isKnownBoxType(type: string, parent?: string): boolean {
  // Some boxes have dynamic boxes in it, therefore we need to check the parent
  if (parent && ['iref', 'tref'].includes(parent)) {
    const allowed_types = [];
    if (parent === 'iref') allowed_types.push(...BoxRegistry.box.iref.allowed_types);
    else if (parent === 'tref') allowed_types.push(...BoxRegistry.box.tref.allowed_types);
    return allowed_types.includes(type);
  }

  // Try boxes first
  if (type in BoxRegistry.box) return true;
  if (type in BoxRegistry.uuid) return true;
  if (type in BoxRegistry.sampleEntry) return true;
  if (type in BoxRegistry.sampleGroupEntry) return true;
  return false;
}

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

function spyOnLog(notices: Set<string>, reportedUnknownBoxes: Set<string>) {
  // Spy on Log.warn and Log.error to track warnings and errors
  const warnSpy = vi.spyOn(Log, 'warn').mockImplementation((module, msg) => {
    // Ignore warnings about unknown boxes, sample entries, and UUIDs
    if (msg && msg.match(/Unknown (sample|box|UUID|track|item)/)) {
      const match = msg.match(/Unknown (sample|box|UUID|track|item).*: '([^']+)'/);
      // If the message doesn't match the expected format, ignore it
      if (match) reportedUnknownBoxes.add(match[2]);
      return;
    }
    // Ignore warnings about box writing not yet implemented
    if (msg && msg.match(/box writing not yet implemented/)) return;
    notices.add(`[${module}] ${msg}`);
  });
  const errorSpy = vi.spyOn(Log, 'error').mockImplementation((module, msg) => {
    notices.add(`[${module}] ${msg}`);
  });
  return () => {
    // Restore the original Log.warn and Log.error implementations
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  };
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
  describe.for(Object.keys(file_groups))('%s', groupName => {
    test.for(file_groups[groupName])('loads %s', async testName => {
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

    test.for(file_groups[groupName])('structure %s', async testName => {
      // Spy on Log.warn and Log.error to track warnings and errors
      const notices = new Set<string>();
      const reportedUnknownBoxes = new Set<string>();
      const resetSpy = spyOnLog(notices, reportedUnknownBoxes);

      // Gather facts about the test
      const { testFile, gpacFile } = getFilePath(groupName, testName);
      const structure = JSON.parse(fs.readFileSync(gpacFile, 'utf-8'));

      // Load the file and get the MP4Box structure
      const { mp4 } = await loadAndGetInfo(testFile, true);

      // Check for warnings and errors, and reset the spy
      expect(notices).toEqual(new Set());
      resetSpy();

      interface Tree {
        [key: string]: Tree | unknown;
      }
      type IncomingRoot = Record<string, string | object>;
      const traverseGPAC = (root: IncomingRoot, parent?: string): Tree => {
        const result: Tree = {};

        function addTypeToResult(item: Record<string, string | object>, inBox?: string) {
          let type = item['@Type'];
          if (type && typeof type === 'string') {
            let query = type;
            if (type === 'uuid' && '@UUID' in item && typeof item['@UUID'] === 'string')
              query = item['@UUID'].replace(/-|\{|\}/g, '').toLowerCase();
            if (!isKnownBoxType(query, inBox) && !reportedUnknownBoxes.has(query)) return;

            const originalType = type;
            if (type in result) {
              const count = Object.keys(result).filter(key =>
                key.startsWith(type as string),
              ).length;
              type = `${type}_${count}`;
            }
            result[type] = traverseGPAC(item, originalType);
          }
        }

        for (const [_, value] of Object.entries(root)) {
          if (Array.isArray(value)) {
            for (const item of value) {
              if (typeof item === 'object' && '@Type' in item) {
                const container =
                  '@Type' in root && typeof root['@Type'] === 'string' && root['@Type'];

                addTypeToResult(item as IncomingRoot, container);
              }
            }
          } else if (typeof value === 'object' && value !== null && '@Type' in value) {
            addTypeToResult(value as IncomingRoot, parent);
          }
        }

        return result;
      };

      // Convert the gpac structure to a tree format
      const gpacTree = traverseGPAC(structure['IsoMediaFile']);
      expect(gpacTree).toBeDefined();

      const traverseMP4 = (root: Array<Box>): Tree => {
        const result: Tree = {};

        for (const box of root) {
          if (box.type) {
            let type = box.type;
            if (type in result) {
              const count = Object.keys(result).filter(key => key.startsWith(type)).length;
              type = `${type}_${count}`;
            }

            if (testFile.includes('sg-tl-st') && type === 'strk_1') {
              // FIXME: FFC issue (MPEGGroup/FileFormatConformance#155)
              continue;
            }

            if (testFile.includes('video_2500000bps_0') && type === 'mdat_1') {
              continue; // FIXME: FFC issue (MPEGGroup/FileFormatConformance#131)
            }

            if (box.boxes?.length > 0) {
              result[type] = traverseMP4(box.boxes);
            } else if (box['entries']) {
              result[type] = traverseMP4(box['entries']);
            } else if (box['item_infos']) {
              result[type] = traverseMP4(box['item_infos']);
            } else if (box['references']) {
              result[type] = traverseMP4(box['references']);
            } else {
              // FIXME: FFC issue, maxr isn't present in the gpac structure (MPEGGroup/FileFormatConformance#157)
              if (box.type === 'maxr') continue;

              // FIXME: FFC issue, gpac de-duplicates entries in sample entries
              // This isn't a proper fix, but FFC doesn't change that much anyway
              if (type.startsWith('colr_')) continue;

              result[type] = {};
            }
          }
        }

        return result;
      };

      // Convert the MP4Box structure to a tree format
      const mp4Tree = traverseMP4(mp4.boxes);
      expect(mp4Tree).toBeDefined();

      // Compare the structures
      expect(mp4Tree).toEqual(gpacTree);
    });
  });
});
