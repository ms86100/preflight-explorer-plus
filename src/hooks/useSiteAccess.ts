import { useState, useEffect, useCallback } from 'react';

const SITE_ACCESS_KEY = 'vertex_site_access';
const VALID_KEY = import.meta.env.VITE_SITE_ACCESS_KEY || 'vertex2025';

export const useSiteAccess = () => {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedAccess = localStorage.getItem(SITE_ACCESS_KEY);
    if (storedAccess === 'granted') {
      setHasAccess(true);
    }
    setIsLoading(false);
  }, []);

  const validateAccess = useCallback((key: string): boolean => {
    if (key === VALID_KEY) {
      localStorage.setItem(SITE_ACCESS_KEY, 'granted');
      setHasAccess(true);
      return true;
    }
    return false;
  }, []);

  const revokeAccess = useCallback(() => {
    localStorage.removeItem(SITE_ACCESS_KEY);
    setHasAccess(false);
  }, []);

  return {
    hasAccess,
    isLoading,
    validateAccess,
    revokeAccess,
  };
};
