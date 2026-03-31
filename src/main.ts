// src/main.ts
//
// Electron main process — creates the BrowserWindow and handles IPC for
// Mainlayer license verification.

import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import {
  verifyLicense,
  activateLicense,
  clearLicense,
  getCachedLicense,
  isCacheStale,
} from './mainlayer';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // In production serve from built renderer; in dev use Vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────

/**
 * Check license status (tries network, falls back to cache + grace period).
 */
ipcMain.handle('mainlayer:verify', async (_event, userId: string) => {
  return verifyLicense(userId);
});

/**
 * Activate a license key entered by the user.
 */
ipcMain.handle(
  'mainlayer:activate',
  async (_event, { userId, licenseKey }: { userId: string; licenseKey: string }) => {
    return activateLicense(userId, licenseKey);
  },
);

/**
 * Sign out / clear the stored license.
 */
ipcMain.handle('mainlayer:clear', () => {
  clearLicense();
  return { success: true };
});

/**
 * Return the cached license (no network call).
 */
ipcMain.handle('mainlayer:cached', () => {
  return getCachedLicense();
});

/**
 * Open the Mainlayer pricing page in the default browser.
 */
ipcMain.handle('mainlayer:openPricing', () => {
  shell.openExternal('https://mainlayer.fr');
});

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  createWindow();

  // Background: refresh license if cache is stale
  const cached = getCachedLicense();
  if (cached && isCacheStale()) {
    console.log('[Mainlayer] Cache stale, refreshing in background...');
    verifyLicense(cached.userId).catch(console.warn);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
