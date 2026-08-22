import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { lockMobileViewport } from './app/viewportLock';
import { FeedbackProvider } from './components/ui/Feedback';
import { ThemeProvider } from './theme';

lockMobileViewport();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <FeedbackProvider>
        <RouterProvider router={router} />
      </FeedbackProvider>
    </ThemeProvider>
  </React.StrictMode>
);
