import React from 'react';
import { RouterProvider, Routes, Route } from './components/utils/router';
import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import DiscoveryPage from './pages/DiscoveryPage';
import DaoPage from './pages/DaoPage';
import ProfilePage from './pages/ProfilePage';
import { useWallet } from './lib/useWallet';

function App() {
  const { phantomAvailable } = useWallet();
  return (
    <RouterProvider>
      {!phantomAvailable && (
        <div className="bg-yellow-200 text-yellow-900 text-center py-2 text-sm font-semibold">
          Phantom Wallet not detected. <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer" className="underline">Install Phantom</a> to use all features.
        </div>
      )}
      <div className="min-h-screen bg-gradient-to-b from-background-dark to-background-light flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/discovery" element={<DiscoveryPage />} />
            <Route path="/dao" element={<DaoPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
      </div>
    </RouterProvider>
  );
}

export default App;