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
      <div className="bg-gradient-to-r from-fernhill-terracotta to-fernhill-gold text-fernhill-dark rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Skill Exchange</h2>
        </div>
        <p className="opacity-90">Share your dance knowledge, learn from others</p>
      </div>

      {/* New Listing Button */}
      <button
        onClick={() => setShowNewListing(!showNewListing)}
        className="w-full bg-fernhill-gold text-fernhill-dark py-3 rounded-lg hover:bg-fernhill-terracotta font-medium"
      >
        + Post Skill Exchange
      </button>

      {/* New Listing Form */}
      {showNewListing && (
        <div className="bg-fernhill-charcoal rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-fernhill-cream mb-4">Post a Skill Exchange</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fernhill-cream mb-2">I want to...</label>
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
              <label htmlFor="skill-dance-style-input" className="block text-sm font-medium text-fernhill-cream mb-2">Dance Style *</label>
              <select
                id="skill-dance-style-input"
                value={newListing.category}
                onChange={(e) => setNewListing({...newListing, category: e.target.value})}
                className="w-full bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg px-3 py-2 text-fernhill-sand"
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="capitalize">{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-fernhill-cream mb-2">Skill Name *</label>
              <input
                type="text"
                value={newListing.skill_name}
                onChange={(e) => setNewListing({...newListing, skill_name: e.target.value})}
                placeholder="e.g., Cross-body lead technique"
                className="w-full bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg px-3 py-2 text-fernhill-sand placeholder:text-fernhill-sand/50"
                required
              />
            </div>

            <div>
              <label htmlFor="skill-experience-level-input" className="block text-sm font-medium text-fernhill-cream mb-2">Experience Level *</label>
              <select
                id="skill-experience-level-input"
                value={newListing.experience_level}
                onChange={(e) => setNewListing({...newListing, experience_level: e.target.value})}
                className="w-full bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg px-3 py-2 text-fernhill-sand"
                required
              >
                {levels.map(level => (
                  <option key={level} value={level} className="capitalize">{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-fernhill-cream mb-2">Description *</label>
              <textarea
                value={newListing.description}
                onChange={(e) => setNewListing({...newListing, description: e.target.value})}
                placeholder="Describe what you want to teach or learn..."
                className="w-full bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg px-3 py-2 h-24 text-fernhill-sand placeholder:text-fernhill-sand/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fernhill-cream mb-2">Availability</label>
              <input
                type="text"
                value={newListing.availability}
                onChange={(e) => setNewListing({...newListing, availability: e.target.value})}
                placeholder="e.g., Weekends, evenings"
                className="w-full bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg px-3 py-2 text-fernhill-sand placeholder:text-fernhill-sand/50"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-fernhill-gold text-fernhill-dark py-2 rounded-lg hover:bg-fernhill-terracotta"
              >
                Post Listing
              </button>
              <button
                type="button"
                onClick={() => setShowNewListing(false)}
                className="px-6 py-2 border border-fernhill-earth/50 rounded-lg text-fernhill-sand hover:bg-fernhill-brown/30"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-fernhill-charcoal rounded-lg shadow p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fernhill-sand/60 w-5 h-5" />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg text-fernhill-sand placeholder:text-fernhill-sand/50"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {['all', 'teach', 'learn'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg min-h-[44px] capitalize ${
                filter === f ? 'bg-fernhill-gold text-fernhill-dark' : 'bg-fernhill-brown/50 text-fernhill-sand'
              }`}
            >
              {f === 'teach' ? 'Can Teach' : f === 'learn' ? 'Want to Learn' : 'All'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('all')}
            className={`px-3 py-1.5 rounded-full text-sm min-h-[36px] ${
              category === 'all' ? 'bg-fernhill-terracotta text-fernhill-dark' : 'bg-fernhill-brown/50 text-fernhill-sand'
            }`}
          >
            All Styles
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm min-h-[36px] capitalize ${
                category === cat ? 'bg-fernhill-terracotta text-fernhill-dark' : 'bg-fernhill-brown/50 text-fernhill-sand'
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
          <div className="bg-fernhill-charcoal rounded-lg shadow p-8 text-center text-fernhill-sand/70">
            No skill exchanges found. Post one to get started!
          </div>
        ) : (
          filteredListings.map(listing => (
            <div key={listing.id} className="bg-fernhill-charcoal rounded-lg shadow p-4">
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
                      <span className="ml-2 px-2 py-1 bg-fernhill-terracotta/20 text-fernhill-terracotta rounded text-xs font-medium capitalize">
                        <Music className="w-3 h-3 inline mr-1" />
                        {listing.category}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg text-fernhill-cream mb-2">{listing.skill_name}</h3>
                  <p className="text-fernhill-sand mb-3">{listing.description}</p>

                  <div className="flex flex-wrap gap-3 text-sm text-fernhill-sand/80 mb-3">
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

                  <div className="text-sm text-fernhill-sand/80 border-t border-fernhill-earth/50 pt-2">
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
