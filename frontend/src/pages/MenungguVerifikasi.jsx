import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client.js';

export default function MenungguVerifikasi() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('pending'); // 'pending' | 'approved' | 'rejected'
  const [rejectReason, setRejectReason] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  // Auto-polling setiap 60 detik saat halaman terbuka
  const pollRef = useRef(null);
  
  // Ambil email: prioritas dari state navigasi (baru daftar),
  // fallback ke localStorage (kalau halaman di-refresh).
  useEffect(() => {
    const emailFromState = location.state?.email;

    if (emailFromState) {
      setEmail(emailFromState);
      localStorage.setItem('amdal_pending_email', emailFromState);
      return;
    }

    const savedEmail = localStorage.getItem('amdal_pending_email');
    if (!savedEmail) {
      navigate('/daftar');
      return;
    }
    setEmail(savedEmail);
  }, [location.state, navigate]);

  // Auto-polling setiap 60 detik (hanya ketika status masih pending)
  useEffect(() => {
    if (!email || status !== 'pending') return;

    const doCheck = async () => {
      try {
        const res = await api.get('/register/status', { params: { email } });
        const data = res.data;
        if (data.status === 'approved') {
          setStatus('approved');
          localStorage.removeItem('amdal_pending_email');
        } else if (data.status === 'rejected') {
          setStatus('rejected');
          setRejectReason(data.reason || '');
        }
      } catch (_) {
        // Abaikan error polling otomatis — tidak perlu tampilkan ke user
      }
    };

    // Cek pertama kali saat email tersedia
    doCheck();

    pollRef.current = setInterval(doCheck, 60_000);
    return () => clearInterval(pollRef.current);
  }, [email, status]);

  // Auto-redirect ke login setelah akun disetujui (delay 2 detik untuk user baca pesan)
  useEffect(() => {
    if (status === 'approved') {
      const timer = setTimeout(() => {
        navigate('/sign-in', { state: { message: 'Akun Anda telah diverifikasi! Silakan login.' } });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  const handleCekStatus = async () => {
    if (!email) return;
    setChecking(true);
    setError('');
    try {
      const res = await api.get('/register/status', { params: { email } });
      const data = res.data;

      if (data.status === 'approved') {
        setStatus('approved');
        localStorage.removeItem('amdal_pending_email');
      } else if (data.status === 'rejected') {
        setStatus('rejected');
        setRejectReason(data.reason || '');
      } else {
        setStatus('pending');
      }
    } catch (err) {
      console.error('Cek status error:', err);
      if (!err.response) {
        setError('Tidak bisa terhubung ke server.');
      } else {
        setError(err.response?.data?.message || 'Gagal memeriksa status. Coba lagi nanti.');
      }
    } finally {
      setChecking(false);
    }
  };

  const handleDaftarUlang = () => {
    localStorage.removeItem('amdal_pending_email');
    navigate('/daftar');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="font-headline-md text-xl font-bold text-[#6B3410] block mb-10">
          TenagaAhli<span className="text-[#C89368]">.com</span>
        </Link>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STATUS: MENUNGGU                                       */}
        {/* ═══════════════════════════════════════════════════════ */}
        {status === 'pending' && (
          <div className="animate-fadeIn">
            <div className="w-24 h-24 bg-[#F5EBE1] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl text-[#6B3410]">hourglass_top</span>
            </div>
            <h1 className="text-2xl font-bold text-on-background mb-2">Menunggu Verifikasi Admin</h1>

            <p className="text-sm text-on-surface-variant leading-relaxed mb-1">
              Pendaftaran Anda dengan email
            </p>
            <p className="text-sm font-bold text-[#6B3410] mb-4">{email}</p>

            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              sedang ditinjau oleh tim TenagaAhli.com. Proses verifikasi biasanya memakan waktu{' '}
              <strong>1–3 hari kerja</strong>.
            </p>

            {/* Info email otomatis */}
            <div className="bg-[#F5EBE1] border border-[#8B4513]/30 rounded-xl p-4 mb-6 flex gap-3 text-left">
              <span className="material-symbols-outlined text-[#6B3410] text-[20px] shrink-0 mt-0.5">mark_email_read</span>
              <div className="text-sm text-[#075985] leading-relaxed">
                <p className="font-semibold mb-1">Notifikasi via Email</p>
                <p>
                  Kami akan mengirimkan email ke <strong>{email}</strong> segera setelah akun Anda
                  disetujui atau jika ada perbaikan yang diperlukan. Periksa juga folder{' '}
                  <em>Spam/Junk</em> jika email tidak masuk ke kotak masuk.
                </p>
              </div>
            </div>

            {error && (
              <p className="bg-error-container text-on-error-container text-sm rounded-lg px-4 py-3 mb-5 text-left flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">error</span>
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleCekStatus}
              disabled={checking}
              className="w-full bg-[#8B4513] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#6B3410] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mb-3"
            >
              {checking ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Memeriksa...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Cek Status Sekarang
                </>
              )}
            </button>

            <Link
              to="/"
              className="flex items-center justify-center gap-1.5 border border-outline-variant/50 text-on-surface-variant py-3 rounded-lg text-sm font-semibold hover:bg-surface-container-low hover:text-on-background transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Kembali ke Beranda
            </Link>

            <p className="text-xs text-on-surface-variant/50 mt-5">
              Halaman ini otomatis memperbarui status setiap 60 detik.
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STATUS: DISETUJUI                                      */}
        {/* ═══════════════════════════════════════════════════════ */}
        {status === 'approved' && (
          <div className="animate-fadeIn">
            <div className="w-24 h-24 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl text-[#166534]">how_to_reg</span>
            </div>
            <h1 className="text-2xl font-bold text-on-background mb-2">Akun Anda Disetujui!</h1>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
              Selamat, pendaftaran Anda telah diverifikasi oleh admin.
            </p>

            <div className="bg-[#DCFCE7] border border-[#86EFAC] rounded-xl p-4 mb-6 flex gap-3 text-left">
              <span className="material-symbols-outlined text-[#166534] text-[20px] shrink-0 mt-0.5">mark_email_read</span>
              <div className="text-sm text-[#14532D] leading-relaxed">
                <p className="font-semibold mb-1">Email konfirmasi telah dikirim</p>
                <p>
                  Kami sudah mengirimkan email konfirmasi ke <strong>{email}</strong>. Kini Anda
                  dapat masuk dan mulai melengkapi profil Anda.
                </p>
              </div>
            </div>

            <div className="bg-[#F5EBE1] border border-[#8B4513]/30 rounded-xl p-4 mb-6 flex gap-3 text-left">
              <span className="material-symbols-outlined text-[#6B3410] text-[20px] shrink-0 mt-0.5 animate-spin">sync</span>
              <div className="text-sm text-[#075985] leading-relaxed">
                <p className="font-semibold">Mengarahkan ke halaman login...</p>
              </div>
            </div>

            <Link
              to="/sign-in"
              className="w-full inline-block bg-[#8B4513] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#6B3410] active:scale-[0.99] transition-all text-center"
            >
              Masuk Sekarang
            </Link>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STATUS: DITOLAK                                        */}
        {/* ═══════════════════════════════════════════════════════ */}
        {status === 'rejected' && (
          <div className="animate-fadeIn">
            <div className="w-24 h-24 bg-error-container rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl text-on-error-container">cancel</span>
            </div>
            <h1 className="text-2xl font-bold text-on-background mb-2">Perlu Perbaikan Data</h1>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
              Mohon maaf, pendaftaran Anda belum dapat kami setujui.
            </p>

            {rejectReason && (
              <div className="bg-error-container border border-red-200 border-l-4 border-l-red-500 rounded-r-xl px-4 py-3 mb-4 text-left">
                <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">Catatan dari Admin</p>
                <p className="text-sm text-on-error-container leading-relaxed">{rejectReason}</p>
              </div>
            )}

            <div className="bg-[#FFF7ED] border border-orange-200 rounded-xl p-4 mb-8 flex gap-3 text-left">
              <span className="material-symbols-outlined text-orange-500 text-[20px] shrink-0 mt-0.5">mark_email_read</span>
              <div className="text-sm text-orange-800 leading-relaxed">
                <p className="font-semibold mb-1">Email notifikasi telah dikirim</p>
                <p>
                  Detail penolakan dan panduan perbaikan sudah dikirim ke <strong>{email}</strong>.
                  Silakan periksa kotak masuk Anda.
                </p>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              Perbaiki data sesuai catatan di atas, lalu lakukan pendaftaran ulang.
            </p>

            <button
              type="button"
              onClick={handleDaftarUlang}
              className="w-full bg-[#8B4513] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#6B3410] active:scale-[0.99] transition-all"
            >
              Daftar Ulang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
