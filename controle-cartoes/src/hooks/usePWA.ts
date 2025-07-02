/**
 * React hook for PWA and iOS compatibility features
 */

import { useState, useEffect } from 'react';
import { getPWAInfo, type PWAInfo } from '../utils/pwaUtils';

/**
 * Hook to get PWA information and iOS device detection
 */
export function usePWA() {
  const [pwaInfo, setPWAInfo] = useState<PWAInfo>({
    isStandalone: false,
    isIOS: false,
    isIPhone: false,
    isIPad: false,
    canInstall: false,
    deviceType: 'desktop',
    safeAreaSupport: false
  });

  useEffect(() => {
    const info = getPWAInfo();
    setPWAInfo(info);

    // Listen for changes in display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      setPWAInfo(prev => ({
        ...prev,
        isStandalone: mediaQuery.matches
      }));
    };

    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  return pwaInfo;
}

/**
 * Hook for iOS-specific safe area handling
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  useEffect(() => {
    const updateSafeArea = () => {
      if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
        // Get computed safe area values
        const computedStyle = getComputedStyle(document.documentElement);
        setSafeArea({
          top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
          bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
          left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
          right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0')
        });
      }
    };

    updateSafeArea();

    // Update on orientation change
    window.addEventListener('orientationchange', updateSafeArea);
    window.addEventListener('resize', updateSafeArea);

    return () => {
      window.removeEventListener('orientationchange', updateSafeArea);
      window.removeEventListener('resize', updateSafeArea);
    };
  }, []);

  return safeArea;
}

/**
 * Hook to handle iPhone viewport changes
 */
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isLandscape: window.innerWidth > window.innerHeight
  });

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        isLandscape: window.innerWidth > window.innerHeight
      });
    };

    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  return viewport;
}

/**
 * Hook for install prompt handling
 */
export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (installPrompt) {
      (installPrompt as any).prompt();
      const result = await (installPrompt as any).userChoice;
      if (result.outcome === 'accepted') {
        setInstallPrompt(null);
        setIsInstallable(false);
      }
    }
  };

  return {
    isInstallable,
    promptInstall
  };
}
