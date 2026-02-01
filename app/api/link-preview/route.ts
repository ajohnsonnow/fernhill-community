import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Simple HTML parser for Open Graph meta tags
function parseMetaTags(html: string, url: string): {
  title: string | null;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
  favicon_url: string | null;
} {
  const getMetaContent = (property: string): string | null => {
    // Try og: prefix first
    const ogMatch = html.match(new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']*)["']`, 'i'))
      || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${property}["']`, 'i'));
    if (ogMatch) return ogMatch[1];

    // Try twitter: prefix
    const twitterMatch = html.match(new RegExp(`<meta[^>]*name=["']twitter:${property}["'][^>]*content=["']([^"']*)["']`, 'i'))
      || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']twitter:${property}["']`, 'i'));
    if (twitterMatch) return twitterMatch[1];

    // Try standard meta name
    const nameMatch = html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'))
      || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, 'i'));
    if (nameMatch) return nameMatch[1];

    return null;
  };

  // Get title from og:title, then <title>
  let title = getMetaContent('title');
  if (!title) {
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    title = titleMatch ? titleMatch[1].trim() : null;
  }

  // Get description
  const description = getMetaContent('description');

  // Get image
  let image_url = getMetaContent('image');
  if (image_url && !image_url.startsWith('http')) {
    // Make relative URLs absolute
    const urlObj = new URL(url);
    image_url = new URL(image_url, urlObj.origin).toString();
  }

  // Get site name
  const site_name = getMetaContent('site_name');

  // Get favicon
  let favicon_url: string | null = null;
  const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i)
    || html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
  if (faviconMatch) {
    favicon_url = faviconMatch[1];
    if (!favicon_url.startsWith('http')) {
      const urlObj = new URL(url);
      favicon_url = new URL(favicon_url, urlObj.origin).toString();
    }
  } else {
    // Default to /favicon.ico
    const urlObj = new URL(url);
    favicon_url = `${urlObj.origin}/favicon.ico`;
  }

  return { title, description, image_url, site_name, favicon_url };
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const supabase = await createClient();

    // Check cache first
    const { data: cached } = await (supabase
      .from('link_previews') as any)
      .select('*')
      .eq('url', url)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch the URL
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FernhillBot/1.0)',
          'Accept': 'text/html',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        // Not HTML, return basic info
        return NextResponse.json({
          url,
          title: new URL(url).hostname,
          description: null,
          image_url: null,
          site_name: new URL(url).hostname,
          favicon_url: null,
        });
      }

      const html = await response.text();
      const preview = parseMetaTags(html, url);

      // Cache the result (expires in 7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await (supabase
        .from('link_previews') as any)
        .upsert({
          url,
          ...preview,
          expires_at: expiresAt.toISOString(),
        });

      return NextResponse.json({
        url,
        ...preview,
      });

    } catch (fetchError) {
      clearTimeout(timeout);
      console.error('Fetch error:', fetchError);
      
      // Return basic info on error
      return NextResponse.json({
        url,
        title: new URL(url).hostname,
        description: null,
        image_url: null,
        site_name: new URL(url).hostname,
        favicon_url: null,
      });
    }

  } catch (error) {
    console.error('Link preview error:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
