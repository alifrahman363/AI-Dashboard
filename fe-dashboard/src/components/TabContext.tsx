'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type TabType = 'generate' | 'pinned';

interface TabContextProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
}

const TabContext = createContext<TabContextProps | undefined>(undefined);

export function TabProvider({ children }: { children: ReactNode }) {
    const [activeTab, setActiveTab] = useState<TabType>('generate');

    return (
        <TabContext.Provider value={{ activeTab, setActiveTab }}>
            {children}
        </TabContext.Provider>
    );
}

export function useTab() {
    const context = useContext(TabContext);
    if (context === undefined) {
        throw new Error('useTab must be used within a TabProvider');
    }
    return context;
}