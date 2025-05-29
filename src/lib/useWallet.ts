import { useCallback, useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';

declare global {
  interface Window {
    solana?: any;
  }
}

export function useWallet() {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connected, setConnected] = useState(false);
  const [phantomAvailable, setPhantomAvailable] = useState(false);

  useEffect(() => {
    if (window.solana && window.solana.isPhantom) {
      setPhantomAvailable(true);
      window.solana.connect({ onlyIfTrusted: true })
        .then((res: any) => {
          if (res.publicKey) {
            setPublicKey(new PublicKey(res.publicKey.toString()));
            setConnected(true);
          }
        })
        .catch(() => {});
      window.solana.on('connect', () => {
        setPublicKey(new PublicKey(window.solana.publicKey.toString()));
        setConnected(true);
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
  }, []);

  const connect = useCallback(async () => {
    if (!window.solana) {
      window.open('https://phantom.app/', '_blank');
      return;
    }
    try {
      const res = await window.solana.connect();
      setPublicKey(new PublicKey(res.publicKey.toString()));
      setConnected(true);
    } catch (err) {
      // User rejected or error
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (window.solana) {
      await window.solana.disconnect();
      setPublicKey(null);
      setConnected(false);
    }
  }, []);

  return { publicKey, connected, connect, disconnect, phantomAvailable };
} 