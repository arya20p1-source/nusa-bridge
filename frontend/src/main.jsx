import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { AppContextProvider } from './context/AppContext.jsx';
import App from './App.jsx';

import './styles/styles.css';
import './styles/produk.css';
import './styles/solusi.css';
import './styles/harga.css';
import './styles/radar.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </BrowserRouter>
  </StrictMode>
);
