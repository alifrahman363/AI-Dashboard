'use client';

import { useState, useEffect, useRef } from 'react';
import { useTab } from './TabContext';
import { FiBarChart2, FiBookmark, FiMenu, FiX } from 'react-icons/fi';
import { gsap } from 'gsap'; // Import GSAP

export default function Navbar() {
    const { activeTab, setActiveTab } = useTab();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navRef = useRef<HTMLElement>(null); // Ref for nav element
    const logoRef = useRef<HTMLDivElement>(null); // Ref for logo
    const desktopNavRef = useRef<HTMLDivElement>(null); // Ref for desktop nav buttons
    const mobileMenuRef = useRef<HTMLDivElement>(null); // Ref for mobile menu

    // Handle scroll for background change
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // GSAP animations on mount
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Animate logo: Fade in and slide from left
            if (logoRef.current) {
                gsap.fromTo(
                    logoRef.current,
                    { opacity: 0, x: -20 },
                    {
                        opacity: 1,
                        x: 0,
                        duration: 0.6,
                        ease: 'power3.out',
                    }
                );
            }

            // Animate desktop nav buttons: Staggered fade-in and slide up
            if (desktopNavRef.current) {
                const buttons = desktopNavRef.current.querySelectorAll('button');
                gsap.fromTo(
                    buttons,
                    { opacity: 0, y: 10 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.5,
                        ease: 'power3.out',
                        stagger: 0.1, // Stagger buttons for polished effect
                        delay: 0.2, // Delay to follow logo animation
                    }
                );
            }

            // Animate nav background on scroll
            if (navRef.current) {
                gsap.to(navRef.current, {
                    backgroundColor: scrolled ? 'rgba(3, 7, 18, 0.8)' : 'rgba(3, 7, 18, 1)',
                    backdropFilter: scrolled ? 'blur(8px)' : 'none',
                    duration: 0.3,
                    ease: 'power2.out',
                });
            }
        });

        return () => ctx.revert(); // Cleanup animations on unmount
    }, [scrolled]);

    // Animate mobile menu when opened/closed
    useEffect(() => {
        if (mobileMenuRef.current) {
            if (isMobileMenuOpen) {
                gsap.fromTo(
                    mobileMenuRef.current,
                    { opacity: 0, y: -20 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.4,
                        ease: 'power3.out',
                    }
                );
                // Animate mobile menu buttons
                const buttons = mobileMenuRef.current.querySelectorAll('button');
                gsap.fromTo(
                    buttons,
                    { opacity: 0, x: -10 },
                    {
                        opacity: 1,
                        x: 0,
                        duration: 0.4,
                        ease: 'power3.out',
                        stagger: 0.1,
                    }
                );
            } else {
                gsap.to(mobileMenuRef.current, {
                    opacity: 0,
                    y: -20,
                    duration: 0.3,
                    ease: 'power3.in',
                    onComplete: () => {
                        // Ensure mobile menu is hidden after animation
                        mobileMenuRef.current!.style.display = 'none';
                    },
                });
            }
        }
    }, [isMobileMenuOpen]);

    const handleTabChange = (tab: 'generate' | 'pinned') => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
    };

    return (
        <nav
            ref={navRef}
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 gsap-animated ${scrolled ? 'bg-background/80 backdrop-blur-md shadow-sm' : 'bg-background'
                }`}
        >
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div ref={logoRef} className="flex items-center gap-2 gsap-animated">
                        <img src="/images/logo.png" alt="Logo" className="h-8" />
                    </div>

                    {/* Desktop Navigation */}
                    <div ref={desktopNavRef} className="hidden md:flex items-center gap-4 gsap-animated">
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
                <div
                    ref={mobileMenuRef}
                    className="md:hidden bg-background border-t border-gray-700 gsap-animated"
                    style={{ display: 'block' }} // Ensure visibility for animation
                >
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