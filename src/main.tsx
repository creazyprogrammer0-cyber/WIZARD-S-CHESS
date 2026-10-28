import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

try {
  const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
  if (desc && desc.get && !desc.set && desc.configurable !== false) {
    let activeFetch = window.fetch.bind(window);
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      enumerable: true,
      get: () => activeFetch,
      set: (fn) => {
        if (typeof fn === 'function') {
          activeFetch = fn;
        }
      },
    });
  }
} catch {
  // Ignore if already patched or non-configurable
}

createRoot(document.getElementById('root')!).render(<App />);

