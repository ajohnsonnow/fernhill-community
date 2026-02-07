'use client';

import { useState } from 'react';
import { Home, Package, Store, HandHelping, Search, MessageSquare, Car, GraduationCap, BarChart3, Users2, Compass, Lightbulb, ChevronDown } from 'lucide-react';
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
import CommunityRoadmap from '@/components/community/CommunityRoadmap';
import FeatureRequestTracker from '@/components/community/FeatureRequestTracker';

type TabKey = 'roadmap' | 'features' | 'housing' | 'classifieds' | 'businesses' | 'mutual-aid' | 'lost-found' | 'lounge' | 'rides' | 'skills' | 'polls' | 'partners';

// Tab categories for organized mobile display
const tabCategories = [
  {
    name: 'Community Voice',
    tabs: [
      { key: 'roadmap' as TabKey, label: 'Roadmap', icon: Compass, component: CommunityRoadmap },
      { key: 'features' as TabKey, label: 'Requests', icon: Lightbulb, component: FeatureRequestTracker },
      { key: 'polls' as TabKey, label: 'Polls', icon: BarChart3, component: CommunityPolls },
    ]
  },
  {
    name: 'Resources',
    tabs: [
      { key: 'housing' as TabKey, label: 'Housing', icon: Home, component: HousingHub },
      { key: 'classifieds' as TabKey, label: 'Market', icon: Package, component: Classifieds },
      { key: 'lost-found' as TabKey, label: 'Lost/Found', icon: Search, component: LostAndFound },
    ]
  },
  {
    name: 'Connect',
    tabs: [
      { key: 'businesses' as TabKey, label: 'Businesses', icon: Store, component: BusinessDirectory },
      { key: 'mutual-aid' as TabKey, label: 'Mutual Aid', icon: HandHelping, component: MutualAid },
      { key: 'skills' as TabKey, label: 'Skills', icon: GraduationCap, component: SkillExchange },
    ]
  },
  {
    name: 'Social',
    tabs: [
      { key: 'lounge' as TabKey, label: 'Lounge', icon: MessageSquare, component: SpicyChatLounge },
      { key: 'rides' as TabKey, label: 'Rides', icon: Car, component: RideShare },
      { key: 'partners' as TabKey, label: 'Partners', icon: Users2, component: DancePartnerFinder },
    ]
  }
];

// Flatten for easy lookup
const allTabs = tabCategories.flatMap(cat => cat.tabs);

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('roadmap');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const ActiveComponent = allTabs.find(t => t.key === activeTab)?.component || CommunityRoadmap;
  const activeTabInfo = allTabs.find(t => t.key === activeTab);

  return (
    <div className="min-h-screen bg-fernhill-dark">
      {/* Mobile: Dropdown Tab Selector */}
      <div className="md:hidden sticky top-0 z-30 bg-fernhill-charcoal border-b border-fernhill-earth/50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full flex items-center justify-between px-4 py-3 min-h-[52px]"
        >
          <div className="flex items-center gap-3">
            {activeTabInfo && <activeTabInfo.icon className="w-5 h-5 text-fernhill-gold" />}
            <span className="text-fernhill-cream font-medium">{activeTabInfo?.label}</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-fernhill-sand transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Mobile Dropdown Menu - Manila Folder Style */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-fernhill-charcoal border-b border-fernhill-earth/50 shadow-xl max-h-[70vh] overflow-y-auto">
            {tabCategories.map((category, catIdx) => (
              <div key={category.name}>
                {/* Category Header - Like a folder divider */}
                <div className="px-4 py-2 bg-fernhill-earth/30 border-y border-fernhill-earth/20">
                  <span className="text-xs font-semibold uppercase tracking-wider text-fernhill-terracotta">
                    {category.name}
                  </span>
                </div>
                
                {/* Tabs in this category - Manila tab style */}
                <div className="grid grid-cols-3 gap-1 p-2">
                  {category.tabs.map(tab => (
                    <button
                      key={tab.key}
                      data-tab={tab.key}
                      onClick={() => {
                        setActiveTab(tab.key);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center gap-1 p-3 rounded-t-lg min-h-[72px] transition-all ${
                        activeTab === tab.key
                          ? 'bg-fernhill-gold text-fernhill-dark shadow-lg -mb-1 relative z-10 manila-tab-active'
                          : 'bg-fernhill-brown/50 text-fernhill-sand hover:bg-fernhill-brown active:bg-fernhill-earth manila-tab-inactive'
                      }`}
                    >
                      <tab.icon className={`w-5 h-5 ${activeTab === tab.key ? 'text-fernhill-dark' : ''}`} />
                      <span className="text-xs font-medium text-center leading-tight">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Wrapping Tab Bar */}
      <div className="hidden md:block sticky top-0 z-20 bg-fernhill-charcoal border-b border-fernhill-earth/50">
        <div className="max-w-7xl mx-auto px-4 py-2">
          {/* Wrapping tabs */}
          <div className="flex flex-wrap gap-1">
            {allTabs.map((tab, idx) => (
              <button
                key={tab.key}
                data-tab={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`group relative flex items-center gap-2 px-4 py-2.5 font-medium transition-all text-sm rounded-lg min-h-[44px] ${
                  activeTab === tab.key
                    ? 'bg-fernhill-gold text-fernhill-dark shadow-md'
                    : 'bg-fernhill-brown/40 text-fernhill-sand hover:bg-fernhill-brown hover:text-fernhill-cream'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.key ? 'text-fernhill-dark' : 'text-fernhill-terracotta group-hover:text-fernhill-gold'}`} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="bg-fernhill-dark min-h-[calc(100vh-60px)]">
        <ActiveComponent />
      </div>
    </div>
  );
}
