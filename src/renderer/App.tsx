// src/renderer/App.tsx
//
// Root React component for the Electron renderer process.
// Handles license verification on startup and conditionally shows the Paywall.

import React, { useEffect, useState } from 'react';
import { Paywall } from './components/Paywall';
import type { LicenseStatus } from '../preload';

type AppState = 'loading' | 'unlocked' | 'locked';

const DEMO_USER_ID = 'user_desktop_demo'; // In production, derive from account login

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);

  useEffect(() => {
    async function checkLicense() {
      try {
        const status = await window.mainlayer.verify(DEMO_USER_ID);
        setLicenseStatus(status);
        setAppState(status.authorized ? 'unlocked' : 'locked');
      } catch (err) {
        console.error('[App] License check failed:', err);
        setAppState('locked');
      }
    }
    checkLicense();
  }, []);

  async function handleActivate(licenseKey: string) {
    const result = await window.mainlayer.activate(DEMO_USER_ID, licenseKey);
    if (!result.success) throw new Error(result.message);
    // Re-verify to get updated plan info
    const status = await window.mainlayer.verify(DEMO_USER_ID);
    setLicenseStatus(status);
    setAppState(status.authorized ? 'unlocked' : 'locked');
  }

  function handleOpenPricing() {
    window.mainlayer.openPricing();
  }

  if (appState === 'loading') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'system-ui, sans-serif',
          color: '#6b7280',
        }}
      >
        Verifying license…
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', height: '100vh', overflow: 'auto' }}>
      {appState === 'locked' && (
        <Paywall
          onActivate={handleActivate}
          onOpenPricing={handleOpenPricing}
          isOffline={licenseStatus?.offline}
          gracePeriodRemainingMs={licenseStatus?.gracePeriodRemainingMs}
        />
      )}

      {/* Main app content */}
      <div style={{ padding: 32 }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>My Desktop App</h1>
          {licenseStatus && (
            <div
              style={{
                fontSize: 13,
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: licenseStatus.authorized ? '#10b981' : '#ef4444',
                }}
              />
              <span style={{ textTransform: 'capitalize' }}>{licenseStatus.plan} plan</span>
              {licenseStatus.offline && (
                <span style={{ color: '#f59e0b' }}>(offline)</span>
              )}
            </div>
          )}
        </header>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            Premium Features
          </h2>
          {appState === 'unlocked' ? (
            <PremiumContent plan={licenseStatus?.plan ?? 'free'} />
          ) : (
            <p style={{ color: '#9ca3af' }}>
              Unlock premium features with a license key.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function PremiumContent({ plan }: { plan: string }) {
  return (
    <div
      style={{
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: 8,
        padding: 20,
      }}
    >
      <p style={{ color: '#065f46', fontWeight: 600 }}>
        ✓ Premium features unlocked ({plan} plan)
      </p>
      <ul style={{ marginTop: 12, color: '#047857', fontSize: 14, paddingLeft: 20 }}>
        <li>Unlimited exports</li>
        <li>Advanced analytics</li>
        <li>Priority support</li>
      </ul>
    </div>
  );
}
