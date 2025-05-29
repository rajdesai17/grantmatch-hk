import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Keypair, Connection, PublicKey, Transaction, sendAndConfirmTransaction } from 'https://esm.sh/@solana/web3.js@1.89.2';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from 'https://esm.sh/@solana/spl-token@0.2.0';
import { createCreateMetadataAccountV3Instruction, PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from 'https://esm.sh/@metaplex-foundation/mpl-token-metadata@2.3.0';

serve(async (req) => {
  try {
    const { recipient_wallet, metadata_uri, name = 'GrantMatch NFT', symbol = 'GMNFT' } = await req.json();
    if (!recipient_wallet || !metadata_uri) {
      return new Response(JSON.stringify({ error: 'Missing recipient_wallet or metadata_uri' }), { status: 400 });
    }

    // MOCK MODE: If MOCK_NFT_MINTING env variable is set, return a mock NFT mint result
    const mockMode = Deno.env.get('MOCK_NFT_MINTING') === 'true';
    if (mockMode) {
      // Simulate a fake mint address and associated token account
      const fakeMint = 'MockMint111111111111111111111111111111111111';
      const fakeAta = 'MockATA1111111111111111111111111111111111111';
      const fakeSignature = 'MockSignature1111111111111111111111111111111';
      return new Response(
        JSON.stringify({
          mint: fakeMint,
          ata: fakeAta,
          signature: fakeSignature,
          mock: true,
          metadata: {
            name,
            symbol,
            uri: metadata_uri,
            recipient_wallet
          }
        }),
        { status: 200 }
      );
    }

    // Load keypair from env
    const secret = Deno.env.get('SOLANA_KEYPAIR_JSON');
    if (!secret) throw new Error('SOLANA_KEYPAIR_JSON env variable not set');
    const secretArray = JSON.parse(secret);
    const payer = Keypair.fromSecretKey(Uint8Array.from(secretArray));

    // Connect to Solana Devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const recipient = new PublicKey(recipient_wallet);

    // Mint NFT (1 token, 0 decimals)
    const mint = await createMint(connection, payer, payer.publicKey, null, 0);
    const ata = await getOrCreateAssociatedTokenAccount(connection, payer, mint, recipient);
    await mintTo(connection, payer, mint, ata.address, payer, 1);

    // Create metadata account (Metaplex standard)
    const metadataSeeds = [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ];
    const [metadataPDA] = await PublicKey.findProgramAddress(
      metadataSeeds,
      TOKEN_METADATA_PROGRAM_ID
    );

    const metadataIx = createCreateMetadataAccountV3Instruction({
      metadata: metadataPDA,
      mint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    }, {
      createMetadataAccountArgsV3: {
        data: {
          name,
          symbol,
          uri: metadata_uri,
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null,
        },
        isMutable: true,
        collectionDetails: null,
      },
    });

    const tx = new Transaction().add(metadataIx);
    const sig = await sendAndConfirmTransaction(connection, tx, [payer]);

    return new Response(JSON.stringify({ mint: mint.toBase58(), ata: ata.address.toBase58(), signature: sig }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}); 