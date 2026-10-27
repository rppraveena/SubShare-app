import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const MAIN_TABS = [
  '/services', '/tickets', '/rides', '/blood', '/food',
  '/subscriptions', '/chat', '/profile', '/notifications',
  '/payments', '/admin', '/requests',
];

const ROOT_SCREENS = ['/', '/welcome', '/auth', '/home', '/organization/home'];

let listenerRegistered = false;

export function initBackButtonHandler() {
  if (!Capacitor.isNativePlatform()) return;
  if (listenerRegistered) return; // prevent duplicate listeners
  listenerRegistered = true;

  App.addListener('backButton', ({ canGoBack }) => {
    const path = window.location.pathname;

    // Root screens → exit app
    if (ROOT_SCREENS.includes(path)) {
      App.exitApp();
      return;
    }

    // Main tabs → home
    if (MAIN_TABS.includes(path)) {
      window.history.back();
      return;
    }

    // Sub-pages → parent
    if (path.startsWith('/admin/')) { window.history.back(); return; }
    if (path.startsWith('/chat/')) { window.history.back(); return; }
    if (path.startsWith('/tickets/')) { window.history.back(); return; }
    if (path.startsWith('/rides/')) { window.history.back(); return; }
    if (path.startsWith('/blood/')) { window.history.back(); return; }
    if (path.startsWith('/food/')) { window.history.back(); return; }
    if (path.startsWith('/subscriptions/')) { window.history.back(); return; }
    if (path.startsWith('/organization/')) { window.history.back(); return; }

    // Fallback
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });
}
