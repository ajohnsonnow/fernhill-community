'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Users,
  Plus,
  X,
  Send,
  Settings,
  Crown,
  Shield,
  User,
  Loader2,
  ArrowLeft,
  MoreVertical,
  UserPlus,
  Bell,
  BellOff,
  LogOut,
  Edit,
  Trash2,
  Check,
  Search
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GroupConversation {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  is_encrypted: boolean;
  max_members: number;
  created_at: string;
  member_count?: number;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

interface GroupMember {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  nickname: string | null;
  muted_until: string | null;
  joined_at: string;
  profile?: {
    tribe_name: string;
    avatar_url: string | null;
  };
}

interface GroupMessage {
  id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'voice' | 'system';
  media_url: string | null;
  reply_to_id: string | null;
  is_edited: boolean;
  created_at: string;
  sender?: {
    tribe_name: string;
    avatar_url: string | null;
  };
}

interface GroupDMsProps {
  onBack?: () => void;
}

export function GroupDMs({ onBack }: GroupDMsProps) {
  const [groups, setGroups] = useState<GroupConversation[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupConversation | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<'admin' | 'moderator' | 'member' | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchGroups();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedGroup) {
      fetchMessages(selectedGroup.id);
      fetchMembers(selectedGroup.id);

      // Subscribe to new messages
      const channel = supabase
        .channel(`group-${selectedGroup.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${selectedGroup.id}`,
        }, (payload) => {
          fetchMessages(selectedGroup.id);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get groups where user is a member
    const { data: memberOf } = await (supabase
      .from('group_members') as any)
      .select('group_id')
      .eq('user_id', user.id);

    if (!memberOf || memberOf.length === 0) {
      setLoading(false);
      return;
    }

    const groupIds = memberOf.map((m: { group_id: string }) => m.group_id);

    const { data: groupsData, error } = await (supabase
      .from('group_conversations') as any)
      .select('*')
      .in('id', groupIds)
      .order('updated_at', { ascending: false });

    if (!error && groupsData) {
      // Get member counts and last messages for each group
      const enrichedGroups = await Promise.all(
        groupsData.map(async (group: GroupConversation) => {
          const { count } = await (supabase
            .from('group_members') as any)
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          const { data: lastMsg } = await (supabase
            .from('group_messages') as any)
            .select('content, created_at')
            .eq('group_id', group.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...group,
            member_count: count || 0,
            last_message: lastMsg?.content,
            last_message_at: lastMsg?.created_at,
          };
        })
      );

      setGroups(enrichedGroups);
    }
    setLoading(false);
  };

  const fetchMessages = async (groupId: string) => {
    const { data, error } = await (supabase
      .from('group_messages') as any)
      .select(`
        *,
        sender:profiles!group_messages_sender_id_fkey(tribe_name, avatar_url)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!error && data) {
      setMessages(data);
    }
  };

  const fetchMembers = async (groupId: string) => {
    const { data, error } = await (supabase
      .from('group_members') as any)
      .select(`
        *,
        profile:profiles!group_members_user_id_fkey(tribe_name, avatar_url)
      `)
      .eq('group_id', groupId)
      .order('role', { ascending: true });

    if (!error && data) {
      setMembers(data);
      // Find my role
      const me = data.find((m: GroupMember) => m.user_id === currentUserId);
      setMyRole(me?.role || null);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup || !currentUserId || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await (supabase
      .from('group_messages') as any)
      .insert({
        group_id: selectedGroup.id,
        sender_id: currentUserId,
        content,
        message_type: 'text',
      });

    if (error) {
      toast.error('Failed to send message');
      setNewMessage(content);
    }

    setSending(false);
  };

  const leaveGroup = async () => {
    if (!selectedGroup || !currentUserId) return;
    if (!confirm('Leave this group? You\'ll need to be re-invited to rejoin.')) return;

    const { error } = await (supabase
      .from('group_members') as any)
      .delete()
      .eq('group_id', selectedGroup.id)
      .eq('user_id', currentUserId);

    if (!error) {
      toast.success('Left group');
      setSelectedGroup(null);
      fetchGroups();
    }
  };

  // Group List View
  if (!selectedGroup) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg mr-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Circles
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-emerald-400"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center p-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No circles yet</p>
              <p className="text-sm mt-1">Create one to start group conversations!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white text-sm"
              >
                Create Circle
              </button>
            </div>
          ) : (
            groups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium">
                  {group.avatar_url ? (
                    <img src={group.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Users className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">{group.name}</div>
                  <div className="text-sm text-gray-400 truncate">
                    {group.last_message || `${group.member_count} members`}
                  </div>
                </div>
                {group.last_message_at && (
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(group.last_message_at), { addSuffix: false })}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Create Group Modal */}
        {showCreateModal && (
          <CreateGroupModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false);
              fetchGroups();
            }}
          />
        )}
      </div>
    );
  }

  // Chat View
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <button
          onClick={() => setSelectedGroup(null)}
          className="p-2 hover:bg-white/10 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          {selectedGroup.avatar_url ? (
            <img src={selectedGroup.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <Users className="w-5 h-5 text-white" />
          )}
        </div>

        <div className="flex-1">
          <div className="font-medium">{selectedGroup.name}</div>
          <div className="text-xs text-gray-400">{members.length} members</div>
        </div>

        <button
          onClick={() => setShowMembersPanel(!showMembersPanel)}
          className="p-2 hover:bg-white/10 rounded-lg"
        >
          <Users className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender_id === currentUserId ? 'flex-row-reverse' : ''}`}
              >
                {msg.sender_id !== currentUserId && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex-shrink-0 flex items-center justify-center text-white text-xs">
                    {msg.sender?.avatar_url ? (
                      <img src={msg.sender.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      msg.sender?.tribe_name?.[0] || '?'
                    )}
                  </div>
                )}
                
                <div className={`max-w-[70%] ${msg.sender_id === currentUserId ? 'text-right' : ''}`}>
                  {msg.sender_id !== currentUserId && (
                    <div className="text-xs text-gray-400 mb-1">{msg.sender?.tribe_name}</div>
                  )}
                  <div
                    className={`inline-block px-4 py-2 rounded-2xl ${
                      msg.sender_id === currentUserId
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-800 text-white'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Message the circle..."
                className="flex-1 bg-gray-800 rounded-full px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="p-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-full text-white"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Members Panel */}
        {showMembersPanel && (
          <div className="w-64 border-l border-white/10 overflow-y-auto">
            <div className="p-3 border-b border-white/10 flex justify-between items-center">
              <span className="font-medium text-sm">Members</span>
              {myRole === 'admin' && (
                <button
                  onClick={() => setShowAddMembers(true)}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                </button>
              )}
            </div>
            {members.map((member) => (
              <div key={member.id} className="p-3 flex items-center gap-2 hover:bg-white/5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs">
                  {member.profile?.avatar_url ? (
                    <img src={member.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    member.profile?.tribe_name?.[0] || '?'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{member.profile?.tribe_name}</div>
                  {member.role !== 'member' && (
                    <div className="text-xs text-emerald-400 capitalize">{member.role}</div>
                  )}
                </div>
                {member.role === 'admin' && <Crown className="w-4 h-4 text-yellow-500" />}
              </div>
            ))}
            
            {/* Leave Group */}
            <div className="p-3 border-t border-white/10">
              <button
                onClick={leaveGroup}
                className="w-full flex items-center gap-2 text-red-400 hover:bg-red-500/10 p-2 rounded"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Leave Circle</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Create Group Modal
function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; tribe_name: string; avatar_url: string | null }[]>([]);
  const [creating, setCreating] = useState(false);
  const supabase = createClient();

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    const { data } = await supabase
      .from('profiles')
      .select('id, tribe_name, avatar_url')
      .neq('id', user?.id || '')
      .ilike('tribe_name', `%${query}%`)
      .in('status', ['active', 'facilitator', 'admin'])
      .limit(10);

    setSearchResults(data || []);
  };

  const createGroup = async () => {
    if (!name.trim() || creating) return;

    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create the group
    const { data: group, error: groupError } = await (supabase
      .from('group_conversations') as any)
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (groupError || !group) {
      toast.error('Failed to create circle');
      setCreating(false);
      return;
    }

    // Add creator as admin
    await (supabase
      .from('group_members') as any)
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'admin',
      });

    // Add selected members
    if (selectedMembers.length > 0) {
      await (supabase
        .from('group_members') as any)
        .insert(
          selectedMembers.map((memberId) => ({
            group_id: group.id,
            user_id: memberId,
            role: 'member',
          }))
        );
    }

    toast.success('Circle created!');
    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold">Create Circle</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Circle Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sunday Dancers"
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this circle about?"
              rows={2}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Add Members</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                placeholder="Search members..."
                className="w-full bg-gray-800 rounded-lg pl-10 pr-3 py-2 text-white"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      if (!selectedMembers.includes(user.id)) {
                        setSelectedMembers([...selectedMembers, user.id]);
                      }
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-white/10 rounded"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-xs text-white">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.tribe_name?.[0]
                      )}
                    </div>
                    <span className="text-sm">{user.tribe_name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Members */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedMembers.map((id) => {
                  const user = searchResults.find((u) => u.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs"
                    >
                      {user?.tribe_name || 'Member'}
                      <button onClick={() => setSelectedMembers(selectedMembers.filter((m) => m !== id))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-white/20 rounded-lg hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={createGroup}
            disabled={!name.trim() || creating}
            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-lg font-medium"
          >
            {creating ? 'Creating...' : 'Create Circle'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroupDMs;
