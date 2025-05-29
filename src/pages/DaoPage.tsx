import React, { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, Clock, Check, User, FileText, X, BarChart3, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from '../components/utils/router';

interface ProposalProps {
  id: string;
  title: string;
  description: string;
  proposer_id?: string;
  grant_id?: number;
  status: string;
  end_date?: string;
  created_at?: string;
  // For static proposals compatibility
  proposer?: string;
  votes?: {
    for: number;
    against: number;
    abstain: number;
  };
  profiles?: {
    name: string;
  };
}

const ProposalCard: React.FC<{ proposal: ProposalProps; currentUserId?: string }> = ({ proposal, currentUserId }) => {
  const [votes, setVotes] = useState({ for: 0, against: 0, abstain: 0 });
  const [userVote, setUserVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [proposerProfile, setProposerProfile] = useState<{ female_flag?: boolean } | null>(null);
  const proposalId = proposal.id;

  useEffect(() => {
    const fetchVotes = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('proposal_votes')
        .select('vote_type, voter_id')
        .eq('proposal_id', proposalId);
      const counts = { for: 0, against: 0, abstain: 0 };
      let userVoted: string | null = null;
      (data || []).forEach((v: any) => {
        if (v.vote_type === 'for') counts.for++;
        if (v.vote_type === 'against') counts.against++;
        if (v.vote_type === 'abstain') counts.abstain++;
        if (v.voter_id === currentUserId) userVoted = v.vote_type;
      });
      setVotes(counts);
      setUserVote(userVoted);
      setLoading(false);
    };
    fetchVotes();
  }, [proposalId, currentUserId]);

  useEffect(() => {
    // Fetch proposer profile to check for female_flag
    const fetchProposerProfile = async () => {
      if (!proposal.proposer_id) return;
      const { data } = await supabase
        .from('profiles')
        .select('female_flag')
        .eq('user_id', proposal.proposer_id)
        .single();
      setProposerProfile(data);
    };
    fetchProposerProfile();
  }, [proposal.proposer_id]);

  const handleVote = async (type: 'for' | 'against' | 'abstain') => {
    if (userVote || voting) return;
    setVoting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setVoting(false);
      return;
    }
    await supabase.from('proposal_votes').insert({
      proposal_id: proposalId,
      voter_id: user.id,
      vote_type: type,
    });
    setUserVote(type);
    setVotes((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    setVoting(false);
  };

  const totalVotes = votes.for + votes.against + votes.abstain;
  const forPercentage = totalVotes > 0 ? (votes.for / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (votes.against / totalVotes) * 100 : 0;
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  return (
    <div className="card-bg rounded-xl overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-text-primary">{proposal.title}</h3>
          <span className={`text-sm px-3 py-1 rounded-full ${
            proposal.status === 'Active' 
              ? 'bg-accent-teal bg-opacity-20 text-accent-teal' 
              : 'bg-accent-warm bg-opacity-20 text-accent-warm'
          }`}>
            {proposal.status}
          </span>
        </div>
        
        <p className="text-text-secondary mb-4">{proposal.description}</p>
        
        <div className="flex items-center gap-2 mb-6 text-sm text-text-secondary">
          <User size={16} />
          <span>Proposed by {proposal.profiles?.name || proposal.proposer || proposal.proposer_id || 'Unknown'}
            {proposerProfile?.female_flag && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-pink-200 text-pink-800 text-xs font-semibold ml-2">
                <span className="mr-1">♀️</span> Female Founder
              </span>
            )}
          </span>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between mb-1">
            <div className="flex items-center">
              <ThumbsUp size={16} className="text-accent-teal mr-1" />
              <span className="text-sm text-text-secondary">{votes.for} votes</span>
            </div>
            <div className="flex items-center">
              <ThumbsDown size={16} className="text-accent-warm mr-1" />
              <span className="text-sm text-text-secondary">{votes.against} votes</span>
            </div>
          </div>
          
          <div className="h-2 w-full bg-background-dark rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-teal rounded-full"
              style={{ width: `${forPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-text-secondary text-sm">
            {proposal.status === 'Active' ? (
              <>
                <Clock size={16} className="mr-1" />
                <span>Ends {formatDate(proposal.end_date)}</span>
              </>
            ) : (
              <>
                <Check size={16} className="mr-1" />
                <span>Ended {formatDate(proposal.end_date)}</span>
              </>
            )}
          </div>
          
          <button className="text-sm text-accent-teal hover:underline flex items-center">
            <FileText size={16} className="mr-1" />
            View Details
          </button>
        </div>
      </div>
      
      {proposal.status === 'Active' && (
        <div className="border-t border-gray-800 p-4 flex gap-4">
          <button className="flex-1 py-2 bg-accent-teal bg-opacity-20 hover:bg-opacity-30 rounded-md text-accent-teal transition-colors" onClick={() => handleVote('for')}>
            Vote For
          </button>
          <button className="flex-1 py-2 bg-accent-warm bg-opacity-20 hover:bg-opacity-30 rounded-md text-accent-warm transition-colors" onClick={() => handleVote('against')}>
            Vote Against
          </button>
          <button className="flex-1 py-2 bg-gray-700 bg-opacity-20 hover:bg-opacity-30 rounded-md text-gray-400 transition-colors" onClick={() => handleVote('abstain')}>
            Abstain
          </button>
        </div>
      )}
    </div>
  );
};

const DaoPage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', grantId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setProfile(profileData);
      setLoading(false);
    };
    fetchProfile();

    // Fetch proposals from Supabase
    const fetchProposals = async () => {
      setProposalsLoading(true);
      const { data } = await supabase
        .from('proposals')
        .select('*, profiles:proposer_id(name)')
        .order('created_at', { ascending: false });
      setProposals(data || []);
      setProposalsLoading(false);
    };
    fetchProposals();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  const handleOpenModal = () => {
    setForm({ title: '', description: '', grantId: '' });
    setSubmitMsg(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitMsg('Please sign in.');
      setSubmitting(false);
      return;
    }
    const { error } = await supabase.from('proposals').insert({
      title: form.title,
      description: form.description,
      proposer_id: user.id,
      grant_id: form.grantId ? Number(form.grantId) : null,
      status: 'Active',
      created_at: new Date().toISOString(),
    });
    if (error) {
      setSubmitMsg('Error creating proposal.');
    } else {
      setSubmitMsg('Proposal created!');
      setTimeout(() => {
        setModalOpen(false);
      }, 1000);
    }
  };

  const activeProposals = proposals.filter((p) => p.status === 'Active');
  const passedProposals = proposals.filter((p) => p.status === 'Passed');

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="container mx-auto">
        {/* Winner Takes All Explainer */}
        <div className="card-bg rounded-xl p-6 flex flex-col justify-center mb-10">
          <h2 className="text-xl font-semibold mb-2 flex items-center text-accent-teal">
            <Award size={22} className="mr-2" /> Winner Takes All Voting
          </h2>
          <p className="text-text-secondary text-sm">
            Each vote costs 1 TestToken. The project with the most votes at the end of the round wins <span className="font-bold text-accent-teal">all remaining tokens</span> in the pool. Voters earn <span className="font-bold text-accent-warm">0.1 KMATCH</span> for every vote cast. Top 3 voters receive a special badge!
          </p>
          <button
            className="mt-6 self-end btn-secondary flex items-center gap-2"
            onClick={() => navigate('/leaderboard')}
          >
            <BarChart3 size={18} /> View Voter Leaderboard
          </button>
        </div>
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">DAO Voting</h1>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Participate in governance and help shape the future of GrantMatch. Vote on proposals or create your own.
          </p>
        </div>
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Active Proposals</h2>
          {profile && profile.role === 'founder' && (
            <>
              <button className="btn-secondary" onClick={handleOpenModal}>
                Create Proposal
              </button>
              {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                  <div className="bg-background-dark rounded-xl shadow-lg max-w-md w-full p-8 relative">
                    <button
                      className="absolute top-4 right-4 text-text-secondary hover:text-white"
                      onClick={handleCloseModal}
                    >
                      <X size={20} />
                    </button>
                    <h2 className="text-2xl font-bold mb-6">Create Proposal</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                        <input
                          type="text"
                          name="title"
                          value={form.title}
                          onChange={handleChange}
                          className="w-full bg-background-dark border border-gray-800 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-teal"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                        <textarea
                          name="description"
                          value={form.description}
                          onChange={handleChange}
                          className="w-full bg-background-dark border border-gray-800 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-teal"
                          rows={4}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Grant ID (optional)</label>
                        <input
                          type="number"
                          name="grantId"
                          value={form.grantId}
                          onChange={handleChange}
                          className="w-full bg-background-dark border border-gray-800 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-teal"
                          min={1}
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full btn-primary py-2"
                        disabled={submitting}
                      >
                        {submitting ? 'Submitting...' : 'Submit Proposal'}
                      </button>
                      {submitMsg && <div className="text-center mt-2 text-accent-teal">{submitMsg}</div>}
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {proposalsLoading ? (
            <div className="col-span-2 text-center text-text-secondary py-8">Loading proposals...</div>
          ) : activeProposals.length > 0 ? (
            activeProposals.map(proposal => (
              <ProposalCard key={proposal.id} proposal={proposal} currentUserId={currentUserId || undefined} />
            ))
          ) : (
            <div className="col-span-2 text-center text-text-secondary py-8">No active proposals.</div>
          )}
        </div>
        <h2 className="text-2xl font-semibold mb-6">Recent Passed Proposals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {proposalsLoading ? (
            <div className="col-span-2 text-center text-text-secondary py-8">Loading proposals...</div>
          ) : passedProposals.length > 0 ? (
            passedProposals.map(proposal => (
              <ProposalCard key={proposal.id} proposal={proposal} currentUserId={currentUserId || undefined} />
            ))
          ) : (
            <div className="col-span-2 text-center text-text-secondary py-8">No passed proposals.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DaoPage;