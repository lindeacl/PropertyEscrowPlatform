import React, { useState, useEffect } from 'react';
import { Menu, X, Home, Plus, Settings, Moon, Sun } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, current: location.pathname === '/' },
    { name: 'Create Escrow', href: '/create', icon: Plus, current: location.pathname === '/create' },
    { name: 'Settings', href: '/settings', icon: Settings, current: location.pathname === '/settings' },
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-surface dark:bg-surface-dark border-r border-border dark:border-border-dark">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="ml-3 text-h2 font-bold text-text-primary dark:text-text-primary-dark">
                Escrow Platform
              </span>
            </div>
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`${
                    item.current
                      ? 'bg-primary text-white'
                      : 'text-text-secondary dark:text-text-secondary-dark hover:bg-primary/10 hover:text-text-primary dark:hover:text-text-primary-dark'
                  } group flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors duration-200`}
                >
                  <Icon
                    className={`${
                      item.current ? 'text-white' : 'text-text-secondary dark:text-text-secondary-dark'
                    } mr-3 flex-shrink-0 h-5 w-5`}
                  />
                  {item.name}
                </a>
              );
            })}
          </nav>
          <div className="flex-shrink-0 p-4">
            <button
              onClick={toggleDarkMode}
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-text-secondary dark:text-text-secondary-dark bg-border/20 dark:bg-border-dark/20 rounded-xl hover:bg-border/40 dark:hover:bg-border-dark/40 transition-colors duration-200"
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4 mr-2" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 mr-2" />
                  Dark Mode
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`lg:hidden ${sidebarOpen ? 'fixed inset-0 flex z-40' : ''}`}>
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
        )}
        
        <div className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } relative flex-1 flex flex-col max-w-xs w-full bg-surface dark:bg-surface-dark transition-transform duration-300 ease-in-out transform`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <span className="ml-3 text-h2 font-bold text-text-primary dark:text-text-primary-dark">
                  Escrow Platform
                </span>
              </div>
            </div>
            <nav className="mt-8 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`${
                      item.current
                        ? 'bg-primary text-white'
                        : 'text-text-secondary dark:text-text-secondary-dark hover:bg-primary/10 hover:text-text-primary dark:hover:text-text-primary-dark'
                    } group flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors duration-200`}
                  >
                    <Icon
                      className={`${
                        item.current ? 'text-white' : 'text-text-secondary dark:text-text-secondary-dark'
                      } mr-3 flex-shrink-0 h-5 w-5`}
                    />
                    {item.name}
                  </a>
                );
              })}
            </nav>
          </div>
          
          <div className="flex-shrink-0 p-4">
            <button
              onClick={toggleDarkMode}
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-text-secondary dark:text-text-secondary-dark bg-border/20 dark:bg-border-dark/20 rounded-xl hover:bg-border/40 dark:hover:bg-border-dark/40 transition-colors duration-200"
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4 mr-2" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 mr-2" />
                  Dark Mode
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar for mobile */}
        <div className="lg:hidden bg-surface dark:bg-surface-dark border-b border-border dark:border-border-dark">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="ml-2 text-lg font-bold text-text-primary dark:text-text-primary-dark">
                Escrow Platform
              </span>
            </div>
            <button
              onClick={toggleDarkMode}
              className="text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;