'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Camera, MapPin, Search, Filter, Clock, Check } from 'lucide-react';

type LostFoundItem = {
  id: string;
  type: 'lost' | 'found';
  title: string;
  description: string;
  category: string;
  location_description: string;
  date_occurred: string;
  photo_urls: string[];
  status: string;
  created_by: string;
  created_at: string;
  profiles: { display_name: string; };
};

export default function LostAndFound() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItem, setNewItem] = useState({
    type: 'lost' as 'lost' | 'found',
    title: '',
    description: '',
    category: 'keys',
    location_description: '',
    date_occurred: new Date().toISOString().split('T')[0]
  });
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const categories = ['keys', 'phone', 'wallet', 'jewelry', 'clothing', 'electronics', 'pet', 'documents', 'other'];

  useEffect(() => {
    loadItems();
  }, [filter, category]);

  async function loadItems() {
    let query = supabase
      .from('lost_and_found')
      .select('*, profiles:created_by(display_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (filter !== 'all') query = query.eq('type', filter);
    if (category !== 'all') query = query.eq('category', category);

    const { data } = await query as any;
    setItems(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('lost_and_found').insert({
      ...newItem,
      created_by: user.id,
      photo_urls: []
    } as any);

    setShowNewItemForm(false);
    setNewItem({ type: 'lost', title: '', description: '', category: 'keys', location_description: '', date_occurred: new Date().toISOString().split('T')[0] });
    loadItems();
    setUploading(false);
  }

  async function markAsFound(itemId: string) {
    await ((supabase.from('lost_and_found') as any).update({ status: 'resolved' }).eq('id', itemId));
    loadItems();
  }

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Lost &amp; Found</h2>
          <button
            onClick={() => setShowNewItemForm(!showNewItemForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            + Report Item
          </button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'lost', 'found'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                  filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setCategory('all')}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                category === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100'
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap capitalize ${
                  category === cat ? 'bg-purple-600 text-white' : 'bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* New Item Form */}
      {showNewItemForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Report Lost or Found Item</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <div className="flex gap-4">
                {['lost', 'found'].map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      checked={newItem.type === type}
                      onChange={(e) => setNewItem({...newItem, type: e.target.value as any})}
                      className="w-4 h-4"
                    />
                    <span className="capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="capitalize">{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={newItem.title}
                onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                placeholder="e.g., Black leather wallet"
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                placeholder="Detailed description..."
                className="w-full border rounded-lg px-3 py-2 h-24"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location *</label>
              <input
                type="text"
                value={newItem.location_description}
                onChange={(e) => setNewItem({...newItem, location_description: e.target.value})}
                placeholder="Where was it lost/found?"
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={newItem.date_occurred}
                onChange={(e) => setNewItem({...newItem, date_occurred: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploading ? 'Posting...' : 'Post Item'}
              </button>
              <button
                type="button"
                onClick={() => setShowNewItemForm(false)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No items found. Be the first to report something!
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start gap-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  item.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {item.type.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      <p className="text-sm text-gray-600 capitalize">{item.category}</p>
                    </div>
                    <button
                      onClick={() => markAsFound(item.id)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      Mark Resolved
                    </button>
                  </div>
                  <p className="text-gray-700 mb-3">{item.description}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {item.location_description}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(item.date_occurred).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Posted by {item.profiles?.display_name || 'Unknown'} •{' '}
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
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
