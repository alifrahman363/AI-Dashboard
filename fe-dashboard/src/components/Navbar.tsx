'use client';

import { useState, useEffect } from 'react';
import { useTab } from './TabContext';
import { FiBarChart2, FiBookmark, FiMenu, FiX, FiSettings, FiInfo } from 'react-icons/fi';

export default function Navbar() {
    const { activeTab, setActiveTab } = useTab();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Handle scroll event for navbar transparency effect
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
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
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled
                ? 'bg-gray-900/95 backdrop-blur-md shadow-lg'
                : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 bg-gray-900/95 ">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10   rounded-xl">
                            {/* <FiBarChart2 size={22} color="white" /> */}
                            {/* add logo */}
                            <img src="images/logo.png" alt="Logo" className="w-8 h-8" />
                        </div>
                        {/* <span className="text-lg font-semibold text-white">ChartGPT</span> */}
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-2">
                        <button
                            onClick={() => handleTabChange('generate')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${activeTab === 'generate'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-800'
                                } transition-colors duration-200`}
                        >
                            <FiBarChart2 size={18} />
                            <span>Generate</span>
                        </button>
                        <button
                            onClick={() => handleTabChange('pinned')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${activeTab === 'pinned'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-800'
                                } transition-colors duration-200`}
                        >
                            <FiBookmark size={18} />
                            <span>Pinned</span>
                        </button>
                    </div>

                    {/* Right Side Controls - Desktop Only */}
                    <div className="hidden md:flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors">
                            <FiInfo size={18} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors">
                            <FiSettings size={18} />
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-gray-300 hover:bg-gray-800 rounded-lg"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-gray-900 border-t border-gray-800 animate-slide-down">
                    <div className="px-4 py-3 space-y-2">
                        <button
                            onClick={() => handleTabChange('generate')}
                            className={`flex items-center w-full gap-3 p-3 rounded-lg ${activeTab === 'generate'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-800'
                                } transition-colors duration-200`}
                        >
                            <FiBarChart2 size={20} />
                            <span>Generate Charts</span>
                        </button>
                        <button
                            onClick={() => handleTabChange('pinned')}
                            className={`flex items-center w-full gap-3 p-3 rounded-lg ${activeTab === 'pinned'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-800'
                                } transition-colors duration-200`}
                        >
                            <FiBookmark size={20} />
                            <span>Pinned Charts</span>
                        </button>

                        <div className="border-t border-gray-800 my-2"></div>

                        <button className="flex items-center w-full gap-3 p-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                            <FiInfo size={20} />
                            <span>Help</span>
                        </button>
                        <button className="flex items-center w-full gap-3 p-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                            <FiSettings size={20} />
                            <span>Settings</span>
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}