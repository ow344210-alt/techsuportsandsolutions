import { useEffect } from "react";
import { SEO_DEFAULTS, type SEOProps } from "../../config/seo.config";

function SEO({
  title,
  description,
  canonicalPath,
  ogTitle,
  ogDescription,
  ogImage,
  noIndex = false,
  structuredData = null,
}: SEOProps) {
  const pageTitle = title ? `${title} | ${SEO_DEFAULTS.title}` : SEO_DEFAULTS.title;
  const pageDescription = description ?? SEO_DEFAULTS.description;
  const canonicalUrl = canonicalPath
    ? `${SEO_DEFAULTS.url}${canonicalPath}`
    : SEO_DEFAULTS.url;
  const ogTitleValue = ogTitle ?? title ?? SEO_DEFAULTS.title;
  const ogDescriptionValue = ogDescription ?? description ?? SEO_DEFAULTS.description;
  const ogImageValue = ogImage ?? SEO_DEFAULTS.image;

  useEffect(() => {
    document.title = pageTitle;

    const head = document.head;

    const updateMeta = (name: string, content: string) => {
      let el = head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const updateProperty = (property: string, content: string) => {
      let el = head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    updateMeta("description", pageDescription);
    updateMeta("robots", noIndex ? "noindex, nofollow" : "index, follow");
    updateProperty("og:title", ogTitleValue);
    updateProperty("og:description", ogDescriptionValue);
    updateProperty("og:image", ogImageValue);
    updateProperty("og:url", canonicalUrl);
    updateProperty("og:type", SEO_DEFAULTS.type);
    updateProperty("og:site_name", SEO_DEFAULTS.siteName);
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", ogTitleValue);
    updateMeta("twitter:description", ogDescriptionValue);
    updateMeta("twitter:image", ogImageValue);

    let canonicalEl = head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute("href", canonicalUrl);

    if (structuredData) {
      let scriptEl = head.querySelector(
        'script[type="application/ld+json"]'
      ) as HTMLScriptElement | null;
      if (!scriptEl) {
        scriptEl = document.createElement("script");
        scriptEl.setAttribute("type", "application/ld+json");
        head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(structuredData);
    } else {
      const existingScript = head.querySelector(
        'script[type="application/ld+json"]'
      );
      if (existingScript) {
        existingScript.remove();
      }
    }

    return () => {
      document.title = SEO_DEFAULTS.title;
    };
  }, [
    pageTitle,
    pageDescription,
    canonicalUrl,
    ogTitleValue,
    ogDescriptionValue,
    ogImageValue,
    noIndex,
    structuredData,
  ]);

  return null;
}

export default SEO;