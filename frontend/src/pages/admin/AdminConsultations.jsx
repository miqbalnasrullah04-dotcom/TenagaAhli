import { useEffect, useState } from 'react';
import { useTranslation } from '../../context/LanguageContext.jsx';
import api from '../../api/client.js';

export default function AdminConsultations() {
  const { t } = useTranslation();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  
  // Modal Set Zoom State
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [zoomLink, setZoomLink] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [previewProofModal, setPreviewProofModal] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  const handleVerifyPayment = async (consultationId) => {
    try {
      setVerifyingId(consultationId);
      const res = await api.post(`/admin/consultations/${consultationId}/verify-payment`);
      setFeedback({
        type: 'success',
        message: res.data?.message || 'Pembayaran konsultasi berhasil diverifikasi dan disetujui!',
      });
      if (previewProofModal) setPreviewProofModal(null);
      fetchConsultations();
    } catch (err) {
      console.error('Verify payment error:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal memverifikasi pembayaran.',
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/consultations', {
        params: filterStatus !== 'all' ? { status: filterStatus } : {},
      });
      if (res.data?.success) {
        setConsultations(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching consultations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, [filterStatus]);

  const openSetZoomModal = (c) => {
    setSelectedConsultation(c);
    setZoomLink(c.zoom_link || '');
    setMeetingId(c.zoom_meeting_id || '');
    setPasscode(c.zoom_passcode || '');
    setDurationMinutes(c.duration_minutes || 30);
    setShowModal(true);
  };

  const handleSaveZoom = async (e) => {
    e.preventDefault();
    if (!selectedConsultation) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await api.post(`/admin/consultations/${selectedConsultation.id}/set-zoom`, {
        zoom_link: zoomLink.trim(),
        zoom_meeting_id: meetingId.trim(),
        zoom_passcode: passcode.trim(),
        duration_minutes: Number(durationMinutes) || 30,
      });

      setFeedback({
        type: 'success',
        message: res.data?.message || 'Link Zoom (Durasi 30 Menit) berhasil disimpan dan dikirimkan ke Tenaga Ahli & Klien!',
      });
      setShowModal(false);
      setSelectedConsultation(null);
      fetchConsultations();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menyimpan link Zoom.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = consultations.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (c.client_name || '').toLowerCase().includes(q) ||
        (c.expert_name || '').toLowerCase().includes(q) ||
        (c.topic || '').toLowerCase().includes(q) ||
        (c.ref || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2A22]">Kelola Sesi Konsultasi & Link Zoom</h1>
          <p className="text-sm text-[#5B6660]">
            Admin menyiapkan dan membagikan ruang rapat resmi Zoom Meeting (Durasi 30 Menit) ke Tenaga Ahli dan Klien
          </p>
        </div>
        <button
          onClick={fetchConsultations}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E2D9] rounded-xl text-sm font-semibold text-[#1F2A22] hover:bg-[#FAF9F6] transition-colors self-start shadow-sm"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Segarkan Data
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">
              {feedback.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {feedback.message}
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E2D9] pb-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'Semua Sesi' },
            { id: 'confirmed', label: 'Terkonfirmasi' },
            { id: 'pending', label: 'Menunggu' },
            { id: 'selesai', label: 'Selesai' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                filterStatus === tab.id
                  ? 'bg-[#0284C7] text-white shadow-sm'
                  : 'bg-white border border-[#E5E2D9] text-[#5B6660] hover:bg-[#FAF9F6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari ahli, klien, topik..."
          className="px-4 py-2 text-xs sm:text-sm rounded-xl border border-[#E5E2D9] focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white w-full sm:w-64"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E5E2D9] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#5B6660]">
            <span className="material-symbols-outlined animate-spin text-3xl mb-2 text-[#0284C7]">progress_activity</span>
            <p className="text-sm">Memuat jadwal konsultasi...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center text-[#5B6660]">
            <span className="material-symbols-outlined text-4xl mb-2 text-gray-400">videocam</span>
            <p className="text-sm font-semibold">Tidak ada jadwal konsultasi</p>
            <p className="text-xs text-gray-400 mt-1">Sesi konsultasi yang diajukan pengguna akan muncul di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF9F6] border-b border-[#E5E2D9] text-xs font-bold text-[#5B6660] uppercase">
                <tr>
                  <th className="px-5 py-3.5">Ref / Tanggal</th>
                  <th className="px-5 py-3.5">Klien & Pemohon</th>
                  <th className="px-5 py-3.5">Tenaga Ahli</th>
                  <th className="px-5 py-3.5">Topik Diskusi</th>
                  <th className="px-5 py-3.5">Status Pembayaran</th>
                  <th className="px-5 py-3.5 text-center">Status Zoom (30 Menit)</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2D9]">
                {filteredData.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF9F6]/60 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#1F2A22]">{c.ref}</p>
                      <p className="text-xs text-[#0284C7] font-semibold">
                        {c.consultation_date} • {(c.consultation_time || '').replace(/\s*WIB/gi, '').trim()} WIB
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#1F2A22]">{c.client_name}</p>
                      <p className="text-xs text-[#5B6660]">{c.client_email || '-'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#1F2A22]">{c.expert_name}</p>
                      <p className="text-xs text-[#5B6660]">{c.expert_phone || '-'}</p>
                    </td>
                    <td className="px-5 py-4 max-w-[200px]">
                      <p className="text-xs font-semibold text-[#1F2A22] line-clamp-2">{c.topic || '-'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="font-extrabold text-[#1F2A22] text-xs">
                          Rp {Number(c.amount || 0).toLocaleString('id-ID')}
                        </div>
                        <div className="text-[11px] text-[#5B6660]">
                          {c.payment_method === 'manual' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-blue-800">
                              <span className="material-symbols-outlined text-[13px]">account_balance</span>
                              <span>Transfer ({c.bank_name || 'Bank'})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                              <span className="material-symbols-outlined text-[13px]">qr_code_2</span>
                              <span>Midtrans</span>
                            </span>
                          )}
                        </div>
                        <div>
                          {c.payment_status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <span className="material-symbols-outlined text-[12px]">check_circle</span>
                              Lunas
                            </span>
                          ) : c.payment_status === 'menunggu_verifikasi' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              <span className="material-symbols-outlined text-[12px]">hourglass_top</span>
                              Menunggu Verifikasi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <span className="material-symbols-outlined text-[12px]">pending</span>
                              Belum Bayar
                            </span>
                          )}
                        </div>
                        {c.payment_proof_url && (
                          <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setPreviewProofModal(c)}
                              className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded border border-blue-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[12px]">visibility</span>
                              Lihat Bukti
                            </button>
                            {c.payment_status !== 'paid' && (
                              <button
                                type="button"
                                disabled={verifyingId === c.id}
                                onClick={() => handleVerifyPayment(c.id)}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded shadow-2xs transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-[12px]">check</span>
                                {verifyingId === c.id ? 'Memproses...' : 'Setujui'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {c.zoom_link ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">videocam</span>
                            Siap ({c.duration_minutes || 30} Min)
                          </span>
                          <a
                            href={c.zoom_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#0284C7] underline mt-1 font-semibold hover:text-[#0369A1]"
                          >
                            Buka Link Zoom &rarr;
                          </a>
                        </div>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          ⏳ Belum Ada Link
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => openSetZoomModal(c)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 mx-auto ${
                          c.zoom_link
                            ? 'bg-white border border-[#0284C7] text-[#0284C7] hover:bg-blue-50'
                            : 'bg-[#0284C7] hover:bg-[#0369A1] text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">link</span>
                        {c.zoom_link ? 'Ubah Link Zoom' : 'Set Link Zoom'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL SET ZOOM */}
      {showModal && selectedConsultation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E2D9]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2D9]">
              <h3 className="text-lg font-bold text-[#1F2A22] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0284C7]">videocam</span>
                Atur Ruang Zoom Meeting (30 Menit)
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveZoom} className="mt-4 space-y-4">
              <div className="bg-[#F0F9FF] p-4 rounded-xl border border-[#BAE6FD] text-xs space-y-1.5 text-[#0C4A6E]">
                <div className="flex justify-between">
                  <span className="text-[#0369A1]">Sesi / Topik:</span>
                  <strong className="text-right max-w-[240px] truncate">{selectedConsultation.topic}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0369A1]">Tenaga Ahli:</span>
                  <strong>{selectedConsultation.expert_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0369A1]">Klien:</span>
                  <strong>{selectedConsultation.client_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0369A1]">Jadwal:</span>
                  <strong>{selectedConsultation.consultation_date} pukul {(selectedConsultation.consultation_time || '').replace(/\s*WIB/gi, '').trim()} WIB</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2A22] uppercase tracking-wider mb-1">
                  Link Zoom Meeting (Join URL) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={zoomLink}
                  onChange={(e) => setZoomLink(e.target.value)}
                  placeholder="https://us05web.zoom.us/j/1234567890?pwd=..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E2D9] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1F2A22] uppercase tracking-wider mb-1">
                    Meeting ID (Opsional)
                  </label>
                  <input
                    type="text"
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                    placeholder="Contoh: 842 1892 4891"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1F2A22] uppercase tracking-wider mb-1">
                    Passcode (Opsional)
                  </label>
                  <input
                    type="text"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Contoh: 123456"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2A22] uppercase tracking-wider mb-1">
                  Durasi Sesi Konsultasi
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-24 px-3.5 py-2 rounded-xl border border-[#E5E2D9] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                  />
                  <span className="text-sm font-semibold text-[#5B6660]">Menit (Standar: 30 Menit)</span>
                </div>
              </div>

              <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E5E2D9] text-xs text-[#5B6660]">
                ℹ️ Saat Anda menyimpan link ini, sistem akan <strong>otomatis mengirimkan email notifikasi</strong> ke Tenaga Ahli dan Klien, serta memunculkan tombol <strong>"🎥 Masuk Ruang Zoom"</strong> di dashboard mereka.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E2D9]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E2D9] text-sm font-semibold text-[#5B6660] hover:bg-[#FAF9F6]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !zoomLink.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan & Kirim ke Tenaga Ahli & Klien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LIHAT BUKTI TRANSFER & SETUJUI */}
      {previewProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">receipt_long</span>
                Bukti Transfer: {previewProofModal.ref}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewProofModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-500">Klien:</span>
                  <div className="font-bold text-gray-900">{previewProofModal.client_name}</div>
                </div>
                <div>
                  <span className="text-gray-500">Total Tagihan:</span>
                  <div className="font-extrabold text-[#8B4513]">
                    Rp {Number(previewProofModal.amount || 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Bank Tujuan:</span>
                  <div className="font-bold text-gray-900">{previewProofModal.bank_name || 'Bank Transfer'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Status Saat Ini:</span>
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      previewProofModal.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {previewProofModal.payment_status === 'paid' ? 'Lunas' : 'Menunggu Verifikasi'}
                    </span>
                  </div>
                </div>
              </div>

              {/* File Image/PDF Viewer */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-900/5 max-h-[380px] flex items-center justify-center p-2">
                {previewProofModal.payment_proof_url ? (
                  previewProofModal.payment_proof_url.endsWith('.pdf') ? (
                    <div className="py-8 text-center space-y-2">
                      <span className="material-symbols-outlined text-4xl text-rose-600">picture_as_pdf</span>
                      <p className="text-xs text-gray-600">Dokumen PDF Bukti Transfer</p>
                      <a
                        href={previewProofModal.payment_proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-xs"
                      >
                        Buka Dokumen PDF &rarr;
                      </a>
                    </div>
                  ) : (
                    <img
                      src={previewProofModal.payment_proof_url}
                      alt="Bukti Transfer"
                      className="max-h-[350px] w-auto object-contain rounded-lg"
                    />
                  )
                ) : (
                  <p className="text-xs text-gray-400 py-8">Tidak ada file bukti</p>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-100 gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewProofModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Tutup
                </button>
                {previewProofModal.payment_status !== 'paid' && (
                  <button
                    type="button"
                    disabled={verifyingId === previewProofModal.id}
                    onClick={() => handleVerifyPayment(previewProofModal.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>{verifyingId === previewProofModal.id ? 'Memverifikasi...' : 'Setujui & Tandai Lunas'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
