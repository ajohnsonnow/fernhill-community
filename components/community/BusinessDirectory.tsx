'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Store, MapPin, Phone, Globe, Star, Heart, Search, Filter, Plus, X, ExternalLink } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  photos: string[];
  logo_url: string | null;
  community_discount: string | null;
  is_community_owned: boolean;
  dance_friendly: boolean;
  is_verified: boolean;
  status: string;
  created_at: string;
  average_rating?: number;
  review_count?: number;
  is_favorited?: boolean;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
}

export default function BusinessDirectory() {
  const supabase = createClient();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    dance_friendly: false,
    community_owned: false
  });

  useEffect(() => {
    loadBusinesses();
  }, [filters, searchQuery]);

  async function loadBusinesses() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('local_businesses' as any)
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters.dance_friendly) {
        query = query.eq('dance_friendly', true);
      }
      if (filters.community_owned) {
        query = query.eq('is_community_owned', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get ratings for each business
      const businessesWithRatings = await Promise.all(
        ((data as any) || []).map(async (business: any) => {
          const { data: ratingData } = await (supabase
            .rpc as any)('get_business_rating', { p_business_id: business.id });
          
          return {
            ...business,
            average_rating: (ratingData as any)?.average || 0,
            review_count: (ratingData as any)?.count || 0
          };
        })
      );

      // Check favorites
      if (user) {
        const { data: favs } = await supabase
          .from('business_favorites' as any)
          .select('business_id')
          .eq('user_id', user.id);
        
        const favIds = new Set((favs as any)?.map((f: any) => f.business_id) || []);
        
        setBusinesses(businessesWithRatings.map((b: any) => ({
          ...b,
          is_favorited: favIds.has(b.id)
        })));
      } else {
        setBusinesses(businessesWithRatings);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(businessId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const business = businesses.find(b => b.id === businessId);
      if (!business) return;

      if (business.is_favorited) {
        await supabase
          .from('business_favorites' as any)
          .delete()
          .match({ user_id: user.id, business_id: businessId });
      } else {
        await (supabase
          .from('business_favorites' as any)
          .insert as any)({ user_id: user.id, business_id: businessId });
      }

      setBusinesses(prev => prev.map(b => 
        b.id === businessId ? { ...b, is_favorited: !b.is_favorited } : b
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  const categories = [
    'dance-studio', 'dance-school', 'music-venue', 'restaurant', 'bar', 'cafe',
    'fitness', 'wellness', 'clothing', 'shoes', 'services', 'entertainment', 'other'
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Store className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Local Businesses</h1>
            </div>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Business
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
                placeholder="Search businesses..."
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 rounded-lg"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.replace('-', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.dance_friendly}
                      onChange={(e) => setFilters({ ...filters, dance_friendly: e.target.checked })}
                      className="rounded"
                    />
                    Dance Friendly
                  </label>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.community_owned}
                      onChange={(e) => setFilters({ ...filters, community_owned: e.target.checked })}
                      className="rounded"
                    />
                    Community Owned
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Business Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading businesses...</p>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No businesses found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try different filters or add a business!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map(business => (
              <div
                key={business.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedBusiness(business)}
              >
                {/* Logo/Photo */}
                <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-400">
                  {business.photos?.[0] ? (
                    <img src={business.photos[0]} alt={business.name} className="w-full h-full object-cover" />
                  ) : business.logo_url ? (
                    <img src={business.logo_url} alt={business.name} className="w-full h-full object-contain p-8 bg-white" />
                  ) : null}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(business.id);
                    }}
                    className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                  >
                    <Heart className={`w-5 h-5 ${business.is_favorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                  </button>
                  {business.is_verified && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                      ✓ Verified
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{business.name}</h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    {(business.average_rating ?? 0) > 0 ? (
                      <>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{business.average_rating?.toFixed(1)}</span>
                        </div>
                        <span className="text-sm text-gray-500">({business.review_count} reviews)</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">No reviews yet</span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{business.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      {business.address}
                    </div>
                    {business.phone && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4" />
                        {business.phone}
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                      {business.category.replace('-', ' ')}
                    </span>
                    {business.dance_friendly && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        💃 Dance Friendly
                      </span>
                    )}
                    {business.is_community_owned && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        🤝 Community Owned
                      </span>
                    )}
                    {business.community_discount && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                        🎟️ Discount Available
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedBusiness && (
        <BusinessDetailModal
          business={selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
          onReviewAdded={loadBusinesses}
        />
      )}

      {showSubmitModal && (
        <SubmitBusinessModal
          onClose={() => setShowSubmitModal(false)}
          onSuccess={() => {
            setShowSubmitModal(false);
            loadBusinesses();
          }}
        />
      )}
    </div>
  );
}

function BusinessDetailModal({ business, onClose, onReviewAdded }: {
  business: Business;
  onClose: () => void;
  onReviewAdded: () => void;
}) {
  const supabase = createClient();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    loadReviews();
  }, [business.id]);

  async function loadReviews() {
    const { data } = await supabase
      .from('business_reviews' as any)
      .select(`
        *,
        profiles!business_reviews_user_id_fkey (display_name, avatar_url)
      `)
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });
    
    setReviews(data || []);
  }

  async function submitReview() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase.from('business_reviews' as any).insert as any)({
        business_id: business.id,
        user_id: user.id,
        rating,
        review_text: reviewText
      });

      alert('Review submitted!');
      setShowReviewForm(false);
      setReviewText('');
      loadReviews();
      onReviewAdded();
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{business.name}</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {(business.average_rating ?? 0) > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-lg">{business.average_rating?.toFixed(1)}</span>
                    <span className="text-gray-500">({business.review_count} reviews)</span>
                  </div>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">{business.description}</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                <MapPin className="w-4 h-4" />
                {business.address}, {business.city}
              </div>
              {business.phone && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${business.phone}`} className="hover:text-blue-600">{business.phone}</a>
                </div>
              )}
            </div>
            <div>
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <Globe className="w-4 h-4" />
                  Visit Website
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {business.community_discount && (
                <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-orange-700 dark:text-orange-300 text-sm">
                  🎟️ {business.community_discount}
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Reviews</h3>
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Write Review
              </button>
            </div>

            {showReviewForm && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 rounded-lg resize-none mb-3"
                />
                <button
                  onClick={submitReview}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Review
                </button>
              </div>
            )}

            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                      <span className="font-medium">{review.profiles?.display_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{review.rating}</span>
                    </div>
                  </div>
                  {review.review_text && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{review.review_text}</p>
                  )}
                  <span className="text-xs text-gray-500 mt-1 block">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {reviews.length === 0 && !showReviewForm && (
                <p className="text-center text-gray-500 py-4">No reviews yet. Be the first!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmitBusinessModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const supabase = createClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'dance-studio',
    address: '',
    phone: '',
    website: '',
    community_discount: '',
    dance_friendly: false
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase.from('local_businesses' as any).insert as any)({
        submitted_by: user.id,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        address: formData.address,
        city: 'Portland',
        phone: formData.phone || null,
        website: formData.website || null,
        community_discount: formData.community_discount || null,
        dance_friendly: formData.dance_friendly,
        status: 'pending'
      });

      alert('Business submitted for review!');
      onSuccess();
    } catch (error) {
      console.error('Error submitting business:', error);
    }
  }

  const categories = ['dance-studio', 'dance-school', 'music-venue', 'restaurant', 'bar', 'cafe', 'fitness', 'wellness', 'clothing', 'shoes', 'services', 'entertainment', 'other'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Add Business</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Business Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Community Discount (optional)</label>
            <input
              type="text"
              value={formData.community_discount}
              onChange={(e) => setFormData({ ...formData, community_discount: e.target.value })}
              placeholder="10% off for community members"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.dance_friendly}
              onChange={(e) => setFormData({ ...formData, dance_friendly: e.target.checked })}
            />
            Dance Friendly (hosts events or dance-related)
          </label>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Submit for Review
          </button>
        </form>
      </div>
    </div>
  );
}
