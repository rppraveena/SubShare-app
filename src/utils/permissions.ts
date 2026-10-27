// src/utils/permissions.ts
import { getLocationWithPermission } from '../lib/capacitorPlugins';

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    await getLocationWithPermission();
    return true;
  } catch (e) {
    console.error('Location permission denied or error:', e);
    return false;
  }
};
