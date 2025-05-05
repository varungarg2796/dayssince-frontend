'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LoadingOverlay } from '@mantine/core';

export function PageLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Trigger loading state on route change
    setIsLoading(true);

    // Simulate a short delay to ensure the loader is visible
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Adjust the duration as needed

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return (
    <LoadingOverlay
      visible={isLoading}
      zIndex={1000}
      overlayProps={{ radius: 'sm', blur: 2 }}
      loaderProps={{
        color: 'blue',
        type: 'bars',
        size: 'sm',
      }}
    />
  );
}