'use client';

import React from 'react';
import { createHoneypotField, generateHoneypotFieldName } from '@/lib/honeypot';

interface HoneypotFieldProps {
  /**
   * Custom field name (optional, will generate random if not provided)
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
  const props = createHoneypotField({
    fieldName,
    validateTimestamp,
  });

  return (
    <>
      <input
        {...props}
        type="text"
        name={props.name}
      />
      <input
        type="hidden"
        name="_timestamp"
        value={props.timestamp}
      />
      <input
        type="hidden"
        name="_honeypotFieldName"
        value={props.name}
      />
    </>
  );
};

/**
 * Hook to use honeypot in forms
 */
export function useHoneypot(config?: { fieldName?: string }) {
  const [fieldName] = React.useState(
    config?.fieldName || generateHoneypotFieldName()
  );
  const [timestamp] = React.useState(Date.now());

  return {
    fieldName,
    timestamp,
    getFormData: (additionalData: Record<string, any> = {}) => ({
      ...additionalData,
      [fieldName]: '', // Empty for honeypot
      _timestamp: timestamp,
      _honeypotFieldName: fieldName,
    }),
  };
}

export default HoneypotField;
