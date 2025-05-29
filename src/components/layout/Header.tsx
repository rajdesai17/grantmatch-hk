import React, { useState, useEffect, useCallback } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from '../utils/router';
import { AuthModal } from '../auth/AuthModal';
import { supabase } from '../../lib/supabase';
import { useWallet } from '../../lib/useWallet';
import { User } from '@supabase/supabase-js';
import { PublicKey } from '@solana/web3.js';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { publicKey, connected, connect, disconnect, setOnConnect } = useWallet();
  const [connectingWallet, setConnectingWallet] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Disconnect wallet whenever user changes (sign in/out)
    disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSignOut = async () => {
    await disconnect(); // Disconnect wallet on sign out
    await supabase.auth.signOut();
    navigate('/');
  };

  const navItems = [
    { label: 'Grant Discovery', path: '/discovery' },
    { label: 'Explore Grants', path: '/explore' },
    { label: 'DAO Voting', path: '/dao' },
    { label: 'My Profile', path: '/profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Handler for linking wallet to logged-in user
  const handleLinkWallet = useCallback(async (walletPublicKey?: PublicKey) => {
    setWalletError(null);
    const keyToUse = walletPublicKey || publicKey;
    console.log('handleLinkWallet:', { user, publicKey: keyToUse }); // Debug log
    try {
      const walletAddress = keyToUse?.toBase58();
      if (!walletAddress || !user?.id) {
        setWalletError('Wallet or user not found.');
        return;
      }
      const { error } = await supabase.functions.invoke('link-wallet', {
        body: { wallet_address: walletAddress, user_id: user.id },
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      });
      if (error) {
        if (error.message?.includes('already linked')) {
          setWalletError('This wallet is already linked to another account.');
        } else {
          setWalletError(error.message || 'Failed to link wallet.');
        }
        return;
      }
      // Update wallet_address in profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_address: walletAddress })
        .eq('user_id', user.id);
      if (updateError) {
        setWalletError(updateError.message || 'Failed to update wallet address in profile.');
        return;
      }
      setWalletError(null); // Clear any previous error
      console.log('Wallet successfully linked to profile:', walletAddress);
    } catch (err) {
      if (err instanceof Error) {
        setWalletError(err.message || 'Failed to link wallet.');
      } else {
        setWalletError('Failed to link wallet.');
      }
    }
  }, [publicKey, user]);

  // Set up the wallet connect callback when user is available
  useEffect(() => {
    if (user) {
      // Set the callback to automatically link wallet when connected
      setOnConnect(handleLinkWallet);
    } else {
      // Clear the callback when no user is logged in
      setOnConnect(null);
    }
  }, [user, setOnConnect, handleLinkWallet]);

  return (
    <header
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background-dark bg-opacity-95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 
              className="text-xl font-semibold cursor-pointer"
              onClick={() => navigate('/')}
            >
              GrantMatch
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          
          <div className="hidden md:block">
            {user ? (
              <div className="flex items-center gap-4">
                {/* Wallet Connect Button */}
                {connected ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-400 font-mono">{publicKey?.toBase58().slice(0, 6)}...{publicKey?.toBase58().slice(-4)}</span>
                    <button onClick={disconnect} className="btn-secondary">Disconnect Wallet</button>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      setConnectingWallet(true);
                      try {
                        await connect();
                      } finally {
                        setConnectingWallet(false);
                      }
                    }}
                    className="btn-secondary"
                    disabled={connectingWallet}
                  >
                    {connectingWallet ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                )}
                <button 
                  onClick={handleSignOut}
                  className="btn-secondary"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
                {walletError && (
                  <div className="text-red-500 text-xs mt-1">{walletError}</div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="btn-secondary"
              >
                Sign In
              </button>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background-dark bg-opacity-95 backdrop-blur-sm">
          <div className="px-4 py-3 space-y-4">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left py-2 px-3 rounded-md ${
                  isActive(item.path)
                    ? 'bg-accent-subtle text-white'
                    : 'text-gray-300 hover:bg-background-light hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
            {user ? (
              <>
                {/* Wallet Connect Button (Mobile) */}
                {connected ? (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-green-400 font-mono">{publicKey?.toBase58().slice(0, 6)}...{publicKey?.toBase58().slice(-4)}</span>
                    <button onClick={disconnect} className="btn-secondary w-full">Disconnect Wallet</button>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      setConnectingWallet(true);
                      try {
                        await connect();
                      } finally {
                        setConnectingWallet(false);
                      }
                    }}
                    className="btn-secondary w-full mb-2"
                    disabled={connectingWallet}
                  >
                    {connectingWallet ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                )}
                <button 
                  onClick={handleSignOut}
                  className="btn-secondary w-full"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
                {walletError && (
                  <div className="text-red-500 text-xs mt-1">{walletError}</div>
                )}
              </>
            ) : (
              <button 
                onClick={() => {
                  setAuthModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="btn-secondary w-full"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}

      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </header>
  );
};

export default Header;