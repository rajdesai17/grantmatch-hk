import React from 'react';
import { Calendar, DollarSign, Tag } from 'lucide-react';

interface GrantProps {
  id: number;
  title: string;
  organization: string;
  amount: number;
  deadline: string;
  description: string;
  tags: string[];
}

const GrantCard: React.FC<{ grant: GrantProps }> = ({ grant }) => {
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
    <div className="card-bg rounded-xl overflow-hidden hover:shadow-subtle transition-all duration-300">
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-text-primary">{grant.title}</h3>
        <p className="text-text-secondary text-sm mb-4">{grant.organization}</p>
        
        <p className="text-text-secondary mb-4 line-clamp-2">{grant.description}</p>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center text-accent-warm">
            <DollarSign size={16} className="mr-1" />
            <span className="text-sm font-medium">{formatAmount(grant.amount)}</span>
          </div>
          
          <div className="flex items-center text-accent-teal">
            <Calendar size={16} className="mr-1" />
            <span className="text-sm">{formatDate(grant.deadline)}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {grant.tags.map((tag, index) => (
            <span 
              key={index}
              className="text-xs px-2 py-1 rounded-full bg-accent-subtle text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="border-t border-gray-800 p-4">
        <button className="w-full btn-primary py-2">
          View Details
        </button>
      </div>
    </div>
  );
};

export default GrantCard;