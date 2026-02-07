'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Trash2, Database, RefreshCw, CheckCircle, AlertTriangle,
  Map, Lightbulb, Bug, Download, Upload
} from 'lucide-react';
import { toast } from 'sonner';

type DemoStats = {
  roadmap_items: number;
  feature_requests: number;
  feature_requests_demo: number;
  bug_reports: number;
  bug_reports_demo: number;
};

export default function DemoDataManager() {
  const [stats, setStats] = useState<DemoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    
    const [roadmap, features, featuresDemo, bugs, bugsDemo] = await Promise.all([
      supabase.from('roadmap_items').select('id', { count: 'exact', head: true }),
      supabase.from('feature_requests').select('id', { count: 'exact', head: true }),
      supabase.from('feature_requests').select('id', { count: 'exact', head: true }).eq('is_demo', true),
      supabase.from('bug_reports').select('id', { count: 'exact', head: true }),
      supabase.from('bug_reports').select('id', { count: 'exact', head: true }).eq('is_demo', true)
    ]) as any[];

    setStats({
      roadmap_items: roadmap.count || 0,
      feature_requests: features.count || 0,
      feature_requests_demo: featuresDemo.count || 0,
      bug_reports: bugs.count || 0,
      bug_reports_demo: bugsDemo.count || 0
    });
    
    setLoading(false);
  }

  async function handleClearDemoData() {
    if (!confirm('Are you sure you want to clear all demo data? This cannot be undone.')) {
      return;
    }
    
    setClearing(true);
    
    try {
      const { data, error } = await supabase.rpc('clear_demo_data') as any;
      
      if (error) throw error;
      
      toast.success(`Cleared ${data.deleted_features} feature requests, ${data.deleted_bugs} bug reports`);
      loadStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear demo data');
    } finally {
      setClearing(false);
    }
  }

  async function handleClearAllRoadmapData() {
    if (!confirm('⚠️ WARNING: This will delete ALL roadmap items, feature requests, and bug reports. Are you absolutely sure?')) {
      return;
    }
    
    if (!confirm('This is your final warning. All data will be permanently deleted. Continue?')) {
      return;
    }
    
    setClearing(true);
    
    try {
      // Delete in order to respect foreign key constraints
      await supabase.from('feature_request_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000') as any;
      await supabase.from('feature_request_upvotes').delete().neq('id', '00000000-0000-0000-0000-000000000000') as any;
      await supabase.from('roadmap_upvotes').delete().neq('id', '00000000-0000-0000-0000-000000000000') as any;
      await supabase.from('feature_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000') as any;
      await supabase.from('bug_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000') as any;
      await supabase.from('roadmap_items').delete().neq('id', '00000000-0000-0000-0000-000000000000') as any;
      
      toast.success('All roadmap data cleared');
      loadStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear data');
    } finally {
      setClearing(false);
    }
  }

  async function handleExportData() {
    try {
      const [roadmap, features, bugs] = await Promise.all([
        supabase.from('roadmap_items').select('*'),
        supabase.from('feature_requests').select('*'),
        supabase.from('bug_reports').select('*')
      ]) as any[];

      const exportData = {
        exported_at: new Date().toISOString(),
        roadmap_items: roadmap.data || [],
        feature_requests: features.data || [],
        bug_reports: bugs.data || []
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fernhill-roadmap-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error: any) {
      toast.error('Failed to export data');
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fernhill-gold" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-fernhill-cream mb-2 flex items-center gap-3">
          <Database className="w-6 h-6 text-fernhill-gold" />
          Demo Data Manager
        </h2>
        <p className="text-fernhill-sand/70">
          Manage demo data for the roadmap and feature tracking system
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-fernhill-charcoal rounded-xl p-6 border border-fernhill-earth">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-fernhill-gold/20 rounded-lg">
              <Map className="w-5 h-5 text-fernhill-gold" />
            </div>
            <h3 className="font-semibold text-fernhill-cream">Roadmap Items</h3>
          </div>
          <p className="text-3xl font-bold text-fernhill-gold">{stats?.roadmap_items || 0}</p>
        </div>

        <div className="bg-fernhill-charcoal rounded-xl p-6 border border-fernhill-earth">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-fernhill-terracotta/20 rounded-lg">
              <Lightbulb className="w-5 h-5 text-fernhill-terracotta" />
            </div>
            <h3 className="font-semibold text-fernhill-cream">Feature Requests</h3>
          </div>
          <p className="text-3xl font-bold text-fernhill-terracotta">{stats?.feature_requests || 0}</p>
          <p className="text-sm text-fernhill-sand/50 mt-1">
            {stats?.feature_requests_demo || 0} demo entries
          </p>
        </div>

        <div className="bg-fernhill-charcoal rounded-xl p-6 border border-fernhill-earth">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-900/30 rounded-lg">
              <Bug className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="font-semibold text-fernhill-cream">Bug Reports</h3>
          </div>
          <p className="text-3xl font-bold text-red-400">{stats?.bug_reports || 0}</p>
          <p className="text-sm text-fernhill-sand/50 mt-1">
            {stats?.bug_reports_demo || 0} demo entries
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <div className="bg-fernhill-charcoal rounded-xl p-6 border border-fernhill-earth">
          <h3 className="font-semibold text-fernhill-cream mb-4">Data Management</h3>
          
          <div className="space-y-3">
            <button
              onClick={loadStats}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-fernhill-brown/50 hover:bg-fernhill-brown text-fernhill-sand rounded-xl font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Stats
            </button>

            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-fernhill-gold/20 hover:bg-fernhill-gold/30 text-fernhill-gold rounded-xl font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export All Data (JSON)
            </button>

            <button
              onClick={handleClearDemoData}
              disabled={clearing || (stats?.feature_requests_demo === 0 && stats?.bug_reports_demo === 0)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-fernhill-terracotta/20 hover:bg-fernhill-terracotta/30 text-fernhill-terracotta rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Clear Demo Data Only
              {stats && (stats.feature_requests_demo > 0 || stats.bug_reports_demo > 0) && (
                <span className="text-xs bg-fernhill-terracotta/30 px-2 py-0.5 rounded-full">
                  {(stats.feature_requests_demo || 0) + (stats.bug_reports_demo || 0)} items
                </span>
              )}
            </button>

            <button
              onClick={handleClearAllRoadmapData}
              disabled={clearing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-xl font-medium transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Clear ALL Data (Danger!)
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-fernhill-gold/10 rounded-xl p-6 border border-fernhill-gold/30">
          <h3 className="font-semibold text-fernhill-gold mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            How to Seed Demo Data
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-fernhill-sand text-sm">
            <li>First, run the <code className="bg-fernhill-brown/50 px-2 py-0.5 rounded">roadmap_migration.sql</code> in Supabase SQL Editor</li>
            <li>Then run <code className="bg-fernhill-brown/50 px-2 py-0.5 rounded">demo_data_seed.sql</code> to populate demo data</li>
            <li>Demo feature requests and bug reports are flagged with <code className="bg-fernhill-brown/50 px-2 py-0.5 rounded">is_demo = true</code></li>
            <li>Use &quot;Clear Demo Data Only&quot; to remove just the demo entries</li>
            <li>Roadmap items are not flagged as demo (they represent real planned features)</li>
          </ol>
        </div>

        {/* SQL Quick Reference */}
        <div className="bg-fernhill-charcoal/50 rounded-xl p-6 border border-fernhill-earth">
          <h3 className="font-semibold text-fernhill-cream mb-3">SQL Quick Reference</h3>
          <div className="space-y-2 font-mono text-xs">
            <div className="bg-fernhill-dark text-fernhill-moss p-3 rounded-lg overflow-x-auto">
              <p className="text-fernhill-sand/50">-- Clear demo data only</p>
              <p>SELECT clear_demo_data();</p>
            </div>
            <div className="bg-fernhill-dark text-fernhill-moss p-3 rounded-lg overflow-x-auto">
              <p className="text-fernhill-sand/50">-- Get roadmap stats</p>
              <p>SELECT get_roadmap_stats();</p>
            </div>
            <div className="bg-fernhill-dark text-fernhill-moss p-3 rounded-lg overflow-x-auto">
              <p className="text-fernhill-sand/50">-- Toggle upvote (requires auth)</p>
              <p>SELECT toggle_roadmap_upvote(&apos;item-uuid&apos;);</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
