import React, { useEffect, useState } from 'react';
import { Award, Mail, Briefcase, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from '../components/utils/router';
import { useWallet } from '../lib/useWallet';

interface Profile {
  name: string;
  role: 'founder' | 'dao_funder';
  email: string;
  region?: string;
  mission?: string;
  female_flag?: boolean;
  applied_grants_count: number;
  wallet_address?: string;
}

interface ProposalVoteSummary {
  title: string;
  for: number;
  against: number;
  abstain: number;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState<unknown[]>([]);
  const [appliedGrants, setAppliedGrants] = useState<unknown[]>([]);
  const [proposalVotes, setProposalVotes] = useState<ProposalVoteSummary[]>([]);
  const [myProposals, setMyProposals] = useState<{ id: string; title: string; created_at?: string; status?: string }[]>([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<{ id: string; title: string; description?: string; created_at?: string; status?: string } | null>(null);
  const [minting, setMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintSuccess, setMintSuccess] = useState<{ mint: string; signature: string } | null>(null);
  const { publicKey, connect, phantomAvailable } = useWallet();
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/');
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;

        const { data: nftsData } = await supabase
          .from('nfts')
          .select('*')
          .eq('user_id', user.id);

        setProfile(profileData);
        setNfts(nftsData || []);

        // Fetch applied grants for founders
        if (profileData.role === 'founder') {
          const { data: applications } = await supabase
            .from('grant_applications')
            .select('grant_id, proposal_id, grants(title), proposals(title)')
            .eq('user_id', user.id);
          setAppliedGrants(applications || []);
          // Fetch proposals created by this user
          const { data: proposalsCreated } = await supabase
            .from('proposals')
            .select('id, title, created_at, status')
            .eq('proposer_id', user.id);
          setMyProposals(proposalsCreated || []);
          if (proposalsCreated && proposalsCreated.length > 0) {
            // For each proposal, fetch votes
            const votesResults: ProposalVoteSummary[] = await Promise.all(proposalsCreated.map(async (proposal: { id: string; title: string }) => {
              const { data: pvotes } = await supabase
                .from('proposal_votes')
                .select('vote_type')
                .eq('proposal_id', proposal.id);
              const counts = { for: 0, against: 0, abstain: 0 };
              (pvotes || []).forEach((v: { vote_type: string }) => {
                if (v.vote_type === 'for') counts.for++;
                if (v.vote_type === 'against') counts.against++;
                if (v.vote_type === 'abstain') counts.abstain++;
              });
              return { title: proposal.title, ...counts };
            }));
            setProposalVotes(votesResults);
          } else {
            setProposalVotes([]);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleViewDetails = (proposal: typeof myProposals[0]) => {
    setSelectedProposal(proposal);
    setDetailsModalOpen(true);
  };

  const handleMintNft = async () => {
    setMinting(true);
    setMintError(null);
    setMintSuccess(null);
    try {
      if (!profile?.wallet_address) {
        setMintError('Connect your wallet first.');
        setMinting(false);
        return;
      }
      // 1. Enforce one NFT per user (in-memory only)
      if (nfts.length > 0) {
        setMintError('You already have an NFT profile.');
        setMinting(false);
        return;
      }
      // 2. Use static metadata for mock NFT
      const metadata = {
        name: 'GrantMatch Demo NFT',
        symbol: 'GMNFT',
        description: 'This is a mock NFT for testing.',
        image: '',
        attributes: [
          { trait_type: 'Demo', value: true }
        ]
      };
      // 3. Simulate NFT minting (no Supabase, no storage)
      const mockMint = 'MockMint111111111111111111111111111111111111';
      const mockSignature = 'MockSignature1111111111111111111111111111111';
      const mockNft = {
        id: mockMint,
        champion_badge: false,
        created_at: new Date().toISOString(),
        ...metadata
      };
      setMintSuccess({ mint: mockMint, signature: mockSignature });
      setNfts([mockNft]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMintError(err.message || 'Failed to mint NFT');
      } else {
        setMintError('Failed to mint NFT');
      }
    } finally {
      setMinting(false);
    }
  };

  const handleConnectWallet = async () => {
    setWalletError(null);
    setWalletLoading(true);
    try {
      if (!phantomAvailable) {
        window.open('https://phantom.app/', '_blank');
        setWalletLoading(false);
        return;
      }
      await connect();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      const walletAddress = publicKey?.toBase58();
      if (!walletAddress) throw new Error('Wallet not found');
      // Directly update wallet_address in profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_address: walletAddress })
        .eq('user_id', user.id);
      if (updateError) throw new Error(updateError.message || 'Failed to update wallet address in profile');
      setWalletError(null);
      // Refetch profile to update UI
      setProfile((prev) => prev ? { ...prev, wallet_address: walletAddress } : prev);
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setWalletLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto text-center">
          <p className="text-text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto text-center">
          <p className="text-text-secondary">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-4 min-h-screen bg-gradient-to-b from-background-dark to-background-light flex flex-col items-center">
      <div className="container mx-auto max-w-3xl w-full">
        <div className="card-bg rounded-2xl p-10 mb-12 relative overflow-hidden glow-subtle shadow-lg">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-accent-teal to-transparent opacity-10 pointer-events-none"></div>
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start relative z-10">
            <div className="relative">
              <div className="w-36 h-36 rounded-2xl bg-accent-subtle flex items-center justify-center text-5xl font-bold text-white shadow-lg border-4 border-background">
                {profile.name.charAt(0)}
              </div>
              <div className="absolute -bottom-4 -right-4 bg-accent-teal rounded-full p-3 shadow-lg">
                <Award size={28} className="text-white" />
              </div>
            </div>
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2 flex items-center justify-center md:justify-start gap-3 tracking-tight">
                {profile.name}
                {profile.female_flag && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-pink-200 text-pink-800 text-sm font-semibold ml-2 gap-1">
                    <Award size={16} className="text-pink-700" /> Female Founder
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-3 mb-4 justify-center md:justify-start text-base">
                <span className="text-text-secondary capitalize">{profile.role.replace('_', ' ')}</span>
                {profile.female_flag && (
                  <>
                    <span className="text-text-secondary">•</span>
                    <span className="text-accent-teal font-semibold">Female-led</span>
                  </>
                )}
              </div>
              {profile.mission && (
                <p className="text-text-secondary mb-6 max-w-2xl text-lg font-medium">{profile.mission}</p>
              )}
              {profile.region && (
                <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-6">
                  <span className="bg-accent-subtle bg-opacity-30 text-text-secondary px-4 py-1 rounded-full text-base font-medium">
                    {profile.region}
                  </span>
                </div>
              )}
              <div className="flex gap-4 justify-center md:justify-start mt-4">
                <button className="btn-primary text-base px-6 py-2.5">
                  <Mail size={20} />
                  Contact
                </button>
                {profile.wallet_address ? (
                  <button className="btn-secondary text-base px-6 py-2.5">
                    <Briefcase size={20} />
                    View Wallet
                  </button>
                ) : (
                  <>
                    <button className="btn-secondary text-base px-6 py-2.5" onClick={handleConnectWallet} disabled={walletLoading}>
                      {walletLoading ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                    {walletError && <div className="text-red-500 mt-2">{walletError}</div>}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Applied Grants */}
        {profile.role === 'founder' && (
          <div className="card-bg rounded-2xl p-8 mb-10 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-accent-teal flex items-center gap-2">
              <Award size={22} className="text-accent-teal" /> Applied Grants
            </h2>
            {appliedGrants.length > 0 ? (
              <ul className="list-disc list-inside ml-4 text-base">
                {appliedGrants.map((app) => {
                  const a = app as { grant_id: number; grants?: { title?: string }; proposals?: { title?: string } };
                  return (
                    <li key={a.grant_id} className="mb-1">
                      {a.grants?.title || 'Grant #' + a.grant_id}
                      {a.proposals?.title && (
                        <span className="text-text-secondary"> (via proposal: {a.proposals.title})</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-text-secondary">No grant applications yet.</p>
            )}
          </div>
        )}
        {/* My Proposals */}
        {profile.role === 'founder' && myProposals.length > 0 && (
          <div className="card-bg rounded-2xl p-8 mb-10 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-accent-teal flex items-center gap-2">
              <Award size={22} className="text-accent-teal" /> My Created Proposals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(() => {
                const p = myProposals[0];
                if (!p) return null;
                const voteSummary = proposalVotes.find(v => v.title === p.title);
                return (
                  <div key={p.id} className="card-bg rounded-xl p-5 border border-background-light shadow-subtle">
                    <h3 className="text-lg font-bold mb-2">{p.title}</h3>
                    <div className="text-sm text-text-secondary mb-2">
                      Created: {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Unknown'}
                    </div>
                    <div className="text-sm mb-2">
                      Status: <span className="font-semibold">{p.status || 'Active'}</span>
                    </div>
                    <div className="text-sm mb-4">
                      Votes: For <span className="text-accent-teal font-semibold">{voteSummary?.for ?? 0}</span>,
                      Against <span className="text-accent-warm font-semibold">{voteSummary?.against ?? 0}</span>,
                      Abstain <span className="text-gray-400 font-semibold">{voteSummary?.abstain ?? 0}</span>
                    </div>
                    <button className="btn-secondary text-sm" onClick={() => handleViewDetails(p)}>
                      View Details
                    </button>
                  </div>
                );
              })()}
            </div>
            {detailsModalOpen && selectedProposal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                <div className="bg-background-dark rounded-2xl shadow-lg max-w-md w-full p-8 relative">
                  <button
                    className="absolute top-4 right-4 text-text-secondary hover:text-white"
                    onClick={() => setDetailsModalOpen(false)}
                  >
                    &times;
                  </button>
                  <h2 className="text-2xl font-bold mb-4">{selectedProposal.title}</h2>
                  <div className="mb-2 text-sm text-text-secondary">
                    Created: {selectedProposal.created_at ? new Date(selectedProposal.created_at).toLocaleDateString() : 'Unknown'}
                  </div>
                  <div className="mb-2 text-sm">
                    Status: <span className="font-semibold">{selectedProposal.status || 'Active'}</span>
                  </div>
                  <div className="mb-4 text-sm">
                    Description: <br />
                    <span className="text-text-primary">{selectedProposal.description || 'No description available.'}</span>
                  </div>
                  <div className="mb-2 text-sm">
                    Votes: For <span className="text-accent-teal font-semibold">{proposalVotes.find(v => v.title === selectedProposal.title)?.for ?? 0}</span>,
                    Against <span className="text-accent-warm font-semibold">{proposalVotes.find(v => v.title === selectedProposal.title)?.against ?? 0}</span>,
                    Abstain <span className="text-gray-400 font-semibold">{proposalVotes.find(v => v.title === selectedProposal.title)?.abstain ?? 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* NFT Achievements */}
        <div className="card-bg rounded-2xl p-8 shadow-lg mb-10">
          <h2 className="text-2xl font-bold mb-6 text-accent-teal flex items-center gap-2">
            <Award size={24} className="mr-2 text-accent-teal" /> NFT Achievements
          </h2>
          <div className="space-y-4">
            {nfts.length > 0 ? (
              nfts.map((nft) => {
                const n = nft as { id: string; champion_badge?: boolean; created_at: string };
                return (
                  <div key={n.id} className="card-bg rounded-xl overflow-hidden border border-background-light">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-medium">NFT #{n.id.slice(0, 8)}</h3>
                        {n.champion_badge && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent-teal bg-opacity-20 text-accent-teal">
                            Champion
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-secondary">
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                        <button className="text-accent-teal hover:underline flex items-center">
                          View on Chain
                          <ArrowUpRight size={14} className="ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) :
              <div className="card-bg rounded-xl p-6 text-center">
                <p className="text-text-secondary mb-4">No NFT achievements yet.</p>
                {profile.wallet_address && (
                  <button className="btn-secondary mx-auto" onClick={handleMintNft} disabled={minting}>
                    {minting ? 'Minting NFT...' : 'Mint NFT Achievement'}
                  </button>
                )}
                {mintError && <div className="text-red-500 mt-2">{mintError}</div>}
                {mintSuccess && (
                  <div className="text-green-500 mt-2">
                    NFT Minted! <a href={`https://explorer.solana.com/address/${mintSuccess.mint}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="underline">View on Solana Explorer</a>
                  </div>
                )}
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;