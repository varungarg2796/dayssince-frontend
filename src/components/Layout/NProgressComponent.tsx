// src/components/Layout/NProgressComponent.tsx (Rename the file)
'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

// Configure NProgress (Do this once, e.g., here or in layout)
NProgress.configure({ showSpinner: true });

export default function NProgressComponent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPath = useRef(pathname + searchParams.toString()); // Store previous route

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();

    // Start progress only if the path actually changes
    if (previousPath.current !== currentPath) {
      console.log(`[NProgress] Starting. Prev: ${previousPath.current}, Curr: ${currentPath}`);
      NProgress.start();
    }

    // Always try to finish progress when the effect runs (component mounts/updates)
    // console.log(`[NProgress] Route update, calling done() for path: ${currentPath}`);
    NProgress.done();

    // Update previous path ref *after* checking and potentially starting
    previousPath.current = currentPath;

    // Cleanup function on unmount (less critical now as `done` is called on next effect run)
    // return () => {
    //   NProgress.done();
    // };

  }, [pathname, searchParams]); // Depend on route changes

  // This component doesn't render anything itself
  return null;
}