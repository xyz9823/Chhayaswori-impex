import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against known Firebase Auth SDK internal popup race condition assertion
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = event?.reason?.message || String(event?.reason || '');
    if (
      reasonStr.includes('Pending promise was never set') ||
      reasonStr.includes('INTERNAL ASSERTION FAILED')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
  });

  window.addEventListener('error', (event) => {
    const errStr =
      event?.message || event?.error?.message || String(event || '');
    if (
      errStr.includes('Pending promise was never set') ||
      errStr.includes('INTERNAL ASSERTION FAILED')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
