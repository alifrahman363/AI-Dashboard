'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap'; // Import GSAP
import { ChartData, PinnedChart } from '../types';

interface PinnedChartCardProps {
    chart: PinnedChart;
    onView: (pinnedChartId: number) => Promise<void>;
    onUnpin: (pinnedChartId: number, chart: ChartData | PinnedChart) => Promise<void>;
}

export default function PinnedChartCard({ chart, onView, onUnpin }: PinnedChartCardProps) {
    const cardRef = useRef<HTMLDivElement>(null); // Ref for the card
    const promptRef = useRef<HTMLSpanElement>(null); // Ref for the prompt text
    const buttonRef = useRef<HTMLButtonElement>(null); // Ref for the unpin button

    // GSAP animations on mount
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Animate card: Fade in and slide up
            if (cardRef.current) {
                gsap.fromTo(
                    cardRef.current,
                    { opacity: 0, y: 20 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        ease: 'power3.out',
                    }
                );
            }

            // Animate prompt text: Fade in and slide from left
            if (promptRef.current) {
                gsap.fromTo(
                    promptRef.current,
                    { opacity: 0, x: -10 },
                    {
                        opacity: 1,
                        x: 0,
                        duration: 0.4,
                        ease: 'power3.out',
                        delay: 0.2,
                    }
                );
            }

            // Animate unpin button: Fade in and scale
            if (buttonRef.current) {
                gsap.fromTo(
                    buttonRef.current,
                    { opacity: 0, scale: 0.8 },
                    {
                        opacity: 1,
                        scale: 1,
                        duration: 0.4,
                        ease: 'power3.out',
                        delay: 0.3,
                    }
                );
            }
        });

        return () => ctx.revert(); // Cleanup animations on unmount
    }, []);

    // Handle hover animation
    const handleMouseEnter = () => {
        if (cardRef.current) {
            gsap.to(cardRef.current, {
                backgroundColor: '#E0F2FE',
                duration: 0.3,
                ease: 'power3.out',
            });
        }
        if (buttonRef.current) {
            gsap.to(buttonRef.current, {
                filter: 'brightness(1.1)',
                scale: 1.05,
                duration: 0.2,
                ease: 'power3.out',
            });
        }
    };

    const handleMouseLeave = () => {
        if (cardRef.current) {
            gsap.to(cardRef.current, {
                backgroundColor: '#FFFFFF',
                duration: 0.3,
                ease: 'power3.out',
            });
        }
        if (buttonRef.current) {
            gsap.to(buttonRef.current, {
                filter: 'brightness(1)',
                scale: 1,
                duration: 0.2,
                ease: 'power3.out',
            });
        }
    };

    // Handle unpin with exit animation
    const handleUnpin = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (cardRef.current) {
            await gsap.to(cardRef.current, {
                opacity: 0,
                x: 20,
                duration: 0.3,
                ease: 'power3.in',
            }).then(() => onUnpin(chart.id, chart)); // Trigger onUnpin after animation
        } else {
            await onUnpin(chart.id, chart); // Fallback if ref is unavailable
        }
    };

    return (
        <div
            ref={cardRef}
            className="bg-white p-4 rounded-xl shadow-lg border border-[#E5E7EB] flex items-center justify-between cursor-pointer gsap-animated"
            onClick={() => onView(chart.id)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <span ref={promptRef} className="text-[#1E3A8A] font-medium">
                {chart.prompt}
            </span>
            <button
                ref={buttonRef}
                onClick={handleUnpin}
                className="px-3 py-1 bg-gradient-to-r from-[#EF4444] to-[#EC4899] text-white rounded-full font-medium shadow-sm transition-all duration-200 gsap-animated"
            >
                Unpin
            </button>
        </div>
    );
}