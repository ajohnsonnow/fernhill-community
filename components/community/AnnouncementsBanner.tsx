'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Megaphone, Pin, AlertTriangle, Calendar, Shield, X, Plus } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  is_pinned: boolean;
  image_url: string | null;
  created_at: string;
  author: {
    display_name: string;
  };
}

export default function AnnouncementsBanner() {
  const supabase = createClient();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadAnnouncements();
    checkAdminStatus();
  }, []);

  async function checkAdminStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single() as any;

    setIsAdmin(data?.status === 'admin');
  }

  async function loadAnnouncements() {
    const { data, error } = await supabase
      .from('announcements' as any)
      .select(`
        *,
        profiles!announcements_author_id_fkey (display_name)
      `)
      .eq('status', 'published')
      .lte('publish_at', new Date().toISOString())
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) setAnnouncements((data as any) || []);
  }

  const priorityColors = {
    low: 'bg-fernhill-moss/30 text-green-400',
    normal: 'bg-fernhill-brown/50 text-fernhill-sand',
    high: 'bg-fernhill-terracotta/30 text-fernhill-terracotta',
    urgent: 'bg-red-500/20 text-red-400 animate-pulse'
  };

  const categoryIcons = {
    logistics: Calendar,
    event: Megaphone,
    policy: Shield,
    safety: AlertTriangle,
    community: Megaphone,
    urgent: AlertTriangle
  };

  if (announcements.length === 0) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-fernhill-gold/20 to-fernhill-terracotta/20 border-b border-fernhill-earth">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-start gap-3">
            <Megaphone className="w-5 h-5 text-fernhill-gold flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-fernhill-cream">Community Announcements</h3>
                {announcements[0].is_pinned && (
                  <Pin className="w-4 h-4 text-fernhill-gold" />
                )}
              </div>
              <button
                onClick={() => setSelectedAnnouncement(announcements[0])}
                className="text-left hover:underline text-fernhill-sand"
              >
                <p className="font-medium line-clamp-1">{announcements[0].title}</p>
                <p className="text-sm text-fernhill-sand/70 line-clamp-2">
                  {announcements[0].content}
                </p>
              </button>
              {announcements.length > 1 && (
                <button
                  onClick={() => setSelectedAnnouncement(announcements[0])}
                  className="text-sm text-fernhill-gold hover:underline mt-1"
                >
                  +{announcements.length - 1} more announcement{announcements.length > 2 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAnnouncement(null)}>
          <div className="bg-fernhill-charcoal rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-fernhill-charcoal border-b border-fernhill-earth p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-fernhill-gold" />
                <h2 className="text-xl font-bold text-fernhill-cream">Announcements</h2>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)} className="text-fernhill-sand/70 hover:text-fernhill-cream" aria-label="Close announcements"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-6 space-y-6">
              {announcements.map(announcement => {
                const Icon = categoryIcons[announcement.category as keyof typeof categoryIcons] || Megaphone;
                return (
                  <div key={announcement.id} className="border-b border-fernhill-earth pb-6 last:border-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-fernhill-gold/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-fernhill-gold" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-fernhill-cream">{announcement.title}</h3>
                          {announcement.is_pinned && (
                            <Pin className="w-4 h-4 text-fernhill-gold" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-fernhill-sand/70 mb-2">
                          <span>{announcement.author?.display_name || 'Admin'}</span>
                          <span>•</span>
                          <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${priorityColors[announcement.priority as keyof typeof priorityColors]}`}>
                            {announcement.priority}
                          </span>
                        </div>
                        <p className="text-fernhill-sand whitespace-pre-wrap">{announcement.content}</p>
                        {announcement.image_url && (
                          <img src={announcement.image_url} alt="" className="mt-3 rounded-lg w-full" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
