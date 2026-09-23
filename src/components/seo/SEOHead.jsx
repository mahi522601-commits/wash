import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BASE_URL } from '../../data/seoData';

/**
 * SEOHead - Zero-dependency Head manager for Titles, Meta Tags, Open Graph,
 * Canonical URLs, and JSON-LD Structured Data in React / Vite SPAs.
 */
export const SEOHead = ({
  title,
  description,
  canonicalUrl,
  keywords,
  ogType = 'website',
  ogImage = `${BASE_URL}/techwashlogo.webp`,
  structuredData,
  noindex = false,
}) => {
  const location = useLocation();

  const finalTitle = title 
    ? `${title}` 
    : 'Tech Wash Laundry Services — Next-Gen Premium Garment Care Hyderabad';

  const finalDesc = description || 
    'Tech Wash provides premium laundry, eco-friendly hydrocarbon dry cleaning, steam ironing, shoe laundry, and saree rolling across Hyderabad with doorstep pickup.';

  const finalCanonical = canonicalUrl || `${BASE_URL}${location.pathname === '/' ? '' : location.pathname}`;

  useEffect(() => {
    // 1. Set Title
    document.title = finalTitle;

    // Helper to set or update meta tags
    const setMetaTag = (attrName, attrValue, content) => {
      if (!content) return;
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to set or update link tags (e.g. canonical)
    const setLinkTag = (rel, href) => {
      if (!href) return;
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Standard Meta
    setMetaTag('name', 'description', finalDesc);
    setMetaTag('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }
    setMetaTag('name', 'author', 'Tech Wash Laundry Services');

    // 3. Canonical Link
    setLinkTag('canonical', finalCanonical);

    // 4. Open Graph Tags
    setMetaTag('property', 'og:title', finalTitle);
    setMetaTag('property', 'og:description', finalDesc);
    setMetaTag('property', 'og:url', finalCanonical);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:site_name', 'Tech Wash Laundry Services');
    setMetaTag('property', 'og:locale', 'en_IN');

    // 5. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', finalTitle);
    setMetaTag('name', 'twitter:description', finalDesc);
    setMetaTag('name', 'twitter:image', ogImage);

    // 6. JSON-LD Structured Data Injection
    const SCRIPT_ID = 'techwash-seo-schema';
    let scriptTag = document.getElementById(SCRIPT_ID);
    if (scriptTag) {
      scriptTag.remove();
    }

    if (structuredData) {
      scriptTag = document.createElement('script');
      scriptTag.id = SCRIPT_ID;
      scriptTag.type = 'application/ld+json';
      scriptTag.textContent = JSON.stringify(structuredData);
      document.head.appendChild(scriptTag);
    }

    return () => {
      // Clean up JSON-LD on unmount to prevent stale schema
      const existingScript = document.getElementById(SCRIPT_ID);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [finalTitle, finalDesc, finalCanonical, keywords, ogType, ogImage, structuredData, noindex]);

  return null;
};
