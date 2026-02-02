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
    low: 'bg-blue-100 text-blue-700',
    normal: 'bg-gray-100 text-gray-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700 animate-pulse'
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
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-purple-200 dark:border-purple-800">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-start gap-3">
            <Megaphone className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Community Announcements</h3>
                {announcements[0].is_pinned && (
                  <Pin className="w-4 h-4 text-purple-600" />
                )}
              </div>
              <button
                onClick={() => setSelectedAnnouncement(announcements[0])}
                className="text-left hover:underline text-gray-700 dark:text-gray-300"
              >
                <p className="font-medium line-clamp-1">{announcements[0].title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {announcements[0].content}
                </p>
              </button>
              {announcements.length > 1 && (
                <button
                  onClick={() => setSelectedAnnouncement(announcements[0])}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline mt-1"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-bold">Announcements</h2>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)}><X className="w-6 h-6" /></button>
            </div>

            <div className="p-6 space-y-6">
              {announcements.map(announcement => {
                const Icon = categoryIcons[announcement.category as keyof typeof categoryIcons] || Megaphone;
                return (
                  <div key={announcement.id} className="border-b pb-6 last:border-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{announcement.title}</h3>
                          {announcement.is_pinned && (
                            <Pin className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span>{announcement.author?.display_name || 'Admin'}</span>
                          <span>•</span>
                          <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${priorityColors[announcement.priority as keyof typeof priorityColors]}`}>
                            {announcement.priority}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{announcement.content}</p>
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
