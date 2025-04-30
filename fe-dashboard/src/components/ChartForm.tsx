'use client';

import { FiTrash2 } from 'react-icons/fi';

interface ChartFormProps {
    prompt: string;
    setPrompt: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    chartDataListLength: number;
    onClear: () => void;
}

export default function ChartForm({ prompt, setPrompt, onSubmit, loading, chartDataListLength, onClear }: ChartFormProps) {
    return (
        <div className="w-full max-w-2xl flex items-center justify-between gap-4 mb-12">
            <form onSubmit={onSubmit} className="flex items-center gap-4 flex-1">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask something like 'All products with price'"
                    className="flex-1 px-5 py-4 bg-white border border-[#E5E7EB] rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-[#1E3A8A] placeholder-gray-500 transition-all duration-300 hover:shadow-md"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-4 bg-gradient-to-r from-[#3B82F6] to-[#10B981] text-white rounded-full font-medium shadow-sm hover:brightness-110 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Loading...' : 'Generate'}
                </button>
            </form>
            {chartDataListLength > 0 && (
                <button
                    onClick={onClear}
                    className="p-4 bg-gradient-to-r from-[#EF4444] to-[#EC4899] text-white rounded-full font-medium shadow-sm hover:brightness-110 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 flex items-center"
                    title="Clear Charts"
                >
                    <FiTrash2 size={20} />
                </button>
            )}
        </div>
    );
}