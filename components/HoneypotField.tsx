'use client';

import React from 'react';
import { createHoneypotField } from '@/lib/honeypot';

interface HoneypotFieldProps {
  /**
   * Custom field name (optional, defaults to 'website_verify')
   */
  fieldName?: string;

  /**
   * Whether to validate timestamp
   */
  validateTimestamp?: boolean;
}

export const HoneypotField: React.FC<HoneypotFieldProps> = ({
  fieldName,
  validateTimestamp = true,
}) => {
  // Use a fixed field name to avoid hydration mismatch
  const [timestamp] = React.useState(Date.now());
  const honeypotFieldName = fieldName || 'website_verify';

  const honeypotProps = {
    name: honeypotFieldName,
    defaultValue: '',
    style: {
      position: 'absolute' as const,
      left: '-5000px',
      width: '0',
      height: '0',
      opacity: '0',
      pointerEvents: 'none' as const,
    },
    tabIndex: -1,
    autoComplete: 'off',
    'aria-hidden': true,
  };

  return (
    <>
      <input
        {...honeypotProps}
        type="text"
        name={honeypotProps.name}
      />
      <input
        type="hidden"
        name="_timestamp"
        value={timestamp}
      />
      <input
        type="hidden"
        name="_honeypotFieldName"
        value={honeypotProps.name}
      />
    </>
  );
};

/**
 * Hook to use honeypot in forms
 */
export function useHoneypot(config?: { fieldName?: string }) {
  const [timestamp] = React.useState(Date.now());
  const honeypotFieldName = config?.fieldName || 'website_verify';

  return {
    fieldName: honeypotFieldName,
    timestamp,
    getFormData: (additionalData: Record<string, any> = {}) => ({
      ...additionalData,
      [honeypotFieldName]: '', // Empty for honeypot
      _timestamp: timestamp,
      _honeypotFieldName: honeypotFieldName,
    }),
  };
}

export default HoneypotField;
