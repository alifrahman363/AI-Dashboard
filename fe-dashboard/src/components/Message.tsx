'use client';

import { FiX } from 'react-icons/fi';

interface MessageProps {
    message: string;
    type: 'error' | 'success';
    onClose: () => void;
}

export default function Message({ message, type, onClose }: MessageProps) {
    return (
        <div
            className={`text-sm px-6 py-3 rounded-xl shadow-lg w-80 text-center ${type === 'success' ? 'text-[#10B981] bg-[#D1FAE5]' : 'text-[#EF4444] bg-[#FEE2E2]'
                } animate-slide-in-right flex items-center justify-between gap-2`}
        >
            <span>{message}</span>
            <button onClick={onClose} className="text-[#4B5563] hover:text-[#1E3A8A] transition-colors duration-200">
                <FiX size={16} />
            </button>
        </div>
    );
}