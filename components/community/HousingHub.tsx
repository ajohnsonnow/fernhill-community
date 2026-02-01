'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Home, MapPin, DollarSign, Calendar, Users, Heart, Search, Filter, Plus, X } from 'lucide-react';

interface HousingListing {
  id: string;
  user_id: string;
  listing_type: 'room' | 'apartment' | 'house' | 'sublet' | 'roommate-wanted';
  title: string;
  description: string;
  neighborhood: string;
  city: string;
  rent_amount: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  available_date: string | null;
  amenities: string[];
  photos: string[];
  status: string;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
  is_favorited?: boolean;
}

interface HousingFilters {
  listing_type: string;
  max_rent: number;
  bedrooms: number;
  neighborhood: string;
  amenities: string[];
}

export default function HousingHub() {
  const supabase = createClient();
  const [listings, setListings] = useState<HousingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<HousingListing | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<HousingFilters>({
    listing_type: 'all',
    max_rent: 3000,
    bedrooms: 0,
    neighborhood: '',
    amenities: []
  });

  useEffect(() => {
    loadListings();
  }, [filters, searchQuery]);

  async function loadListings() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('housing_listings' as any)
        .select(`
          *,
          profiles!housing_listings_user_id_fkey (display_name, avatar_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.listing_type !== 'all') {
        query = query.eq('listing_type', filters.listing_type);
      }
      if (filters.max_rent > 0) {
        query = query.lte('rent_amount', filters.max_rent * 100);
      }
      if (filters.bedrooms > 0) {
        query = query.gte('bedrooms', filters.bedrooms);
      }
      if (filters.neighborhood) {
        query = query.ilike('neighborhood', `%${filters.neighborhood}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Check favorites
      if (user) {
        const { data: favs } = await supabase
          .from('housing_favorites' as any)
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
      console.error('Error loading housing listings:', error);
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
          .from('housing_favorites' as any)
          .delete()
          .match({ user_id: user.id, listing_id: listingId });
      } else {
        await (supabase
          .from('housing_favorites' as any)
          .insert as any)({ user_id: user.id, listing_id: listingId });
      }

      setListings(prev => prev.map(l => 
        l.id === listingId ? { ...l, is_favorited: !l.is_favorited } : l
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  async function sendInquiry(listingId: string, message: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase
        .from('housing_inquiries' as any)
        .insert as any)({
          listing_id: listingId,
          inquirer_id: user.id,
          message
        });

      alert('Inquiry sent! The poster will receive your message.');
      setSelectedListing(null);
    } catch (error) {
      console.error('Error sending inquiry:', error);
      alert('Failed to send inquiry');
    }
  }

  const amenitiesList = [
    'parking', 'laundry', 'pet-friendly', 'wheelchair-accessible', 
    'dance-space', 'gym', 'balcony', 'dishwasher', 'ac', 'heating'
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Home className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Housing Hub</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Post Listing
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by location, keywords..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white"
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

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={filters.listing_type}
                    onChange={(e) => setFilters({ ...filters, listing_type: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="all">All Types</option>
                    <option value="room">Room</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="sublet">Sublet</option>
                    <option value="roommate-wanted">Roommate Wanted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Rent
                  </label>
                  <input
                    type="number"
                    value={filters.max_rent}
                    onChange={(e) => setFilters({ ...filters, max_rent: parseInt(e.target.value) || 0 })}
                    placeholder="3000"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Min Bedrooms
                  </label>
                  <input
                    type="number"
                    value={filters.bedrooms}
                    onChange={(e) => setFilters({ ...filters, bedrooms: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Neighborhood
                  </label>
                  <input
                    type="text"
                    value={filters.neighborhood}
                    onChange={(e) => setFilters({ ...filters, neighborhood: e.target.value })}
                    placeholder="e.g. Pearl District"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading housing listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No listings found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or be the first to post!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(listing => (
              <div
                key={listing.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedListing(listing)}
              >
                {/* Photo */}
                <div className="relative h-48 bg-gradient-to-br from-purple-400 to-pink-400">
                  {listing.photos?.[0] && (
                    <img
                      src={listing.photos[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(listing.id);
                    }}
                    className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                  >
                    <Heart
                      className={`w-5 h-5 ${listing.is_favorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                    />
                  </button>
                  <div className="absolute top-2 left-2 px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-full">
                    {listing.listing_type.replace('-', ' ')}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                    {listing.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <MapPin className="w-4 h-4" />
                    {listing.neighborhood}, {listing.city}
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    {listing.rent_amount && (
                      <div className="flex items-center gap-1 text-lg font-bold text-purple-600">
                        <DollarSign className="w-5 h-5" />
                        {(listing.rent_amount / 100).toLocaleString()}/mo
                      </div>
                    )}
                    {listing.bedrooms && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {listing.bedrooms} bed • {listing.bathrooms} bath
                      </div>
                    )}
                  </div>

                  {listing.available_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <Calendar className="w-4 h-4" />
                      Available {new Date(listing.available_date).toLocaleDateString()}
                    </div>
                  )}

                  {/* Amenities */}
                  {listing.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {listing.amenities.slice(0, 3).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-700 dark:text-gray-300"
                        >
                          {amenity}
                        </span>
                      ))}
                      {listing.amenities.length > 3 && (
                        <span className="px-2 py-1 text-xs text-gray-500">
                          +{listing.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onSendInquiry={sendInquiry}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateListingModal
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

// Detail Modal Component
function ListingDetailModal({
  listing,
  onClose,
  onSendInquiry
}: {
  listing: HousingListing;
  onClose: () => void;
  onSendInquiry: (listingId: string, message: string) => void;
}) {
  const [message, setMessage] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{listing.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Photos */}
          {listing.photos?.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {listing.photos.map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {listing.rent_amount && (
                <div className="text-2xl font-bold text-purple-600">
                  ${(listing.rent_amount / 100).toLocaleString()}/month
                </div>
              )}
              <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {listing.listing_type.replace('-', ' ')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Location:</span>
                <span className="ml-2 font-medium">{listing.neighborhood}, {listing.city}</span>
              </div>
              {listing.bedrooms && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Size:</span>
                  <span className="ml-2 font-medium">{listing.bedrooms} bed, {listing.bathrooms} bath</span>
                </div>
              )}
              {listing.available_date && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Available:</span>
                  <span className="ml-2 font-medium">
                    {new Date(listing.available_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{listing.description}</p>
            </div>

            {listing.amenities?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact Form */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Send Inquiry</h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I'm interested in this listing. Can we set up a time to view it?"
              rows={4}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white resize-none"
            />
            <button
              onClick={() => {
                if (message.trim()) {
                  onSendInquiry(listing.id, message);
                  setMessage('');
                }
              }}
              disabled={!message.trim()}
              className="mt-3 w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Send Inquiry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Modal Component
function CreateListingModal({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const supabase = createClient();
  const [formData, setFormData] = useState({
    listing_type: 'room',
    title: '',
    description: '',
    neighborhood: '',
    rent_amount: '',
    bedrooms: '',
    bathrooms: '',
    available_date: '',
    amenities: [] as string[]
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase.from('housing_listings' as any).insert as any)({
        user_id: user.id,
        listing_type: formData.listing_type,
        title: formData.title,
        description: formData.description,
        neighborhood: formData.neighborhood,
        city: 'Portland',
        rent_amount: formData.rent_amount ? parseInt(formData.rent_amount) * 100 : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
        available_date: formData.available_date || null,
        amenities: formData.amenities
      });

      alert('Listing created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Failed to create listing');
    }
  }

  const amenitiesList = ['parking', 'laundry', 'pet-friendly', 'dance-space', 'gym', 'balcony'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Create Housing Listing</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Listing Type</label>
            <select
              value={formData.listing_type}
              onChange={(e) => setFormData({ ...formData, listing_type: e.target.value })}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
              required
            >
              <option value="room">Room</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="sublet">Sublet</option>
              <option value="roommate-wanted">Roommate Wanted</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Cozy room in Pearl District dance community"
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
              placeholder="Describe the space, neighborhood, and what you're looking for..."
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Neighborhood</label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                placeholder="Pearl District"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Rent ($)</label>
              <input
                type="number"
                value={formData.rent_amount}
                onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                placeholder="1200"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Bedrooms</label>
              <input
                type="number"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bathrooms</label>
              <input
                type="number"
                step="0.5"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Available Date</label>
              <input
                type="date"
                value={formData.available_date}
                onChange={(e) => setFormData({ ...formData, available_date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {amenitiesList.map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      amenities: prev.amenities.includes(amenity)
                        ? prev.amenities.filter(a => a !== amenity)
                        : [...prev.amenities, amenity]
                    }));
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    formData.amenities.includes(amenity)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Create Listing
          </button>
        </form>
      </div>
    </div>
  );
}
