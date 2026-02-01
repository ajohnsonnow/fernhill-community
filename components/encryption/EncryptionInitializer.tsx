'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { initializeEncryption } from '@/lib/crypto';

/**
 * EncryptionInitializer - Automatically initializes E2EE keys when user logs in
 * 
 * This component runs silently in the background to ensure encryption keys
 * are ready before the user tries to send their first message.
 * 
 * Keys are:
 * - Generated once per device using Web Crypto API
 * - Stored locally in IndexedDB (private key never leaves device)
 * - Public key is synced to profile for other users to encrypt messages to you
 */
export function EncryptionInitializer() {
  const [initialized, setInitialized] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const initE2EE = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || initialized) return;

        // Check if user already has a public key (encryption already set up)
        const { data: profile } = await supabase
          .from('profiles')
          .select('public_key')
          .eq('id', user.id)
          .single();

        // If public key exists and is valid, keys are already initialized
        if ((profile as any)?.public_key) {
          setInitialized(true);
          return;
        }

        // Initialize encryption and update profile with public key
        const result = await initializeEncryption(
          user.id,
          async (publicKey: string) => {
            await (supabase
              .from('profiles') as any)
              .update({ public_key: publicKey })
              .eq('id', user.id);
          }
        );

        if (result.success) {
          console.log('🔐 E2EE encryption initialized');
          setInitialized(true);
        }
      } catch (error) {
        console.error('E2EE initialization error:', error);
      }
    };

    // Small delay to not block initial render
    const timer = setTimeout(initE2EE, 1000);
    return () => clearTimeout(timer);
  }, [supabase, initialized]);

  // This component renders nothing - it just initializes encryption
  return null;
}

export default EncryptionInitializer;
