import React, { useEffect, useState } from 'react';
import { Award, FileText, Mail, Briefcase, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from '../components/utils/router';

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
  const [votes, setVotes] = useState<unknown[]>([]);
  const [nfts, setNfts] = useState<unknown[]>([]);
  const [appliedGrants, setAppliedGrants] = useState<unknown[]>([]);
  const [proposalVotes, setProposalVotes] = useState<ProposalVoteSummary[]>([]);
  const [myProposals, setMyProposals] = useState<{ id: string; title: string; created_at?: string; status?: string }[]>([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<{ id: string; title: string; description?: string; created_at?: string; status?: string } | null>(null);

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

        const { data: votesData } = await supabase
          .from('votes')
          .select('*')
          .eq(profileData.role === 'founder' ? 'founder_id' : 'voter_id', user.id);

        const { data: nftsData } = await supabase
          .from('nfts')
          .select('*')
          .eq('user_id', user.id);

        setProfile(profileData);
        setVotes(votesData || []);
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
    <div className="pt-24 pb-16 px-4">
      <div className="container mx-auto">
        <div className="card-bg rounded-xl p-8 mb-10 relative overflow-hidden glow-subtle">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-accent-teal to-transparent opacity-5 pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
            <div className="relative">
              <div className="w-32 h-32 rounded-xl bg-accent-subtle flex items-center justify-center text-4xl font-bold text-white">
                {profile.name.charAt(0)}
              </div>
              <div className="absolute -bottom-3 -right-3 bg-accent-teal rounded-full p-2">
                <Award size={20} className="text-white" />
              </div>
            </div>
            
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
              <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                <span className="text-text-secondary capitalize">{profile.role.replace('_', ' ')}</span>
                {profile.female_flag && (
                  <>
                    <span className="text-text-secondary">•</span>
                    <span className="text-accent-teal">Female-led</span>
                  </>
                )}
              </div>
              
              {profile.mission && (
                <p className="text-text-secondary mb-6 max-w-2xl">{profile.mission}</p>
              )}
              
              {profile.region && (
                <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-6">
                  <span className="bg-accent-subtle bg-opacity-30 text-text-secondary px-3 py-1 rounded-full text-sm">
                    {profile.region}
                  </span>
                </div>
              )}
              
              <div className="flex gap-4 justify-center md:justify-start">
                <button className="btn-primary">
                  <Mail size={18} />
                  Contact
                </button>
                {profile.wallet_address ? (
                  <button className="btn-secondary">
                    <Briefcase size={18} />
                    View Wallet
                  </button>
                ) : (
                  <button className="btn-secondary">
                    <Briefcase size={18} />
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {profile.role === 'founder' && (
          <div className="card-bg rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Applied Grants</h2>
            {appliedGrants.length > 0 ? (
              <ul className="list-disc list-inside ml-4">
                {appliedGrants.map((app) => {
                  const a = app as { grant_id: number; grants?: { title?: string }; proposals?: { title?: string } };
                  return (
                    <li key={a.grant_id}>
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
        
        {profile.role === 'founder' && myProposals.length > 0 && (
          <div className="card-bg rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">My Created Proposals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myProposals.map((p) => {
                const voteSummary = proposalVotes.find(v => v.title === p.title);
                return (
                  <div key={p.id} className="card-bg rounded-xl p-4 border border-gray-800">
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
              })}
            </div>
            {detailsModalOpen && selectedProposal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                <div className="bg-background-dark rounded-xl shadow-lg max-w-md w-full p-8 relative">
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
        
        {profile.role === 'founder' && proposalVotes.length > 0 && (
          <div className="card-bg rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Votes Received on My Proposals</h2>
            <ul className="list-disc list-inside ml-4">
              {proposalVotes.map((p, idx) => (
                <li key={idx}>
                  <span className="font-semibold">{p.title}:</span> For: {p.for}, Against: {p.against}, Abstain: {p.abstain}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Votes Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <FileText size={24} className="mr-2 text-accent-teal" />
              {profile.role === 'founder' ? 'Received Votes' : 'Given Votes'}
            </h2>
            
            <div className="space-y-4">
              {votes.length > 0 ? (
                votes.map((vote) => {
                  const v = vote as { id: string; token_amount: number; created_at: string };
                  return (
                    <div key={v.id} className="card-bg rounded-xl p-5 hover:shadow-subtle transition-all duration-300">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">Vote #{v.id.slice(0, 8)}</h3>
                        <span className="text-accent-teal">{v.token_amount} tokens</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-secondary">
                          {new Date(v.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="card-bg rounded-xl p-6 text-center">
                  <p className="text-text-secondary mb-4">No votes yet.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* NFT Achievements */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <Award size={24} className="mr-2 text-accent-teal" />
              NFT Achievements
            </h2>
            
            <div className="space-y-4">
              {nfts.length > 0 ? (
                nfts.map((nft) => {
                  const n = nft as { id: string; champion_badge?: boolean; created_at: string };
                  return (
                    <div key={n.id} className="card-bg rounded-xl overflow-hidden">
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
              ) : (
                <div className="card-bg rounded-xl p-6 text-center">
                  <p className="text-text-secondary mb-4">No NFT achievements yet.</p>
                  {profile.role === 'founder' && (
                    <button className="btn-secondary mx-auto">
                      Apply for Grants
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;