'use client';

interface TabsProps {
    activeTab: 'generate' | 'pinned';
    setActiveTab: (tab: 'generate' | 'pinned') => void;
}

export default function Tabs({ activeTab, setActiveTab }: TabsProps) {
    return (
        <div className="w-full max-w-2xl flex justify-center mb-8">
            <div className="flex space-x-4 bg-[#E5E7EB] rounded-full p-1">
                <button
                    onClick={() => setActiveTab('generate')}
                    className={`px-6 py-2 rounded-full font-medium shadow-sm transition-all duration-200 ${activeTab === 'generate'
                            ? 'bg-gradient-to-r from-[#3B82F6] to-[#10B981] text-white'
                            : 'bg-transparent text-[#4B5563] hover:bg-[#D1D5DB] hover:shadow-md'
                        }`}
                >
                    Generate Charts
                </button>
                <button
                    onClick={() => setActiveTab('pinned')}
                    className={`px-6 py-2 rounded-full font-medium shadow-sm transition-all duration-200 ${activeTab === 'pinned'
                            ? 'bg-gradient-to-r from-[#3B82F6] to-[#10B981] text-white'
                            : 'bg-transparent text-[#4B5563] hover:bg-[#D1D5DB] hover:shadow-md'
                        }`}
                >
                    Pinned Charts
                </button>
            </div>
        </div>
    );
}