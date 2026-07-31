import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'tmp', 'ns-cache');

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getFilePath(key) {
  // Replace characters unsafe for filenames
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(CACHE_DIR, `${safeKey}.json`);
}

export function getFileCache(key, ttlMs) {
  try {
    ensureCacheDir();
    const filePath = getFilePath(key);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const cache = JSON.parse(fileContent);

    const now = Date.now();
    if (now - cache.timestamp > ttlMs) {
      // Cache expired
      return null;
    }

    return cache.data;
  } catch (error) {
    console.error(`Error reading file cache for key: ${key}`, error);
    return null;
  }
}

export function setFileCache(key, data) {
  try {
    ensureCacheDir();
    const filePath = getFilePath(key);
    
    const cacheObj = {
      timestamp: Date.now(),
      data
    };

    fs.writeFileSync(filePath, JSON.stringify(cacheObj), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing file cache for key: ${key}`, error);
    return false;
  }
}
