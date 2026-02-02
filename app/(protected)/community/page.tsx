'use client';

import { useState } from 'react';
import { Home, Package, Store, HandHelping, Search, MessageSquare, Megaphone, Car, GraduationCap, BarChart3, Users2 } from 'lucide-react';
import HousingHub from '@/components/community/HousingHub';
import Classifieds from '@/components/community/Classifieds';
import BusinessDirectory from '@/components/community/BusinessDirectory';
import MutualAid from '@/components/community/MutualAid';
import LostAndFound from '@/components/community/LostAndFound';
import SpicyChatLounge from '@/components/community/SpicyChatLounge';
import RideShare from '@/components/community/RideShare';
import SkillExchange from '@/components/community/SkillExchange';
import CommunityPolls from '@/components/community/CommunityPolls';
import DancePartnerFinder from '@/components/community/DancePartnerFinder';

type TabKey = 'housing' | 'classifieds' | 'businesses' | 'mutual-aid' | 'lost-found' | 'lounge' | 'rides' | 'skills' | 'polls' | 'partners';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('housing');

  const tabs = [
    { key: 'housing' as TabKey, label: 'Housing', icon: Home, component: HousingHub },
    { key: 'classifieds' as TabKey, label: 'Marketplace', icon: Package, component: Classifieds },
    { key: 'lost-found' as TabKey, label: 'Lost & Found', icon: Search, component: LostAndFound },
    { key: 'businesses' as TabKey, label: 'Businesses', icon: Store, component: BusinessDirectory },
    { key: 'mutual-aid' as TabKey, label: 'Mutual Aid', icon: HandHelping, component: MutualAid },
    { key: 'lounge' as TabKey, label: 'Chat Lounge', icon: MessageSquare, component: SpicyChatLounge },
    { key: 'rides' as TabKey, label: 'Ride Share', icon: Car, component: RideShare },
    { key: 'skills' as TabKey, label: 'Skill Exchange', icon: GraduationCap, component: SkillExchange },
    { key: 'polls' as TabKey, label: 'Polls', icon: BarChart3, component: CommunityPolls },
    { key: 'partners' as TabKey, label: 'Dance Partners', icon: Users2, component: DancePartnerFinder }
  ];

  const ActiveComponent = tabs.find(t => t.key === activeTab)?.component || HousingHub;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap text-sm ${
                  activeTab === tab.key
                    ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
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
