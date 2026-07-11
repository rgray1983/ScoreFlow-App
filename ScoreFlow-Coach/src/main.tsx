import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { WorkspaceProvider } from './context/WorkspaceContext';
import './styles.css';
import './responsive.css';
import './teams.css';
import './glass-polish.css';
import './context-bar.css';
import './players.css';
import './controls.css';

registerSW({ immediate: true });

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('ScoreFlow Coach root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <HashRouter>
      <WorkspaceProvider>
        <App />
      </WorkspaceProvider>
    </HashRouter>
  </StrictMode>
);
