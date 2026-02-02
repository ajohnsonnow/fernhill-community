'use client';

import React, { useState } from 'react';
import {
  Tribe,
  TribeMember,
  TribeVisibility,
  TribeCategory,
  TribeMemberRole,
  getRoleDisplayName,
  getRoleBadgeColor,
  calculateTribeLevel,
  getTribeLevelTitle,
  DEFAULT_TRIBES,
} from '@/lib/tribes';

// ============================================
// TRIBES LIST
// ============================================

interface TribesListProps {
  tribes: Tribe[];
  userTribes: string[]; // IDs of tribes user belongs to
  onJoinTribe: (tribeId: string) => void;
  onViewTribe: (tribe: Tribe) => void;
  onCreateTribe: () => void;
}

export function TribesList({
  tribes,
  userTribes,
  onJoinTribe,
  onViewTribe,
  onCreateTribe,
}: TribesListProps) {
  const [filter, setFilter] = useState<TribeCategory | 'all'>('all');
  
  const filteredTribes = filter === 'all' 
    ? tribes 
    : tribes.filter(t => t.category === filter);

  const categoryFilters: { value: TribeCategory | 'all'; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: '🌐' },
    { value: 'dance_style', label: 'Dance', icon: '💃' },
    { value: 'interest', label: 'Interest', icon: '🎵' },
    { value: 'skill_level', label: 'Level', icon: '📊' },
    { value: 'social', label: 'Social', icon: '👥' },
    { value: 'location', label: 'Location', icon: '📍' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Tribes
        </h2>
        <button
          onClick={onCreateTribe}
          className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          + Create Tribe
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categoryFilters.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === value
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Tribes Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filteredTribes.map((tribe) => (
          <TribeCard
            key={tribe.id}
            tribe={tribe}
            isMember={userTribes.includes(tribe.id)}
            onJoin={() => onJoinTribe(tribe.id)}
            onView={() => onViewTribe(tribe)}
          />
        ))}
      </div>

      {filteredTribes.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl">🏝️</span>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            No tribes found in this category
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// TRIBE CARD
// ============================================

interface TribeCardProps {
  tribe: Tribe;
  isMember: boolean;
  onJoin: () => void;
  onView: () => void;
}

export function TribeCard({ tribe, isMember, onJoin, onView }: TribeCardProps) {
  const level = calculateTribeLevel(tribe.stats);
  const levelTitle = getTribeLevelTitle(level);

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700"
    >
      {/* Banner */}
      <div 
        className="h-20 bg-gradient-to-br from-purple-500 to-pink-500"
        style={tribe.bannerUrl ? { backgroundImage: `url(${tribe.bannerUrl})`, backgroundSize: 'cover' } : {}}
      />

      {/* Content */}
      <div className="p-4 -mt-8">
        {/* Avatar */}
        <div className="flex items-end gap-3 mb-3">
          <div className="w-16 h-16 rounded-xl bg-white dark:bg-gray-700 shadow-lg flex items-center justify-center text-3xl border-4 border-white dark:border-gray-800">
            {tribe.avatarUrl ? (
              <img src={tribe.avatarUrl} alt={tribe.name} className="w-full h-full rounded-lg object-cover" />
            ) : (
              tribe.icon
            )}
          </div>
          
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 dark:text-white truncate">
                {tribe.name}
              </h3>
              {tribe.isVerified && (
                <span className="text-blue-500">✓</span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {tribe.memberCount} members • {levelTitle}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {tribe.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {tribe.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onView}
            className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            View
          </button>
          
          {!isMember && tribe.settings.allowDirectJoin && (
            <button
              onClick={onJoin}
              className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Join
            </button>
          )}
          
          {!isMember && !tribe.settings.allowDirectJoin && (
            <button
              onClick={onJoin}
              className="flex-1 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl text-sm font-medium"
            >
              Request
            </button>
          )}
          
          {isMember && (
            <span className="flex-1 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl text-sm font-medium text-center">
              ✓ Member
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// TRIBE MEMBER LIST
// ============================================

interface TribeMemberListProps {
  members: TribeMember[];
  currentUserId: string;
  onViewProfile: (userId: string) => void;
}

export function TribeMemberList({ members, currentUserId, onViewProfile }: TribeMemberListProps) {
  // Sort: leaders first, then elders, then by join date
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { leader: 0, elder: 1, member: 2 };
    if (roleOrder[a.role] !== roleOrder[b.role]) {
      return roleOrder[a.role] - roleOrder[b.role];
    }
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });

  return (
    <div className="space-y-2">
      {sortedMembers.map((member) => (
        <button
          key={member.id}
          onClick={() => onViewProfile(member.userId)}
          className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {/* Avatar */}
          {member.userAvatar ? (
            <img
              src={member.userAvatar}
              alt={member.userName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium">
              {member.userName.charAt(0)}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {member.userName}
              </span>
              {member.customTitle && (
                <span className="text-xs text-purple-600 dark:text-purple-400">
                  {member.customTitle}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span 
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: getRoleBadgeColor(member.role) + '20',
                  color: getRoleBadgeColor(member.role),
                }}
              >
                {getRoleDisplayName(member.role)}
              </span>
              <span className="text-gray-500">
                {member.xpContributed} XP
              </span>
            </div>
          </div>

          {/* You indicator */}
          {member.userId === currentUserId && (
            <span className="text-xs text-gray-500">You</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================
// MY TRIBES SIDEBAR
// ============================================

interface MyTribesProps {
  tribes: Tribe[];
  onSelectTribe: (tribe: Tribe) => void;
}

export function MyTribes({ tribes, onSelectTribe }: MyTribesProps) {
  if (tribes.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
        <span className="text-3xl">🏘️</span>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          You haven't joined any tribes yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
        Your Tribes
      </h3>
      {tribes.map((tribe) => (
        <button
          key={tribe.id}
          onClick={() => onSelectTribe(tribe)}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="text-2xl">{tribe.icon}</span>
          <span className="font-medium text-gray-900 dark:text-white truncate">
            {tribe.name}
          </span>
          {tribe.stats.weeklyActiveMembers > 0 && (
            <span className="ml-auto text-xs text-green-500">
              {tribe.stats.weeklyActiveMembers} active
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================
// CREATE TRIBE MODAL
// ============================================

interface CreateTribeModalProps {
  onClose: () => void;
  onCreate: (tribe: Partial<Tribe>) => void;
}

export function CreateTribeModal({ onClose, onCreate }: CreateTribeModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TribeCategory>('social');
  const [visibility, setVisibility] = useState<TribeVisibility>('public');
  const [icon, setIcon] = useState('🏘️');

  const icons = ['🏘️', '🎪', '🎭', '🎵', '💃', '🌟', '🔥', '💜', '🌈', '✨', '🦋', '🌸', '🌊', '🏔️', '🎯'];

  const handleCreate = () => {
    if (!name.trim()) return;
    
    onCreate({
      name: name.trim(),
      description: description.trim(),
      category,
      visibility,
      icon,
      tags: [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Create Tribe
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {icons.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                    icon === emoji
                      ? 'bg-purple-100 dark:bg-purple-900/30 ring-2 ring-purple-500'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tribe Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Salsa Lovers"
              maxLength={50}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this tribe about?"
              rows={3}
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TribeCategory)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="social">Social</option>
              <option value="dance_style">Dance Style</option>
              <option value="interest">Interest</option>
              <option value="skill_level">Skill Level</option>
              <option value="location">Location</option>
            </select>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Visibility
            </label>
            <div className="space-y-2">
              {[
                { value: 'public', label: 'Public', desc: 'Anyone can find and join' },
                { value: 'private', label: 'Private', desc: 'Visible, but requires approval' },
                { value: 'invite_only', label: 'Invite Only', desc: 'Hidden, invite link only' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setVisibility(option.value as TribeVisibility)}
                  className={`w-full p-3 rounded-xl text-left transition-colors ${
                    visibility === option.value
                      ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                      : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <p className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </p>
                  <p className="text-sm text-gray-500">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Tribe
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXPORT
// ============================================

export { TribesList as default };
