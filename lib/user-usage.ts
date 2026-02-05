import { createClient } from '@/lib/supabase/client';

export interface UserUsageStats {
  totalPosts: number;
  totalStorageBytes: number;
  lastPostAt: string | null;
  postsThisWeek: number;
  postsThisMonth: number;
  storageFormatted: string;
  percentageOfCommunity: number;
  activityLevel: 'quiet' | 'moderate' | 'active' | 'very_active';
}

export interface CommunityAverages {
  avgPosts: number;
  avgStorage: number;
  avgPostsPerWeek: number;
  totalUsers: number;
  totalPosts: number;
  totalStorage: number;
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Determine activity level based on posting frequency
 */
export function getActivityLevel(postsThisWeek: number): 'quiet' | 'moderate' | 'active' | 'very_active' {
  if (postsThisWeek === 0) return 'quiet';
  if (postsThisWeek <= 2) return 'moderate';
  if (postsThisWeek <= 5) return 'active';
  return 'very_active';
}

/**
 * Get usage stats for a specific user
 */
export async function getUserUsageStats(userId: string): Promise<UserUsageStats | null> {
  const supabase = createClient();
  
  // Get user's profile with usage stats
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('total_posts, total_storage_bytes, last_post_at, posts_this_week, posts_this_month')
    .eq('id', userId)
    .single() as any;
  
  if (error || !profile) {
    console.error('Error fetching user usage stats:', error);
    return null;
  }
  
  // Get community totals for comparison
  const { data: communityStats } = await supabase
    .from('profiles')
    .select('total_posts, total_storage_bytes')
    .eq('status', 'active') as any;
  
  const totalCommunityPosts = communityStats?.reduce((sum: number, p: any) => sum + (p.total_posts || 0), 0) || 1;
  
  return {
    totalPosts: profile.total_posts || 0,
    totalStorageBytes: profile.total_storage_bytes || 0,
    lastPostAt: profile.last_post_at,
    postsThisWeek: profile.posts_this_week || 0,
    postsThisMonth: profile.posts_this_month || 0,
    storageFormatted: formatBytes(profile.total_storage_bytes || 0),
    percentageOfCommunity: totalCommunityPosts > 0 
      ? ((profile.total_posts || 0) / totalCommunityPosts) * 100 
      : 0,
    activityLevel: getActivityLevel(profile.posts_this_week || 0)
  };
}

/**
 * Get community-wide usage averages
 */
export async function getCommunityAverages(): Promise<CommunityAverages | null> {
  const supabase = createClient();
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('total_posts, total_storage_bytes, posts_this_week')
    .in('status', ['active', 'facilitator', 'admin']) as any;
  
  if (error || !profiles || profiles.length === 0) {
    console.error('Error fetching community averages:', error);
    return null;
  }
  
  const totalUsers = profiles.length;
  const totalPosts = profiles.reduce((sum: number, p: any) => sum + (p.total_posts || 0), 0);
  const totalStorage = profiles.reduce((sum: number, p: any) => sum + (p.total_storage_bytes || 0), 0);
  const totalWeeklyPosts = profiles.reduce((sum: number, p: any) => sum + (p.posts_this_week || 0), 0);
  
  return {
    avgPosts: Math.round(totalPosts / totalUsers),
    avgStorage: Math.round(totalStorage / totalUsers),
    avgPostsPerWeek: Math.round(totalWeeklyPosts / totalUsers * 10) / 10, // One decimal
    totalUsers,
    totalPosts,
    totalStorage
  };
}

/**
 * Update a user's usage statistics
 * Call this after creating posts or uploading media
 */
export async function updateUserUsageStats(userId: string): Promise<void> {
  const supabase = createClient();
  
  try {
    // Call the database function to recalculate stats
    const { error } = await (supabase.rpc as any)('update_user_usage_stats', {
      user_uuid: userId
    });
    
    if (error) {
      console.error('Error updating user usage stats:', error);
    }
  } catch (err) {
    console.error('Exception updating user usage stats:', err);
  }
}

/**
 * Get activity history for a user (last 30 days)
 */
export async function getUserActivityHistory(userId: string, days: number = 30) {
  const supabase = createClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const { data, error } = await supabase
    .from('user_activity_log')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });
  
  if (error) {
    console.error('Error fetching activity history:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get top contributors (most active users)
 */
export async function getTopContributors(limit: number = 10) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, tribe_name, avatar_url, total_posts, total_storage_bytes, posts_this_week')
    .in('status', ['active', 'facilitator', 'admin'])
    .order('total_posts', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching top contributors:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get quieter voices (users with low activity who could be amplified)
 */
export async function getQuieterVoices(limit: number = 10) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, tribe_name, avatar_url, total_posts, last_post_at')
    .in('status', ['active', 'facilitator'])
    .order('total_posts', { ascending: true })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching quieter voices:', error);
    return [];
  }
  
  return data || [];
}
