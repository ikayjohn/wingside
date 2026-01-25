'use client';

import React from 'react';

interface BotProtectionProps {
  /**
   * Name of the honeypot field
   * @default 'website'
   */
  honeypotFieldName?: string;
}

/**
 * Bot Protection Component
 * Adds invisible honeypot field and timestamp to forms
 *
 * Usage:
 * <form onSubmit={handleSubmit}>
 *   <BotProtection />
 *   <input name="email" />
 *   <button type="submit">Submit</button>
 * </form>
 */
export default function BotProtection({ honeypotFieldName = 'website' }: BotProtectionProps) {
  const timestamp = React.useMemo(() => Date.now().toString(), []);

  return (
    <>
      {/* Honeypot field - bots will fill this, humans won't see it */}
      <input
        type="text"
        name={honeypotFieldName}
        defaultValue=""
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Timestamp field - for time-based validation */}
      <input
        type="hidden"
        name="_timestamp"
        value={timestamp}
      />
    </>
  );
}
