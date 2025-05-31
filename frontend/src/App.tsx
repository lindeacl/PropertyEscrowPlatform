import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import './styles/index.css';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Homepage from './pages/Homepage';
import Dashboard from './pages/Dashboard';
import CreateEscrow from './pages/CreateEscrow';
import EscrowDetails from './pages/EscrowDetails';
import Settings from './pages/Settings';

function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <Router>
          <div className="App">
            <MainLayout>
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create" element={<CreateEscrow />} />
                <Route path="/escrow/:id" element={<EscrowDetails />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </MainLayout>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'toast-custom',
              style: {
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                boxShadow: '0 2px 16px rgba(41, 98, 255, 0.07)',
              },
            }}
          />
        </div>
      </Router>
    </WalletProvider>
  </ThemeProvider>
  );
}

export default App;