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

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<any[]>([]);
  const [nfts, setNfts] = useState<any[]>([]);

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
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Votes Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <FileText size={24} className="mr-2 text-accent-teal" />
              {profile.role === 'founder' ? 'Received Votes' : 'Given Votes'}
            </h2>
            
            <div className="space-y-4">
              {votes.length > 0 ? (
                votes.map((vote) => (
                  <div key={vote.id} className="card-bg rounded-xl p-5 hover:shadow-subtle transition-all duration-300">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">Vote #{vote.id.slice(0, 8)}</h3>
                      <span className="text-accent-teal">{vote.token_amount} tokens</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary">
                        {new Date(vote.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
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
                nfts.map((nft) => (
                  <div key={nft.id} className="card-bg rounded-xl overflow-hidden">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-medium">NFT #{nft.id.slice(0, 8)}</h3>
                        {nft.champion_badge && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent-teal bg-opacity-20 text-accent-teal">
                            Champion
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-secondary">
                          {new Date(nft.created_at).toLocaleDateString()}
                        </span>
                        <button className="text-accent-teal hover:underline flex items-center">
                          View on Chain
                          <ArrowUpRight size={14} className="ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
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