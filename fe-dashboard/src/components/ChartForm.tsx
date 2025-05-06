'use client';

import { FiActivity, FiSearch, FiTrash2 } from 'react-icons/fi';

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
    return (

        <form onSubmit={onSubmit} className="w-10/12 max-w-3xl mx-auto mb-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="relative flex-1">
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
            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={loading}
                    className="relative w-12 h-12 flex items-center justify-center rounded-full bg-[#E16349] text-white shadow-md hover:from-[#2563EB] hover:to-[#3B82F6] hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {loading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <FiActivity size={20} />
                    )}
                    <span className="absolute top-14 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-[#1F2A44] text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Generate
                    </span>
                </button>
                <button
                    type="button"
                    onClick={onClear}
                    disabled={chartDataListLength === 0}
                    className="relative w-12 h-12 flex items-center justify-center rounded-full bg-[#E16349] text-white shadow-md hover:from-[#DC2626] hover:to-[#EF4444] hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    <FiTrash2 size={20} />
                    <span className="absolute top-14 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-[#1F2A44] text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Clear
                    </span>
                </button>
            </div>
        </form>
    );
}