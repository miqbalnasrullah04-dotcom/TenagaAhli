import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useTika } from '../context/TikaContext.jsx';
import { formatCompactLocation } from '../utils/formatters.js';
import { getDefaultPhoto } from '../utils/media.js';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BRAND_BROWN = '#8B4513';
const BRAND_GREEN = '#2E5E3B';

// ── Helper to remove asterisks completely from message text ───────────────────
function cleanMessageText(text) {
  if (!text) return '';
  return String(text).replace(/\*\*/g, '').replace(/\*/g, '');
}

// ── WhatsApp Icon ─────────────────────────────────────────────────────────────
function IconWhatsapp({ className = 'w-4 h-4' }) {
  return (
    <svg className={`${className} fill-current`} viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.001 2C6.478 2 2 6.477 2 12c0 1.928.554 3.72 1.512 5.24L2 22l4.891-1.483A9.94 9.94 0 0012.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2zm0 18.06a8.02 8.02 0 01-4.086-1.117l-.293-.174-3.05.923.94-2.98-.19-.306A8.006 8.006 0 1120 12c0 4.42-3.58 8.06-7.999 8.06z" />
    </svg>
  );
}

IconWhatsapp.propTypes = {
  className: PropTypes.string
};

// ── Floating Chat Button ─────────────────────────────────────────────────────
function ChatButton({ onClick, hasUnread, isOpen }) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
        isOpen ? 'bg-gray-500' : 'bg-gradient-to-r from-[#8B4513] to-[#2E5E3B]'
      }`}
      style={{
        boxShadow: '0 4px 20px rgba(139, 69, 19, 0.3)'
      }}
      aria-label="Buka Chat Layanan"
    >
      {isOpen ? (
        <span className="material-symbols-outlined text-white text-[24px]">close</span>
      ) : (
        <>
          <img 
            src="/images/tika.png" 
            alt="TIKA" 
            className="w-10 h-10 rounded-full object-cover shadow-sm"
          />
          {hasUnread && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          )}
        </>
      )}
    </button>
  );
}

ChatButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  hasUnread: PropTypes.bool,
  isOpen: PropTypes.bool
};

// ── Message Component ────────────────────────────────────────────────────────
function Message({ message, isTyping }) {
  const { sendQuickReply, setActiveTab } = useTika();
  const navigate = useNavigate();
  const isBot = message.type === 'bot';
  const isSystem = message.type === 'system';
  
  // System messages (warnings and notifications)
  if (isSystem) {
    return (
      <div className="flex justify-center mb-4">
        <div className={`px-4 py-3 rounded-xl text-sm text-center max-w-[85%] ${
          message.isWarning 
            ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' 
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[16px]">
              {message.isWarning ? 'warning' : 'notifications'}
            </span>
            <span className="font-medium">
              {message.isWarning ? 'Peringatan Privasi' : 'Notifikasi'}
            </span>
          </div>
          <div className="mt-1 text-xs leading-relaxed">
            {cleanMessageText(message.content)}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex gap-3 mb-4 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden shadow-xs flex items-center justify-center">
          <img 
            src="/images/tika.png" 
            alt="TIKA" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="flex flex-col gap-2 max-w-[75%] sm:max-w-[65%]">
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isBot 
              ? 'bg-white border border-gray-200 text-gray-800' 
              : 'text-white'
          }`}
          style={!isBot ? { backgroundColor: BRAND_BROWN } : {}}
        >
          {isTyping ? (
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-gray-500 text-xs ml-2">TIKA sedang mengetik...</span>
            </div>
          ) : (
            <div className="whitespace-pre-line">{cleanMessageText(message.content)}</div>
          )}
        </div>

        {/* Quick suggestions */}
        {isBot && message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.suggestions
              .filter(suggestion => suggestion !== 'Menu Pembayaran' && suggestion !== 'Halaman Pembayaran')
              .map((suggestion, index) => {
                const isCS = suggestion === 'Buka Customer Service' || suggestion === 'Hubungi Customer Service';
                const isWA = suggestion === 'Chat WhatsApp CS';

                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (isCS) {
                        setActiveTab('cs');
                      } else if (isWA) {
                        window.open('https://wa.me/628111520900', '_blank');
                      } else {
                        sendQuickReply(suggestion);
                      }
                    }}
                    className={`px-3 py-1.5 text-xs rounded-full transition-all flex items-center gap-1 ${
                      isCS
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium'
                        : isWA
                        ? 'bg-green-50 hover:bg-green-100 text-green-800 border border-green-300 font-medium'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isCS && <span className="material-symbols-outlined text-[14px] text-emerald-600">headset_mic</span>}
                    {isWA && <IconWhatsapp className="w-3.5 h-3.5 text-green-600" />}
                    <span>{cleanMessageText(suggestion)}</span>
                  </button>
                );
              })}
          </div>
        )}

        {/* Expert recommendations */}
        {isBot && message.experts && message.experts.length > 0 && (
          <div className="space-y-2.5 mt-2.5 w-full">
            {message.experts.map((expert) => {
              const isSurveyor = Boolean(
                expert.is_surveyor === true ||
                expert.role_type === 'surveyor' ||
                String(expert.kriteria || '').trim().toLowerCase().includes('surveyor') ||
                String(expert.field || '').trim().toLowerCase().includes('surveyor')
              );
              const roleBadgeLabel = expert.kriteria || (isSurveyor ? 'Surveyor' : 'Tenaga Ahli');
              const photoSrc = expert.photo_url || expert.photo || getDefaultPhoto(expert.id);
              const locationStr = expert.location || [expert.alamat_kota, expert.alamat_provinsi].filter(Boolean).join(', ');

              return (
                <div
                  key={expert.id}
                  className="bg-white border border-gray-200 hover:border-[#8B4513]/40 rounded-2xl p-3 shadow-xs hover:shadow-md transition-all duration-200 group flex flex-col"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={photoSrc}
                        alt={expert.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-100 group-hover:border-[#8B4513]/30 transition-colors shadow-xs"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          expert.is_online ? 'bg-emerald-500' : 'bg-gray-400'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            isSurveyor
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-amber-50 text-[#8B4513] border border-amber-200'
                          }`}
                        >
                          {roleBadgeLabel}
                        </span>
                        {expert.rating && Number(expert.rating) > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200/60">
                            ⭐ {Number(expert.rating).toFixed(1)}
                          </span>
                        ) : null}
                      </div>

                      <h4
                        className="font-bold text-[13px] sm:text-[13.5px] text-gray-900 group-hover:text-[#8B4513] transition-colors leading-snug line-clamp-2 mt-1"
                        title={expert.name}
                      >
                        {expert.name}
                      </h4>

                      <p
                        className="text-[11px] sm:text-[11.5px] font-semibold text-[#8B4513] truncate mt-0.5"
                        title={expert.field || (isSurveyor ? 'Surveyor & Pemetaan' : 'Tenaga Ahli')}
                      >
                        {expert.field || (isSurveyor ? 'Surveyor & Pemetaan' : 'Tenaga Ahli')}
                      </p>

                      {locationStr ? (
                        <p
                          className="text-[10.5px] text-gray-500 flex items-center gap-1 truncate mt-0.5"
                          title={locationStr}
                        >
                          <span className="material-symbols-outlined text-[13px] text-gray-400 shrink-0">location_on</span>
                          <span className="truncate">{formatCompactLocation(locationStr)}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <a
                    href={`/profil/${expert.slug || expert.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full mt-2.5 py-1.5 px-3 rounded-xl text-xs font-bold text-white bg-[#8B4513] hover:bg-[#6e360e] flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-xs"
                  >
                    <span>Lihat Profil Lengkap</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {!isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="material-symbols-outlined text-gray-600 text-[16px]">person</span>
        </div>
      )}
    </div>
  );
}

Message.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    type: PropTypes.oneOf(['user', 'bot', 'system']).isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.instanceOf(Date).isRequired,
    isWarning: PropTypes.bool,
    suggestions: PropTypes.array,
    experts: PropTypes.array
  }).isRequired,
  isTyping: PropTypes.bool
};

// ── Chat Panel ───────────────────────────────────────────────────────────────
function ChatPanel() {
  const { 
    isOpen, 
    activeTab, 
    setActiveTab, 
    messages, 
    isLoading, 
    closeChat, 
    sendMessage, 
    quickReplies, 
    clearChat 
  } = useTika();

  const [inputValue, setInputValue] = useState('');
  const [csMessage, setCsMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const AUTO_CLEAR_TIMEOUT = 3 * 60 * 60 * 1000; // 3 hours

  // Calculate time remaining for auto-clear
  useEffect(() => {
    const updateTimeRemaining = () => {
      const savedData = localStorage.getItem('tika_chat_data');
      if (savedData && messages.length > 1) {
        try {
          const parsed = JSON.parse(savedData);
          const chatStartTime = parsed.timestamp || Date.now();
          const elapsed = Date.now() - chatStartTime;
          const remaining = AUTO_CLEAR_TIMEOUT - elapsed;
          
          if (remaining > 0) {
            const hours = Math.floor(remaining / (60 * 60 * 1000));
            const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
            setTimeRemaining({ hours, minutes, total: remaining });
          } else {
            setTimeRemaining(null);
          }
        } catch {
          setTimeRemaining(null);
        }
      } else {
        setTimeRemaining(null);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, [messages]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeTab === 'tika') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, activeTab]);

  // Focus input when panel opens in TIKA mode
  useEffect(() => {
    if (isOpen && activeTab === 'tika') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeTab]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    sendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-36 md:bottom-24 right-4 md:right-6 w-80 sm:w-96 h-[530px] max-h-[65vh] md:max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-[#8B4513] to-[#2E5E3B]">
        <div className="flex items-center gap-3">
          {activeTab === 'tika' ? (
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shrink-0 shadow-xs">
              <img 
                src="/images/tika.png" 
                alt="TIKA" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white text-[22px]">support_agent</span>
            </div>
          )}

          <div>
            <h3 className="font-bold text-white text-sm">
              {activeTab === 'tika' ? 'TIKA' : 'Customer Service'}
            </h3>
            <div className="flex flex-col">
              <p className="text-white/80 text-xs">
                {activeTab === 'tika' ? 'AI Assistant' : 'Layanan Pelanggan'}
              </p>
              {activeTab === 'tika' && timeRemaining && timeRemaining.total > 300000 && (
                <p className="text-white/70 text-[10px] mt-0.5">
                  Chat terhapus otomatis dalam {timeRemaining.hours}j {timeRemaining.minutes}m
                </p>
              )}
              {activeTab === 'tika' && timeRemaining && timeRemaining.total <= 300000 && (
                <p className="text-yellow-200 text-[10px] mt-0.5 font-medium flex items-center gap-0.5 animate-pulse">
                  <span className="material-symbols-outlined text-[12px]">warning</span>
                  Chat akan terhapus dalam {timeRemaining.minutes}m
                </p>
              )}
              {activeTab === 'cs' && (
                <span className="text-emerald-200 text-[10px] mt-0.5 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Tim Siap Melayani
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {activeTab === 'tika' && (
            <button
              onClick={clearChat}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
              title="Hapus riwayat chat"
              aria-label="Hapus chat"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          )}
          <button
            onClick={closeChat}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
            title="Tutup chat"
            aria-label="Tutup chat"
          >
            <span className="material-symbols-outlined text-[20px]">minimize</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex bg-amber-50/40 p-1 border-b border-gray-200 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('tika')}
          className={`flex-1 py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all duration-200 ${
            activeTab === 'tika'
              ? 'bg-white text-[#8B4513] shadow-xs border border-gray-200 font-bold'
              : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">smart_toy</span>
          <span>TIKA (AI)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cs')}
          className={`flex-1 py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all duration-200 ${
            activeTab === 'cs'
              ? 'bg-white text-[#2E5E3B] shadow-xs border border-gray-200 font-bold'
              : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">headset_mic</span>
          <span>Customer Service</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        </button>
      </div>

      {/* Content based on Active Tab */}
      {activeTab === 'tika' ? (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {isLoading && (
              <Message 
                message={{
                  id: 'typing',
                  type: 'bot',
                  content: '',
                  timestamp: new Date()
                }}
                isTyping={true}
              />
            )}

            {/* Quick replies for first time users */}
            {messages.length === 1 && !isLoading && (
              <div className="mt-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2.5 font-medium">
                  <span className="material-symbols-outlined text-[15px] text-[#8B4513]">help</span>
                  <span>Pertanyaan yang sering ditanyakan:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply, index) => {
                    const isCS = reply === 'Hubungi Customer Service';
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (isCS) {
                            setActiveTab('cs');
                          } else {
                            sendMessage(reply);
                          }
                        }}
                        className={`px-3 py-2 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
                          isCS
                            ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold hover:bg-emerald-100 shadow-xs'
                            : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {isCS && <span className="material-symbols-outlined text-[14px] text-emerald-600">headset_mic</span>}
                        <span>{reply}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3.5 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ketik pesan untuk TIKA AI..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-2 rounded-xl text-white transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                style={{ backgroundColor: inputValue.trim() && !isLoading ? BRAND_BROWN : undefined }}
                aria-label="Kirim pesan"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </form>
        </>
      ) : (
        /* Customer Service Screen */
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Agent Welcome Card */}
            <div className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-[#2E5E3B] to-[#478f5a] flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-[22px]">support_agent</span>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-gray-900 truncate">Customer Care</h4>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Online
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Tim Dukungan TenagaAhli.com</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2.5 leading-relaxed bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                Halo! Butuh bantuan pendaftaran, verifikasi akun, jadwal konsultasi, atau kendala transaksi? Tim Customer Service kami siap membantu Anda secara langsung.
              </p>
            </div>

            {/* Quick Topic Chips */}
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#8B4513]">topic</span>
                Pilih Topik Pertanyaan:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Konsultasi Ahli', text: 'Halo CS TenagaAhli.com, saya ingin bantuan perihal jadwal & konsultasi tenaga ahli.' },
                  { label: 'Kendala Bayar', text: 'Halo CS TenagaAhli.com, saya ingin konfirmasi perihal kendala transaksi/pembayaran.' },
                  { label: 'Verifikasi Akun', text: 'Halo CS TenagaAhli.com, saya ingin menanyakan status verifikasi akun/keahlian saya.' },
                  { label: 'Paket & Layanan', text: 'Halo CS TenagaAhli.com, saya ingin konsultasi mengenai paket dan fitur layanan.' },
                ].map((topic, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCsMessage(topic.text)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-all font-medium text-gray-700 active:scale-95 text-left"
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Message for WhatsApp */}
            <div className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-xs space-y-2">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#2E5E3B]">edit_note</span>
                Pesan untuk Tim Customer Service:
              </label>
              <textarea
                value={csMessage}
                onChange={(e) => setCsMessage(e.target.value)}
                placeholder="Ketik detail kendala atau pesan Anda di sini..."
                rows={2}
                className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E5E3B]/20 focus:border-[#2E5E3B] resize-none"
              />
              <a
                href={`https://wa.me/628111520900?text=${encodeURIComponent(csMessage.trim() || 'Halo Customer Service TenagaAhli.com, saya membutuhkan bantuan informasi/layanan.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs hover:opacity-95 active:scale-[0.98]"
                style={{ backgroundColor: '#25D366' }}
              >
                <IconWhatsapp className="w-4 h-4 text-white shrink-0" />
                <span>Chat WhatsApp CS Sekarang</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </a>
            </div>

            {/* Other Contacts & Operating Hours */}
            <div className="p-3 bg-gray-100/90 rounded-xl space-y-1.5 text-[11px] text-gray-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-gray-500">call</span>
                  Telepon Kantor:
                </span>
                <a href="tel:08111520900" className="text-[#8B4513] font-medium hover:underline">0811-1520-900</a>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-gray-500">mail</span>
                  Email Resmi:
                </span>
                <a href="mailto:help@tenagaahli.com" className="text-[#8B4513] font-medium hover:underline">help@tenagaahli.com</a>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-200 text-gray-500">
                <span>Jam Kerja:</span>
                <span>Senin - Jumat, 08:30 - 17:00 WIB</span>
              </div>
            </div>
          </div>

          {/* Switch back to TIKA AI */}
          <div className="pt-2.5 border-t border-gray-200 mt-2 text-center">
            <button
              type="button"
              onClick={() => setActiveTab('tika')}
              className="text-xs text-[#8B4513] hover:text-[#6a340e] font-semibold flex items-center justify-center gap-1.5 mx-auto hover:underline"
            >
              <span className="material-symbols-outlined text-[15px]">smart_toy</span>
              <span>Mau tanya jawab otomatis? Beralih ke TIKA AI</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main TIKA Chatbot Component ──────────────────────────────────────────────
export default function TikaChatbot() {
  const { isOpen, hasUnread, toggleChat } = useTika();

  return (
    <>
      <ChatButton 
        onClick={toggleChat}
        hasUnread={hasUnread}
        isOpen={isOpen}
      />
      <ChatPanel />
    </>
  );
}