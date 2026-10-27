import React, { useEffect, useRef } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { AppRoutes } from './app/routes';
import { useAuthStore } from './stores/authStore';
import { initDeepLinkListener } from './services/deepLinkService';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

initDeepLinkListener();

const AppContent: React.FC = () => {
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  const initSupabaseAuth = useAuthStore((s) => s.initSupabaseAuth);

  useEffect(() => {
    initSupabaseAuth();
  }, [initSupabaseAuth]);

  useEffect(() => {
    pathRef.current = location.pathname;
  }, [location.pathname]);

  return <AppRoutes />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
