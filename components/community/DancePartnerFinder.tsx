'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Heart, X, Check, Music, Star, MapPin, Calendar } from 'lucide-react';

type DanceProfile = {
  id: string;
  user_id: string;
  dance_styles: string[];
  experience_levels: Record<string, string>;
  preferred_role: string;
  availability: string;
  bio: string;
  goals: string;
  is_active: boolean;
  profiles: { display_name: string; };
};

type MatchRequest = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  message: string;
  created_at: string;
};

export default function DancePartnerFinder() {
  const [myProfile, setMyProfile] = useState<DanceProfile | null>(null);
  const [partners, setPartners] = useState<DanceProfile[]>([]);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showMatchRequest, setShowMatchRequest] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<DanceProfile | null>(null);
  const [matchMessage, setMatchMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [newProfile, setNewProfile] = useState({
    dance_styles: [] as string[],
    experience_levels: {} as Record<string, string>,
    preferred_role: 'both',
    availability: '',
    bio: '',
    goals: ''
  });
  const supabase = createClient();

  const danceStyles = ['salsa', 'bachata', 'kizomba', 'zouk', 'tango', 'swing', 'ballroom'];
  const experienceLevels = ['beginner', 'intermediate', 'advanced', 'professional'];
  const roles = ['lead', 'follow', 'both'];

  useEffect(() => {
    loadMyProfile();
    loadPartners();
  }, [filter]);

  async function loadMyProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('dance_partner_profiles')
      .select('*, profiles:user_id(display_name)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single() as any;

    setMyProfile(data);
    if (!data) setShowCreateProfile(true);
  }

  async function loadPartners() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('dance_partner_profiles')
      .select('*, profiles:user_id(display_name)')
      .eq('is_active', true)
      .neq('user_id', user.id);

    if (filter !== 'all') {
      query = query.contains('dance_styles', [filter]);
    }

    const { data } = await query as any;
    setPartners(data || []);
  }

  async function handleCreateProfile(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (newProfile.dance_styles.length === 0) {
      alert('Please select at least one dance style');
      return;
    }

    // Build experience levels object
    const experienceLevels: Record<string, string> = {};
    newProfile.dance_styles.forEach(style => {
      experienceLevels[style] = newProfile.experience_levels[style] || 'beginner';
    });

    await supabase.from('dance_partner_profiles').insert({
      user_id: user.id,
      dance_styles: newProfile.dance_styles,
      experience_levels: experienceLevels,
      preferred_role: newProfile.preferred_role,
      availability: newProfile.availability,
      bio: newProfile.bio,
      goals: newProfile.goals,
      is_active: true
    } as any);

    setShowCreateProfile(false);
    loadMyProfile();
    loadPartners();
  }

  async function sendMatchRequest() {
    if (!selectedPartner || !matchMessage.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('partner_match_requests').insert({
      from_user_id: user.id,
      to_user_id: selectedPartner.user_id,
      message: matchMessage,
      status: 'pending'
    } as any);

    alert('Match request sent! They will be notified.');
    setShowMatchRequest(false);
    setMatchMessage('');
    setSelectedPartner(null);
  }

  function toggleStyle(style: string) {
    const styles = newProfile.dance_styles.includes(style)
      ? newProfile.dance_styles.filter(s => s !== style)
      : [...newProfile.dance_styles, style];
    setNewProfile({ ...newProfile, dance_styles: styles });
  }

  function setExperienceForStyle(style: string, level: string) {
    setNewProfile({
      ...newProfile,
      experience_levels: { ...newProfile.experience_levels, [style]: level }
    });
  }

  if (showCreateProfile) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Create Your Dance Partner Profile</h2>
          <form onSubmit={handleCreateProfile} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">Dance Styles * (select all that apply)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {danceStyles.map(style => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    className={`p-3 rounded-lg capitalize font-medium ${
                      newProfile.dance_styles.includes(style)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {newProfile.dance_styles.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-3">Experience Levels</label>
                {newProfile.dance_styles.map(style => (
                  <div key={style} className="mb-3">
                    <label className="block text-sm text-gray-600 mb-1 capitalize">{style}</label>
                    <select
                      value={newProfile.experience_levels[style] || 'beginner'}
                      onChange={(e) => setExperienceForStyle(style, e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      {experienceLevels.map(level => (
                        <option key={level} value={level} className="capitalize">{level}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Preferred Role *</label>
              <div className="flex gap-3">
                {roles.map(role => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={newProfile.preferred_role === role}
                      onChange={(e) => setNewProfile({...newProfile, preferred_role: e.target.value})}
                      className="w-4 h-4"
                    />
                    <span className="capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">About Me *</label>
              <textarea
                value={newProfile.bio}
                onChange={(e) => setNewProfile({...newProfile, bio: e.target.value})}
                placeholder="Tell potential partners about yourself..."
                className="w-full border rounded-lg px-3 py-2 h-24"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Dance Goals</label>
              <textarea
                value={newProfile.goals}
                onChange={(e) => setNewProfile({...newProfile, goals: e.target.value})}
                placeholder="What are you looking to achieve? (e.g., social dancing, competitions, teaching)"
                className="w-full border rounded-lg px-3 py-2 h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Availability</label>
              <input
                type="text"
                value={newProfile.availability}
                onChange={(e) => setNewProfile({...newProfile, availability: e.target.value})}
                placeholder="e.g., Weekends, Tuesday & Thursday evenings"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-medium"
            >
              Create Profile
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Dance Partner Finder</h2>
        </div>
        <p className="opacity-90">Find your perfect dance match</p>
      </div>

      {/* My Profile Card */}
      {myProfile && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg">{myProfile.profiles?.display_name}</h3>
              <p className="text-sm text-gray-600 capitalize">
                {myProfile.preferred_role === 'both' ? 'Lead & Follow' : myProfile.preferred_role}
              </p>
            </div>
            <button
              onClick={() => {
                setNewProfile({
                  dance_styles: myProfile.dance_styles,
                  experience_levels: myProfile.experience_levels,
                  preferred_role: myProfile.preferred_role,
                  availability: myProfile.availability,
                  bio: myProfile.bio,
                  goals: myProfile.goals
                });
                setShowCreateProfile(true);
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Edit Profile
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {myProfile.dance_styles.map(style => (
              <span key={style} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium capitalize">
                <Music className="w-3 h-3 inline mr-1" />
                {style}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dance Style Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100'
          }`}
        >
          All Styles
        </button>
        {danceStyles.map(style => (
          <button
            key={style}
            onClick={() => setFilter(style)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap capitalize ${
              filter === style ? 'bg-purple-600 text-white' : 'bg-gray-100'
            }`}
          >
            {style}
          </button>
        ))}
      </div>

      {/* Partners List */}
      <div className="grid md:grid-cols-2 gap-4">
        {partners.length === 0 ? (
          <div className="col-span-2 bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No partners found with these filters. Try adjusting your search!
          </div>
        ) : (
          partners.map(partner => (
            <div key={partner.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{partner.profiles?.display_name}</h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {partner.preferred_role === 'both' ? 'Lead & Follow' : partner.preferred_role}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {partner.dance_styles.map(style => (
                  <span key={style} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium capitalize">
                    {style} • {partner.experience_levels[style]}
                  </span>
                ))}
              </div>

              <p className="text-gray-700 text-sm mb-3">{partner.bio}</p>

              {partner.goals && (
                <p className="text-sm text-gray-600 mb-3">
                  <strong>Goals:</strong> {partner.goals}
                </p>
              )}

              {partner.availability && (
                <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {partner.availability}
                </p>
              )}

              <button
                onClick={() => {
                  setSelectedPartner(partner);
                  setShowMatchRequest(true);
                }}
                className="w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Send Match Request
              </button>
            </div>
          ))
        )}
      </div>

      {/* Match Request Modal */}
      {showMatchRequest && selectedPartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Send Match Request</h3>
              <button onClick={() => setShowMatchRequest(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-700 mb-4">
              Send a partner request to <strong>{selectedPartner.profiles?.display_name}</strong>
            </p>
            <textarea
              value={matchMessage}
              onChange={(e) => setMatchMessage(e.target.value)}
              placeholder="Introduce yourself and explain why you'd like to dance together..."
              className="w-full border rounded-lg px-3 py-2 h-24 mb-4"
              required
            />
            <div className="flex gap-3">
              <button
                onClick={sendMatchRequest}
                className="flex-1 bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700"
              >
                Send Request
              </button>
              <button
                onClick={() => setShowMatchRequest(false)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
