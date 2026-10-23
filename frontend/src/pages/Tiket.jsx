import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import { SkeletonTiket } from '../components/Skeleton.jsx';

const getPRIORITIES = (t) => ({
  rendah: { label: t('ticket.priority.low', 'Rendah'), color: '#2E5E3B', bg: '#E3F2E7' },
  sedang: { label: t('ticket.priority.medium', 'Sedang'), color: '#7A5900', bg: '#FFF4D6' },
  tinggi: { label: t('ticket.priority.high', 'Tinggi'), color: '#B3261E', bg: '#FFDAD6' },
});

const getSTATUSMAP = (t) => ({
  baru: { label: t('ticket.status.new', 'Baru'), color: '#6B3410', bg: '#F5EBE1' },
  diproses: { label: t('ticket.status.processing', 'Diproses'), color: '#7A5900', bg: '#FFF4D6' },
  selesai: { label: t('ticket.status.completed', 'Selesai'), color: '#2E5E3B', bg: '#E3F2E7' },
});

const getKATEGORIOPTIONS = (t) => [
  t('ticket.category.login_account', 'Masalah Login / Akun'),
  t('ticket.category.upload_document', 'Upload Dokumen Gagal'),
  t('ticket.category.verification_status', 'Status Verifikasi'),
  t('ticket.category.payment_invoice', 'Pembayaran & Invoice'),
  t('ticket.category.profile_change', 'Perubahan Data Profil'),
  t('ticket.category.bug_system', 'Bug / Error Sistem'),
  t('ticket.category.other', 'Lainnya'),
];

function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-2xl border border-black/5 shadow-sm ${className}`}>{children}</div>;
}

function SectionTitle({ icon, children }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-bold text-[#6B3410] uppercase tracking-wider border-b border-black/5 pb-3 mb-5">
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {children}
    </h3>
  );
}

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

export default function Tiket() {
  const { t } = useTranslation();
  const PRIORITIES = getPRIORITIES(t);
  const STATUS_MAP = getSTATUSMAP(t);
  const KATEGORI_OPTIONS = getKATEGORIOPTIONS(t);
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('daftar'); // daftar | buat
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filter, setFilter] = useState('semua');

  // Form state
  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState('');
  const [prioritas, setPrioritas] = useState('sedang');
  const [pesan, setPesan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  // Reply state
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Load tickets from API
  const loadTickets = () => {
    setLoading(true);
    setError('');
    api
      .get('/tickets')
      .then((res) => {
        setTickets(res.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || t('ticket.error.load_failed', 'Gagal memuat data tiket.'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = filter === 'semua' ? tickets : tickets.filter((tk) => tk.status === filter);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!judul.trim() || !kategori || !pesan.trim()) return;
    setSubmitting(true);
    setError('');

    api
      .post('/tickets', {
        title: judul,
        category: kategori,
        priority: prioritas,
        message: pesan,
      })
      .then((res) => {
        setTickets((prev) => [res.data, ...prev]);
        setJudul('');
        setKategori('');
        setPrioritas('sedang');
        setPesan('');
        setSuccess('Tiket berhasil dikirim! Tim kami akan segera merespons.');
        setTimeout(() => {
          setSuccess('');
          setActiveTab('daftar');
        }, 2500);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Gagal mengirim tiket.');
      })
      .finally(() => setSubmitting(false));
  };

  const handleReply = (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;
    setSendingReply(true);

    api
      .post(`/tickets/${selectedTicket.id}/reply`, {
        message: replyMessage,
      })
      .then((res) => {
        setSelectedTicket((prev) => ({
          ...prev,
          replies: [...prev.replies, res.data],
        }));
        setReplyMessage('');
        // Refresh tickets list
        loadTickets();
      })
      .catch((err) => {
        alert(err.response?.data?.message || 'Gagal mengirim balasan.');
      })
      .finally(() => setSendingReply(false));
  };

  // Detail View
  if (selectedTicket) {
    const s = STATUS_MAP[selectedTicket.status];
    const p = PRIORITIES[selectedTicket.priority];
    return (
      <DashboardLayout
        title={t('Detail Tiket')}
        subtitle={selectedTicket.ticket_number}
        headerRight={
          <button
            onClick={() => setSelectedTicket(null)}
            className="text-sm font-bold text-[#6B3410] hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            {t('Kembali')}
          </button>
        }
      >
        <div className="space-y-4 sm:space-y-5 animate-fadeIn">
          {/* Ticket Info */}
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
              <h2 className="text-base sm:text-lg font-bold text-[#1F2A22]">{selectedTicket.title}</h2>
              <div className="flex gap-2 shrink-0">
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ color: s.color, backgroundColor: s.bg }}
                >
                  {s.label}
                </span>
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ color: p.color, backgroundColor: p.bg }}
                >
                  {t('Prioritas')} {p.label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs mb-4 sm:mb-5">
              <div>
                <span className="text-[#414844]/60 block font-medium">{t('ID Tiket')}</span>
                <span className="font-bold text-[#1F2A22]">{selectedTicket.ticket_number}</span>
              </div>
              <div>
                <span className="text-[#414844]/60 block font-medium">{t('Kategori')}</span>
                <span className="font-bold text-[#1F2A22]">{selectedTicket.category}</span>
              </div>
              <div>
                <span className="text-[#414844]/60 block font-medium">{t('Dibuat')}</span>
                <span className="font-bold text-[#1F2A22]">{formatDate(selectedTicket.created_at)}</span>
              </div>
              <div>
                <span className="text-[#414844]/60 block font-medium">{t('Update Terakhir')}</span>
                <span className="font-bold text-[#1F2A22]">{formatDate(selectedTicket.updated_at)}</span>
              </div>
            </div>

            <div className="border-t border-black/5 pt-4">
              <p className="text-xs font-bold text-[#414844]/60 uppercase tracking-wide mb-2">{t('Pesan Anda')}</p>
              <div className="bg-[#F5F4EF] rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm text-[#414844] leading-relaxed">
                {selectedTicket.message}
              </div>
            </div>
          </Card>

          {/* Balasan */}
          <Card className="p-4 sm:p-6">
            <SectionTitle icon="forum">{t('Balasan')}</SectionTitle>
            {selectedTicket.replies.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-[40px] text-[#6B3410]/20 mb-2 block">forum</span>
                <p className="text-sm text-[#414844]/60">{t('Belum ada balasan. Tim kami akan segera merespons.')}</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {selectedTicket.replies.map((b) => (
                  <div
                    key={b.id}
                    className={`rounded-xl p-4 border ${
                      b.is_admin
                        ? 'bg-[#F5EBE1] border-[#6B3410]/20'
                        : 'bg-[#F5F4EF] border-black/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                          b.is_admin ? 'bg-[#6B3410]' : 'bg-[#2E5E3B]'
                        }`}
                      >
                        {b.is_admin ? 'A' : 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1F2A22]">{b.user?.name || 'User'}</p>
                        <p className="text-[10px] text-[#414844]/60">{formatDate(b.created_at)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#414844] leading-relaxed">{b.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Form - Only if ticket not closed */}
            {selectedTicket.status !== 'selesai' && (
              <div className="border-t border-black/5 pt-4 mt-4">
                <p className="text-xs font-bold text-[#414844]/60 uppercase tracking-wide mb-2">{t('Tambah Balasan')}</p>
                <form onSubmit={handleReply} className="space-y-3">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    required
                    rows={3}
                    placeholder={t('Tulis balasan Anda...')}
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
                          {t('Mengirim...')}
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">send</span>
                          {t('Kirim Balasan')}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (loading && tickets.length === 0) {
    return (
      <DashboardLayout title={t('Tiket Bantuan')} subtitle={t('Sampaikan kendala atau pertanyaan teknis ke tim Admin.')}>
        <SkeletonTiket />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t('Tiket Bantuan')} subtitle={t('Sampaikan kendala atau pertanyaan teknis ke tim Admin.')}>
      {error && (
        <div className="mb-4 bg-[#FFDAD6] text-[#93000A] text-sm rounded-xl p-4 flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">error</span>
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4 sm:space-y-5 animate-fadeIn">
        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
          <button
            onClick={() => setActiveTab('daftar')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'daftar'
                ? 'bg-[#6B3410] text-white shadow-md shadow-[#6B3410]/15'
                : 'bg-white text-[#414844] border border-black/10 hover:bg-[#6B3410]/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">list_alt</span>
            {t('Daftar Tiket')}
          </button>
          <button
            onClick={() => { setActiveTab('buat'); setSuccess(''); setError(''); }}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'buat'
                ? 'bg-[#6B3410] text-white shadow-md shadow-[#6B3410]/15'
                : 'bg-white text-[#414844] border border-black/10 hover:bg-[#6B3410]/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            {t('Buat Tiket Baru')}
          </button>
        </div>

        {/* ── DAFTAR TIKET ── */}
        {activeTab === 'daftar' && (
          <Card className="overflow-hidden">
            {/* Filter */}
            <div className="p-3.5 sm:p-5 border-b border-black/5 flex gap-1.5 sm:gap-2 flex-wrap">
              {['semua', 'baru', 'diproses', 'selesai'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-colors capitalize ${
                    filter === f
                      ? 'bg-[#6B3410] text-white'
                      : 'bg-[#6B3410]/5 text-[#414844] hover:bg-[#6B3410]/10'
                  }`}
                >
                  {f === 'semua' ? t('Semua') : STATUS_MAP[f]?.label || f}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="divide-y divide-black/5 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="px-5 py-4 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-4 bg-gray-200 rounded w-20" />
                        <div className="h-4 bg-gray-200 rounded w-48" />
                      </div>
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-[56px] text-[#6B3410]/20 mb-3 block">
                  confirmation_number
                </span>
                <h3 className="text-base font-bold text-[#1F2A22] mb-1">{t('Tidak ada tiket')}</h3>
                <p className="text-sm text-[#414844]/60 mb-4">
                  {t('Anda belum memiliki tiket bantuan')}{filter !== 'semua' ? ` dengan status "${STATUS_MAP[filter]?.label}"` : ''}.
                </p>
                <button
                  onClick={() => setActiveTab('buat')}
                  className="text-sm font-bold text-[#6B3410] hover:underline inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  {t('Buat tiket baru')}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {filteredTickets.map((ticket) => {
                  const s = STATUS_MAP[ticket.status];
                  const p = PRIORITIES[ticket.priority];
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className="w-full text-left px-5 py-4 hover:bg-[#6B3410]/3 transition-colors flex items-start gap-4"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: s.bg, color: s.color }}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {ticket.status === 'selesai'
                            ? 'check_circle'
                            : ticket.status === 'diproses'
                            ? 'pending'
                            : 'fiber_new'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-bold text-sm text-[#1F2A22] truncate">{ticket.title}</h4>
                          <span className="text-[9px] font-bold text-[#414844]/50">{ticket.ticket_number}</span>
                        </div>
                        <p className="text-xs text-[#414844]/70 mb-2 line-clamp-1">{ticket.message}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{ color: s.color, backgroundColor: s.bg }}
                          >
                            {s.label}
                          </span>
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{ color: p.color, backgroundColor: p.bg }}
                          >
                            {p.label}
                          </span>
                          <span className="text-[10px] text-[#414844]/50">{formatDate(ticket.created_at)}</span>
                          {ticket.replies && ticket.replies.length > 0 && (
                            <span className="text-[10px] text-[#6B3410] font-bold flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[12px]">reply</span>
                              {ticket.replies.length} {t('balasan')}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[20px] text-[#414844]/30 shrink-0 mt-2">
                        chevron_right
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* ── BUAT TIKET BARU ── */}
        {activeTab === 'buat' && (
          <Card className="p-4 sm:p-6">
            <SectionTitle icon="edit_note">{t('Formulir Tiket Baru')}</SectionTitle>

            {success && (
              <div className="flex items-start gap-2 bg-[#E3F2E7] text-[#2E5E3B] text-sm rounded-xl p-3.5 sm:p-4 mb-4 sm:mb-5">
                <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">check_circle</span>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-[#414844]/60 block mb-1.5">
                  {t('Judul Tiket *')}
                </label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  required
                  placeholder={t('Contoh: Gagal upload dokumen CV')}
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3410]/30 focus:border-[#6B3410] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-[#414844]/60 block mb-1.5">
                    {t('Kategori *')}
                  </label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    required
                    className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6B3410]/30 focus:border-[#6B3410] transition-all"
                  >
                    <option value="">{t('Pilih kategori...')}</option>
                    {KATEGORI_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-[#414844]/60 block mb-1.5">
                    {t('Prioritas')}
                  </label>
                  <div className="flex gap-2">
                    {Object.entries(PRIORITIES).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPrioritas(key)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                          prioritas === key
                            ? 'border-current shadow-sm'
                            : 'border-transparent bg-black/3 hover:bg-black/5'
                        }`}
                        style={
                          prioritas === key
                            ? { color: val.color, backgroundColor: val.bg, borderColor: val.color + '40' }
                            : {}
                        }
                      >
                        {val.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-[#414844]/60 block mb-1.5">
                  {t('Deskripsi Masalah *')}
                </label>
                <textarea
                  value={pesan}
                  onChange={(e) => setPesan(e.target.value)}
                  required
                  rows={5}
                  placeholder={t('Jelaskan kendala yang Anda alami secara detail...')}
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3410]/30 focus:border-[#6B3410] transition-all resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto bg-[#6B3410] text-white text-sm font-bold px-8 py-3 rounded-xl hover:bg-[#55290A] disabled:opacity-50 transition-all shadow-md shadow-[#6B3410]/15 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('Mengirim...')}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      {t('Kirim Tiket')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
