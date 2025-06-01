'use client';

import { useState, useEffect, useRef } from 'react';
import { FiActivity, FiSearch, FiTrash2 } from 'react-icons/fi';
import { gsap } from 'gsap'; // Import GSAP

interface ChartFormProps {
    prompt: string;
    setPrompt: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    chartDataListLength: number;
    onClear: () => void;
}

export default function ChartForm({
    prompt,
    setPrompt,
    onSubmit,
    loading,
    chartDataListLength,
    onClear,
}: ChartFormProps) {
    const formRef = useRef<HTMLFormElement>(null); // Ref for the form
    const inputWrapperRef = useRef<HTMLDivElement>(null); // Ref for input wrapper
    const buttonsRef = useRef<HTMLDivElement>(null); // Ref for buttons container

    // GSAP animations on mount
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Animate form: Fade in and slide up
            if (formRef.current) {
                gsap.fromTo(
                    formRef.current,
                    { opacity: 0, y: 20 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        ease: 'power3.out',
                    }
                );
            }

            // Animate input wrapper: Fade in and slide from left
            if (inputWrapperRef.current) {
                gsap.fromTo(
                    inputWrapperRef.current,
                    { opacity: 0, x: -20 },
                    {
                        opacity: 1,
                        x: 0,
                        duration: 0.5,
                        ease: 'power3.out',
                        delay: 0.2,
                    }
                );
            }

            // Animate buttons: Staggered fade-in and scale
            if (buttonsRef.current) {
                const buttons = buttonsRef.current.querySelectorAll('button');
                gsap.fromTo(
                    buttons,
                    { opacity: 0, scale: 0.8 },
                    {
                        opacity: 1,
                        scale: 1,
                        duration: 0.4,
                        ease: 'power3.out',
                        stagger: 0.1,
                        delay: 0.4,
                    }
                );
            }
        });

        return () => ctx.revert(); // Cleanup animations on unmount
    }, []);

    // Animate tooltips on hover
    const handleButtonHover = (selector: string, show: boolean) => {
        if (buttonsRef.current) {
            const tooltip = buttonsRef.current.querySelector(selector) as HTMLElement | null;
            if (tooltip) {
                gsap.to(tooltip, {
                    opacity: show ? 1 : 0,
                    y: show ? 0 : 10,
                    duration: 0.2,
                    ease: show ? 'power3.out' : 'power3.in',
                });
            }
        }
    };

    // Animate loading spinner
    useEffect(() => {
        if (loading && buttonsRef.current) {
            const spinner = buttonsRef.current.querySelector('.animate-spin') as HTMLElement | null;
            if (spinner) {
                gsap.to(spinner, {
                    rotation: 360,
                    duration: 1,
                    repeat: -1,
                    ease: 'linear',
                });
            }
        }
    }, [loading]);

    return (
        <form
            ref={formRef}
            onSubmit={onSubmit}
            className="w-10/12 max-w-3xl mx-auto mb-8 flex flex-col sm:flex-row gap-4 justify-center items-center gsap-animated"
        >
            <div ref={inputWrapperRef} className="relative flex-1 gsap-animated">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9CA3AF] w-5 h-5">
                    <FiSearch />
                </span>
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your prompt (e.g., Get all products with a price greater than 500)"
                    className="w-full pl-12 pr-4 py-3 rounded-full bg-white border border-[#D1D5DB] text-[#1F2A44] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#E16349] focus:border-transparent shadow-sm transition-all duration-200"
                />
            </div>
            <div ref={buttonsRef} className="flex gap-3">
                <button
                    type="submit"
                    disabled={loading}
                    className="relative w-12 h-12 flex items-center justify-center rounded-full bg-[#E16349] text-white shadow-md hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group gsap-animated"
                    onMouseEnter={() => handleButtonHover('.generate-tooltip', true)}
                    onMouseLeave={() => handleButtonHover('.generate-tooltip', false)}
                >
                    {loading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <FiActivity size={20} />
                    )}
                    <span className="generate-tooltip absolute top-14 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-[#1F2A44] text-white text-sm rounded-lg opacity-0">
                        Generate
                    </span>
                </button>
                <button
                    type="button"
                    onClick={onClear}
                    disabled={chartDataListLength === 0}
                    className="relative w-12 h-12 flex items-center justify-center rounded-full bg-[#E16349] text-white shadow-md hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group gsap-animated"
                    onMouseEnter={() => handleButtonHover('.clear-tooltip', true)}
                    onMouseLeave={() => handleButtonHover('.clear-tooltip', false)}
                >
                    <FiTrash2 size={20} />
                    <span className="clear-tooltip absolute top-14 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-[#1F2A44] text-white text-sm rounded-lg opacity-0">
                        Clear
                    </span>
                </button>
            </div>
        </form>
    );
}