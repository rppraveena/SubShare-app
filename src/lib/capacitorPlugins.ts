/**
 * capacitorPlugins.ts
 * Initializes Capacitor App (back button) and Geolocation plugins.
 * Safe to import on web — all Capacitor calls no-op gracefully in a browser.
 */

import { Capacitor } from '@capacitor/core';

// ─── Back Button (Android hardware key) ─────────────────────────────────────

export function setupNativeBackButton(
  onGoBack: () => void,
  isRootPath: () => boolean
) {
  if (!Capacitor.isNativePlatform()) return () => {};

  let removeListener = () => {};

  import('@capacitor/app').then(({ App }) => {
    const handlePromise = App.addListener('backButton', () => {
      if (isRootPath()) {
        // On root screens: minimise the app instead of closing
        App.minimizeApp();
      } else {
        // On child screens: go back to previous page
        onGoBack();
      }
    });

    removeListener = () => {
      handlePromise.then((h) => h.remove());
    };
  });

  return () => removeListener();
}

// ─── Geolocation ─────────────────────────────────────────────────────────────

export interface GeoResult {
  latitude: number;
  longitude: number;
}

/**
 * Request location permission and get current position.
 * Uses @capacitor/geolocation on Android/iOS (shows native OS dialog),
 * with fallback to browser navigator.geolocation.
 */
export async function getLocationWithPermission(): Promise<GeoResult> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');

      // Check current permission status
      const check = await Geolocation.checkPermissions();
      if (check.location !== 'granted' && check.coarseLocation !== 'granted') {
        // Trigger native Android permission request popup
        const perm = await Geolocation.requestPermissions();
        if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
          throw new Error('Location permission denied by user');
        }
      }

      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
    } catch (err: any) {
      console.warn('Native geolocation failed, attempting web fallback:', err);
    }
  }

  // Web fallback
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported on this device'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
