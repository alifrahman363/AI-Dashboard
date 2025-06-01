'use client';

import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import { gsap } from 'gsap'; // Import GSAP

interface MessageProps {
    message: string;
    type: 'error' | 'success';
    onClose: () => void;
}

export default function Message({ message, type, onClose }: MessageProps) {
    const messageRef = useRef<HTMLDivElement>(null); // Ref for the message container

    // GSAP animation on mount
    useEffect(() => {
        const ctx = gsap.context(() => {
            if (messageRef.current) {
                gsap.fromTo(
                    messageRef.current,
                    { opacity: 0, x: 20 }, // Start from right, transparent
                    {
                        opacity: 1,
                        x: 0,
                        duration: 0.4,
                        ease: 'power3.out', // Match easing with other components
                    }
                );
            }
        });

        return () => ctx.revert(); // Cleanup animations on unmount
    }, []);

    // Handle close with GSAP animation
    const handleClose = () => {
        if (messageRef.current) {
            gsap.to(messageRef.current, {
                opacity: 0,
                x: 20, // Slide back to the right
                duration: 0.3,
                ease: 'power3.in',
                onComplete: onClose, // Trigger onClose after animation completes
            });
        } else {
            onClose(); // Fallback if ref is not available
        }
    };

    return (
        <div
            ref={messageRef}
            className={`text-sm px-6 py-3 rounded-xl shadow-lg w-80 text-center ${type === 'success' ? 'text-[#10B981] bg-[#D1FAE5]' : 'text-[#EF4444] bg-[#FEE2E2]'
                } gsap-animated flex items-center justify-between gap-2`}
        >
            <span>{message}</span>
            <button
                onClick={handleClose}
                className="text-[#4B5563] hover:text-[#1E3A8A] transition-colors duration-200"
            >
                <FiX size={16} />
            </button>
        </div>
    );
}