import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from '../utils/router';

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative gradient-bg pt-32 pb-20 px-4 overflow-hidden">
      <div className="container mx-auto text-center relative z-10">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-text-primary leading-tight">
          Discover Your Perfect Grant
        </h1>
        
        <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Connect with the right funding opportunities for your project. 
          Our AI-powered platform matches founders with grants tailored to their unique vision.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6">
          <button 
            onClick={() => navigate('/discovery')}
            className="btn-primary"
          >
            Start Discovery
            <ArrowRight size={18} />
          </button>
          
          <button 
            onClick={() => navigate('/profile')}
            className="btn-secondary"
          >
            Create Profile
          </button>
        </div>
      </div>
      
      {/* Abstract Background Elements */}
      <div className="absolute bottom-0 left-0 w-full h-64 opacity-30 bg-gradient-to-t from-background-dark to-transparent"></div>
      <div className="absolute top-40 left-1/4 w-64 h-64 rounded-full bg-accent-teal opacity-5 blur-3xl"></div>
      <div className="absolute top-60 right-1/4 w-80 h-80 rounded-full bg-accent-warm opacity-5 blur-3xl"></div>
    </section>
  );
};

export default Hero;