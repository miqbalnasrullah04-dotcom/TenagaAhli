import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { LoadingProvider } from './context/LoadingContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import './index.css';
import './utils/leafletIcons.js';

// Global error handler for performance monitoring errors
window.addEventListener('error', (event) => {
  // Suppress web vitals and performance monitoring errors
  if (event.message && (
    event.message.includes('startTime') || 
    event.message.includes('reportAllChanges') ||
    event.message.includes('web-vitals') ||
    event.filename && event.filename.includes('anonymous')
  )) {
    console.warn('Suppressed performance monitoring error:', event.message);
    event.preventDefault();
    return false;
  }
});

// Suppress unhandled promise rejections from performance monitoring
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && typeof event.reason === 'string') {
    if (event.reason.includes('startTime') || event.reason.includes('web-vitals')) {
      console.warn('Suppressed performance monitoring rejection:', event.reason);
      event.preventDefault();
      return false;
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LanguageProvider>
          <LoadingProvider>
            <NotificationProvider>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-[#8B4513] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              </div>}>
                <App />
              </Suspense>
            </NotificationProvider>
          </LoadingProvider>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);