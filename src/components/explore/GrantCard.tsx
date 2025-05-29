import React from 'react';
import { Calendar, DollarSign, Award } from 'lucide-react';

interface GrantProps {
  id: number;
  title: string;
  organization: string;
  amount: number;
  deadline: string;
  description: string;
  tags: string[];
  female_flag?: boolean;
}

const GrantCard: React.FC<{ grant: GrantProps; onViewDetails?: (grant: GrantProps) => void }> = ({ grant, onViewDetails }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="card-bg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-background-light flex flex-col h-full">
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-text-primary line-clamp-1">{grant.title}</h3>
          {grant.female_flag && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-pink-200 text-pink-800 text-xs font-semibold ml-2 gap-1">
              <Award size={14} className="text-pink-700" />
              Female Founder
            </span>
          )}
        </div>
        <p className="text-accent-teal text-sm font-medium mb-2 line-clamp-1">{grant.organization}</p>
        <p className="text-text-secondary mb-4 line-clamp-3 text-sm">{grant.description}</p>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1 text-accent-warm bg-background rounded-md px-2 py-1 text-xs font-semibold">
            <DollarSign size={14} />
            {formatAmount(grant.amount)}
          </div>
          <div className="flex items-center gap-1 text-accent-teal bg-background rounded-md px-2 py-1 text-xs font-semibold">
            <Calendar size={14} />
            {formatDate(grant.deadline)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {grant.tags.map((tag, index) => (
            <span 
              key={index}
              className="text-xs px-2 py-1 rounded-full bg-accent-subtle text-text-secondary font-medium tracking-wide"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-auto pt-2">
          <button className="w-full btn-primary py-2 text-base font-semibold" onClick={() => onViewDetails?.(grant)}>
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrantCard;