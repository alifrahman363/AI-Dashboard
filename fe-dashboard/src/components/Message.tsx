'use client';

interface MessageProps {
    message: string;
    type: 'error' | 'success';
}

export default function Message({ message, type }: MessageProps) {
    return (
        <p
            className={`text-sm mb-8 px-6 py-3 rounded-xl shadow-lg max-w-md w-full text-center ${type === 'success' ? 'text-[#10B981] bg-[#D1FAE5]' : 'text-[#EF4444] bg-[#FEE2E2]'
                }`}
        >
            {message}
        </p>
    );
}