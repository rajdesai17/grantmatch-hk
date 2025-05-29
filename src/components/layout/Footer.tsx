import React from 'react';

const Footer: React.FC = () => (
  <footer className="bg-background-dark text-text-secondary py-6 mt-12 border-t border-background-light">
    <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-4">
      <div className="mb-2 md:mb-0 text-sm">
        © {new Date().getFullYear()} GrantMatch. All rights reserved.
      </div>
      <div className="flex gap-4 text-sm">
        <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="hover:text-accent-teal">GitHub</a>
        <a href="https://vercel.com/docs" target="_blank" rel="noopener noreferrer" className="hover:text-accent-teal">Docs</a>
        <a href="mailto:contact@grantmatch.app" className="hover:text-accent-teal">Contact</a>
      </div>
    </div>
  </footer>
);

export default Footer; 