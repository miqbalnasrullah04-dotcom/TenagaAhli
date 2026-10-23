import React, { createContext, useContext, useState, useCallback } from 'react';
import libreTranslateService from '../services/LibreTranslateService';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('app_language') || 'id';
  });

  const [translations, setTranslations] = useState({});

  const changeLanguage = useCallback((newLang) => {
    localStorage.setItem('app_language', newLang);
    setLanguageState(newLang);
  }, []);

  const translate = useCallback((keyOrText, fallbackText) => {
    if (!keyOrText && !fallbackText) return '';

    // Choose the Indonesian source text
    const sourceText = (typeof fallbackText === 'string' && fallbackText.trim() !== '')
      ? fallbackText
      : keyOrText;

    if (typeof sourceText !== 'string' || !sourceText.trim()) {
      return keyOrText || fallbackText || '';
    }

    if (language === 'id') {
      return sourceText;
    }

    // Check LibreTranslate cache
    const cached = libreTranslateService.getCachedTranslation(sourceText, 'en') ||
      (typeof keyOrText === 'string' ? libreTranslateService.getCachedTranslation(keyOrText, 'en') : null);
    if (cached) {
      return cached;
    }

    // Check state translations
    if (translations[sourceText]) {
      return translations[sourceText];
    }
    if (keyOrText && translations[keyOrText]) {
      return translations[keyOrText];
    }

    // Trigger async translation in background
    libreTranslateService.translateText(sourceText, 'id', 'en').then((translated) => {
      if (translated && translated !== sourceText) {
        setTranslations((prev) => ({
          ...prev,
          [sourceText]: translated,
          ...(keyOrText ? { [keyOrText]: translated } : {}),
        }));
      }
    });

    return sourceText;
  }, [language, translations]);

  const value = {
    language,
    changeLanguage,
    setLanguage: changeLanguage,
    translate,
    t: translate,
    i18n: {
      language,
      changeLanguage,
    },
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      t: (key, fallback) => fallback || key,
      i18n: { language: 'id', changeLanguage: () => {} },
      language: 'id',
      changeLanguage: () => {},
    };
  }
  return {
    t: context.t,
    i18n: context.i18n,
    language: context.language,
    changeLanguage: context.changeLanguage,
  };
}

export default LanguageContext;
