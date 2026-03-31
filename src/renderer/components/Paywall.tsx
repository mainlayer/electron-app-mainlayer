// src/renderer/components/Paywall.tsx
//
// Paywall overlay shown when the user lacks a premium license.

import React, { useState } from 'react';

interface PaywallProps {
  onActivate: (licenseKey: string) => Promise<void>;
  onOpenPricing: () => void;
  isOffline?: boolean;
  gracePeriodRemainingMs?: number;
}

export function Paywall({
  onActivate,
  onOpenPricing,
  isOffline = false,
  gracePeriodRemainingMs,
}: PaywallProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!licenseKey.trim()) {
      setError('Please enter a license key.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onActivate(licenseKey.trim());
      setSuccess('License activated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activation failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatGracePeriod(ms: number): string {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    return 'less than 1 hour';
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 40,
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Premium Required
        </h2>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          Unlock full access with a Mainlayer license key.
        </p>

        {isOffline && gracePeriodRemainingMs !== undefined && (
          <div
            style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: 8,
              padding: 12,
              marginBottom: 20,
              fontSize: 14,
              color: '#92400e',
            }}
          >
            You are offline. Grace period: {formatGracePeriod(gracePeriodRemainingMs)}{' '}
            remaining.
          </div>
        )}

        {isOffline && gracePeriodRemainingMs === undefined && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: 8,
              padding: 12,
              marginBottom: 20,
              fontSize: 14,
              color: '#991b1b',
            }}
          >
            Offline grace period has expired. Please reconnect to verify your license.
          </div>
        )}

        {success ? (
          <div
            style={{
              background: '#d1fae5',
              border: '1px solid #10b981',
              borderRadius: 8,
              padding: 12,
              color: '#065f46',
            }}
          >
            {success}
          </div>
        ) : (
          <form onSubmit={handleActivate}>
            <input
              type="text"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 15,
                marginBottom: 12,
                boxSizing: 'border-box',
              }}
            />
            {error && (
              <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 12 }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '10px 0',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Activating…' : 'Activate License'}
            </button>
          </form>
        )}

        <button
          onClick={onOpenPricing}
          type="button"
          style={{
            marginTop: 20,
            background: 'none',
            border: 'none',
            color: '#2563eb',
            fontSize: 14,
            cursor: 'pointer',
            textDecoration: 'underline',
            fontWeight: 500,
          }}
        >
          Purchase a license →
        </button>
      </div>
    </div>
  );
}
