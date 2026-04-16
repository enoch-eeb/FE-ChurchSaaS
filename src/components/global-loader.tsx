"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLoaderStore } from '@/store/useLoaderStore';
import ChurchLoader from '@/components/loader'; // Sesuaikan path

export function GlobalLoader() {
  const { isLoading, message, showLoader, hideLoader } = useLoaderStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    hideLoader();
  }, [pathname, searchParams, hideLoader]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a');
      
      if (link && link.href) {
        const isInternal = link.href.startsWith(window.location.origin);
        const isDifferentPage = link.href !== window.location.href;

        if (isInternal && isDifferentPage && link.target !== '_blank') {
          showLoader("Memuat Halaman...");
        }
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [showLoader]);

  return <ChurchLoader isVisible={isLoading} message={message} />;
}