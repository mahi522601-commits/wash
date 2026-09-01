/**
 * YouTube URL Parser & Embed Validator for Tech Wash
 * Handles standard watch URLs, youtu.be short URLs, and direct embed URLs.
 */

export const extractYouTubeVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  
  // Patterns for YouTube URLs:
  // 1. https://www.youtube.com/watch?v=VIDEO_ID
  // 2. https://youtu.be/VIDEO_ID
  // 3. https://www.youtube.com/embed/VIDEO_ID
  // 4. https://youtube.com/shorts/VIDEO_ID
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = trimmed.match(regExp);

  return (match && match[2].length === 11) ? match[2] : null;
};

export const isValidYouTubeUrl = (url) => {
  if (!url) return true; // Optional field
  return extractYouTubeVideoId(url) !== null;
};

export const getYouTubeEmbedUrl = (url, { autoplay = false, mute = false } = {}) => {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    ...(autoplay ? { autoplay: '1' } : {}),
    ...(mute ? { mute: '1' } : {}),
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
};

export const getYouTubeThumbnail = (url, quality = 'hqdefault') => {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  // Options: 'maxresdefault', 'hqdefault', 'mqdefault', 'default'
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};
