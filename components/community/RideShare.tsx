'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Car, MapPin, Calendar, Users, Clock, Search } from 'lucide-react';

type RideOffer = {
  id: string;
  type: 'offer' | 'request';
  departure_location: string;
  destination: string;
  departure_time: string;
  seats_available: number;
  seats_requested: number;
  notes: string;
  event_id: string | null;
  created_by: string;
  created_at: string;
  profiles: { display_name: string; };
  events: { title: string; } | null;
};

export default function RideShare() {
  const [rides, setRides] = useState<RideOffer[]>([]);
  const [filter, setFilter] = useState<'all' | 'offer' | 'request'>('all');
  const [showNewRide, setShowNewRide] = useState(false);
  const [newRide, setNewRide] = useState({
    type: 'offer' as 'offer' | 'request',
    departure_location: '',
    destination: '',
    departure_time: '',
    seats_available: 1,
    seats_requested: 1,
    notes: '',
    event_id: null as string | null
  });
  const supabase = createClient();

  useEffect(() => {
    loadRides();
  }, [filter]);

  async function loadRides() {
    let query = supabase
      .from('ride_share')
      .select('*, profiles:created_by(display_name), events:event_id(title)')
      .gte('departure_time', new Date().toISOString())
      .order('departure_time', { ascending: true });

    if (filter !== 'all') query = query.eq('type', filter);

    const { data } = await query as any;
    setRides(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('ride_share').insert({
      ...newRide,
      created_by: user.id
    } as any);

    setShowNewRide(false);
    setNewRide({
      type: 'offer',
      departure_location: '',
      destination: '',
      departure_time: '',
      seats_available: 1,
      seats_requested: 1,
      notes: '',
      event_id: null
    });
    loadRides();
  }

  async function requestRide(rideId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('ride_requests').insert({
      ride_id: rideId,
      requested_by: user.id,
      seats_needed: 1
    } as any);

    alert('Request sent! The driver will receive a notification.');
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-fernhill-charcoal rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Car className="w-6 h-6 text-fernhill-gold" />
            <h2 className="text-xl font-bold text-fernhill-cream">Ride Share</h2>
          </div>
          <button
            onClick={() => setShowNewRide(!showNewRide)}
            className="bg-fernhill-gold text-fernhill-dark px-4 py-2 rounded-lg hover:bg-fernhill-terracotta"
          >
            + Post Ride
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['all', 'offer', 'request'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg capitalize ${
                filter === f ? 'bg-fernhill-gold text-fernhill-dark' : 'bg-fernhill-brown/50 text-fernhill-sand'
              }`}
            >
              {f === 'offer' ? 'Offering Rides' : f === 'request' ? 'Need Rides' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* New Ride Form */}
      {showNewRide && (
        <div className="bg-fernhill-charcoal rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-fernhill-cream mb-4">Post a Ride</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fernhill-cream mb-2">I want to...</label>
              <div className="flex gap-4">
                {['offer', 'request'].map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      checked={newRide.type === type}
                      onChange={(e) => setNewRide({...newRide, type: e.target.value as any})}
                      className="w-4 h-4"
                    />
                    <span className="capitalize">{type === 'offer' ? 'Offer a ride' : 'Request a ride'}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-fernhill-cream mb-2">From *</label>
              <input
                type="text"
                value={newRide.departure_location}
                onChange={(e) => setNewRide({...newRide, departure_location: e.target.value})}
                placeholder="Starting location"
                className="w-full bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg px-3 py-2 text-fernhill-sand placeholder:text-fernhill-sand/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fernhill-cream mb-2">To *</label>
              <input
                type="text"
                value={newRide.destination}
                onChange={(e) => setNewRide({...newRide, destination: e.target.value})}
                placeholder="Destination"
                className="w-full bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg px-3 py-2 text-fernhill-sand placeholder:text-fernhill-sand/50"
                required
              />
            </div>

            <div>
              <label htmlFor="rideshare-departure-input" className="block text-sm font-medium text-fernhill-cream mb-2">Departure Time *</label>
              <input
                id="rideshare-departure-input"
                type="datetime-local"
                value={newRide.departure_time}
                onChange={(e) => setNewRide({...newRide, departure_time: e.target.value})}
                className="w-full bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg px-3 py-2 text-fernhill-sand"
                required
              />
            </div>

            {newRide.type === 'offer' ? (
              <div>
                <label htmlFor="rideshare-seats-available-input" className="block text-sm font-medium text-fernhill-cream mb-2">Seats Available *</label>
                <input
                  id="rideshare-seats-available-input"
                  type="number"
                  min="1"
                  max="8"
                  value={newRide.seats_available}
                  onChange={(e) => setNewRide({...newRide, seats_available: parseInt(e.target.value)})}
                  className="w-full bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg px-3 py-2 text-fernhill-sand"
                  required
                />
              </div>
            ) : (
              <div>
                <label htmlFor="rideshare-seats-needed-input" className="block text-sm font-medium text-fernhill-cream mb-2">Seats Needed *</label>
                <input
                  id="rideshare-seats-needed-input"
                  type="number"
                  min="1"
                  max="8"
                  value={newRide.seats_requested}
                  onChange={(e) => setNewRide({...newRide, seats_requested: parseInt(e.target.value)})}
                  className="w-full bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg px-3 py-2 text-fernhill-sand"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-fernhill-cream mb-2">Notes</label>
              <textarea
                value={newRide.notes}
                onChange={(e) => setNewRide({...newRide, notes: e.target.value})}
                placeholder="Additional details (optional)"
                className="w-full bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg px-3 py-2 h-20 text-fernhill-sand placeholder:text-fernhill-sand/50"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-fernhill-gold text-fernhill-dark py-2 rounded-lg hover:bg-fernhill-terracotta"
              >
                Post Ride
              </button>
              <button
                type="button"
                onClick={() => setShowNewRide(false)}
                className="px-6 py-2 border border-fernhill-earth/50 rounded-lg text-fernhill-sand hover:bg-fernhill-brown/30"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rides List */}
      <div className="space-y-3">
        {rides.length === 0 ? (
          <div className="bg-fernhill-charcoal rounded-lg shadow p-8 text-center text-fernhill-sand/70">
            No rides available. Post one to get started!
          </div>
        ) : (
          rides.map(ride => (
            <div key={ride.id} className="bg-fernhill-charcoal rounded-lg shadow p-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${
                  ride.type === 'offer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  <Car className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        ride.type === 'offer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {ride.type === 'offer' ? 'Offering Ride' : 'Need Ride'}
                      </span>
                    </div>
                    {ride.type === 'offer' && (
                      <button
                        onClick={() => requestRide(ride.id)}
                        className="bg-fernhill-gold text-fernhill-dark px-4 py-1 rounded-lg text-sm hover:bg-fernhill-terracotta"
                      >
                        Request Ride
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-fernhill-sand">
                      <MapPin className="w-4 h-4 text-fernhill-sand/60" />
                      <span className="font-medium">{ride.departure_location}</span>
                      <span>→</span>
                      <span className="font-medium">{ride.destination}</span>
                    </div>
                    <div className="flex items-center gap-2 text-fernhill-sand/80">
                      <Clock className="w-4 h-4 text-fernhill-sand/60" />
                      {new Date(ride.departure_time).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 text-fernhill-sand/80">
                      <Users className="w-4 h-4 text-fernhill-sand/60" />
                      {ride.type === 'offer' ? `${ride.seats_available} seats available` : `${ride.seats_requested} seats needed`}
                    </div>
                  </div>

                  {ride.notes && (
                    <p className="text-fernhill-sand text-sm mb-3 bg-fernhill-brown/50 p-2 rounded">{ride.notes}</p>
                  )}

                  {ride.events && (
                    <div className="mb-3 px-3 py-1 bg-fernhill-gold/20 text-fernhill-gold rounded inline-block text-sm">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      For: {ride.events.title}
                    </div>
                  )}

                  <div className="text-sm text-fernhill-sand/80 border-t border-fernhill-earth/50 pt-2">
                    Posted by {ride.profiles?.display_name || 'Unknown'} •{' '}
                    {new Date(ride.created_at).toLocaleDateString()}
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
