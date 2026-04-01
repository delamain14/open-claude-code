import React from 'react';
import { Text } from '../../ink.js';

interface OAuthFlowStepProps {
  onSuccess: (token: string) => void;
  onCancel: () => void;
}

/** OAuth flow has been removed. This is a stub component. */
export function OAuthFlowStep({ onCancel }: OAuthFlowStepProps): React.ReactNode {
  React.useEffect(() => {
    // Auto-cancel since OAuth is not available
    const timer = setTimeout(onCancel, 100);
    return () => clearTimeout(timer);
  }, [onCancel]);

  return <Text>OAuth login has been removed. Please configure API keys directly.</Text>;
}
