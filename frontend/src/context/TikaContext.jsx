import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../api/client.js';

// ── Context ───────────────────────────────────────────────────────────────────
const TikaContext = createContext();

// ── Hook untuk menggunakan TIKA context ─────────────────────────────────────
export const useTika = () => {
  const context = useContext(TikaContext);
  if (!context) {
    throw new Error('useTika must be used within a TikaProvider');
  }
  return context;
};

// ── Initial messages ─────────────────────────────────────────────────────────
const WELCOME_MESSAGE = {
  id: 'welcome',
  type: 'bot',
  content: 'Halo! Saya TIKA, asisten virtual resmi TenagaAhli.com. 😊\n\nSaya siap membantu Anda seputar rekomendasi tenaga ahli, panduan cara pembayaran, pendaftaran, serta cara penggunaan website.\n\nCatatan: Percakapan ini hanya untuk tanya-jawab informasi umum. Anda juga dapat beralih ke tab Customer Service untuk berbicara langsung dengan tim kami.',
  timestamp: new Date()
};

const QUICK_REPLIES = [
  'Cara pembayaran',
  'Cari tenaga ahli',
  'Cara daftar',
  'Cara penggunaan',
  'Cara konsultasi',
  'Hubungi Customer Service'
];

// ── Provider ─────────────────────────────────────────────────────────────────
export const TikaProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tika'); // 'tika' | 'cs'
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [autoClearTimer, setAutoClearTimer] = useState(null);
  const [clearWarningTimer, setClearWarningTimer] = useState(null);
  
  // Rate limiting
  const rateLimitRef = useRef({ count: 0, resetTime: Date.now() + 60000 });
  const MAX_MESSAGES_PER_MINUTE = 10;
  const AUTO_CLEAR_TIMEOUT = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
  const CLEAR_WARNING_TIME = 5 * 60 * 1000; // 5 minutes warning before clear

  // Persist messages to localStorage with timestamp
  useEffect(() => {
    const savedData = localStorage.getItem('tika_chat_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const now = Date.now();
        const savedTime = parsed.timestamp || 0;
        
        // Check if data is still valid (within 3 hours)
        if (now - savedTime < AUTO_CLEAR_TIMEOUT && parsed.messages && parsed.messages.length > 1) {
          setMessages(parsed.messages);
          // Set up auto-clear timer for remaining time
          const remainingTime = AUTO_CLEAR_TIMEOUT - (now - savedTime);
          setupAutoClearTimer(remainingTime);
        } else {
          // Data expired, clear it
          localStorage.removeItem('tika_chat_data');
        }
      } catch {
        // Ignore invalid data
        localStorage.removeItem('tika_chat_data');
      }
    }
  }, []);

  // Save messages to localStorage with timestamp
  useEffect(() => {
    if (messages.length > 1) {
      const chatData = {
        messages,
        timestamp: Date.now(),
        sessionId
      };
      localStorage.setItem('tika_chat_data', JSON.stringify(chatData));
    }
  }, [messages, sessionId]);

  // Setup auto-clear timer
  const setupAutoClearTimer = useCallback((delay = AUTO_CLEAR_TIMEOUT) => {
    // Clear existing timers
    if (autoClearTimer) clearTimeout(autoClearTimer);
    if (clearWarningTimer) clearTimeout(clearWarningTimer);

    // Set warning timer (5 minutes before auto-clear)
    const warningDelay = Math.max(0, delay - CLEAR_WARNING_TIME);
    const warningTimerId = setTimeout(() => {
      const warningMessage = {
        id: `warning_${Date.now()}`,
        type: 'system',
        content: 'Percakapan akan otomatis terhapus dalam 5 menit untuk menjaga privasi Anda. Silakan simpan informasi penting jika diperlukan.',
        timestamp: new Date(),
        isWarning: true
      };
      setMessages(prev => [...prev, warningMessage]);
      
      // Show unread if chat is closed
      if (!isOpen) {
        setHasUnread(true);
      }
    }, warningDelay);
    setClearWarningTimer(warningTimerId);

    // Set auto-clear timer
    const clearTimerId = setTimeout(() => {
      const clearMessage = {
        id: `cleared_${Date.now()}`,
        type: 'system',
        content: 'Percakapan telah otomatis terhapus setelah 3 jam untuk menjaga privasi Anda. Silakan mulai percakapan baru jika diperlukan.',
        timestamp: new Date(),
        isClearNotification: true
      };
      
      setMessages([WELCOME_MESSAGE, clearMessage]);
      localStorage.removeItem('tika_chat_data');
      
      // Show unread if chat is closed
      if (!isOpen) {
        setHasUnread(true);
      }
    }, delay);
    setAutoClearTimer(clearTimerId);
  }, [autoClearTimer, clearWarningTimer, isOpen]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (autoClearTimer) clearTimeout(autoClearTimer);
      if (clearWarningTimer) clearTimeout(clearWarningTimer);
    };
  }, [autoClearTimer, clearWarningTimer]);

  // Rate limiting check
  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    if (now > rateLimitRef.current.resetTime) {
      rateLimitRef.current = { count: 0, resetTime: now + 60000 };
    }
    
    if (rateLimitRef.current.count >= MAX_MESSAGES_PER_MINUTE) {
      return false;
    }
    
    rateLimitRef.current.count++;
    return true;
  }, []);

  // Toggle chat panel
  const toggleChat = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) {
        setHasUnread(false);
      }
      return !prev;
    });
  }, []);

  // Open chat panel
  const openChat = useCallback((tab = 'tika') => {
    setIsOpen(true);
    setActiveTab(tab);
    setHasUnread(false);
  }, []);

  // Close chat panel
  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Send message to TIKA
  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isLoading) return;

    // Rate limiting
    if (!checkRateLimit()) {
      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        content: 'Maaf, Anda sudah mengirim terlalu banyak pesan. Silakan tunggu sebentar dan coba lagi.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      // Start auto-clear timer on first user message after welcome
      if (newMessages.length === 2) {
        setTimeout(() => setupAutoClearTimer(), 100); // Delay to ensure state is updated
      }
      return newMessages;
    });
    setIsLoading(true);

    try {
      // Call TIKA API
      const response = await api.post('/tika/chat', {
        message: content.trim(),
        session_id: sessionId,
        context: {
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          current_path: window.location.pathname
        }
      });

      const rawResponse = response.data.response || 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.';
      const cleanContent = rawResponse.replace(/\*\*/g, '').replace(/\*/g, '');

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: cleanContent,
        timestamp: new Date(),
        suggestions: response.data.suggestions || [],
        experts: response.data.experts || []
      };

      setMessages(prev => [...prev, botMessage]);

      // Show unread indicator if chat is closed
      if (!isOpen) {
        setHasUnread(true);
      }

    } catch (error) {
      console.error('Error sending message to TIKA:', error);
      
      let errorMessage = 'Maaf, saya mengalami kendala teknis. Silakan coba lagi dalam beberapa saat.';
      
      if (error.response?.status === 429) {
        errorMessage = 'Terlalu banyak permintaan. Silakan tunggu sebentar dan coba lagi.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server sedang mengalami masalah. Tim kami sedang menanganinya.';
      }

      const botErrorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: errorMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sessionId, checkRateLimit, isOpen, setupAutoClearTimer]);

  // Clear chat history
  const clearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    localStorage.removeItem('tika_chat_data');
    
    // Clear auto-clear timers
    if (autoClearTimer) {
      clearTimeout(autoClearTimer);
      setAutoClearTimer(null);
    }
    if (clearWarningTimer) {
      clearTimeout(clearWarningTimer);
      setClearWarningTimer(null);
    }
  }, [autoClearTimer, clearWarningTimer]);

  // Send quick reply
  const sendQuickReply = useCallback((reply) => {
    if (reply === 'Hubungi Customer Service') {
      setActiveTab('cs');
      return;
    }
    sendMessage(reply);
  }, [sendMessage]);

  const contextValue = {
    // State
    isOpen,
    activeTab,
    messages,
    isLoading,
    hasUnread,
    quickReplies: QUICK_REPLIES,
    
    // Actions
    setActiveTab,
    toggleChat,
    openChat,
    closeChat,
    sendMessage,
    sendQuickReply,
    clearChat,
    
    // Utils
    sessionId
  };

  return (
    <TikaContext.Provider value={contextValue}>
      {children}
    </TikaContext.Provider>
  );
};

TikaProvider.propTypes = {
  children: PropTypes.node.isRequired
};