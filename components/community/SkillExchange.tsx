'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Award, Search, Star, Clock, Music } from 'lucide-react';

type SkillListing = {
  id: string;
  type: 'teach' | 'learn';
  skill_name: string;
  category: string;
  description: string;
  experience_level: string;
  availability: string;
  created_by: string;
  created_at: string;
  profiles: { display_name: string; };
};

export default function SkillExchange() {
  const [listings, setListings] = useState<SkillListing[]>([]);
  const [filter, setFilter] = useState<'all' | 'teach' | 'learn'>('all');
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewListing, setShowNewListing] = useState(false);
  const [newListing, setNewListing] = useState({
    type: 'teach' as 'teach' | 'learn',
    skill_name: '',
    category: 'salsa',
    description: '',
    experience_level: 'beginner',
    availability: ''
  });
  const supabase = createClient();

  const categories = ['salsa', 'bachata', 'kizomba', 'zouk', 'tango', 'swing', 'ballroom', 'other'];
  const levels = ['beginner', 'intermediate', 'advanced', 'professional'];

  useEffect(() => {
    loadListings();
  }, [filter, category]);

  async function loadListings() {
    let query = supabase
      .from('skill_exchange')
      .select('*, profiles:created_by(display_name)')
      .order('created_at', { ascending: false });

    if (filter !== 'all') query = query.eq('type', filter);
    if (category !== 'all') query = query.eq('category', category);

    const { data } = await query as any;
    setListings(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('skill_exchange').insert({
      ...newListing,
      created_by: user.id
    } as any);

    setShowNewListing(false);
    setNewListing({
      type: 'teach',
      skill_name: '',
      category: 'salsa',
      description: '',
      experience_level: 'beginner',
      availability: ''
    });
    loadListings();
  }

  const filteredListings = listings.filter(listing =>
    listing.skill_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Skill Exchange</h2>
        </div>
        <p className="opacity-90">Share your dance knowledge, learn from others</p>
      </div>

      {/* New Listing Button */}
      <button
        onClick={() => setShowNewListing(!showNewListing)}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-medium"
      >
        + Post Skill Exchange
      </button>

      {/* New Listing Form */}
      {showNewListing && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Post a Skill Exchange</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">I want to...</label>
              <div className="flex gap-4">
                {['teach', 'learn'].map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      checked={newListing.type === type}
                      onChange={(e) => setNewListing({...newListing, type: e.target.value as any})}
                      className="w-4 h-4"
                    />
                    <span className="capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Dance Style *</label>
              <select
                value={newListing.category}
                onChange={(e) => setNewListing({...newListing, category: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="capitalize">{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Skill Name *</label>
              <input
                type="text"
                value={newListing.skill_name}
                onChange={(e) => setNewListing({...newListing, skill_name: e.target.value})}
                placeholder="e.g., Cross-body lead technique"
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Experience Level *</label>
              <select
                value={newListing.experience_level}
                onChange={(e) => setNewListing({...newListing, experience_level: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                {levels.map(level => (
                  <option key={level} value={level} className="capitalize">{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                value={newListing.description}
                onChange={(e) => setNewListing({...newListing, description: e.target.value})}
                placeholder="Describe what you want to teach or learn..."
                className="w-full border rounded-lg px-3 py-2 h-24"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Availability</label>
              <input
                type="text"
                value={newListing.availability}
                onChange={(e) => setNewListing({...newListing, availability: e.target.value})}
                placeholder="e.g., Weekends, evenings"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
              >
                Post Listing
              </button>
              <button
                type="button"
                onClick={() => setShowNewListing(false)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'teach', 'learn'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap capitalize ${
                filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {f === 'teach' ? 'Can Teach' : f === 'learn' ? 'Want to Learn' : 'All'}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setCategory('all')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              category === 'all' ? 'bg-orange-600 text-white' : 'bg-gray-100'
            }`}
          >
            All Styles
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap capitalize ${
                category === cat ? 'bg-orange-600 text-white' : 'bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Listings */}
      <div className="space-y-3">
        {filteredListings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No skill exchanges found. Post one to get started!
          </div>
        ) : (
          filteredListings.map(listing => (
            <div key={listing.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${
                  listing.type === 'teach' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {listing.type === 'teach' ? <Award className="w-6 h-6" /> : <Star className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        listing.type === 'teach' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {listing.type === 'teach' ? 'Can Teach' : 'Want to Learn'}
                      </span>
                      <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium capitalize">
                        <Music className="w-3 h-3 inline mr-1" />
                        {listing.category}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg mb-2">{listing.skill_name}</h3>
                  <p className="text-gray-700 mb-3">{listing.description}</p>

                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1 capitalize">
                      <Star className="w-4 h-4" />
                      {listing.experience_level}
                    </span>
                    {listing.availability && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {listing.availability}
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 border-t pt-2">
                    Posted by {listing.profiles?.display_name || 'Unknown'} •{' '}
                    {new Date(listing.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
