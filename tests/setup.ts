import fs from 'fs';
import path from 'path';
import { pipeline } from 'node:stream/promises';
import * as tar from 'tar';

const CACHE_DIR = '.cache';
const FFC_RELEASE_URL =
  'https://github.com/MPEGGroup/FileFormatConformance/releases/latest/download';
const FFC_FILES = 'files.json';
const FFC_ARCHIVE = 'conformance-files.tar.gz';

async function ensureAssetExists(asset: string) {
  const assetPath = path.join(CACHE_DIR, asset);
  if (!fs.existsSync(assetPath)) {
    console.log(`Downloading ${asset}...`);

    // If it doesn't exist, download the asset
    const response = await fetch(`${FFC_RELEASE_URL}/${asset}`);
    if (!response.ok || !response.body)
      throw new Error(`Failed to download ${asset}: ${response.statusText}`);

    // Stream the response to a file
    await pipeline(response.body, fs.createWriteStream(assetPath));
  }
  // Check hash when FFC provides it
}

export async function setup() {
  // Create the .cache directory if it doesn't exist
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  // Ensure both assets exist
  await ensureAssetExists(FFC_FILES);
  await ensureAssetExists(FFC_ARCHIVE);

  // Ensure the files.json file is valid JSON
  const boxesPath = path.join(CACHE_DIR, FFC_FILES);
  const boxesContent = fs.readFileSync(boxesPath, 'utf-8');
  const files = JSON.parse(boxesContent);
  const metadata = files.file_metadata || {};

  // Extract the archive if not already extracted
  const archivePath = path.join(CACHE_DIR, 'files');
  if (!fs.existsSync(archivePath)) {
    console.log(`Extracting ${FFC_ARCHIVE}...`);
    await tar.x({
      file: path.join(CACHE_DIR, FFC_ARCHIVE),
      cwd: CACHE_DIR,
    });

    // Force file system sync after extraction
    try {
      const fd = fs.openSync(archivePath, 'r');
      fs.fsyncSync(fd);
      fs.closeSync(fd);
    } catch {
      // fsync not critical, continue if it fails
      console.warn('fsync failed, continuing without it.');
    }
  }

  // Ensure the extracted files are valid
  // Add a small retry mechanism for CI environments
  for (const fpath of Object.keys(metadata)) {
    const filePath = path.join(CACHE_DIR, 'files', fpath);
    let exists = fs.existsSync(filePath);

    // Retry a few times with a small delay if file doesn't exist
    if (!exists) {
      for (let attempt = 0; attempt < 3 && !exists; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        exists = fs.existsSync(filePath);
      }
    }

    if (!exists) throw new Error(`File ${filePath} does not exist, but is listed in metadata.`);
  }
}

export function teardown() {
  // Optionally clean up the .cache directory after tests
  // fs.rmSync(CACHE_DIR, { recursive: true, force: true });
}
