import { useCallback, useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect(): Promise<{ publicKey: { toString(): string } }>;
      disconnect(): Promise<void>;
      on(event: string, handler: () => void): void;
      removeAllListeners?(event: string): void;
      publicKey?: { toString(): string };
    };
  }
}

export function useWallet() {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connected, setConnected] = useState(false);
  const [phantomAvailable, setPhantomAvailable] = useState(false);
  const [onConnectCallback, setOnConnectCallback] = useState<((publicKey: PublicKey) => Promise<void>) | null>(null);

  useEffect(() => {
    if (window.solana && window.solana.isPhantom) {
      setPhantomAvailable(true);
      
      // Check if wallet is already connected on page load
      if (window.solana.publicKey) {
        const existingPublicKey = new PublicKey(window.solana.publicKey.toString());
        setPublicKey(existingPublicKey);
        setConnected(true);
        
        // Call the callback if it exists (this handles page refresh cases)
        if (onConnectCallback) {
          onConnectCallback(existingPublicKey).catch(error => {
            console.error('Error in initial wallet connect callback:', error);
          });
        }
      }
      
      window.solana.on('connect', async () => {
        if (window.solana?.publicKey) {
          const newPublicKey = new PublicKey(window.solana.publicKey.toString());
          setPublicKey(newPublicKey);
          setConnected(true);
          
          // Defensive: Only call if onConnectCallback is a function
          if (typeof onConnectCallback === 'function') {
            try {
              await onConnectCallback(newPublicKey);
            } catch (error) {
              console.error('Error in wallet connect callback:', error);
            }
          } else {
            console.warn('onConnectCallback is not a function:', onConnectCallback);
          }
        }
      });
      window.solana.on('disconnect', () => {
        setPublicKey(null);
        setConnected(false);
      });
    } else {
      setPhantomAvailable(false);
    }
    return () => {
      if (window.solana && window.solana.removeAllListeners) {
        window.solana.removeAllListeners('connect');
        window.solana.removeAllListeners('disconnect');
      }
    };
  }, [onConnectCallback]);

  const connect = useCallback(async () => {
    if (!window.solana) {
      window.open('https://phantom.app/', '_blank');
      return null;
    }
    try {
      const res = await window.solana.connect();
      const newPublicKey = new PublicKey(res.publicKey.toString());
      setPublicKey(newPublicKey);
      setConnected(true);
      
      // Defensive: Only call if onConnectCallback is a function
      if (typeof onConnectCallback === 'function') {
        try {
          await onConnectCallback(newPublicKey);
        } catch (error) {
          console.error('Error in wallet connect callback:', error);
        }
      } else {
        console.warn('onConnectCallback is not a function:', onConnectCallback);
      }
      
      return newPublicKey;
    } catch (err) {
      // User rejected the connection or error occurred
      console.log('Wallet connection failed:', err);
      return null;
    }
  }, [onConnectCallback]);

  const disconnect = useCallback(async () => {
    if (window.solana) {
      await window.solana.disconnect();
      setPublicKey(null);
      setConnected(false);
      // Clear Phantom wallet connection state from storage to force popup on next connect
      try {
        localStorage.removeItem('phantom:connected');
        sessionStorage.removeItem('phantom:connected');
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const setOnConnect = useCallback((callback: ((publicKey: PublicKey) => Promise<void>) | null) => {
    // Defensive: Only set if callback is a function or null
    if (typeof callback === 'function' || callback === null) {
      setOnConnectCallback(callback);
    } else {
      console.warn('setOnConnect called with non-function:', callback);
      setOnConnectCallback(null);
    }
  }, []);

  return { publicKey, connected, connect, disconnect, phantomAvailable, setOnConnect };
}