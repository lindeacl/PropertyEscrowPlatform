import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import './styles/index.css';

// Pages
import PureStaticHomepage from './pages/PureStaticHomepage';
import Dashboard from './pages/Dashboard';
import CreateEscrow from './pages/CreateEscrow';
import EscrowDetails from './pages/EscrowDetails';
import Settings from './pages/Settings';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<PureStaticHomepage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<CreateEscrow />} />
            <Route path="/escrow/:id" element={<EscrowDetails />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                boxShadow: '0 2px 16px rgba(41, 98, 255, 0.07)',
              },
            }}
          />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;