import React from 'react';

const ImpactSection: React.FC = () => (
  <section className="py-16 px-4 bg-background-dark text-center">
    <div className="container mx-auto max-w-3xl">
      <h2 className="text-2xl md:text-3xl font-bold mb-4 text-accent-teal">Our Vision</h2>
      <p className="text-lg md:text-xl text-text-secondary mb-8">
        match the right ideas with the right support — transparently, inclusively, and on-chain.
      </p>
      {/* <div className="bg-background rounded-xl p-6 shadow-subtle">
        <h3 className="text-xl font-semibold mb-2 text-accent-warm">TL;DR</h3>
        <p className="text-base md:text-lg text-text-primary">
          GrantMatch is where grants meet the blockchain, and founders meet their community. AI finds the best-fit grants, DAOs vote transparently, and NFT profiles track everyone's journey — making funding fair, fun, and future-ready.
        </p>
      </div> */}
    </div>
  </section>
);

export default ImpactSection; 