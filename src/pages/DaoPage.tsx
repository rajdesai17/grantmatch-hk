import React from 'react';
import { ThumbsUp, ThumbsDown, Clock, Check, User, FileText } from 'lucide-react';
import proposalsData from '../data/proposals.json';

interface ProposalProps {
  id: number;
  title: string;
  description: string;
  proposer: string;
  votes: {
    for: number;
    against: number;
    abstain: number;
  };
  status: string;
  endDate: string;
}

const ProposalCard: React.FC<{ proposal: ProposalProps }> = ({ proposal }) => {
  const totalVotes = proposal.votes.for + proposal.votes.against + proposal.votes.abstain;
  const forPercentage = (proposal.votes.for / totalVotes) * 100;
  const againstPercentage = (proposal.votes.against / totalVotes) * 100;
  
  const formatDate = (dateString: string) => {
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
          <span>Proposed by {proposal.proposer}</span>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between mb-1">
            <div className="flex items-center">
              <ThumbsUp size={16} className="text-accent-teal mr-1" />
              <span className="text-sm text-text-secondary">{proposal.votes.for} votes</span>
            </div>
            <div className="flex items-center">
              <ThumbsDown size={16} className="text-accent-warm mr-1" />
              <span className="text-sm text-text-secondary">{proposal.votes.against} votes</span>
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
                <span>Ends {formatDate(proposal.endDate)}</span>
              </>
            ) : (
              <>
                <Check size={16} className="mr-1" />
                <span>Ended {formatDate(proposal.endDate)}</span>
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
          <button className="flex-1 py-2 bg-accent-teal bg-opacity-20 hover:bg-opacity-30 rounded-md text-accent-teal transition-colors">
            Vote For
          </button>
          <button className="flex-1 py-2 bg-accent-warm bg-opacity-20 hover:bg-opacity-30 rounded-md text-accent-warm transition-colors">
            Vote Against
          </button>
          <button className="flex-1 py-2 bg-gray-700 bg-opacity-20 hover:bg-opacity-30 rounded-md text-gray-400 transition-colors">
            Abstain
          </button>
        </div>
      )}
    </div>
  );
};

const DaoPage: React.FC = () => {
  const activeProposals = proposalsData.filter(p => p.status === 'Active');
  const passedProposals = proposalsData.filter(p => p.status === 'Passed');

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="container mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">DAO Voting</h1>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Participate in governance and help shape the future of GrantMatch. Vote on proposals or create your own.
          </p>
        </div>
        
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Active Proposals</h2>
          <button className="btn-secondary">
            Create Proposal
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {activeProposals.map(proposal => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
        
        <h2 className="text-2xl font-semibold mb-6">Recent Passed Proposals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {passedProposals.map(proposal => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DaoPage;