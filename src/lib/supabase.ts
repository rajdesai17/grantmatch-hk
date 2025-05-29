import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility to mint an NFT via Edge Function
export async function mintNft({ recipient_wallet, metadata_uri, name = 'GrantMatch NFT', symbol = 'GMNFT' }: {
  recipient_wallet: string,
  metadata_uri: string,
  name?: string,
  symbol?: string
}) {
  const { data, error } = await supabase.functions.invoke('mint-nft', {
    body: { recipient_wallet, metadata_uri, name, symbol }
  });
  if (error) throw new Error(error.message || 'Failed to mint NFT');
  return data;
}

// Utility to upload NFT metadata JSON to Supabase Storage and return public URL
export async function uploadNftMetadata(userId: string, metadata: object): Promise<string> {
  const fileName = `nft-metadata-${userId}.json`;
  const file = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
  const { error } = await supabase.storage.from('nft-metadata').upload(fileName, file, {
    contentType: 'application/json',
    upsert: true,
  });
  if (error) throw new Error(error.message || 'Failed to upload NFT metadata');
  // Get public URL
  const { publicUrl } = supabase.storage.from('nft-metadata').getPublicUrl(fileName).data;
  if (!publicUrl) throw new Error('Failed to get public URL for NFT metadata');
  return publicUrl;
}