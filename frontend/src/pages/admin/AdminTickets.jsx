import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import api from '../../api/client.js';

const PRIORITIES = {
  rendah: { label: 'Rendah', color: '#2E5E3B', bg: '#E3F2E7' },
  sedang: { label: 'Sedang', color: '#7A5900', bg: '#FFF4D6' },
  tinggi: { label: 'Tinggi', color: '#B3261E', bg: '#FFDAD6' },
};

const STATUS_MAP = {
  baru: { label: 'Baru', color: '#6B3410', bg: '#F5EBE1', icon: 'fiber_new' },
  diproses: { label: 'Diproses', color: '#7A5900', bg: '#FFF4D6', icon: 'pending' },
  selesai: { label: 'Selesai', color: '#2E5E3B', bg: '#E3F2E7', icon: 'check_circle' },
};

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminTickets() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';

  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const loadTickets = () => {
    setLoading(true);
    api
      .get('/admin/tickets')
      .then((res) => {
        setTickets(res.data);
      })
      .catch(() => setError('Gagal memuat data tiket.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Filter tickets based on status and search
  useEffect(() => {
    let result = [...tickets];

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((ticket) => {
        return (
          ticket.ticket_number?.toLowerCase().includes(query) ||
          ticket.title?.toLowerCase().includes(query) ||
          ticket.user?.name?.toLowerCase().includes(query) ||
          ticket.user?.email?.toLowerCase().includes(query) ||
          ticket.category?.toLowerCase().includes(query)
        );
      });
    }

    setFilteredTickets(result);
  }, [tickets, statusFilter, searchQuery]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;
    setSendingReply(true);

    try {
      const res = await api.post(`/admin/tickets/${selectedTicket.id}/reply`, {
        message: replyMessage,
      });
      
      setSelectedTicket((prev) => ({
        ...prev,
        replies: [...prev.replies, res.data],
      }));
      setReplyMessage('');
      loadTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengirim balasan.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket || changingStatus) return;
    setChangingStatus(true);

    try {
      const res = await api.patch(`/admin/tickets/${selectedTicket.id}/status`, {
        status: newStatus,
      });
      
      setSelectedTicket(res.data);
      loadTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status tiket.');
    } finally {
      setChangingStatus(false);
    }
  };

  const stats = {
    total: tickets.length,
    baru: tickets.filter((t) => t.status === 'baru').length,
    diproses: tickets.filter((t) => t.status === 'diproses').length,
    selesai: tickets.filter((t) => t.status === 'selesai').length,
  };

  // Detail View
  if (selectedTicket) {
    const s = STATUS_MAP[selectedTicket.status];
    const p = PRIORITIES[selectedTicket.priority];

    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#6B3410]">Detail Tiket</h2>
            <p className="text-[#414844]/80 text-sm mt-1">{selectedTicket.ticket_number}</p>
          </div>
          <button
            onClick={() => setSelectedTicket(null)}
            className="px-4 py-2 bg-[#6B3410]/10 hover:bg-[#6B3410]/20 text-[#6B3410] text-sm font-bold rounded-lg transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali
          </button>
        </div>

        <div className="space-y-5">
          {/* Ticket Info */}
          <div className="bg-white rounded-xl border border-[#6B3410]/15 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#1F2A22] mb-2">{selectedTicket.title}</h3>
                <div className="flex flex-wrap gap-2">
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"
                    style={{ color: s.color, backgroundColor: s.bg }}
                  >
                    <span className="material-symbols-outlined text-[12px]">{s.icon}</span>
                    {s.label}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ color: p.color, backgroundColor: p.bg }}
                  >
                    Prioritas: {p.label}
                  </span>
                </div>
              </div>

              {/* Status Change Buttons */}
              <div className="flex flex-wrap gap-2">
                {selectedTicket.status !== 'baru' && (
                  <button
                    onClick={() => handleStatusChange('baru')}
                    disabled={changingStatus}
                    className="px-3 py-2 bg-[#6B3410]/10 hover:bg-[#6B3410]/20 text-[#6B3410] text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                  >
                    Set Baru
                  </button>
                )}
                {selectedTicket.status !== 'diproses' && (
                  <button
                    onClick={() => handleStatusChange('diproses')}
                    disabled={changingStatus}
                    className="px-3 py-2 bg-[#7A5900]/10 hover:bg-[#7A5900]/20 text-[#7A5900] text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                  >
                    Set Diproses
                  </button>
                )}
                {selectedTicket.status !== 'selesai' && (
                  <button
                    onClick={() => handleStatusChange('selesai')}
                    disabled={changingStatus}
                    className="px-3 py-2 bg-[#2E5E3B]/10 hover:bg-[#2E5E3B]/20 text-[#2E5E3B] text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                  >
                    Tutup Tiket
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-5 pb-5 border-b border-black/5">
              <div>
                <span className="text-[#414844]/60 block font-medium">User</span>
                <span className="font-bold text-[#1F2A22]">{selectedTicket.user?.name}</span>
                <span className="text-[10px] text-[#414844]/60 block">{selectedTicket.user?.email}</span>
              </div>
              <div>
                <span className="text-[#414844]/60 block font-medium">Kategori</span>
                <span className="font-bold text-[#1F2A22]">{selectedTicket.category}</span>
              </div>
              <div>
                <span className="text-[#414844]/60 block font-medium">Dibuat</span>
                <span className="font-bold text-[#1F2A22]">{formatDate(selectedTicket.created_at)}</span>
              </div>
              <div>
                <span className="text-[#414844]/60 block font-medium">Update Terakhir</span>
                <span className="font-bold text-[#1F2A22]">{formatDate(selectedTicket.updated_at)}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-[#414844]/60 uppercase tracking-wide mb-2">Pesan User</p>
              <div className="bg-[#F5F4EF] rounded-xl p-4 text-sm text-[#414844] leading-relaxed">
                {selectedTicket.message}
              </div>
            </div>
          </div>

          {/* Replies */}
          <div className="bg-white rounded-xl border border-[#6B3410]/15 shadow-sm p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#6B3410] uppercase tracking-wider mb-5">
              <span className="material-symbols-outlined text-[18px]">forum</span>
              Percakapan
            </h3>

            {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
              <div className="space-y-4 mb-6">
                {selectedTicket.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`rounded-xl p-4 border ${
                      reply.is_admin
                        ? 'bg-[#F5EBE1] border-[#6B3410]/20'
                        : 'bg-[#F5F4EF] border-black/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                          reply.is_admin ? 'bg-[#6B3410]' : 'bg-[#2E5E3B]'
                        }`}
                      >
                        {reply.is_admin ? 'A' : 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1F2A22]">
                          {reply.user?.name} {reply.is_admin && '(Admin)'}
                        </p>
                        <p className="text-[10px] text-[#414844]/60">{formatDate(reply.created_at)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#414844] leading-relaxed">{reply.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 mb-6">
                <span className="material-symbols-outlined text-[40px] text-[#6B3410]/20 mb-2 block">forum</span>
                <p className="text-sm text-[#414844]/60">Belum ada balasan.</p>
              </div>
            )}

            {/* Reply Form */}
            <div className="border-t border-black/5 pt-4">
              <p className="text-xs font-bold text-[#414844]/60 uppercase tracking-wide mb-2">Balas sebagai Admin</p>
              <form onSubmit={handleReply} className="space-y-3">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  required
                  rows={3}
                  placeholder="Tulis balasan Anda..."
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3410]/30 focus:border-[#6B3410] transition-all resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sendingReply || !replyMessage.trim()}
                    className="bg-[#6B3410] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-[#55290A] disabled:opacity-50 transition-all shadow-md shadow-[#6B3410]/15 flex items-center gap-2"
                  >
                    {sendingReply ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        Kirim Balasan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#6B3410]">Manajemen Tiket</h2>
        <p className="text-[#414844]/80 text-sm mt-1">Kelola dan tanggapi tiket bantuan dari pengguna.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#6B3410]/10 to-[#6B3410]/5 rounded-xl p-4 border border-[#6B3410]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#414844]/70">Total Tiket</span>
            <span className="material-symbols-outlined text-[#6B3410] text-[20px]">confirmation_number</span>
          </div>
          <p className="text-2xl font-bold text-[#6B3410]">{stats.total}</p>
        </div>

        <div className="bg-gradient-to-br from-[#6B3410]/10 to-[#6B3410]/5 rounded-xl p-4 border border-[#6B3410]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#414844]/70">Baru</span>
            <span className="material-symbols-outlined text-[#6B3410] text-[20px]">fiber_new</span>
          </div>
          <p className="text-2xl font-bold text-[#6B3410]">{stats.baru}</p>
        </div>

        <div className="bg-gradient-to-br from-[#7A5900]/10 to-[#7A5900]/5 rounded-xl p-4 border border-[#7A5900]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#414844]/70">Diproses</span>
            <span className="material-symbols-outlined text-[#7A5900] text-[20px]">pending</span>
          </div>
          <p className="text-2xl font-bold text-[#7A5900]">{stats.diproses}</p>
        </div>

        <div className="bg-gradient-to-br from-[#2E5E3B]/10 to-[#2E5E3B]/5 rounded-xl p-4 border border-[#2E5E3B]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#414844]/70">Selesai</span>
            <span className="material-symbols-outlined text-[#2E5E3B] text-[20px]">check_circle</span>
          </div>
          <p className="text-2xl font-bold text-[#2E5E3B]">{stats.selesai}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-[#FFDAD6] text-[#93000A] text-sm rounded-lg p-3">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-[#6B3410]/15 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-5 border-b border-[#6B3410]/15">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#414844]/40 text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Cari nomor tiket, judul, nama user, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#6B3410]/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3410]/30 focus:border-[#6B3410] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#414844]/40 hover:text-[#6B3410] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-[#414844]/60 mt-2">
              Menampilkan {filteredTickets.length} dari {tickets.length} hasil
            </p>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="p-5 border-b border-[#6B3410]/15 flex gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'baru', label: 'Baru' },
            { id: 'diproses', label: 'Diproses' },
            { id: 'selesai', label: 'Selesai' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSearchParams({ status: tab.id })}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-[#6B3410] text-white shadow-sm'
                  : 'bg-[#6B3410]/5 text-[#414844] hover:bg-[#6B3410]/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#6B3410]/5 text-[#414844] text-xs font-semibold">
                <th className="px-6 py-3 whitespace-nowrap">No. Tiket</th>
                <th className="px-6 py-3 whitespace-nowrap">User</th>
                <th className="px-6 py-3 whitespace-nowrap">Judul & Kategori</th>
                <th className="px-6 py-3 whitespace-nowrap">Status</th>
                <th className="px-6 py-3 whitespace-nowrap">Prioritas</th>
                <th className="px-6 py-3 whitespace-nowrap">Dibuat</th>
                <th className="px-6 py-3 whitespace-nowrap text-center">Balasan</th>
                <th className="px-6 py-3 whitespace-nowrap text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#6B3410]/10">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#6B3410]/20 border-t-[#6B3410]"></div>
                      <p className="text-sm text-[#414844]/70">Memuat data tiket...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-[48px] text-[#414844]/30">confirmation_number</span>
                      <p className="text-sm text-[#414844]/70 font-semibold">
                        {searchQuery ? `Tidak ditemukan hasil untuk "${searchQuery}"` : 'Tidak ada data tiket pada filter ini.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const s = STATUS_MAP[ticket.status];
                  const p = PRIORITIES[ticket.priority];
                  return (
                    <tr key={ticket.id} className="hover:bg-[#6B3410]/5 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-[#F5F4F0] px-2 py-1 rounded">{ticket.ticket_number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#6B3410]/10 flex items-center justify-center text-[#6B3410] font-bold text-xs">
                            {ticket.user?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-[#6B3410] text-sm">{ticket.user?.name}</p>
                            <p className="text-xs text-[#414844]/60">{ticket.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#1F2A22] text-sm mb-1">{ticket.title}</p>
                        <p className="text-xs text-[#414844]/60">{ticket.category}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1"
                          style={{ color: s.color, backgroundColor: s.bg }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }}></span>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{ color: p.color, backgroundColor: p.bg }}
                        >
                          {p.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-[#414844]/75">
                          <p className="font-semibold">
                            {new Date(ticket.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-[#414844]/50">
                            {new Date(ticket.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#6B3410]">
                          <span className="material-symbols-outlined text-[14px]">forum</span>
                          {ticket.replies?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="bg-[#6B3410]/10 hover:bg-[#6B3410]/20 text-[#6B3410] px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 mx-auto"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          Lihat
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
