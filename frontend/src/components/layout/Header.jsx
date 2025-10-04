import React from 'react';
import HeaderBadge from '../ui/HeaderBadge';

const Header = ({ title = "EchoMine — A voice-driven, screenless language mining app.", showBadges = true }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            {showBadges && (
              <div className="flex space-x-2">
                <HeaderBadge text="Beta" variant="warning" size="small" />
                <HeaderBadge text="New" variant="success" size="small" />
              </div>
            )}
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <a href="/" className="text-gray-600 hover:text-gray-800 transition-colors">
              Home
            </a>
            <a href="/about" className="text-gray-600 hover:text-gray-800 transition-colors">
              About
            </a>
            <a href="/contact" className="text-gray-600 hover:text-gray-800 transition-colors">
              Contact
            </a>
          </nav>
          
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;