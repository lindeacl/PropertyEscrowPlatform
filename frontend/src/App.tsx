import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { WalletProvider } from './contexts/WalletContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConnectionStatus } from './components/ConnectionStatus';
import { Toaster } from 'react-hot-toast';
import './styles/index.css';

// Pages
import StaticLanding from './pages/StaticLanding';
import PureStaticHomepage from './pages/PureStaticHomepage';
import Dashboard from './pages/Dashboard';
import CreateEscrow from './pages/CreateEscrow';
import EscrowDetails from './pages/EscrowDetails';
import Settings from './pages/Settings';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<StaticLanding />} />
              <Route path="/home" element={<PureStaticHomepage />} />
              <Route path="/dashboard" element={
                <WalletProvider>
                  <ConnectionStatus>
                    <Dashboard />
                  </ConnectionStatus>
                </WalletProvider>
              } />
              <Route path="/create" element={
                <WalletProvider>
                  <ConnectionStatus>
                    <CreateEscrow />
                  </ConnectionStatus>
                </WalletProvider>
              } />
              <Route path="/escrow/:id" element={
                <WalletProvider>
                  <ConnectionStatus>
                    <EscrowDetails />
                  </ConnectionStatus>
                </WalletProvider>
              } />
              <Route path="/settings" element={<Settings />} />
            </Routes>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#ffffff',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 2px 16px rgba(0, 0, 0, 0.1)',
                },
              }}
            />
          </div>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;