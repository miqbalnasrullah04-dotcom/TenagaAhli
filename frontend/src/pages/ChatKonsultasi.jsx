import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import api from '../api/client.js';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BRAND_BROWN      = '#8B4513';
const BRAND_BROWN_DARK = '#654321';
const BRAND_GREEN      = '#2E5E3B';

const STATUS_CFG = {
  confirmed:           { label: 'Aktif', bg: '#ECFDF5', fg: '#047857', border: '#A7F3D0', dot: '#10B981' },
  accepted:            { label: 'Diterima', bg: '#ECFDF5', fg: '#047857', border: '#A7F3D0', dot: '#10B981' },
  active:              { label: 'Aktif', bg: '#ECFDF5', fg: '#047857', border: '#A7F3D0', dot: '#10B981' },
  in_progress:         { label: 'Berlangsung', bg: '#ECFDF5', fg: '#047857', border: '#A7F3D0', dot: '#10B981' },
  waiting:             { label: 'Menunggu Jadwal', bg: '#FFFBEB', fg: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  pending:             { label: 'Menunggu', bg: '#FFFBEB', fg: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  menunggu_konfirmasi: { label: 'Menunggu', bg: '#FFFBEB', fg: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  completed:           { label: 'Selesai', bg: '#F3F4F6', fg: '#4B5563', border: '#E5E7EB', dot: '#9CA3AF' },
  selesai:             { label: 'Selesai', bg: '#F3F4F6', fg: '#4B5563', border: '#E5E7EB', dot: '#9CA3AF' },
  cancelled:           { label: 'Batal', bg: '#FEF2F2', fg: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
  dibatalkan:          { label: 'Batal', bg: '#FEF2F2', fg: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
  rejected:            { label: 'Ditolak', bg: '#FEF2F2', fg: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
  ditolak:             { label: 'Ditolak', bg: '#FEF2F2', fg: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
};

export default function ChatKonsultasi() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('id');

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [roomSearch, setRoomSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');
  const [downloadingId, setDownloadingId] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const formatCountdown = (totalSec) => {
    const sec = Math.max(0, Math.floor(Number(totalSec) || 0));
    if (sec <= 0) return '00:00';
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${hours}j ${pad(minutes)}m ${pad(seconds)}s`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const userRaw = localStorage.getItem('amdal_user');
  const isClient = useMemo(() => {
    try {
      const u = JSON.parse(userRaw || '{}');
      const roleType = u.role_type || '';
      return roleType === 'klien' || roleType === 'client' || u.role === 'klien' || u.role === 'client' || (u.role !== 'admin' && roleType !== 'tenaga_ahli' && roleType !== 'surveyor' && roleType !== 'tenaga_teknis');
    } catch {
      return false;
    }
  }, [userRaw]);

  // Filter & Search Rooms
  const filteredRooms = useMemo(() => {
    return rooms
      .filter((r) => {
        const isDone = r.session_status === 'completed' || r.session_status === 'cancelled' || ['completed', 'selesai', 'cancelled', 'dibatalkan', 'rejected', 'ditolak'].includes(r.status);
        if (roomFilter === 'active') {
          if (isDone) return false;
        } else if (roomFilter === 'completed') {
          if (!isDone) return false;
        }
        if (roomSearch.trim()) {
          const q = roomSearch.toLowerCase();
          const name = (r.partner_name || '').toLowerCase();
          const topic = (r.topic || '').toLowerCase();
          const ref = (r.ref || '').toLowerCase();
          const msg = (r.last_msg || '').toLowerCase();
          return name.includes(q) || topic.includes(q) || ref.includes(q) || msg.includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = a.last_time ? new Date(a.last_time).getTime() : 0;
        const timeB = b.last_time ? new Date(b.last_time).getTime() : 0;
        return timeB - timeA;
      });
  }, [rooms, roomSearch, roomFilter]);

  // Fetch Rooms
  const fetchRooms = async () => {
    try {
      const res = await api.get('/my/chat-rooms');
      if (res.data?.success) {
        const roomList = res.data.data || [];
        setRooms(roomList);

        // Jika ada targetId dari query parameter, langsung pilih room tersebut
        if (targetId && !activeRoom) {
          const matched = roomList.find((r) => String(r.id) === String(targetId));
          if (matched) {
            setActiveRoom(matched);
          } else if (roomList.length > 0) {
            setActiveRoom(roomList[0]);
          }
        } else if (!activeRoom && roomList.length > 0) {
          setActiveRoom(roomList[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching chat rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Fetch Messages when activeRoom changes
  const fetchMessages = async (showLoading = true) => {
    if (!activeRoom) return;
    if (showLoading) setLoadingMessages(true);
    try {
      const res = await api.get(`/consultations/${activeRoom.id}/messages`);
      if (res.data?.success) {
        setMessages(res.data.messages || []);
        if (res.data.consultation) {
          setActiveRoom((prev) => ({
            ...(prev || {}),
            ...res.data.consultation,
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);
  }, [activeRoom?.id]);

  // Sync remaining seconds from activeRoom
  useEffect(() => {
    if (activeRoom?.seconds_remaining !== undefined) {
      setSecondsRemaining(Math.max(0, Math.floor(Number(activeRoom.seconds_remaining) || 0)));
    }
  }, [activeRoom?.id, activeRoom?.seconds_remaining, activeRoom?.session_status]);

  // Live timer tick every second
  useEffect(() => {
    if (!activeRoom || secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto refresh state saat timer habis
          fetchMessages(false);
          fetchRooms();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeRoom?.id, activeRoom?.session_status, secondsRemaining > 0]);

  // Polling messages every 5 seconds
  useEffect(() => {
    if (!activeRoom) return;
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeRoom?.id]);

  // Auto scroll to bottom inside messages thread only, preventing window/page from jumping or scrolling
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !selectedFile) || !activeRoom || sending) return;

    setSending(true);
    const formData = new FormData();
    if (text.trim()) formData.append('message', text.trim());
    if (selectedFile) formData.append('attachment', selectedFile);

    try {
      const res = await api.post(`/consultations/${activeRoom.id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data.message) {
        setMessages((prev) => [...prev, res.data.message]);
        setText('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchRooms(); // Update last msg in room list
      }
    } catch (err) {
      console.error('Error sending message:', err);
      const errMsg = err.response?.data?.message || 'Gagal mengirim pesan.';
      alert(errMsg);
      // Jika session sudah selesai atau belum mulai, sinkronkan data terkini
      if (err.response?.status === 403) {
        fetchMessages(false);
        fetchRooms();
      }
    } finally {
      setSending(false);
    }
  };

  const fmtRelative = (s) => {
    if (!s) return '';
    const diff = (Date.now() - new Date(s)) / 36e5;
    return diff < 24
      ? new Date(s).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  // Direct File/Photo Downloader
  const handleDownload = async (url, filename, msgId) => {
    if (!url) return;
    setDownloadingId(msgId);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download request failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'berkas-konsultasi';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn('Direct blob download failed, fallback to direct open:', err);
      // Fallback
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'berkas-konsultasi';
      link.target = '_blank';
      link.rel = 'noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto -mt-2 sm:-mt-5 md:-mt-8 space-y-3">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">forum</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1F2A22] leading-tight">Ruang Diskusi & Komunikasi</h1>
              <p className="text-xs text-[#5B6660]">
                {isClient
                  ? 'Aktivitas komunikasi langsung Anda dengan Ahli'
                  : 'Aktivitas komunikasi langsung Anda dengan klien'}
              </p>
            </div>
          </div>
          <button
            onClick={fetchRooms}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E5E2D9] text-[#1F2A22] hover:bg-[#FAF9F6] shadow-2xs self-start sm:self-center text-xs font-bold transition-all cursor-pointer"
            title="Segarkan Ruang Diskusi"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Segarkan</span>
          </button>
        </div>

        {/* Chat Main Window Container */}
        <div className="bg-white rounded-2xl border border-[#E5E2D9] shadow-sm overflow-hidden flex flex-col md:grid md:grid-cols-12 h-[calc(100vh-200px)] min-h-[480px]">
          {/* Sidebar Room List (Col 4) */}
          <div className={`md:col-span-4 border-r border-[#E5E2D9] flex flex-col h-full bg-[#FAF9F6]/50 overflow-hidden ${activeRoom ? 'hidden md:flex' : 'flex'}`}>
            {/* Header Sidebar: Title, Search, Filter */}
            <div className="p-3.5 border-b border-[#E5E2D9] bg-white space-y-2.5 shrink-0 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[17px]">forum</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Chat
                  </h3>
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  {rooms.length} Sesi
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  placeholder="Cari nama, topik, chat..."
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30 focus:border-[#8B4513] transition-all"
                />
                {roomSearch && (
                  <button
                    type="button"
                    onClick={() => setRoomSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 pt-0.5">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'active', label: 'Aktif' },
                  { id: 'completed', label: 'Selesai' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setRoomFilter(f.id)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      roomFilter === f.id
                        ? 'bg-[#8B4513] text-white shadow-xs'
                        : 'bg-gray-100/90 text-gray-600 hover:bg-gray-200/90'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Room List Body */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
              {loadingRooms ? (
                <div className="p-8 text-center text-[#5B6660]">
                  <span className="material-symbols-outlined animate-spin text-2xl text-[#8B4513] mb-1">progress_activity</span>
                  <p className="text-xs">Memuat daftar room...</p>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <span className="material-symbols-outlined text-3xl mb-1 text-gray-300">chat_bubble_outline</span>
                  <p className="text-xs font-semibold text-gray-700">Tidak ada sesi ditemukan</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {roomSearch ? 'Coba ubah kata kunci pencarian.' : 'Saat ada konsultasi aktif, obrolan akan muncul di sini.'}
                  </p>
                </div>
              ) : (
                filteredRooms.map((room) => {
                  const isSelected = activeRoom?.id === room.id;
                  const displayStatus = room.session_status || room.status;
                  const cfg = STATUS_CFG[displayStatus] || STATUS_CFG[room.status] || STATUS_CFG.confirmed;
                  const isFileMsg = room.last_msg?.toLowerCase().includes('berkas') || room.last_msg?.toLowerCase().includes('file') || room.last_msg?.toLowerCase().includes('image');

                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setActiveRoom(room)}
                      className={`w-full p-3 rounded-2xl text-left transition-all duration-200 flex items-start gap-3 cursor-pointer group ${
                        isSelected
                          ? 'bg-[#8B4513]/10 border border-[#8B4513]/30 shadow-xs'
                          : 'bg-white/80 hover:bg-white hover:shadow-2xs border border-gray-200/60'
                      }`}
                    >
                      {/* Avatar with Status Dot */}
                      <div className="relative shrink-0">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-2xs overflow-hidden"
                          style={{ background: `linear-gradient(135deg, ${BRAND_BROWN}, ${BRAND_BROWN_DARK})` }}
                        >
                          {room.partner_photo ? (
                            <img src={room.partner_photo} alt={room.partner_name} className="w-full h-full object-cover" />
                          ) : (
                            (room.partner_name || 'U').charAt(0).toUpperCase()
                          )}
                        </div>
                        {/* Status Indicator Dot */}
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                          style={{ backgroundColor: cfg.dot }}
                          title={`Status: ${cfg.label}`}
                        />
                      </div>

                      {/* Info Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <p className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-[#8B4513]' : 'text-gray-900 group-hover:text-[#8B4513]'}`}>
                            {room.partner_name}
                          </p>
                          <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                            {fmtRelative(room.last_time)}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 truncate mb-2 flex items-center gap-1">
                          {isFileMsg && (
                            <span className="material-symbols-outlined text-[14px] text-amber-700 shrink-0">attach_file</span>
                          )}
                          <span className="truncate">{room.last_msg || 'Sesi konsultasi'}</span>
                        </p>

                        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-gray-100">
                          <span className="text-[10px] font-semibold text-gray-500 truncate max-w-[130px] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-gray-400">topic</span>
                            <span className="truncate">{room.topic || room.ref}</span>
                          </span>

                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0"
                            style={{ backgroundColor: cfg.bg, color: cfg.fg, borderColor: cfg.border || cfg.dot }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
                            <span>{cfg.label}</span>
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Main Chat Conversation (Col 8) */}
          <div className={`md:col-span-8 flex flex-col h-full bg-white overflow-hidden ${!activeRoom ? 'hidden md:flex' : 'flex'}`}>
            {activeRoom ? (
              <>
                {/* Chat Top Header */}
                <div className="p-3 sm:p-4 border-b border-[#E5E2D9] flex items-center justify-between bg-white z-10 shadow-2xs shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setActiveRoom(null)}
                      className="md:hidden p-1.5 -ml-1 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0"
                      title="Kembali ke Daftar Percakapan"
                    >
                      <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    </button>
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${BRAND_BROWN}, ${BRAND_BROWN_DARK})` }}
                    >
                      {activeRoom.partner_photo ? (
                        <img src={activeRoom.partner_photo} alt={activeRoom.partner_name} className="w-full h-full object-cover" />
                      ) : (
                        (activeRoom.partner_name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-[#1F2A22] truncate">{activeRoom.partner_name}</h2>
                      <p className="text-xs text-[#5B6660] truncate">
                        {activeRoom.ref} • Topik: <strong>{activeRoom.topic || '-'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeRoom.consultation_time && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-bold">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        {activeRoom.consultation_time.replace(/\s*WIB/gi, '').trim()} WIB
                      </span>
                    )}
                    {activeRoom.zoom_link && (
                      <a
                        href={activeRoom.zoom_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-105 shrink-0"
                      >
                        <span className="material-symbols-outlined text-[16px]">videocam</span>
                        <span>Masuk Zoom</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Zoom Link Info Banner */}
                {activeRoom.zoom_link ? (
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/80 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-blue-600 text-[20px] shrink-0">videocam</span>
                      <div className="min-w-0">
                        <span className="font-bold text-blue-950">Ruang Konsultasi Zoom Resmi</span>
                        <span className="text-blue-800 ml-2">
                          {activeRoom.zoom_meeting_id && `ID: ${activeRoom.zoom_meeting_id}`}
                          {activeRoom.zoom_passcode && ` • Passcode: ${activeRoom.zoom_passcode}`}
                        </span>
                      </div>
                    </div>
                    <a
                      href={activeRoom.zoom_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900 underline shrink-0"
                    >
                      <span>Buka Link Zoom</span>
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  </div>
                ) : activeRoom.service_type === 'zoom' ? (
                  <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2 flex items-center gap-2 text-xs text-amber-900 shrink-0">
                    <span className="material-symbols-outlined text-amber-600 text-[18px]">info</span>
                    <span>Sesi konsultasi ini via Zoom. Link Zoom akan dikirimkan oleh Administrator / Ahli sebelum sesi dimulai.</span>
                  </div>
                ) : null}

                {/* Waiting Time-Gated Banner */}
                {activeRoom.session_status === 'waiting' && (
                  <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-200/90 px-4 py-3 flex items-start gap-3 text-amber-950 shrink-0 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <span className="material-symbols-outlined text-[19px]">schedule</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-amber-900 flex items-center gap-1.5">
                          <span>Menunggu Waktu Sesi Konsultasi</span>
                          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        </h4>
                        {secondsRemaining > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[11px] font-extrabold tracking-wide">
                            <span className="material-symbols-outlined text-[13px] animate-spin">hourglass_top</span>
                            <span>Dibuka dalam: {formatCountdown(secondsRemaining)}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        {activeRoom.explanation || `Anda dapat mulai mengirim chat ketika sudah masuk jam atau jadwal konsultasi Anda (${activeRoom.formatted_schedule || activeRoom.consultation_time}).`}
                      </p>
                    </div>
                  </div>
                )}

                {/* In Progress Session Banner */}
                {activeRoom.session_status === 'in_progress' && (
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-b border-emerald-200/90 px-4 py-2 flex items-center justify-between gap-2 text-emerald-950 text-xs shrink-0 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                      </span>
                      <span className="font-bold text-emerald-900">Sesi Konsultasi Sedang Aktif</span>
                      <span className="hidden sm:inline text-emerald-700">&bull; Silakan berdiskusi dan bertukar berkas</span>
                    </div>
                    {secondsRemaining > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-300 rounded-lg text-emerald-800 font-bold shadow-2xs">
                        <span className="material-symbols-outlined text-[15px]">timer</span>
                        <span>Sisa Waktu: {formatCountdown(secondsRemaining)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Completed / Missed Session Banner */}
                {(activeRoom.session_status === 'completed' || activeRoom.status === 'selesai') && (
                  <div className="bg-gradient-to-r from-gray-50 via-stone-50 to-gray-50 border-b border-gray-200 px-4 py-3 flex items-start gap-3 text-gray-800 shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-gray-200 text-gray-600 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[19px]">
                        {activeRoom.is_missed ? 'history_toggle_off' : 'lock_clock'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                        {activeRoom.is_missed ? 'Jadwal Konsultasi Telah Terlewat' : 'Sesi Konsultasi Telah Selesai'}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {activeRoom.is_missed
                          ? 'Waktu jadwal konsultasi ini telah terlewat dan ruang obrolan telah ditutup otomatis. Anda tidak dapat mengirim pesan pada sesi ini. Silakan pesan jadwal baru untuk berkonsultasi kembali.'
                          : 'Durasi waktu konsultasi telah habis dan obrolan untuk sesi ini telah selesai otomatis. Anda tidak dapat mengirim chat lagi pada sesi ini. Untuk konsultasi lebih lanjut, silakan pesan jadwal baru.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Messages Thread */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF9F6]/30 min-h-0">
                  {loadingMessages ? (
                    <div className="p-12 text-center text-[#5B6660]">
                      <span className="material-symbols-outlined animate-spin text-2xl text-[#8B4513] mb-1">progress_activity</span>
                      <p className="text-xs">Memuat riwayat pesan...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="p-12 text-center text-[#5B6660]">
                      <span className="material-symbols-outlined text-3xl mb-1 text-gray-300">chat_bubble_outline</span>
                      <p className="text-sm font-semibold">Belum ada percakapan</p>
                      <p className="text-xs text-gray-400 mt-1">Kirim pesan pertama Anda untuk memulai konsultasi.</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.is_me;

                      return (
                        <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-3.5 shadow-sm text-sm ${
                              isMe
                                ? 'bg-[#8B4513] text-white rounded-tr-none'
                                : 'bg-white border border-[#E5E2D9] text-[#1F2A22] rounded-tl-none'
                            }`}
                          >
                            {!isMe && (
                              <p className="text-[11px] font-bold text-[#8B4513] mb-1">{m.sender_name}</p>
                            )}

                            <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>

                            {m.attachment_url && (() => {
                              const isImg = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(m.attachment_name || m.attachment_url);
                              const isDownloading = downloadingId === m.id;

                              return (
                                <div className="mt-2.5 pt-2 border-t border-white/20">
                                  {isImg ? (
                                    <div className="space-y-1.5">
                                      {/* Image Card Preview */}
                                      <a
                                        href={m.attachment_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block overflow-hidden rounded-xl group/img max-w-xs shadow-xs border border-black/10"
                                      >
                                        <img
                                          src={m.attachment_url}
                                          alt={m.attachment_name || 'Foto'}
                                          className="max-h-60 w-auto object-cover rounded-xl transition-transform duration-200 group-hover/img:scale-105"
                                        />
                                      </a>

                                      {/* Action Buttons: Preview & Download */}
                                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                                        <a
                                          href={m.attachment_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                                            isMe
                                              ? 'bg-white/20 text-white hover:bg-white/30'
                                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                          }`}
                                          title="Buka foto ukuran penuh"
                                        >
                                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                                          <span>Lihat</span>
                                        </a>

                                        <button
                                          type="button"
                                          onClick={() => handleDownload(m.attachment_url, m.attachment_name || 'foto.png', m.id)}
                                          disabled={isDownloading}
                                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                            isMe
                                              ? 'bg-white text-[#8B4513] hover:bg-white/90 shadow-2xs'
                                              : 'bg-[#8B4513] text-white hover:bg-[#654321] shadow-2xs'
                                          }`}
                                          title="Unduh foto langsung ke perangkat"
                                        >
                                          <span className={`material-symbols-outlined text-[14px] ${isDownloading ? 'animate-spin' : ''}`}>
                                            {isDownloading ? 'progress_activity' : 'download'}
                                          </span>
                                          <span>{isDownloading ? 'Mengunduh...' : 'Unduh Foto'}</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Document Card */
                                    <div
                                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                                        isMe
                                          ? 'bg-white/15 border-white/25 text-white'
                                          : 'bg-[#FAF9F6] border-[#E5E2D9] text-[#1F2A22]'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                            isMe ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                                          }`}
                                        >
                                          <span className="material-symbols-outlined text-lg">
                                            {m.attachment_name?.toLowerCase().endsWith('.pdf')
                                              ? 'picture_as_pdf'
                                              : m.attachment_name?.toLowerCase().endsWith('.zip')
                                              ? 'folder_zip'
                                              : 'description'}
                                          </span>
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-bold truncate max-w-[160px]">
                                            {m.attachment_name || 'Dokumen'}
                                          </p>
                                          <p className={`text-[10px] ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                            Berkas lampiran
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <a
                                          href={m.attachment_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className={`p-1.5 rounded-lg transition-colors ${
                                            isMe ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200 text-gray-600'
                                          }`}
                                          title="Buka dokumen di tab baru"
                                        >
                                          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                        </a>

                                        <button
                                          type="button"
                                          onClick={() => handleDownload(m.attachment_url, m.attachment_name || 'dokumen', m.id)}
                                          disabled={isDownloading}
                                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            isMe
                                              ? 'bg-white text-[#8B4513] hover:bg-white/90 shadow-2xs'
                                              : 'bg-[#8B4513] text-white hover:bg-[#654321] shadow-2xs'
                                          }`}
                                          title="Unduh dokumen langsung ke perangkat"
                                        >
                                          <span className={`material-symbols-outlined text-[15px] ${isDownloading ? 'animate-spin' : ''}`}>
                                            {isDownloading ? 'progress_activity' : 'download'}
                                          </span>
                                          <span>{isDownloading ? 'Mengunduh...' : 'Unduh'}</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-white/70' : 'text-[#5B6660]'}`}>
                              <span>{m.time_formatted}</span>
                              {isMe && (
                                <span className="material-symbols-outlined text-xs">
                                  {m.is_read ? 'done_all' : 'done'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Selected File Preview Badge */}
                {selectedFile && (
                  <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 flex items-center justify-between text-xs text-amber-950 shrink-0">
                    <div className="flex items-center gap-2.5 truncate">
                      {selectedFile.type.startsWith('image/') ? (
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-amber-300">
                          <img
                            src={URL.createObjectURL(selectedFile)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <span className="material-symbols-outlined text-base text-amber-700">
                          {selectedFile.name.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'description'}
                        </span>
                      )}
                      <div className="truncate">
                        <span className="font-bold truncate block">{selectedFile.name}</span>
                        <span className="text-[10px] text-amber-700">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB &bull; Siap dikirim
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-amber-700 hover:text-amber-950 font-bold ml-2 shrink-0 p-1 rounded-md hover:bg-amber-100 cursor-pointer"
                      title="Batalkan lampiran"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                )}

                {/* Chat Input or Session Control Box */}
                {activeRoom.session_status === 'waiting' ? (
                  /* Waiting State: Locked Input Bar */
                  <div className="p-2.5 sm:p-3 bg-amber-50/70 border-t border-amber-200 flex items-center gap-2 shrink-0">
                    <div
                      className="p-2.5 rounded-xl border border-amber-200 bg-amber-100/60 text-amber-600 shrink-0 flex items-center justify-center"
                      title="Ruang chat belum aktif sebelum waktu jadwal"
                    >
                      <span className="material-symbols-outlined text-lg sm:text-xl">lock</span>
                    </div>

                    <div className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-amber-200/90 bg-white/95 text-[11px] sm:text-xs text-amber-900 flex items-center justify-between gap-2 shadow-2xs">
                      <span className="font-medium text-amber-900/90">
                        Ruang chat aktif pada jadwal Anda ({activeRoom.consultation_time?.replace(/\s*WIB/gi, '').trim()} WIB)
                      </span>
                      {secondsRemaining > 0 && (
                        <span className="font-extrabold text-amber-900 shrink-0 bg-amber-100/80 px-2.5 py-0.5 rounded-md border border-amber-200/60 text-[10px] sm:text-[11px]">
                          {formatCountdown(secondsRemaining)}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (activeRoom.session_status === 'completed' || activeRoom.status === 'selesai') ? (
                  /* Completed State: Locked Notification with "Booking Jadwal Baru" Button */
                  <div className="p-3.5 sm:p-4 bg-gray-50/95 border-t border-[#E5E2D9] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-2xs">
                    <div className="flex items-center gap-3 text-center sm:text-left min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gray-200 text-gray-600 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl">event_busy</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                          {activeRoom.is_missed ? 'Jadwal Terlewat • Chat Ditutup' : 'Sesi Konsultasi Selesai • Chat Ditutup'}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {activeRoom.is_missed
                            ? 'Waktu sesi telah terlewat. Silakan pesan jadwal baru untuk berkonsultasi.'
                            : 'Waktu habis dan tidak dapat mengirim chat lagi. Ingin berdiskusi kembali?'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const targetSlug = activeRoom.expert_slug || activeRoom.expert_id;
                        if (targetSlug) {
                          navigate(`/profil/${targetSlug}`);
                        } else {
                          navigate('/tenaga-ahli');
                        }
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#8B4513] hover:bg-[#654321] text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02] cursor-pointer shrink-0"
                      title="Pesan jadwal konsultasi baru"
                    >
                      <span className="material-symbols-outlined text-[17px]">event_available</span>
                      <span>Booking Jadwal Baru</span>
                    </button>
                  </div>
                ) : (
                  /* Active / In-Progress State: Normal Send Message Form */
                  <form onSubmit={handleSend} className="p-2.5 sm:p-3 bg-white border-t border-[#E5E2D9] flex items-center gap-2 shrink-0">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*,.pdf,.doc,.docx,.zip"
                      onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-xl border border-[#E5E2D9] text-[#5B6660] hover:bg-[#FAF9F6] hover:text-[#1F2A22] transition-colors shrink-0 cursor-pointer"
                      title="Lampirkan Dokumen/Foto"
                    >
                      <span className="material-symbols-outlined text-xl">attach_file</span>
                    </button>

                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Tulis pesan konsultasi..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                    />

                    <button
                      type="submit"
                      disabled={sending || (!text.trim() && !selectedFile)}
                      className="p-2.5 rounded-xl bg-[#8B4513] hover:bg-[#654321] text-white shadow-md transition-all disabled:opacity-50 flex items-center justify-center shrink-0 cursor-pointer"
                      title="Kirim Pesan"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {sending ? 'progress_activity' : 'send'}
                      </span>
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-[#5B6660]">
                <span className="material-symbols-outlined text-5xl mb-2 text-gray-300">forum</span>
                <p className="font-bold text-base text-[#1F2A22]">Pilih sesi konsultasi</p>
                <p className="text-xs text-gray-400 mt-1">Pilih salah satu ruang obrolan di sebelah kiri untuk mulai berdiskusi.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
