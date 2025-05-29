import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface GrantDetailsModalProps {
  grant: {
    id: number;
    title: string;
    organization: string;
    amount: number;
    deadline: string;
    description: string;
    tags: string[];
    requirements: string[];
  };
  open: boolean;
  onClose: () => void;
}

const GrantDetailsModal: React.FC<GrantDetailsModalProps> = ({ grant, open, onClose }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [userProposals, setUserProposals] = useState<{ id: string; title: string }[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState<string>('');
  const [grantApplicationsCount, setGrantApplicationsCount] = useState<number>(0);
  const [appliedProposals, setAppliedProposals] = useState<{ title: string; proposer_name?: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    setMessage(null);
    setApplied(false);
    setProfile(null);
    setLoading(true);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setProfile(profileData);
      // Fetch user's proposals
      const { data: proposals } = await supabase
        .from('proposals')
        .select('id, title')
        .eq('proposer_id', user.id);
      setUserProposals(proposals || []);
      // Check if already applied
      const { data: appData } = await supabase
        .from('grant_applications')
        .select('id')
        .eq('user_id', user.id)
        .eq('grant_id', grant.id)
        .maybeSingle();
      setApplied(!!appData);
      // Count and list proposals that have applied for this grant
      const { data: appliedApps } = await supabase
        .from('grant_applications')
        .select('proposal_id, proposals(title, profiles:proposer_id(name))')
        .eq('grant_id', grant.id);
      setGrantApplicationsCount(appliedApps ? appliedApps.length : 0);
      setAppliedProposals(
        (appliedApps || [])
          .filter((a: any) => a.proposals)
          .map((a: any) => ({
            title: a.proposals.title,
            proposer_name: a.proposals.profiles?.name
          }))
      );
      setLoading(false);
    })();
  }, [grant, open]);

  const handleApply = async () => {
    setLoading(true);
    setMessage(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage('Please sign in to apply.');
      setLoading(false);
      return;
    }
    if (!selectedProposalId) {
      setMessage('Please select a proposal to link.');
      setLoading(false);
      return;
    }
    // Prevent duplicate
    const { data: appData } = await supabase
      .from('grant_applications')
      .select('id')
      .eq('user_id', user.id)
      .eq('grant_id', grant.id)
      .maybeSingle();
    if (appData) {
      setApplied(true);
      setMessage('You have already applied for this grant.');
      setLoading(false);
      return;
    }
    // Insert application with proposal_id
    const { error } = await supabase
      .from('grant_applications')
      .insert({ user_id: user.id, grant_id: grant.id, proposal_id: selectedProposalId });
    if (error) {
      setMessage('Error applying for grant.');
    } else {
      setApplied(true);
      setMessage('Application submitted successfully!');
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-background-dark rounded-xl shadow-lg max-w-lg w-full p-8 relative">
        <button
          className="absolute top-4 right-4 text-text-secondary hover:text-white"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-2">{grant.title}</h2>
        <p className="text-text-secondary mb-2">{grant.organization}</p>
        <p className="mb-4">{grant.description}</p>
        <div className="mb-4">
          <span className="font-semibold">Amount:</span> ${grant.amount.toLocaleString()}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Deadline:</span> {new Date(grant.deadline).toLocaleDateString()}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Tags:</span> {grant.tags.join(', ')}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Requirements:</span>
          <ul className="list-disc list-inside ml-4">
            {grant.requirements.map((req, idx) => (
              <li key={idx}>{req}</li>
            ))}
          </ul>
        </div>
        {profile && profile.role === 'founder' && (
          <>
            <div className="mb-2 text-sm text-text-secondary">
              Proposals applied for this grant: <span className="font-bold">{grantApplicationsCount}</span>
              {appliedProposals.length > 0 && (
                <ul className="list-disc list-inside ml-4 mt-1">
                  {appliedProposals.map((p, idx) => (
                    <li key={idx}>{p.title}{p.proposer_name ? ` (by ${p.proposer_name})` : ''}</li>
                  ))}
                </ul>
              )}
            </div>
            {userProposals.length === 0 ? (
              <div className="mb-4 text-accent-warm">You must create a proposal before applying for a grant.</div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm mb-1">Select Proposal to Link</label>
                <select
                  className="w-full bg-background-dark border border-gray-800 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-teal"
                  value={selectedProposalId}
                  onChange={e => setSelectedProposalId(e.target.value)}
                  disabled={applied || loading}
                >
                  <option value="">-- Select Proposal --</option>
                  {userProposals.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              className={`btn-primary w-full py-2 mt-2 ${applied || userProposals.length === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={handleApply}
              disabled={applied || loading || userProposals.length === 0}
            >
              {applied ? 'Already Applied' : loading ? 'Applying...' : 'Apply for Grant'}
            </button>
          </>
        )}
        {message && (
          <div className="mt-4 text-center text-accent-teal">{message}</div>
        )}
      </div>
    </div>
  );
};

export default GrantDetailsModal; 