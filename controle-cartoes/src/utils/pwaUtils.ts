/**
 * PWA Utilities for iOS compatibility and standalone mode detection
 */

export interface PWAInfo {
  isStandalone: boolean;
  isIOS: boolean;
  isIPhone: boolean;
  isIPad: boolean;
  canInstall: boolean;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  safeAreaSupport: boolean;
}

/**
 * Detect if the app is running in standalone PWA mode
 */
export function isStandaloneMode(): boolean {
  // Check if running in standalone mode (iOS/Android PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // iOS Safari specific check
  const isIOSStandalone = 'standalone' in window.navigator && window.navigator.standalone === true;
  
  // Android Chrome specific check
  const isAndroidStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  return isStandalone || isIOSStandalone || isAndroidStandalone;
}

/**
 * Detect iOS devices
 */
export function isIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Detect iPhone specifically
 */
export function isIPhoneDevice(): boolean {
  return /iPhone/.test(navigator.userAgent);
}

/**
 * Detect iPad specifically
 */
export function isIPadDevice(): boolean {
  return /iPad/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Detect if safe area insets are supported
 */
export function supportsSafeArea(): boolean {
  return CSS.supports('padding-top: env(safe-area-inset-top)');
}

/**
 * Get device type based on screen size and user agent
 */
export function getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
  const width = window.innerWidth;
  
  if (width >= 1024) return 'desktop';
  if (width >= 768) return 'tablet';
  return 'mobile';
}

/**
 * Check if PWA can be installed
 */
export function canInstallPWA(): boolean {
  // This will be true if the beforeinstallprompt event was fired
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get comprehensive PWA information
 */
export function getPWAInfo(): PWAInfo {
  return {
    isStandalone: isStandaloneMode(),
    isIOS: isIOSDevice(),
    isIPhone: isIPhoneDevice(),
    isIPad: isIPadDevice(),
    canInstall: canInstallPWA(),
    deviceType: getDeviceType(),
    safeAreaSupport: supportsSafeArea()
  };
}

/**
 * Apply iOS-specific styles dynamically
 */
export function applyIOSStyles(): void {
  if (!isIOSDevice()) return;
  
  const root = document.documentElement;
  
  // Add iOS-specific CSS custom properties
  root.style.setProperty('--ios-safe-top', 'env(safe-area-inset-top, 20px)');
  root.style.setProperty('--ios-safe-bottom', 'env(safe-area-inset-bottom, 0px)');
  root.style.setProperty('--ios-safe-left', 'env(safe-area-inset-left, 0px)');
  root.style.setProperty('--ios-safe-right', 'env(safe-area-inset-right, 0px)');
  
  // Add body classes for iOS
  document.body.classList.add('ios-device');
  
  if (isIPhoneDevice()) {
    document.body.classList.add('iphone-device');
  }
  
  if (isIPadDevice()) {
    document.body.classList.add('ipad-device');
  }
  
  if (isStandaloneMode()) {
    document.body.classList.add('pwa-standalone');
  }
}

/**
 * Set up viewport meta tag for optimal iPhone display
 */
export function setupViewportForIPhone(): void {
  if (!isIPhoneDevice()) return;
  
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no, maximum-scale=1'
    );
  }
}

/**
 * Initialize PWA utilities
 */
export function initializePWA(): PWAInfo {
  const pwaInfo = getPWAInfo();
  
  // Apply iOS-specific styles
  if (pwaInfo.isIOS) {
    applyIOSStyles();
    setupViewportForIPhone();
  }
  
  // Log PWA info for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('PWA Info:', pwaInfo);
  }
  
  return pwaInfo;
}

/**
 * Monitor for orientation changes and adjust layout
 */
export function handleOrientationChange(): () => void {
  const handleResize = () => {
    // Re-apply iOS styles on orientation change
    if (isIOSDevice()) {
      setTimeout(() => {
        applyIOSStyles();
      }, 100);
    }
  };
  
  window.addEventListener('orientationchange', handleResize);
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('orientationchange', handleResize);
    window.removeEventListener('resize', handleResize);
  };
}
