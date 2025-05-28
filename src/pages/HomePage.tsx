import React from 'react';
import Hero from '../components/home/Hero';
import FeatureSection from '../components/home/FeatureSection';

const HomePage: React.FC = () => {
  return (
    <div>
      <Hero />
      <FeatureSection />
    </div>
  );
};

export default HomePage;