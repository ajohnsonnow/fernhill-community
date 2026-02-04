'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Car, MapPin, Clock, Users, ChevronDown, ChevronUp, Plus, X, Send, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Ride {
  id: string;
  type: 'offer' | 'request';
  departure_location: string;
  destination: string;
  departure_time: string;
  seats_available: number;
  seats_requested: number;
  notes: string | null;
  status: string;
  created_by: string;
  profiles: { 
    display_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface EventRideShareProps {
  eventId: string;
  eventTitle: string;
  eventLocation: string;
  eventDate: string;
}

export function EventRideShare({ eventId, eventTitle, eventLocation, eventDate }: EventRideShareProps) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'offer' as 'offer' | 'request',
    departure_location: '',
    seats: 1,
    notes: ''
  });
  
  const supabase = createClient();

  useEffect(() => {
    loadRides();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, [eventId]);

  async function loadRides() {
    setLoading(true);
    const { data, error } = await (supabase
      .from('ride_share') as any)
      .select('*, profiles:created_by(display_name, full_name, avatar_url)')
      .eq('event_id', eventId)
      .eq('status', 'active')
      .gte('departure_time', new Date().toISOString())
      .order('departure_time', { ascending: true });

    if (!error && data) {
      setRides(data);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to post a ride');
      return;
    }

    const { error } = await (supabase
      .from('ride_share') as any)
      .insert({
        type: formData.type,
        departure_location: formData.departure_location,
        destination: eventLocation,
        departure_time: eventDate,
        seats_available: formData.type === 'offer' ? formData.seats : 0,
        seats_requested: formData.type === 'request' ? formData.seats : 0,
        notes: formData.notes || null,
        event_id: eventId,
        created_by: user.id
      });

    if (error) {
      console.error('Error posting ride:', error);
      toast.error('Failed to post ride');
    } else {
      toast.success(formData.type === 'offer' ? 'Ride offered!' : 'Ride request posted!');
      setShowForm(false);
      setFormData({ type: 'offer', departure_location: '', seats: 1, notes: '' });
      loadRides();
    }
  }

  async function requestRide(ride: Ride) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to request a ride');
      return;
    }

    if (ride.created_by === user.id) {
      toast.error("You can't request your own ride");
      return;
    }

    const { error } = await (supabase
      .from('ride_requests') as any)
      .insert({
        ride_id: ride.id,
        requested_by: user.id,
        seats_needed: 1
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('You already requested this ride');
      } else {
        console.error('Error requesting ride:', error);
        toast.error('Failed to request ride');
      }
    } else {
      toast.success('Ride requested! The driver will be notified.');
    }
  }

  const offers = rides.filter(r => r.type === 'offer');
  const requests = rides.filter(r => r.type === 'request');

  return (
    <div className="mt-4 border-t border-fernhill-sand/10 pt-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-indigo-400" />
          <span className="font-medium text-fernhill-cream">Ride Share</span>
          {rides.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-300">
              {rides.length} {rides.length === 1 ? 'ride' : 'rides'}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-fernhill-sand/50" />
        ) : (
          <ChevronDown className="w-5 h-5 text-fernhill-sand/50" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFormData({ ...formData, type: 'offer' });
                setShowForm(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-sm"
            >
              <Car className="w-4 h-4" />
              <span>Offer Ride</span>
            </button>
            <button
              onClick={() => {
                setFormData({ ...formData, type: 'request' });
                setShowForm(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-sm"
            >
              <Users className="w-4 h-4" />
              <span>Need Ride</span>
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-fernhill-brown/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-fernhill-cream">
                  {formData.type === 'offer' ? '🚗 Offer a Ride' : '🙋 Request a Ride'}
                </h4>
                <button type="button" onClick={() => setShowForm(false)} title="Close form" aria-label="Close form">
                  <X className="w-5 h-5 text-fernhill-sand/50 hover:text-fernhill-sand" />
                </button>
              </div>

              <div>
                <label className="block text-sm text-fernhill-sand/70 mb-1">
                  {formData.type === 'offer' ? 'Departing from' : 'Pickup location'}
                </label>
                <input
                  type="text"
                  value={formData.departure_location}
                  onChange={(e) => setFormData({ ...formData, departure_location: e.target.value })}
                  placeholder="e.g., SE Portland, Pearl District..."
                  className="w-full px-3 py-2 rounded-lg bg-fernhill-charcoal border border-fernhill-sand/20 text-fernhill-cream placeholder:text-fernhill-sand/40 focus:outline-none focus:border-fernhill-gold/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-fernhill-sand/70 mb-1">
                  {formData.type === 'offer' ? 'Seats available' : 'Seats needed'}
                </label>
                <select
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-fernhill-charcoal border border-fernhill-sand/20 text-fernhill-cream focus:outline-none focus:border-fernhill-gold/50"
                  aria-label="Number of seats"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'seat' : 'seats'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-fernhill-sand/70 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g., Can pick up along the way..."
                  className="w-full px-3 py-2 rounded-lg bg-fernhill-charcoal border border-fernhill-sand/20 text-fernhill-cream placeholder:text-fernhill-sand/40 focus:outline-none focus:border-fernhill-gold/50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-fernhill-gold text-fernhill-dark font-medium hover:bg-fernhill-gold/90 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Post {formData.type === 'offer' ? 'Offer' : 'Request'}
              </button>
            </form>
          )}

          {/* Existing Rides */}
          {loading ? (
            <div className="text-center py-4 text-fernhill-sand/50">Loading rides...</div>
          ) : rides.length === 0 ? (
            <div className="text-center py-4 text-fernhill-sand/50 text-sm">
              <Car className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No rides posted yet for this event.</p>
              <p className="text-xs mt-1">Be the first to offer or request a ride!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Offers */}
              {offers.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-green-400 mb-2 flex items-center gap-1">
                    <Car className="w-3 h-3" /> RIDES OFFERED ({offers.length})
                  </h5>
                  {offers.map(ride => (
                    <RideCard 
                      key={ride.id} 
                      ride={ride} 
                      onRequest={() => requestRide(ride)}
                      isOwn={ride.created_by === currentUserId}
                    />
                  ))}
                </div>
              )}

              {/* Requests */}
              {requests.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-xs font-medium text-amber-400 mb-2 flex items-center gap-1">
                    <Users className="w-3 h-3" /> RIDES NEEDED ({requests.length})
                  </h5>
                  {requests.map(ride => (
                    <RideCard 
                      key={ride.id} 
                      ride={ride} 
                      onRequest={() => requestRide(ride)}
                      isOwn={ride.created_by === currentUserId}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RideCard({ ride, onRequest, isOwn }: { ride: Ride; onRequest: () => void; isOwn: boolean }) {
  const displayName = ride.profiles?.display_name || ride.profiles?.full_name || 'Community Member';
  
  return (
    <div className="p-3 rounded-xl bg-fernhill-charcoal/50 border border-fernhill-sand/10">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-fernhill-moss/30 flex items-center justify-center text-xs">
              {displayName.charAt(0)}
            </div>
            <span className="font-medium text-fernhill-cream text-sm truncate">{displayName}</span>
            {isOwn && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-fernhill-gold/20 text-fernhill-gold">You</span>
            )}
          </div>
          
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex items-center gap-2 text-fernhill-sand/70">
              <MapPin className="w-3 h-3" />
              <span>From: {ride.departure_location}</span>
            </div>
            <div className="flex items-center gap-2 text-fernhill-sand/70">
              <Users className="w-3 h-3" />
              <span>
                {ride.type === 'offer' 
                  ? `${ride.seats_available} seat${ride.seats_available !== 1 ? 's' : ''} available`
                  : `${ride.seats_requested} seat${ride.seats_requested !== 1 ? 's' : ''} needed`
                }
              </span>
            </div>
            {ride.notes && (
              <p className="text-fernhill-sand/50 italic">{ride.notes}</p>
            )}
          </div>
        </div>

        {!isOwn && (
          <button
            onClick={onRequest}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              ride.type === 'offer'
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
            }`}
          >
            {ride.type === 'offer' ? 'Request' : 'Offer Help'}
          </button>
        )}
      </div>
    </div>
  );
}

export default EventRideShare;
