'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

interface TabContextType {
    activeTab: 'generate' | 'pinned';
    setActiveTab: (tab: 'generate' | 'pinned') => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export function TabProvider({ children }: { children: ReactNode }) {
    const [activeTab, setActiveTab] = useState<'generate' | 'pinned'>('generate');

    return (
        <TabContext.Provider value={{ activeTab, setActiveTab }}>
            {children}
        </TabContext.Provider>
    );
}

export function useTab() {
    const context = useContext(TabContext);
    if (!context) {
        throw new Error('useTab must be used within a TabProvider');
    }
    return context;
}