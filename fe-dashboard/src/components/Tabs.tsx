'use client';

interface TabsProps {
    activeTab: 'generate' | 'pinned';
    setActiveTab: (tab: 'generate' | 'pinned') => void;
}

export default function Tabs({ activeTab, setActiveTab }: TabsProps) {
    return (
        <div className="relative flex space-x-8 mb-8">
            <button
                onClick={() => setActiveTab('generate')}
                className={`relative px-4 py-2 text-lg font-medium transition-colors duration-300 ${activeTab === 'generate' ? 'text-slate-700' : 'text-slate-400 hover:text-[#1F2A44]'
                    }`}
            >
                Generate Charts
                {activeTab === 'generate' && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-[#E16349] rounded-t-md animate-slide-in" />
                )}
            </button>
            <button
                onClick={() => setActiveTab('pinned')}
                className={`relative px-4 py-2 text-lg font-medium transition-colors duration-300 ${activeTab === 'pinned' ? 'text-slate-700' : 'text-slate-400 hover:text-[#1F2A44]'
                    }`}
            >
                Pinned Charts
                {activeTab === 'pinned' && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-[#E16349] rounded-t-md animate-slide-in" />
                )}
            </button>
        </div>
    );
}