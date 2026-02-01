'use client';

import { useState } from 'react';
import { Home, Package, Store, HandHelping } from 'lucide-react';
import HousingHub from '@/components/community/HousingHub';
import Classifieds from '@/components/community/Classifieds';
import BusinessDirectory from '@/components/community/BusinessDirectory';
import MutualAid from '@/components/community/MutualAid';

type TabKey = 'housing' | 'classifieds' | 'businesses' | 'mutual-aid';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('housing');

  const tabs = [
    { key: 'housing' as TabKey, label: 'Housing', icon: Home, component: HousingHub },
    { key: 'classifieds' as TabKey, label: 'Classifieds', icon: Package, component: Classifieds },
    { key: 'businesses' as TabKey, label: 'Businesses', icon: Store, component: BusinessDirectory },
    { key: 'mutual-aid' as TabKey, label: 'Mutual Aid', icon: HandHelping, component: MutualAid }
  ];

  const ActiveComponent = tabs.find(t => t.key === activeTab)?.component || HousingHub;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Tab Content */}
      <ActiveComponent />
    </div>
  );
}
