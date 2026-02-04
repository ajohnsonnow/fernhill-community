// Roadmap & Feature Tracking System
// Utility functions for managing community roadmap and feature requests

import { createClient } from '@/lib/supabase/client';

// Types
export type RoadmapStatus = 'planned' | 'in_progress' | 'completed' | 'archived';
export type FeatureStatus = 'submitted' | 'under_review' | 'accepted' | 'in_progress' | 'completed' | 'declined' | 'duplicate';
export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BugStatus = 'reported' | 'confirmed' | 'in_progress' | 'fixed' | 'wont_fix' | 'cannot_reproduce';
export type FeatureCategory = 'social' | 'events' | 'messaging' | 'community' | 'admin' | 'mobile' | 'accessibility' | 'performance' | 'security' | 'other';

export interface RoadmapItem {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string | null;
  category: FeatureCategory;
  status: RoadmapStatus;
  priority: number;
  target_quarter: string | null;
  release_version: string | null;
  completed_at: string | null;
  upvotes: number;
  is_featured: boolean;
  emoji: string;
  related_feature_request_id: string | null;
}

export interface FeatureRequest {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  category: FeatureCategory;
  status: FeatureStatus;
  submitted_by: string;
  upvotes: number;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  roadmap_item_id: string | null;
  is_demo: boolean;
}

export interface BugReport {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  steps_to_reproduce: string | null;
  expected_behavior: string | null;
  actual_behavior: string | null;
  severity: BugSeverity;
  status: BugStatus;
  reported_by: string;
  browser_info: Record<string, unknown> | null;
  console_logs: string | null;
  screenshot_url: string | null;
  affected_page: string | null;
  admin_notes: string | null;
  assigned_to: string | null;
  fixed_in_version: string | null;
  fixed_at: string | null;
  is_demo: boolean;
}

export interface RoadmapStats {
  planned: number;
  in_progress: number;
  completed: number;
  total_feature_requests: number;
  pending_requests: number;
  open_bugs: number;
  fixed_bugs: number;
}

// Status display configurations
export const ROADMAP_STATUS_CONFIG: Record<RoadmapStatus, { label: string; color: string; bgColor: string }> = {
  planned: { label: 'Planned', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  in_progress: { label: 'In Progress', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  completed: { label: 'Completed', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  archived: { label: 'Archived', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-700' }
};

export const FEATURE_STATUS_CONFIG: Record<FeatureStatus, { label: string; color: string; bgColor: string }> = {
  submitted: { label: 'Submitted', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  under_review: { label: 'Under Review', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  accepted: { label: 'Accepted', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  in_progress: { label: 'In Progress', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  completed: { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  declined: { label: 'Declined', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  duplicate: { label: 'Duplicate', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-700' }
};

export const BUG_SEVERITY_CONFIG: Record<BugSeverity, { label: string; color: string; bgColor: string; emoji: string }> = {
  low: { label: 'Low', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700', emoji: '🟢' },
  medium: { label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', emoji: '🟡' },
  high: { label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', emoji: '🟠' },
  critical: { label: 'Critical', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', emoji: '🔴' }
};

export const BUG_STATUS_CONFIG: Record<BugStatus, { label: string; color: string; bgColor: string }> = {
  reported: { label: 'Reported', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  confirmed: { label: 'Confirmed', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  in_progress: { label: 'In Progress', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  fixed: { label: 'Fixed', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  wont_fix: { label: "Won't Fix", color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  cannot_reproduce: { label: 'Cannot Reproduce', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-700' }
};

export const CATEGORY_CONFIG: Record<FeatureCategory, { label: string; emoji: string; description: string }> = {
  social: { label: 'Social', emoji: '👥', description: 'Posts, reactions, profiles, and social features' },
  events: { label: 'Events', emoji: '📅', description: 'Calendar, RSVPs, and event management' },
  messaging: { label: 'Messaging', emoji: '💬', description: 'DMs, group chats, and communication' },
  community: { label: 'Community', emoji: '🏘️', description: 'Community resources and collaboration' },
  admin: { label: 'Admin', emoji: '⚙️', description: 'Admin tools and moderation' },
  mobile: { label: 'Mobile', emoji: '📱', description: 'Mobile app and PWA features' },
  accessibility: { label: 'Accessibility', emoji: '♿', description: 'Accessibility and usability improvements' },
  performance: { label: 'Performance', emoji: '⚡', description: 'Speed, optimization, and reliability' },
  security: { label: 'Security', emoji: '🔒', description: 'Security and privacy features' },
  other: { label: 'Other', emoji: '✨', description: 'Other features and improvements' }
};

// API Functions
export async function getRoadmapStats(): Promise<RoadmapStats | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_roadmap_stats') as any;
  if (error) {
    console.error('Error fetching roadmap stats:', error);
    return null;
  }
  return data;
}

export async function toggleRoadmapUpvote(itemId: string): Promise<{ action: 'added' | 'removed'; upvotes: number } | null> {
  const supabase = createClient();
  const { data, error } = await (supabase.rpc as any)('toggle_roadmap_upvote', { item_id: itemId });
  if (error) {
    console.error('Error toggling roadmap upvote:', error);
    return null;
  }
  return data;
}

export async function toggleFeatureRequestUpvote(requestId: string): Promise<{ action: 'added' | 'removed'; upvotes: number } | null> {
  const supabase = createClient();
  const { data, error } = await (supabase.rpc as any)('toggle_feature_request_upvote', { request_id: requestId });
  if (error) {
    console.error('Error toggling feature request upvote:', error);
    return null;
  }
  return data;
}

export async function clearDemoData(): Promise<{ deleted_features: number; deleted_bugs: number; deleted_roadmap: number } | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('clear_demo_data') as any;
  if (error) {
    console.error('Error clearing demo data:', error);
    return null;
  }
  return data;
}

// Admin Functions
export async function updateFeatureRequestStatus(
  requestId: string, 
  status: FeatureStatus, 
  adminNotes?: string
): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const updateData: any = {
    status,
    reviewed_by: user?.id,
    reviewed_at: new Date().toISOString()
  };
  
  if (adminNotes !== undefined) {
    updateData.admin_notes = adminNotes;
  }
  
  const { error } = await (supabase
    .from('feature_requests') as any)
    .update(updateData)
    .eq('id', requestId);
    
  return !error;
}

export async function updateBugReportStatus(
  bugId: string,
  status: BugStatus,
  adminNotes?: string,
  fixedInVersion?: string
): Promise<boolean> {
  const supabase = createClient();
  
  const updateData: any = { status };
  
  if (adminNotes !== undefined) {
    updateData.admin_notes = adminNotes;
  }
  
  if (status === 'fixed' && fixedInVersion) {
    updateData.fixed_in_version = fixedInVersion;
    updateData.fixed_at = new Date().toISOString();
  }
  
  const { error } = await (supabase
    .from('bug_reports') as any)
    .update(updateData)
    .eq('id', bugId);
    
  return !error;
}

export async function createRoadmapItem(item: Partial<RoadmapItem>): Promise<RoadmapItem | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await (supabase
    .from('roadmap_items') as any)
    .insert({
      ...item,
      created_by: user?.id
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating roadmap item:', error);
    return null;
  }
  
  return data;
}

export async function updateRoadmapItem(itemId: string, updates: Partial<RoadmapItem>): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await (supabase
    .from('roadmap_items') as any)
    .update(updates)
    .eq('id', itemId);
    
  return !error;
}

export async function promoteFeatureToRoadmap(
  featureRequestId: string,
  roadmapData: Partial<RoadmapItem>
): Promise<RoadmapItem | null> {
  const supabase = createClient();
  
  // Create roadmap item linked to feature request
  const roadmapItem = await createRoadmapItem({
    ...roadmapData,
    related_feature_request_id: featureRequestId
  });
  
  if (roadmapItem) {
    // Update feature request with roadmap link
    await (supabase
      .from('feature_requests') as any)
      .update({ 
        roadmap_item_id: roadmapItem.id,
        status: 'accepted'
      })
      .eq('id', featureRequestId);
  }
  
  return roadmapItem;
}

// Utility: Format date for display
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Utility: Get quarter string
export function getCurrentQuarter(): string {
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${quarter} ${now.getFullYear()}`;
}

export function getNextQuarter(): string {
  const now = new Date();
  let quarter = Math.ceil((now.getMonth() + 1) / 3) + 1;
  let year = now.getFullYear();
  
  if (quarter > 4) {
    quarter = 1;
    year += 1;
  }
  
  return `Q${quarter} ${year}`;
}
