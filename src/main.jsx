import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Debug logging
console.log('Main.jsx loading...');

// Error handling for the root render
try {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  console.log('Root element found, creating React root...');
  
  const root = createRoot(rootElement);
  
  console.log('Rendering App...');
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  
  console.log('App rendered successfully');
} catch (error) {
  console.error('Failed to render app:', error);
  
  // Fallback error display
  document.body.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 20px;
    ">
      <div style="text-align: center; max-width: 400px;">
        <h1 style="color: #dc2626; margin-bottom: 16px;">App Failed to Load</h1>
        <p style="color: #6b7280; margin-bottom: 20px;">
          There was an error loading the application. Please try refreshing the page.
        </p>
        <button 
          onclick="window.location.reload()" 
          style="
            background: #ef4444;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          "
        >
          Refresh Page
        </button>
        <details style="margin-top: 20px; text-align: left;">
          <summary style="cursor: pointer; color: #6b7280;">Error Details</summary>
          <pre style="
            background: #f3f4f6;
            padding: 12px;
            border-radius: 4px;
            font-size: 12px;
            margin-top: 8px;
            overflow: auto;
            color: #374151;
          ">${error.toString()}</pre>
        </details>
      </div>
    </div>
  `;
}