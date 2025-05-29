import React from 'react';
import { Search, Users, Zap, Award, BadgeCheck, Gift, BarChart3, ShieldCheck } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="card-bg rounded-xl p-6 transition-all duration-300 hover:shadow-subtle flex flex-col items-center text-center">
      <div className="feature-icon mb-2">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  );
};

const FeatureSection: React.FC = () => {
  const features = [
    {
      icon: <Search size={48} />, title: "AI Chat Grant Matching", description: "Conversational AI helps you find the best-fit grants in seconds." },
    {
      icon: <Users size={48} />, title: "DAO Voting (Winner-Takes-All)", description: "Vote on proposals using on-chain tokens. The top project wins the entire pool." },
    {
      icon: <Zap size={48} />, title: "NFT Profiles", description: "Mint your on-chain identity. Track achievements, badges, and reputation." },
    {
      icon: <BadgeCheck size={48} />, title: "Female Founder Support", description: "Self-attest as a female founder and get highlighted for inclusive funding." },
    {
      icon: <Gift size={48} />, title: "100 TestToken Faucet", description: "Get 100 free TestTokens on first wallet connect to start voting." },
    {
      icon: <Award size={48} />, title: "Kudos Token Airdrop", description: "Earn KMATCH tokens for every vote you cast. Real rewards for participation." },
    {
      icon: <BarChart3 size={48} />, title: "Voter Leaderboard", description: "See top voters and compete for the Top Voter badge and rewards." },
    {
      icon: <ShieldCheck size={48} />, title: "On-Chain Reputation", description: "All actions are transparent and recorded on Solana Devnet for trust." },
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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