'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package, Tag, DollarSign, MapPin, Heart, Search, Filter, Plus, X, Send } from 'lucide-react';

interface Classified {
  id: string;
  user_id: string;
  listing_type: 'for-sale' | 'wanted' | 'free' | 'trade';
  category: string;
  title: string;
  description: string;
  price: number | null;
  is_negotiable: boolean;
  condition: string | null;
  location: string | null;
  photos: string[];
  status: string;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
  is_favorited?: boolean;
}

export default function Classifieds() {
  const supabase = createClient();
  const [listings, setListings] = useState<Classified[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Classified | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    listing_type: 'all',
    category: 'all',
    max_price: 10000,
    condition: 'all'
  });

  useEffect(() => {
    loadListings();
  }, [filters, searchQuery]);

  async function loadListings() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('classifieds' as any)
        .select(`
          *,
          profiles!classifieds_user_id_fkey (display_name, avatar_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (filters.listing_type !== 'all') {
        query = query.eq('listing_type', filters.listing_type);
      }
      if (filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters.max_price > 0 && filters.listing_type !== 'free') {
        query = query.lte('price', filters.max_price * 100);
      }
      if (filters.condition !== 'all') {
        query = query.eq('condition', filters.condition);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (user) {
        const { data: favs } = await supabase
          .from('classifieds_favorites' as any)
          .select('listing_id')
          .eq('user_id', user.id);
        
        const favIds = new Set((favs as any)?.map((f: any) => f.listing_id) || []);
        
        setListings((data as any)?.map((listing: any) => ({
          ...listing,
          is_favorited: favIds.has(listing.id)
        })) || []);
      } else {
        setListings(data || []);
      }
    } catch (error) {
      console.error('Error loading classifieds:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(listingId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const listing = listings.find(l => l.id === listingId);
      if (!listing) return;

      if (listing.is_favorited) {
        await supabase
          .from('classifieds_favorites' as any)
          .delete()
          .match({ user_id: user.id, listing_id: listingId });
      } else {
        await (supabase
          .from('classifieds_favorites' as any)
          .insert as any)({ user_id: user.id, listing_id: listingId });
      }

      setListings(prev => prev.map(l => 
        l.id === listingId ? { ...l, is_favorited: !l.is_favorited } : l
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  const categories = [
    'dance-shoes', 'dance-costumes', 'dance-accessories', 'music-equipment',
    'electronics', 'furniture', 'clothing', 'vehicles', 'services', 'tickets', 'other'
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Classifieds</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Post Item
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {['all', 'for-sale', 'wanted', 'free', 'trade'].map(type => (
              <button
                key={type}
                onClick={() => setFilters({ ...filters, listing_type: type })}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filters.listing_type === type
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {type === 'all' ? 'All' : type.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Search & Filters */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.replace('-', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Price</label>
                  <input
                    type="number"
                    value={filters.max_price}
                    onChange={(e) => setFilters({ ...filters, max_price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Condition</label>
                  <select
                    value={filters.condition}
                    onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    <option value="all">Any Condition</option>
                    <option value="new">New</option>
                    <option value="like-new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading items...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No items found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try different filters or be the first to post!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {listings.map(listing => (
              <div
                key={listing.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedListing(listing)}
              >
                {/* Photo */}
                <div className="relative h-48 bg-gradient-to-br from-green-400 to-blue-400">
                  {listing.photos?.[0] && (
                    <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(listing.id);
                    }}
                    className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${listing.is_favorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                  </button>
                  <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                    {listing.listing_type}
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 text-sm">
                    {listing.title}
                  </h3>
                  
                  {listing.price !== null ? (
                    <div className="text-lg font-bold text-green-600 mb-1">
                      ${(listing.price / 100).toLocaleString()}
                      {listing.is_negotiable && <span className="text-xs text-gray-500 ml-1">OBO</span>}
                    </div>
                  ) : (
                    <div className="text-lg font-bold text-green-600 mb-1">
                      {listing.listing_type === 'free' ? 'FREE' : 'Price on request'}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span className="capitalize">{listing.category.replace('-', ' ')}</span>
                    {listing.condition && (
                      <span className="capitalize">{listing.condition}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedListing && (
        <ClassifiedDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
        />
      )}

      {showCreateModal && (
        <CreateClassifiedModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadListings();
          }}
        />
      )}
    </div>
  );
}

function ClassifiedDetailModal({ listing, onClose }: { listing: Classified; onClose: () => void }) {
  const supabase = createClient();
  const [offerMessage, setOfferMessage] = useState('');
  const [offerAmount, setOfferAmount] = useState('');

  async function sendOffer() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase.from('classifieds_offers' as any).insert as any)({
        listing_id: listing.id,
        offerer_id: user.id,
        offer_amount: offerAmount ? parseInt(offerAmount) * 100 : null,
        message: offerMessage
      });

      alert('Offer sent!');
      onClose();
    } catch (error) {
      console.error('Error sending offer:', error);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{listing.title}</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6 space-y-4">
          {listing.photos?.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {listing.photos.map((photo, idx) => (
                <img key={idx} src={photo} alt={`Photo ${idx + 1}`} className="w-full h-48 object-cover rounded-lg" />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            {listing.price !== null ? (
              <div className="text-3xl font-bold text-green-600">
                ${(listing.price / 100).toLocaleString()}
                {listing.is_negotiable && <span className="text-sm text-gray-500 ml-2">or best offer</span>}
              </div>
            ) : (
              <div className="text-3xl font-bold text-green-600">
                {listing.listing_type === 'free' ? 'FREE' : 'Make an offer'}
              </div>
            )}
            <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              {listing.listing_type}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Category:</span>
              <span className="ml-2 font-medium capitalize">{listing.category.replace('-', ' ')}</span>
            </div>
            {listing.condition && (
              <div>
                <span className="text-gray-600">Condition:</span>
                <span className="ml-2 font-medium capitalize">{listing.condition}</span>
              </div>
            )}
            {listing.location && (
              <div>
                <span className="text-gray-600">Location:</span>
                <span className="ml-2 font-medium">{listing.location}</span>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{listing.description}</p>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Make an Offer</h3>
            {listing.listing_type === 'for-sale' && (
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="Your offer amount"
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg mb-3"
              />
            )}
            <textarea
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
              placeholder="Add a message..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg resize-none"
            />
            <button
              onClick={sendOffer}
              disabled={!offerMessage.trim()}
              className="mt-3 w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateClassifiedModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const supabase = createClient();
  const [formData, setFormData] = useState({
    listing_type: 'for-sale',
    category: 'dance-shoes',
    title: '',
    description: '',
    price: '',
    is_negotiable: true,
    condition: 'good',
    location: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase.from('classifieds' as any).insert as any)({
        user_id: user.id,
        listing_type: formData.listing_type,
        category: formData.category,
        title: formData.title,
        description: formData.description,
        price: formData.price ? parseInt(formData.price) * 100 : null,
        is_negotiable: formData.is_negotiable,
        condition: formData.condition,
        location: formData.location
      });

      alert('Item posted!');
      onSuccess();
    } catch (error) {
      console.error('Error creating classified:', error);
    }
  }

  const categories = ['dance-shoes', 'dance-costumes', 'dance-accessories', 'music-equipment', 'electronics', 'furniture', 'clothing', 'other'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Post Item</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={formData.listing_type}
                onChange={(e) => setFormData({ ...formData, listing_type: e.target.value })}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
              >
                <option value="for-sale">For Sale</option>
                <option value="wanted">Wanted</option>
                <option value="free">Free</option>
                <option value="trade">Trade</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.replace('-', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Latin dance shoes - size 8"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {formData.listing_type !== 'free' && (
              <div>
                <label className="block text-sm font-medium mb-1">Price ($)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                />
                <label className="flex items-center gap-2 mt-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.is_negotiable}
                    onChange={(e) => setFormData({ ...formData, is_negotiable: e.target.checked })}
                  />
                  Negotiable
                </label>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
              >
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location (optional)</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Pearl District"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Post Item
          </button>
        </form>
      </div>
    </div>
  );
}
