import React from 'react';
import { Search, Users, Zap } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="card-bg rounded-xl p-6 transition-all duration-300 hover:shadow-subtle flex flex-col items-center text-center">
      <div className="feature-icon">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  );
};

const FeatureSection: React.FC = () => {
  const features = [
    {
      icon: <Search size={48} />,
      title: "AI-Powered Grant Discovery",
      description: "Our intelligent system matches your project with the perfect funding opportunities."
    },
    {
      icon: <Users size={48} />,
      title: "Community Voting",
      description: "Participate in DAO governance to shape the future of grant distribution."
    },
    {
      icon: <Zap size={48} />,
      title: "NFT Profiles",
      description: "Showcase your achievements and build credibility with verified NFT credentials."
    }
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;