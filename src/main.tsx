import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { PlayerProvider } from './store/playerStore';
import { UserProvider } from './store/userStore';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <PlayerProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </PlayerProvider>
    </BrowserRouter>
  </React.StrictMode>
);
