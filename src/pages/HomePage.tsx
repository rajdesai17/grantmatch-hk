import React from 'react';
import Hero from '../components/home/Hero';
import FeatureSection from '../components/home/FeatureSection';
import ImpactSection from '../components/home/ImpactSection';

const HomePage: React.FC = () => {
  return (
    <div>
      <Hero />
      <FeatureSection />
      <ImpactSection />
    </div>
  );
};

export default HomePage;