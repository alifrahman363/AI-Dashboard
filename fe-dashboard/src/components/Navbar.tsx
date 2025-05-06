'use client';

import { useState } from 'react';
import { useTab } from './TabContext';
import { FiBarChart2, FiBookmark, FiMenu, FiX } from 'react-icons/fi';

export default function Navbar() {
    const { activeTab, setActiveTab } = useTab();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleTabChange = (tab: 'generate' | 'pinned') => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
    };

    return (
        <nav className="bg-white shadow-md p-4 flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="text-xl font-bold text-gray-800">AI Dashboard</div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
                <button
                    onClick={() => handleTabChange('generate')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${activeTab === 'generate'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                        } transition-colors duration-200`}
                >
                    <FiBarChart2 size={20} />
                    {/* <span>Generate Charts</span> */}
                </button>
                <button
                    onClick={() => handleTabChange('pinned')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${activeTab === 'pinned'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                        } transition-colors duration-200`}
                >
                    <FiBookmark size={20} />
                    {/* <span>Pinned Charts</span> */}
                </button>
            </div>

            {/* Mobile Menu Button */}
            <button
                className="md:hidden text-gray-600"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>

            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
                <div className="absolute top-16 left-0 w-full bg-white shadow-md flex flex-col p-4 md:hidden">
                    <button
                        onClick={() => handleTabChange('generate')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${activeTab === 'generate'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            } transition-colors duration-200`}
                    >
                        <FiBarChart2 size={20} />
                        <span>Generate Charts</span>
                    </button>
                    <button
                        onClick={() => handleTabChange('pinned')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${activeTab === 'pinned'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            } transition-colors duration-200`}
                    >
                        <FiBookmark size={20} />
                        <span>Pinned Charts</span>
                    </button>
                </div>
            )}
        </nav>
    );
}