import BUILTIN_DICTIONARY_EN, { BUILTIN_LOWER_MAP } from './builtInDictionary.js';

const DEFAULT_LIBRE_URL = 'https://libretranslate.com/translate';

// In-memory cache for ultra-fast lookup
const memoryCache = new Map();

// Local Storage Cache Helpers
const getStorageCache = (targetLang) => {
  try {
    const raw = localStorage.getItem(`lt_cache_${targetLang}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveStorageCache = (targetLang, cacheObj) => {
  try {
    localStorage.setItem(`lt_cache_${targetLang}`, JSON.stringify(cacheObj));
  } catch (e) {
    console.warn('Failed to save translation cache to localStorage:', e);
  }
};

class LibreTranslateService {
  constructor() {
    this.batchQueue = new Map();
    this.batchTimer = null;
  }

  getApiUrl() {
    return import.meta.env.VITE_LIBRETRANSLATE_API_URL || null;
  }

  getCachedTranslation(text, targetLang = 'en') {
    if (!text || typeof text !== 'string') return text;
    const trimmed = text.trim();
    if (!trimmed) return text;

    if (targetLang === 'en') {
      // 1. Tier 1: Built-in Dictionary (exact match)
      if (BUILTIN_DICTIONARY_EN[trimmed]) {
        return BUILTIN_DICTIONARY_EN[trimmed];
      }

      // 1b. Tier 1b: Normalized case-insensitive match
      const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');
      if (BUILTIN_LOWER_MAP && BUILTIN_LOWER_MAP[normalized]) {
        return BUILTIN_LOWER_MAP[normalized];
      }
    }

    // 2. Tier 2: In-memory cache
    const cacheKey = `${targetLang}:${trimmed}`;
    if (memoryCache.has(cacheKey)) {
      return memoryCache.get(cacheKey);
    }

    // 3. Tier 3: LocalStorage cache
    const storageCache = getStorageCache(targetLang);
    if (storageCache[trimmed]) {
      memoryCache.set(cacheKey, storageCache[trimmed]);
      return storageCache[trimmed];
    }

    return null;
  }

  async translateText(text, sourceLang = 'id', targetLang = 'en') {
    if (!text || typeof text !== 'string') return text;
    if (sourceLang === targetLang) return text;
    
    const trimmed = text.trim();
    if (!trimmed) return text;

    // Check built-in and caches first
    const cached = this.getCachedTranslation(trimmed, targetLang);
    if (cached) return cached;

    // Queue for async machine translation
    return new Promise((resolve) => {
      if (!this.batchQueue.has(trimmed)) {
        this.batchQueue.set(trimmed, []);
      }
      this.batchQueue.get(trimmed).push(resolve);

      this.scheduleBatchProcess(sourceLang, targetLang);
    });
  }

  scheduleBatchProcess(sourceLang, targetLang) {
    if (this.batchTimer) return;

    this.batchTimer = setTimeout(() => {
      this.batchTimer = null;
      this.processBatch(sourceLang, targetLang);
    }, 50);
  }

  async processBatch(sourceLang, targetLang) {
    if (this.batchQueue.size === 0) return;

    const currentQueue = new Map(this.batchQueue);
    this.batchQueue.clear();

    const textsToTranslate = Array.from(currentQueue.keys());
    const apiUrl = this.getApiUrl();

    // If custom LibreTranslate API URL is configured in .env, use it
    if (apiUrl) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: textsToTranslate.length === 1 ? textsToTranslate[0] : textsToTranslate,
            source: sourceLang,
            target: targetLang,
            format: 'text',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          let results = [];

          if (Array.isArray(data)) {
            results = data.map(item => item.translatedText || item);
          } else if (data.translatedText) {
            results = Array.isArray(data.translatedText) ? data.translatedText : [data.translatedText];
          }

          if (results.length > 0) {
            this.fulfillTranslations(currentQueue, textsToTranslate, results, targetLang);
            return;
          }
        }
      } catch (e) {
        console.warn('Custom LibreTranslate API error, falling back to MyMemory:', e.message);
      }
    }

    // Fallback: Free MyMemory API for dynamic strings
    try {
      const storageCache = getStorageCache(targetLang);

      await Promise.all(
        textsToTranslate.map(async (text) => {
          try {
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
            const res = await fetch(url);
            const data = await res.json();
            const translated = data?.responseData?.translatedText || text;

            const cacheKey = `${targetLang}:${text}`;
            memoryCache.set(cacheKey, translated);
            storageCache[text] = translated;

            const resolvers = currentQueue.get(text) || [];
            resolvers.forEach((resolve) => resolve(translated));
          } catch {
            const resolvers = currentQueue.get(text) || [];
            resolvers.forEach((resolve) => resolve(text));
          }
        })
      );

      saveStorageCache(targetLang, storageCache);
    } catch {
      // Final fallback: resolve with original text
      textsToTranslate.forEach((originalText) => {
        const resolvers = currentQueue.get(originalText) || [];
        resolvers.forEach((resolve) => resolve(originalText));
      });
    }
  }

  fulfillTranslations(currentQueue, textsToTranslate, results, targetLang) {
    const storageCache = getStorageCache(targetLang);

    textsToTranslate.forEach((originalText, index) => {
      const translated = results[index] || originalText;
      const cacheKey = `${targetLang}:${originalText}`;
      memoryCache.set(cacheKey, translated);
      storageCache[originalText] = translated;

      const resolvers = currentQueue.get(originalText) || [];
      resolvers.forEach((resolve) => resolve(translated));
    });

    saveStorageCache(targetLang, storageCache);
  }
}

export const libreTranslateService = new LibreTranslateService();
export default libreTranslateService;
