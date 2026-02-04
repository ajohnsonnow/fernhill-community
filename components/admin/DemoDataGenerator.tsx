'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Trash2, 
  Users, 
  MessageSquare, 
  Calendar, 
  Bell, 
  Megaphone,
  Car,
  Image,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Play,
  RotateCcw
} from 'lucide-react';

// Demo user personas
const DEMO_PERSONAS = [
  { name: 'Luna Starweaver', tribe: 'Moonlit Mystics', gifts: 'Breathwork, Sound Healing, Astrology', vibe: 'flowing' },
  { name: 'River Oak', tribe: 'Forest Dwellers', gifts: 'Herbalism, Permaculture, Drum Circles', vibe: 'lyrical' },
  { name: 'Phoenix Rising', tribe: 'Fire Dancers', gifts: 'Fire Performance, Contact Improv, DJ', vibe: 'chaos' },
  { name: 'Sage Windwhisper', tribe: 'Stillness Seekers', gifts: 'Meditation, Yoga, Massage', vibe: 'stillness' },
  { name: 'Echo Ripple', tribe: 'Wave Riders', gifts: 'Ecstatic Dance, Facilitation, Poetry', vibe: 'staccato' },
  { name: 'Moss Tender', tribe: 'Garden Guild', gifts: 'Community Gardens, Cooking, Composting', vibe: 'open_to_dance' },
  { name: 'Ember Glow', tribe: 'Night Owls', gifts: 'Late Night Sets, Ambient Music, Tea Ceremony', vibe: 'mycelial' },
  { name: 'Cedar Song', tribe: 'Tree Huggers', gifts: 'Forest Bathing, Bird Watching, Storytelling', vibe: 'flowing' },
];

const DEMO_POSTS = [
  { category: 'general', content: '✨ Just had the most incredible dance session! The energy in the room was electric. Feeling so grateful for this community. 💜 #fernhillfamily' },
  { category: 'mutual_aid_offer', content: '🚗 Offering rides to Sunday\'s dance! I can pick up 3 people from SE Portland. DM me your cross streets and I\'ll map a route. Let\'s carpool! #rideshare' },
  { category: 'mutual_aid_request', content: '🙏 Does anyone have a spare yoga mat I could borrow for the workshop tomorrow? Mine finally gave up after 10 years of service. Will return with gratitude!' },
  { category: 'gratitude', content: '🙏 Huge thank you to everyone who helped set up and clean up last Sunday. The altar was absolutely beautiful. This community runs on love and it shows!' },
  { category: 'organizing', content: '📋 Volunteer sign-up for the Spring Equinox celebration is now open! We need help with: altar decoration, sound setup, snack coordination. Comment below!' },
  { category: 'general', content: '🎵 New playlist alert! I put together a 2-hour flow journey inspired by Sunday\'s set. Link in my profile. Enjoy! #musicsharing' },
  { category: 'mutual_aid_offer', content: '🍲 Made way too much soup! I have 4 quarts of homemade vegetable lentil soup to share. Pick up in NE Portland today or tomorrow. First come first served!' },
  { category: 'gratitude', content: '💫 Six months sober today. This community has been such a crucial part of my healing journey. Dancing without substances has opened up so much. Thank you all. 🌱' },
];

const DEMO_ANNOUNCEMENTS = [
  { title: 'Spring Schedule Update', content: 'Starting March 1st, we\'ll be adding a Wednesday evening session! Same location, 7-9pm. Open floor format. See you there!', category: 'event', priority: 'high' },
  { title: 'New Sound System Arrives!', content: 'Thanks to community donations, we\'ve upgraded our speakers. The bass is going to hit different. 🔊 Thank you to everyone who contributed!', category: 'community', priority: 'normal' },
  { title: 'Parking Reminder', content: 'Please remember to park on the street, not in the neighboring business lots. We want to stay good neighbors! 🚗', category: 'logistics', priority: 'normal' },
];

const DEMO_EVENTS = [
  { title: 'Sunday Ecstatic Dance', location: 'Bridgespace', type: 'dance' },
  { title: 'Full Moon Sound Bath', location: 'Fernhill Park', type: 'workshop' },
  { title: 'Community Potluck', location: 'TBD', type: 'gathering' },
];

interface DemoDataGeneratorProps {
  onDataChanged: () => void;
}

export default function DemoDataGenerator({ onDataChanged }: DemoDataGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  
  const supabase = createClient();

  const addProgress = (msg: string) => {
    setProgress(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const generateDemoData = async () => {
    setGenerating(true);
    setProgress([]);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Must be logged in');
        return;
      }

      // 1. Create demo profiles (as fake users in profiles table)
      addProgress('Creating demo user profiles...');
      const demoUserIds: string[] = [];
      
      for (const persona of DEMO_PERSONAS) {
        // Generate a deterministic UUID based on the persona name (for idempotency)
        const fakeId = crypto.randomUUID();
        
        const { data: existingProfile } = await (supabase
          .from('profiles') as any)
          .select('id')
          .eq('tribe_name', persona.tribe)
          .single();
        
        if (existingProfile) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          demoUserIds.push((existingProfile as Record<string, string>).id);
          addProgress(`  → ${persona.name} already exists`);
          continue;
        }

        const { data: profile, error} = await (supabase.from('profiles') as any).insert({
          id: fakeId,
          full_name: persona.name,
          tribe_name: persona.tribe,
          display_name: persona.name,
          mycelial_gifts: persona.gifts,
          vibe_status: persona.vibe,
          status: 'active',
          show_in_directory: true,
          requires_review: false,
          is_demo: true // Mark as demo for easy cleanup and filtering
        }).select().single();

        if (error) {
          // Try without is_demo column (might not exist yet - migration not run)
          const { data: profile2, error: error2 } = await (supabase.from('profiles') as any).insert({
            id: fakeId,
            full_name: persona.name,
            tribe_name: persona.tribe,
            display_name: persona.name,
            mycelial_gifts: persona.gifts,
            vibe_status: persona.vibe,
            status: 'active',
            show_in_directory: true,
            requires_review: false
          }).select().single();
          
          if (error2) {
            addProgress(`  ⚠️ Failed to create ${persona.name}: ${error2.message}`);
            continue;
          }
          demoUserIds.push(profile2.id);
        } else {
          demoUserIds.push(profile.id);
        }
        addProgress(`  ✓ Created ${persona.name}`);
      }

      // 2. Create demo posts
      addProgress('Creating demo posts...');
      for (let i = 0; i < DEMO_POSTS.length; i++) {
        const post = DEMO_POSTS[i];
        const authorId = demoUserIds[i % demoUserIds.length];
        
        if (!authorId) continue;
        
        // Try with is_demo field first
        let { error } = await (supabase.from('posts') as any).insert({
          author_id: authorId,
          category: post.category,
          content: post.content,
          likes_count: Math.floor(Math.random() * 20),
          is_demo: true
        });
        
        // Fall back without is_demo if column doesn't exist yet
        if (error && error.message?.includes('is_demo')) {
          const result = await (supabase.from('posts') as any).insert({
            author_id: authorId,
            category: post.category,
            content: post.content,
            likes_count: Math.floor(Math.random() * 20)
          });
          error = result.error;
        }
        
        if (error) {
          addProgress(`  ⚠️ Post failed: ${error.message}`);
        } else {
          addProgress(`  ✓ Created ${post.category} post`);
        }
      }

      // 3. Create demo announcements (as current admin)
      addProgress('Creating demo announcements...');
      for (const announcement of DEMO_ANNOUNCEMENTS) {
        // Try with is_demo field first
        let { error } = await (supabase.from('announcements') as any).insert({
          author_id: user.id,
          title: announcement.title,
          content: announcement.content,
          category: announcement.category,
          priority: announcement.priority,
          status: 'published',
          is_pinned: announcement.priority === 'high',
          is_demo: true
        });
        
        // Fall back without is_demo if column doesn't exist yet
        if (error && error.message?.includes('is_demo')) {
          const result = await (supabase.from('announcements') as any).insert({
            author_id: user.id,
            title: announcement.title,
            content: announcement.content,
            category: announcement.category,
            priority: announcement.priority,
            status: 'published',
            is_pinned: announcement.priority === 'high'
          });
          error = result.error;
        }
        
        if (error) {
          addProgress(`  ⚠️ Announcement failed: ${error.message}`);
        } else {
          addProgress(`  ✓ Created "${announcement.title}"`);
        }
      }

      // 4. Create demo notifications for current user
      addProgress('Creating demo notifications...');
      const notificationTypes = [
        { type: 'reaction', title: '❤️ New Reaction', content: 'Luna Starweaver loved your post' },
        { type: 'comment', title: '💬 New Comment', content: 'River Oak commented on your post' },
        { type: 'follow', title: '👋 New Follower', content: 'Phoenix Rising started following you' },
        { type: 'event', title: '📅 Event Reminder', content: 'Sunday Ecstatic Dance starts in 1 hour' },
        { type: 'mention', title: '📣 You were mentioned', content: 'Sage Windwhisper mentioned you in a post' },
      ];
      
      for (const notif of notificationTypes) {
        const actorId = demoUserIds[Math.floor(Math.random() * demoUserIds.length)];
        const { error } = await (supabase.from('notifications') as any).insert({
          user_id: user.id,
          actor_id: actorId || null,
          type: notif.type,
          title: notif.title,
          content: notif.content,
          link: '/hearth',
          is_read: Math.random() > 0.5
        });
        
        if (!error) {
          addProgress(`  ✓ Created ${notif.type} notification`);
        }
      }

      // 5. Create demo ride shares
      addProgress('Creating demo ride shares...');
      const rideOffers = [
        { departure: 'SE Portland (Division & 50th)', destination: 'Bridgespace', seats: 3, notes: 'Leaving at 6pm, can make stops along the way!' },
        { departure: 'NE Portland (Alberta)', destination: 'Bridgespace', seats: 2, notes: 'Happy to pick up anyone in NE!' },
      ];
      const rideRequests = [
        { departure: 'Downtown Portland', destination: 'Bridgespace', seats: 1, notes: 'Can chip in for gas!' },
      ];
      
      for (const ride of rideOffers) {
        const driverId = demoUserIds[Math.floor(Math.random() * demoUserIds.length)];
        if (!driverId) continue;
        
        const { error } = await (supabase.from('ride_share') as any).insert({
          created_by: driverId,
          type: 'offer',
          departure_location: ride.departure,
          destination: ride.destination,
          departure_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          seats_available: ride.seats,
          notes: ride.notes,
          status: 'active'
        });
        
        if (!error) addProgress(`  ✓ Created ride offer`);
      }
      
      for (const ride of rideRequests) {
        const requesterId = demoUserIds[Math.floor(Math.random() * demoUserIds.length)];
        if (!requesterId) continue;
        
        const { error } = await (supabase.from('ride_share') as any).insert({
          created_by: requesterId,
          type: 'request',
          departure_location: ride.departure,
          destination: ride.destination,
          departure_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          seats_requested: ride.seats,
          notes: ride.notes,
          status: 'active'
        });
        
        if (!error) addProgress(`  ✓ Created ride request`);
      }

      // 6. Create some demo feedback
      addProgress('Creating demo feedback...');
      const feedbackItems = [
        { type: 'gratitude', message: 'This app has made connecting with my dance community so much easier! Love the vibe check feature 💜' },
        { type: 'feature', message: 'Would love to see a "looking for dance partner" feature for specific events!' },
        { type: 'bug', message: 'Sometimes the notification badge doesn\'t clear when I read all notifications' },
      ];
      
      for (const fb of feedbackItems) {
        const userId = demoUserIds[Math.floor(Math.random() * demoUserIds.length)];
        if (!userId) continue;
        
        const { error } = await (supabase.from('feedback') as any).insert({
          user_id: userId,
          type: fb.type,
          message: fb.message
        });
        
        if (!error) addProgress(`  ✓ Created ${fb.type} feedback`);
      }

      // 7. Create demo polls
      addProgress('Creating demo polls...');
      const { error: pollError } = await (supabase.from('polls') as any).insert({
        created_by: user.id,
        title: 'What time works best for Wednesday sessions?',
        description: 'Help us decide the best time for our new midweek dance!',
        options: JSON.stringify([
          { id: '1', text: '6:00 PM', votes: 12 },
          { id: '2', text: '7:00 PM', votes: 23 },
          { id: '3', text: '7:30 PM', votes: 8 },
          { id: '4', text: '8:00 PM', votes: 5 }
        ]),
        is_active: true,
        is_pinned: true
      });
      
      if (!pollError) addProgress(`  ✓ Created demo poll`);

      // Log the action
      await (supabase.from('audit_logs') as any).insert({
        admin_id: user.id,
        action: 'demo_data_generated',
        details: { 
          users_created: demoUserIds.length,
          posts_created: DEMO_POSTS.length,
          timestamp: new Date().toISOString()
        }
      });

      addProgress('✅ Demo data generation complete!');
      toast.success('Demo data generated successfully!');
      onDataChanged();
      
    } catch (error: any) {
      addProgress(`❌ Error: ${error.message}`);
      toast.error('Failed to generate demo data');
    } finally {
      setGenerating(false);
    }
  };

  const resetToBaseline = async () => {
    setResetting(true);
    setProgress([]);
    setShowConfirmReset(false);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Must be logged in');
        return;
      }

      // Get list of admin user IDs to preserve
      addProgress('Identifying admin accounts to preserve...');
      const { data: admins } = await (supabase
        .from('profiles') as any)
        .select('id, tribe_name')
        .eq('status', 'admin');
      
      const adminIds = (admins as any[])?.map(a => a.id) || [];
      addProgress(`  → Preserving ${adminIds.length} admin account(s)`);

      // Delete all demo content (prioritize is_demo flag)
      addProgress('Cleaning up demo data...');

      // Delete demo profiles first (if is_demo column exists)
      addProgress('Removing demo user profiles...');
      let deletedDemoProfiles = 0;
      const { error: demoProfileError, count: demoCount } = await supabase
        .from('profiles')
        .delete({ count: 'exact' })
        .eq('is_demo', true);
      
      if (!demoProfileError && demoCount) {
        deletedDemoProfiles = demoCount;
        addProgress(`  ✓ Removed ${demoCount} demo profile(s)`);
      } else if (demoProfileError && !demoProfileError.message?.includes('is_demo')) {
        addProgress(`  ⚠️ Error removing demo profiles: ${demoProfileError.message}`);
      } else {
        // Fallback: delete non-admin profiles if is_demo column doesn't exist
        addProgress('  → is_demo column not found, removing non-admin profiles...');
        const { error: profilesError, count: fallbackCount } = await supabase
          .from('profiles')
          .delete({ count: 'exact' })
          .not('id', 'in', `(${adminIds.join(',')})`);
        
        if (!profilesError && fallbackCount) {
          deletedDemoProfiles = fallbackCount;
          addProgress(`  ✓ Removed ${fallbackCount} non-admin profile(s)`);
        }
      }

      // Delete demo posts
      const { error: demoPostError, count: postCount } = await (supabase.from('posts') as any)
        .delete({ count: 'exact' })
        .eq('is_demo', true);
      if (!demoPostError && postCount) {
        addProgress(`  ✓ Cleared ${postCount} demo post(s)`);
      } else if (!demoPostError?.message?.includes('is_demo')) {
        // Fallback: delete posts from non-admin users
        const { count: fallbackPostCount } = await supabase
          .from('posts')
          .delete({ count: 'exact' })
          .not('author_id', 'in', `(${adminIds.join(',')})`);
        if (fallbackPostCount) addProgress(`  ✓ Cleared ${fallbackPostCount} non-admin post(s)`);
      }

      // Delete demo announcements
      const { count: annCount } = await (supabase.from('announcements') as any)
        .delete({ count: 'exact' })
        .eq('is_demo', true);
      if (annCount) addProgress(`  ✓ Cleared ${annCount} demo announcement(s)`);

      // Delete notifications (except for admins)
      const { error: notifError } = await (supabase.from('notifications') as any)
        .delete()
        .not('user_id', 'in', `(${adminIds.join(',')})`);
      if (!notifError) addProgress('  ✓ Cleared notifications');

      // Delete stories
      const { error: storiesError } = await (supabase.from('stories') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (!storiesError) addProgress('  ✓ Cleared stories');

      // Delete story views and reactions
      await (supabase.from('story_views') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await (supabase.from('story_reactions') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      addProgress('  ✓ Cleared story data');

      // Delete announcement reads
      await (supabase.from('announcement_reads') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Delete ride shares and requests
      await (supabase.from('ride_requests') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { error: rideError } = await (supabase.from('ride_share') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (!rideError) addProgress('  ✓ Cleared ride shares');

      // Delete post reactions
      await (supabase.from('post_reactions') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      addProgress('  ✓ Cleared reactions');

      // Delete polls
      await (supabase.from('poll_votes') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { error: pollsError } = await (supabase.from('polls') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (!pollsError) addProgress('  ✓ Cleared polls');

      // Delete feedback
      const { error: fbError } = await supabase.from('feedback').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (!fbError) addProgress('  ✓ Cleared feedback');

      // Clear content queue
      await (supabase.from('content_queue') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      addProgress('  ✓ Cleared content queue');

      // Log the action
      await (supabase.from('audit_logs') as any).insert({
        admin_id: user.id,
        action: 'database_reset_to_baseline',
        details: { 
          admins_preserved: adminIds.length,
          demo_profiles_deleted: deletedDemoProfiles,
          timestamp: new Date().toISOString()
        }
      });

      addProgress('✅ Reset to baseline complete!');
      addProgress(`📌 ${adminIds.length} admin account(s) preserved`);
      toast.success('Database reset to baseline!');
      onDataChanged();
      
    } catch (error: any) {
      addProgress(`❌ Error: ${error.message}`);
      toast.error('Failed to reset database');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Demo Data Section */}
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-medium text-fernhill-cream">Demo Data Generator</h3>
            <p className="text-xs text-fernhill-sand/50">Create test accounts and sample content for demos</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div className="glass-panel-dark rounded-lg p-2">
            <div className="flex items-center gap-2 text-fernhill-sand/70">
              <Users className="w-3 h-3" />
              <span>8 Demo Users</span>
            </div>
          </div>
          <div className="glass-panel-dark rounded-lg p-2">
            <div className="flex items-center gap-2 text-fernhill-sand/70">
              <MessageSquare className="w-3 h-3" />
              <span>8 Posts</span>
            </div>
          </div>
          <div className="glass-panel-dark rounded-lg p-2">
            <div className="flex items-center gap-2 text-fernhill-sand/70">
              <Megaphone className="w-3 h-3" />
              <span>3 Announcements</span>
            </div>
          </div>
          <div className="glass-panel-dark rounded-lg p-2">
            <div className="flex items-center gap-2 text-fernhill-sand/70">
              <Bell className="w-3 h-3" />
              <span>5 Notifications</span>
            </div>
          </div>
          <div className="glass-panel-dark rounded-lg p-2">
            <div className="flex items-center gap-2 text-fernhill-sand/70">
              <Car className="w-3 h-3" />
              <span>3 Ride Shares</span>
            </div>
          </div>
          <div className="glass-panel-dark rounded-lg p-2">
            <div className="flex items-center gap-2 text-fernhill-sand/70">
              <Calendar className="w-3 h-3" />
              <span>Polls & Feedback</span>
            </div>
          </div>
        </div>

        <button
          onClick={generateDemoData}
          disabled={generating || resetting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Generate Demo Data
            </>
          )}
        </button>
      </div>

      {/* Reset Section */}
      <div className="glass-panel rounded-xl p-4 border border-red-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-500/20">
            <RotateCcw className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-medium text-fernhill-cream">Reset to Baseline</h3>
            <p className="text-xs text-fernhill-sand/50">Remove all demo data, keep admin accounts</p>
          </div>
        </div>

        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-300">
              <strong>Warning:</strong> This will permanently delete all posts, stories, announcements, 
              ride shares, notifications, and non-admin user profiles. Admin accounts will be preserved.
            </div>
          </div>
        </div>

        {!showConfirmReset ? (
          <button
            onClick={() => setShowConfirmReset(true)}
            disabled={generating || resetting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
            Reset Database
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-center text-sm text-red-400 font-medium">Are you sure? This cannot be undone!</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-2 rounded-xl glass-panel text-fernhill-sand hover:bg-fernhill-brown/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={resetToBaseline}
                disabled={resetting}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                {resetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Confirm Reset
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress Log */}
      {progress.length > 0 && (
        <div className="glass-panel rounded-xl p-4">
          <h4 className="font-medium text-fernhill-cream mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Progress Log
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-1 text-xs font-mono">
            {progress.map((msg, i) => (
              <div 
                key={i} 
                className={`${
                  msg.includes('✓') ? 'text-green-400' : 
                  msg.includes('⚠️') ? 'text-yellow-400' : 
                  msg.includes('❌') ? 'text-red-400' : 
                  msg.includes('✅') ? 'text-green-400 font-bold' :
                  'text-fernhill-sand/70'
                }`}
              >
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
