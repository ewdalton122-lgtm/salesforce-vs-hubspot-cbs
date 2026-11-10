import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import './styles/index.css';
import { AppProvider } from './context/AppContext';
import Home from './pages/Home';
import Checklist from './pages/Checklist';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/checklist" element={<Checklist />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  </StrictMode>,
);
