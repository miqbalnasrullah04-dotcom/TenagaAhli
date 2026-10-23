/**
 * Utility for resolving media URLs consistently across the frontend.
 */

const FALLBACK_COVERS = [
  'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
];

const FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
];

export function getMediaUrl(path, fallback = '') {
  if (!path) return fallback;
  if (typeof path !== 'string') return fallback;
  
  // Clean backslashes if any
  let normalized = path.replace(/\\/g, '/');

  const baseUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '');

  // Fix localhost without port in dev/local environment
  if (normalized.startsWith('http://localhost/storage/')) {
    return normalized.replace('http://localhost/storage/', `${baseUrl || 'https://tenagaahli.com'}/storage/`);
  }

  if (normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('blob:') || normalized.startsWith('data:')) {
    return normalized;
  }
  
  // Remove leading slashes
  normalized = normalized.replace(/^\/+/, '');
  
  // If already starts with storage/, don't double it
  if (normalized.startsWith('storage/')) {
    return `${baseUrl}/${normalized}`;
  }

  return `${baseUrl}/storage/${normalized}`;
}

export function getDefaultCover(id = 0) {
  const num = typeof id === 'number' ? id : (String(id).charCodeAt(0) || 0);
  return FALLBACK_COVERS[Math.abs(num) % FALLBACK_COVERS.length];
}

export function getDefaultPhoto(id = 0) {
  const num = typeof id === 'number' ? id : (String(id).charCodeAt(0) || 0);
  return FALLBACK_PHOTOS[Math.abs(num) % FALLBACK_PHOTOS.length];
}

/**
 * Safely parse a video URL (YouTube, Vimeo, Google Drive, direct video, or web link)
 * and return embed information without ever throwing errors.
 */
export function getVideoEmbedInfo(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const url = rawUrl.trim();
  if (!url) return null;

  try {
    // 1. YouTube (standard, short, shorts, embed)
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      const vid = ytMatch[1];
      return {
        type: 'youtube',
        platform: 'YouTube',
        embedUrl: `https://www.youtube-nocookie.com/embed/${vid}?rel=0`,
        videoId: vid,
        originalUrl: url,
        thumbnail: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
      };
    }

    // 2. Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+))/i);
    if (vimeoMatch && vimeoMatch[3]) {
      const vid = vimeoMatch[3];
      return {
        type: 'vimeo',
        platform: 'Vimeo',
        embedUrl: `https://player.vimeo.com/video/${vid}`,
        videoId: vid,
        originalUrl: url,
      };
    }

    // 3. Google Drive Video
    const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (gdriveMatch && gdriveMatch[1]) {
      const fileId = gdriveMatch[1];
      return {
        type: 'gdrive',
        platform: 'Google Drive',
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        videoId: fileId,
        originalUrl: url,
      };
    }

    // 4. Direct video file (.mp4, .webm, .ogg)
    if (/\.(mp4|webm|ogg)($|\?)/i.test(url)) {
      return {
        type: 'direct',
        platform: 'Video MP4',
        embedUrl: url,
        originalUrl: url,
      };
    }

    // 5. Valid HTTP/HTTPS generic link fallback
    if (/^https?:\/\//i.test(url)) {
      return {
        type: 'link',
        platform: 'Tautan Eksternal',
        embedUrl: null,
        originalUrl: url,
      };
    }

    return null;
  } catch (err) {
    console.error('Error parsing video URL:', err);
    return null;
  }
}

