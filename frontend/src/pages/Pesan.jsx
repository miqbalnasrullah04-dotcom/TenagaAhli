import { useState } from 'react';
import { useTranslation } from '../context/LanguageContext.jsx';
import DashboardLayout from '../components/DashboardLayout';

function formatTime(dateStr, t) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return t('message.time.just_now', 'Baru saja');
  if (mins < 60) return t('message.time.minutes_ago', '{minutes} menit lalu').replace('{minutes}', mins);
  if (hours < 24) return t('message.time.hours_ago', '{hours} jam lalu').replace('{hours}', hours);
  if (days < 7) return t('message.time.days_ago', '{days} hari lalu').replace('{days}', days);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function formatFullTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

const getDEMOCONVERSATIONS = (t) => [
  {
    id: 1,
    nama: 'PT Bangun Nusantara',
    avatar: 'B',
    avatarColor: '#6B3410',
    unread: 2,
    lastMessage: t('message.demo.last_message_1', 'Baik pak, kami tunggu revisi dokumen AMDAL-nya ya.'),
    lastTime: new Date(Date.now() - 30 * 60000).toISOString(),
    messages: [
      { id: 1, dari: 'klien', pesan: t('message.demo.msg_1_1', 'Selamat pagi, Pak. Kami ingin konsultasi tentang analisis dampak lingkungan untuk proyek baru kami.'), waktu: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: 2, dari: 'saya', pesan: t('message.demo.msg_1_2', 'Selamat pagi. Tentu, bisa dijelaskan terlebih dahulu detail proyeknya?'), waktu: new Date(Date.now() - 3 * 86400000 + 3600000).toISOString() },
      { id: 3, dari: 'klien', pesan: t('message.demo.msg_1_3', 'Kami berencana membangun gedung perkantoran 12 lantai di Jakarta Selatan. Lahan sekitar 2 hektar.'), waktu: new Date(Date.now() - 2 * 86400000).toISOString() },
      { id: 4, dari: 'saya', pesan: t('message.demo.msg_1_4', 'Baik, untuk proyek tersebut memerlukan dokumen AMDAL lengkap. Saya bisa buatkan proposal kerjasama terlebih dahulu.'), waktu: new Date(Date.now() - 2 * 86400000 + 1800000).toISOString() },
      { id: 5, dari: 'klien', pesan: t('message.demo.msg_1_5', 'Bagus, silakan kirim proposalnya. Apakah bisa juga termasuk analisis hidrologi?'), waktu: new Date(Date.now() - 86400000).toISOString() },
      { id: 6, dari: 'klien', pesan: t('message.demo.msg_1_6', 'Baik pak, kami tunggu revisi dokumen AMDAL-nya ya.'), waktu: new Date(Date.now() - 30 * 60000).toISOString() },
    ],
  },
  {
    id: 2,
    nama: t('message.demo.admin_name', 'Admin TenagaAhli.com'),
    avatar: 'A',
    avatarColor: '#2E5E3B',
    unread: 0,
    lastMessage: t('message.demo.last_message_2', 'Profil Anda telah diverifikasi. Selamat bergabung!'),
    lastTime: new Date(Date.now() - 5 * 86400000).toISOString(),
    messages: [
      { id: 1, dari: 'admin', pesan: t('message.demo.msg_2_1', 'Selamat datang di TenagaAhli.com! Profil Anda sedang kami review.'), waktu: new Date(Date.now() - 7 * 86400000).toISOString() },
      { id: 2, dari: 'admin', pesan: t('message.demo.msg_2_2', 'Profil Anda telah diverifikasi. Selamat bergabung!'), waktu: new Date(Date.now() - 5 * 86400000).toISOString() },
    ],
  },
  {
    id: 3,
    nama: t('message.demo.dinas_name', 'Dinas LH Kota Bogor'),
    avatar: 'D',
    avatarColor: '#EA580C',
    unread: 0,
    lastMessage: t('message.demo.last_message_3', 'Terima kasih atas pelatihannya, sangat bermanfaat untuk tim kami.'),
    lastTime: new Date(Date.now() - 10 * 86400000).toISOString(),
    messages: [
      { id: 1, dari: 'klien', pesan: t('message.demo.msg_3_1', 'Apakah Bapak bersedia menjadi narasumber pelatihan untuk staf kami?'), waktu: new Date(Date.now() - 20 * 86400000).toISOString() },
      { id: 2, dari: 'saya', pesan: t('message.demo.msg_3_2', 'Tentu, saya bersedia. Bisa diinfokan jadwal dan topik pelatihannya?'), waktu: new Date(Date.now() - 19 * 86400000).toISOString() },
      { id: 3, dari: 'klien', pesan: t('message.demo.msg_3_3', 'Terima kasih atas pelatihannya, sangat bermanfaat untuk tim kami.'), waktu: new Date(Date.now() - 10 * 86400000).toISOString() },
    ],
  },
];

function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-2xl border border-black/5 shadow-sm ${className}`}>{children}</div>;
}

export default function Pesan() {
  const { t } = useTranslation();
  const [conversations] = useState(getDEMOCONVERSATIONS(t));
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');

  const filteredConvos = search
    ? conversations.filter((c) => c.nama.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConvo) return;
    // In a real app this would send via API
    selectedConvo.messages.push({
      id: Date.now(),
      dari: 'saya',
      pesan: newMessage,
      waktu: new Date().toISOString(),
    });
    setNewMessage('');
  };

  return (
    <DashboardLayout title={t('Pesan')} subtitle={t('Kelola percakapan Anda dengan klien dan admin.')}>
      <div className="animate-fadeIn">
        <Card className="overflow-hidden">
          <div className="flex h-[65vh] min-h-[480px]">
            {/* ── Sidebar Conversation List ── */}
            <div
              className={`w-full sm:w-80 shrink-0 border-r border-black/5 flex flex-col ${
                selectedConvo ? 'hidden sm:flex' : 'flex'
              }`}
            >
              {/* Search */}
              <div className="p-4 border-b border-black/5">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#414844]/40 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder={t('Cari percakapan...')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B3410]/20 focus:border-[#6B3410] transition-all"
                  />
                </div>
                {totalUnread > 0 && (
                  <p className="text-[10px] text-[#6B3410] font-bold mt-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#6B3410] animate-pulse" />
                    {totalUnread} {t('pesan belum dibaca')}
                  </p>
                )}
              </div>

              {/* Conversation Items */}
              <div className="flex-1 overflow-y-auto">
                {filteredConvos.length === 0 ? (
                  <div className="p-8 text-center">
                    <span className="material-symbols-outlined text-[40px] text-[#6B3410]/20 mb-2 block">
                      chat_bubble_outline
                    </span>
                    <span className="text-sm text-[#414844]/60">{t('Tidak ada percakapan ditemukan')}</span>
                  </div>
                ) : (
                  filteredConvos.map((convo) => (
                    <button
                      key={convo.id}
                      onClick={() => setSelectedConvo(convo)}
                      className={`w-full text-left px-4 py-3.5 flex items-start gap-3 border-b border-black/3 transition-colors ${
                        selectedConvo?.id === convo.id
                          ? 'bg-[#6B3410]/5 border-l-3 border-l-[#6B3410]'
                          : 'hover:bg-black/2'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: convo.avatarColor }}
                      >
                        {convo.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-sm text-[#1F2A22] truncate">{convo.nama}</h4>
                          <span className="text-[10px] text-[#414844]/50 shrink-0">
                            {formatTime(convo.lastTime)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-[#414844]/60 truncate">{convo.lastMessage}</p>
                          {convo.unread > 0 && (
                            <span className="bg-[#6B3410] text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                              {convo.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* ── Chat Area ── */}
            {selectedConvo ? (
              <div className="flex-1 flex flex-col min-w-0">
                {/* Chat Header */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-black/5 bg-white">
                  <button
                    onClick={() => setSelectedConvo(null)}
                    className="sm:hidden p-1 text-[#414844]/60 hover:text-[#6B3410]"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  </button>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                    style={{ backgroundColor: selectedConvo.avatarColor }}
                  >
                    {selectedConvo.avatar}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-[#1F2A22] truncate">{selectedConvo.nama}</h4>
                    <p className="text-[10px] text-[#414844]/50">
                      {selectedConvo.messages.length} pesan
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#F9FAFB]">
                  {selectedConvo.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.dari === 'saya' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                          msg.dari === 'saya'
                            ? 'bg-[#6B3410] text-white rounded-br-md'
                            : msg.dari === 'admin'
                            ? 'bg-[#E3F2E7] text-[#1F2A22] rounded-bl-md'
                            : 'bg-white text-[#1F2A22] border border-black/5 rounded-bl-md shadow-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.pesan}</p>
                        <p
                          className={`text-[10px] mt-1.5 ${
                            msg.dari === 'saya' ? 'text-white/60' : 'text-[#414844]/40'
                          }`}
                        >
                          {formatFullTime(msg.waktu)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSend} className="px-5 py-3.5 border-t border-black/5 bg-white">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder={t('Ketik pesan...')}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 border border-black/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3410]/20 focus:border-[#6B3410] transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-[#6B3410] text-white p-2.5 rounded-xl hover:bg-[#55290A] disabled:opacity-40 transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[20px]">send</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* No conversation selected */
              <div className="flex-1 hidden sm:flex flex-col items-center justify-center text-center px-8">
                <span className="material-symbols-outlined text-[72px] text-[#6B3410]/15 mb-4">chat</span>
                <h3 className="text-lg font-bold text-[#1F2A22] mb-2">{t('Pilih percakapan')}</h3>
                <p className="text-sm text-[#414844]/60 max-w-xs">
                  {t('Pilih percakapan dari daftar di samping atau mulai percakapan baru untuk berkomunikasi dengan klien dan admin.')}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
