'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ExternalLink, Loader2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
  favicon_url: string | null;
}

interface LinkPreviewProps {
  url: string;
  compact?: boolean;
}

// URL regex pattern
const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  return matches ? [...new Set(matches)] : [];
}

export function LinkPreview({ url, compact = false }: LinkPreviewProps) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchPreview();
  }, [url]);

  const fetchPreview = async () => {
    setLoading(true);
    setError(false);

    try {
      // First check cache
      const { data: cached } = await (supabase
        .from('link_previews') as any)
        .select('*')
        .eq('url', url)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cached) {
        setPreview(cached);
        setLoading(false);
        return;
      }

      // Fetch preview from our API
      const response = await fetch('/api/link-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error('Failed to fetch preview');

      const data = await response.json();
      setPreview(data);

    } catch (err) {
      console.error('Link preview error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-white/5">
        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
        <span className="text-sm text-gray-500 truncate">{url}</span>
      </div>
    );
  }

  if (error || !preview) {
    // Simple fallback link
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-white/5 hover:bg-gray-800 transition-colors"
      >
        <LinkIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span className="text-sm text-emerald-400 truncate">{url}</span>
        <ExternalLink className="w-3 h-3 text-gray-500 flex-shrink-0" />
      </a>
    );
  }

  // Compact preview (for message bubbles)
  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-2 rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-colors"
      >
        {preview.image_url && (
          <div className="h-32 bg-gray-800">
            <img
              src={preview.image_url}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="p-2 bg-gray-800/80">
          {preview.site_name && (
            <div className="text-xs text-emerald-400 mb-0.5">{preview.site_name}</div>
          )}
          {preview.title && (
            <div className="text-sm font-medium text-white line-clamp-1">{preview.title}</div>
          )}
        </div>
      </a>
    );
  }

  // Full preview (for posts)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-3 rounded-xl overflow-hidden border border-white/10 hover:border-emerald-500/30 transition-all group"
    >
      {preview.image_url && (
        <div className="aspect-video bg-gray-800 relative overflow-hidden">
          <img
            src={preview.image_url}
            alt={preview.title || ''}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-4 bg-gray-800/60">
        <div className="flex items-center gap-2 mb-2">
          {preview.favicon_url && (
            <img
              src={preview.favicon_url}
              alt=""
              className="w-4 h-4 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          {preview.site_name && (
            <span className="text-xs text-emerald-400 uppercase tracking-wide">
              {preview.site_name}
            </span>
          )}
        </div>
        
        {preview.title && (
          <h4 className="font-medium text-white line-clamp-2 mb-1 group-hover:text-emerald-400 transition-colors">
            {preview.title}
          </h4>
        )}
        
        {preview.description && (
          <p className="text-sm text-gray-400 line-clamp-2">
            {preview.description}
          </p>
        )}
        
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
          <ExternalLink className="w-3 h-3" />
          <span className="truncate">{new URL(url).hostname}</span>
        </div>
      </div>
    </a>
  );
}

// Auto-detect and render link previews in text
interface AutoLinkPreviewProps {
  text: string;
  compact?: boolean;
  maxPreviews?: number;
}

export function AutoLinkPreview({ text, compact = false, maxPreviews = 1 }: AutoLinkPreviewProps) {
  const urls = extractUrls(text);
  const previewUrls = urls.slice(0, maxPreviews);

  if (previewUrls.length === 0) return null;

  return (
    <div className="space-y-2">
      {previewUrls.map((url) => (
        <LinkPreview key={url} url={url} compact={compact} />
      ))}
    </div>
  );
}

export default LinkPreview;
