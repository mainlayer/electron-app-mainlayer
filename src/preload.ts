// src/preload.ts
//
// Electron preload script — exposes a typed IPC bridge to the renderer
// process via contextBridge. The renderer never touches Node.js or Electron APIs directly.

import { contextBridge, ipcRenderer } from 'electron';

export interface LicenseStatus {
  authorized: boolean;
  plan: string;
  offline: boolean;
  gracePeriodActive: boolean;
  gracePeriodRemainingMs?: number;
}

export interface LicenseCache {
  userId: string;
  licenseKey: string;
  authorized: boolean;
  plan: string;
  verifiedAt: number;
  expiresAt?: number;
}

export interface ActivationResult {
  success: boolean;
  message: string;
}

/**
 * The `window.mainlayer` API available in the renderer process.
 */
const mainlayerAPI = {
  /**
   * Verify the user's license (network + grace period fallback).
   */
  verify: (userId: string): Promise<LicenseStatus> =>
    ipcRenderer.invoke('mainlayer:verify', userId),

  /**
   * Activate a license key.
   */
  activate: (userId: string, licenseKey: string): Promise<ActivationResult> =>
    ipcRenderer.invoke('mainlayer:activate', { userId, licenseKey }),

  /**
   * Clear the stored license (sign out).
   */
  clear: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('mainlayer:clear'),

  /**
   * Get the cached license without a network call.
   */
  getCached: (): Promise<LicenseCache | null> =>
    ipcRenderer.invoke('mainlayer:cached'),

  /**
   * Open the Mainlayer pricing page in the default browser.
   */
  openPricing: (): Promise<void> =>
    ipcRenderer.invoke('mainlayer:openPricing'),
};

contextBridge.exposeInMainWorld('mainlayer', mainlayerAPI);

// TypeScript augmentation so renderer code gets full type safety
declare global {
  interface Window {
    mainlayer: typeof mainlayerAPI;
  }
}
