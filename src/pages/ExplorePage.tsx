import React, { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import GrantCard from '../components/explore/GrantCard';
import { supabase } from '../lib/supabase';
import GrantDetailsModal from '../components/explore/GrantDetailsModal';

interface Grant {
  id: number;
  title: string;
  organization: string;
  amount: number;
  deadline: string;
  description: string;
  tags: string[];
  requirements?: string[];
}

const ExplorePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const fetchGrants = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('grants')
        .select('*');
      if (!error && data) {
        setGrants(data);
      }
      setLoading(false);
    };
    fetchGrants();
  }, []);
  
  // Extract all unique tags
  const allTags = Array.from(
    new Set(grants.flatMap(grant => grant.tags || []))
  );
  
  // Filter grants based on search and tags
  const filteredGrants = grants.filter(grant => {
    const matchesSearch = grant.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          grant.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          grant.organization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
                        selectedTags.some(tag => (grant.tags || []).includes(tag));
    return matchesSearch && matchesTags;
  });
  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  return (
    <div className="pt-24 pb-16 px-4 min-h-screen bg-gradient-to-b from-background-dark to-background-light flex flex-col items-center">
      <div className="container mx-auto max-w-7xl w-full">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-3 tracking-tight">Explore Grants</h1>
          <p className="text-text-secondary max-w-2xl mx-auto text-lg">
            Browse through available grants and find the perfect funding opportunity for your project.
          </p>
        </div>
        <div className="mb-10">
          <div className="card-bg rounded-2xl shadow-lg p-6 max-w-3xl mx-auto mb-6 flex flex-col gap-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search grants by title, description, or organization..."
                className="w-full pl-10 pr-4 py-3 bg-background-dark border border-background-light rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-teal text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 justify-center">
              <Filter size={18} className="text-text-secondary mr-1" />
              <span className="text-text-secondary text-sm mr-2">Filter by tags:</span>
              {allTags.map((tag, index) => (
                <button 
                  key={index}
                  onClick={() => toggleTag(tag)}
                  className={`text-sm px-3 py-1 rounded-full transition-colors font-medium tracking-wide ${
                    selectedTags.includes(tag)
                      ? 'bg-accent-teal text-white'
                      : 'bg-background-dark text-text-secondary border border-gray-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <p className="text-text-secondary text-lg">Loading grants...</p>
          </div>
        ) : (
          <>
        <div className="grid-layout">
          {filteredGrants.map(grant => (
            <GrantCard key={grant.id} grant={grant} onViewDetails={(g) => { setSelectedGrant(g); setDetailsOpen(true); }} />
          ))}
        </div>
        {filteredGrants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-secondary text-lg">No grants found matching your criteria.</p>
          </div>
            )}
          </>
        )}
        {selectedGrant && (
          <GrantDetailsModal 
            grant={{ ...selectedGrant, requirements: selectedGrant.requirements || [] }} 
            open={detailsOpen} 
            onClose={() => setDetailsOpen(false)} 
          />
        )}
      </div>
    </div>
  );
};

export default ExplorePage;