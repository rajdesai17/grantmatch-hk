import React from 'react';
import { ArrowLeft, Award, BarChart3 } from 'lucide-react';
import { useNavigate } from '../components/utils/router';

const leaderboard = [
  { name: 'Alex Chen', votes: 32, badge: '🥇', kmatch: 3.2 },
  { name: 'Sophia Rodriguez', votes: 28, badge: '🥈', kmatch: 2.8 },
  { name: 'Marcus Johnson', votes: 21, badge: '🥉', kmatch: 2.1 },
  { name: 'Priya Patel', votes: 17, kmatch: 1.7 },
  { name: 'Jordan Lee', votes: 14, kmatch: 1.4 },
  { name: 'Samira Khan', votes: 12, kmatch: 1.2 },
  { name: 'Liam Smith', votes: 10, kmatch: 1.0 },
  { name: 'Emily Davis', votes: 8, kmatch: 0.8 },
  { name: 'Noah Kim', votes: 7, kmatch: 0.7 },
  { name: 'Olivia Brown', votes: 6, kmatch: 0.6 },
];

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="pt-24 pb-16 px-4 min-h-screen bg-gradient-to-b from-background-dark to-background-light flex flex-col items-center">
      <div className="container mx-auto max-w-2xl">
        <button
          className="flex items-center gap-2 text-accent-teal mb-8 hover:underline"
          onClick={() => navigate('/dao')}
        >
          <ArrowLeft size={20} /> Back to DAO Voting
        </button>
        <div className="card-bg rounded-xl p-8 shadow-lg mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <BarChart3 size={28} className="text-accent-warm" /> Voter Leaderboard
          </h1>
          <p className="text-text-secondary mb-6">
            The most active voters earn <span className="font-bold text-accent-warm">KMATCH</span> tokens and special badges. Top 3 get a permanent on-chain badge!
          </p>
          <ol className="space-y-4 mt-8">
            {leaderboard.map((voter, idx) => (
              <li
                key={voter.name}
                className={`flex items-center justify-between bg-background-dark rounded-lg px-6 py-4 shadow-subtle ${idx < 3 ? 'border-2 border-accent-teal' : 'border border-background-light'} transition-all`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-2xl font-bold ${idx < 3 ? 'text-accent-teal' : 'text-text-primary'}`}>{idx + 1}</span>
                  <span className="font-semibold text-lg flex items-center gap-2">
                    {voter.name}
                    {voter.badge && <span className="text-2xl ml-1">{voter.badge}</span>}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-accent-warm font-semibold text-lg">{voter.votes} votes</span>
                  <span className="text-xs text-text-secondary">{voter.kmatch} KMATCH</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage; 