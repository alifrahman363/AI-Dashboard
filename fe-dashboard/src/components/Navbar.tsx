'use client';

import { useState, useEffect } from 'react';
import { useTab } from './TabContext';
import { FiBarChart2, FiBookmark, FiMenu, FiX } from 'react-icons/fi';

export default function Navbar() {
    const { activeTab, setActiveTab } = useTab();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleTabChange = (tab: 'generate' | 'pinned') => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
    };

    return (
        <nav
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-md shadow-sm' : 'bg-background'
                }`}
        >
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <img src="/images/logo.png" alt="Logo" className="h-8" />
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        <button
                            onClick={() => handleTabChange('generate')}
                            className={`px-3 py-2 rounded-xl text-sm font-medium font-inter ${activeTab === 'generate' ? 'bg-primary text-white' : 'text-text-muted hover:bg-card-bg'
                                } transition-colors duration-200`}
                        >
                            Generate
                        </button>
                        <button
                            onClick={() => handleTabChange('pinned')}
                            className={`px-3 py-2 rounded-xl text-sm font-medium font-inter ${activeTab === 'pinned' ? 'bg-primary text-white' : 'text-text-muted hover:bg-card-bg'
                                } transition-colors duration-200`}
                        >
                            Pinned
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-text-muted hover:bg-card-bg rounded-xl"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-background border-t border-gray-700 animate-slide-down">
                    <div className="px-4 py-3 space-y-2">
                        <button
                            onClick={() => handleTabChange('generate')}
                            className={`flex items-center w-full gap-2 px-3 py-2 rounded-xl font-inter ${activeTab === 'generate' ? 'bg-primary text-white' : 'text-text-muted hover:bg-card-bg'
                                } transition-colors duration-200`}
                        >
                            <FiBarChart2 size={18} />
                            Generate
                        </button>
                        <button
                            onClick={() => handleTabChange('pinned')}
                            className={`flex items-center w-full gap-2 px-3 py-2 rounded-xl font-inter ${activeTab === 'pinned' ? 'bg-primary text-white' : 'text-text-muted hover:bg-card-bg'
                                } transition-colors duration-200`}
                        >
                            <FiBookmark size={18} />
                            Pinned
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}