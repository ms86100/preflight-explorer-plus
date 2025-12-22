import React from 'react';
import { useIsFeatureEnabled } from '../context/PluginContext';
import { Card, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDisabledMessage?: boolean;
}

/**
 * FeatureGate component - wraps content that should only be visible when a plugin is enabled
 * 
 * Usage:
 * <FeatureGate feature="custom-fields">
 *   <CustomFieldsSection />
 * </FeatureGate>
 */
export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  showDisabledMessage = false 
}: FeatureGateProps) {
  const isEnabled = useIsFeatureEnabled(feature);

  if (isEnabled) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showDisabledMessage) {
    return <FeatureDisabledMessage feature={feature} />;
  }

  // By default, hide the content completely
  return null;
}

function FeatureDisabledMessage({ feature }: { feature: string }) {
  const navigate = useNavigate();
  
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Lock className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          Feature Not Available
        </h3>
        <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
          The <strong>{feature}</strong> feature requires a plugin that is currently disabled. 
          Enable the required plugin to access this feature.
        </p>
        <Button variant="outline" onClick={() => navigate('/plugins')}>
          Manage Plugins
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Higher-order component version of FeatureGate
 */
export function withFeatureGate<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: string,
  options?: { fallback?: React.ReactNode; showDisabledMessage?: boolean }
) {
  return function FeatureGatedComponent(props: P) {
    return (
      <FeatureGate 
        feature={feature} 
        fallback={options?.fallback}
        showDisabledMessage={options?.showDisabledMessage}
      >
        <WrappedComponent {...props} />
      </FeatureGate>
    );
  };
}
