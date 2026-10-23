import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client.js';

export default function AdminSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Ubah Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('amdal_user');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('amdal_token');
      localStorage.removeItem('amdal_user');
      navigate('/sign-in');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    if (newPassword !== newPasswordConfirmation) {
      setPasswordError('Konfirmasi password baru tidak cocok.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await api.put('/admin/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation
      });
      setPasswordSuccess(res.data.message || 'Password berhasil diubah.');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Gagal mengubah password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-[#5B6660] p-8">
        <span className="w-5 h-5 rounded-full border-2 border-[#8B4513]/30 border-t-[#8B4513] animate-spin" />
        Memuat pengaturan...
      </div>
    );
  }

  const initials = (user?.name || 'A')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#8B4513]">Pengaturan</h2>
        <p className="text-[#414844]/80 text-sm mt-1">Kelola data profil admin, ubah kata sandi keamanan, dan kontrol sesi.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-[#8B4513]/15 shadow-sm p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-[#8B4513] text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-[#8B4513] leading-tight truncate">{user?.name || 'Administrator'}</p>
          <p className="text-sm text-[#414844]/80 truncate mb-2">{user?.email || '-'}</p>
          <span className="inline-block text-[10px] uppercase tracking-wider font-bold text-[#8B4513] bg-[#8B4513]/10 px-2.5 py-1 rounded-full">
            {user?.role || 'admin'}
          </span>
        </div>
      </div>

      {/* Account Info Details */}
      <div className="bg-white rounded-2xl border border-[#6B3410]/15 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#6B3410] border-b border-black/5 pb-2">Informasi Akun</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-xs text-[#414844]/60 block font-medium">Nama Administrator</span>
            <span className="font-semibold text-[#1F2A22]">{user?.name || '-'}</span>
          </div>
          <div>
            <span className="text-xs text-[#414844]/60 block font-medium">Email Terdaftar</span>
            <span className="font-semibold text-[#1F2A22]">{user?.email || '-'}</span>
          </div>
        </div>
      </div>

      {/* Ubah Password */}
      <div className="bg-white rounded-2xl border border-[#6B3410]/15 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#6B3410] border-b border-black/5 pb-2">Ubah Kata Sandi</h3>
        
        {passwordError && <p className="bg-[#FFDAD6] text-[#93000A] text-xs rounded-lg p-3">{passwordError}</p>}
        {passwordSuccess && <p className="bg-[#F5EBE1] text-[#6B3410] text-xs rounded-lg p-3 font-semibold">{passwordSuccess}</p>}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-[#414844]/70 block">Kata Sandi Lama *</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full mt-1.5 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#6B3410] focus:border-[#6B3410]"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-[#414844]/70 block">Kata Sandi Baru *</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mt-1.5 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#6B3410] focus:border-[#6B3410]"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-[#414844]/70 block">Konfirmasi Kata Sandi Baru *</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPasswordConfirmation}
              onChange={(e) => setNewPasswordConfirmation(e.target.value)}
              className="w-full mt-1.5 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#6B3410] focus:border-[#6B3410]"
            />
          </div>

          <button
            type="submit"
            disabled={passwordSaving}
            className="bg-[#6B3410] text-white py-2.5 px-5 rounded-xl text-xs font-bold hover:bg-[#55290A] disabled:opacity-60 transition-colors"
          >
            {passwordSaving ? 'Menyimpan...' : 'Perbarui Password'}
          </button>
        </form>
      </div>

      {/* Sessions and Security */}
      <div className="bg-white rounded-2xl border border-[#6B3410]/15 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#6B3410] border-b border-black/5 pb-2">Keamanan & Sesi</h3>
        <p className="text-xs text-[#414844]/80 leading-relaxed">
          Keluar dari sesi administrator saat ini pada browser ini.
        </p>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="border border-[#B3261E]/40 text-[#B3261E] py-3 px-6 rounded-xl font-bold text-xs hover:bg-[#B3261E]/10 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loggingOut && (
            <span className="w-4 h-4 border-2 border-[#B3261E]/30 border-t-[#B3261E] rounded-full animate-spin" />
          )}
          <span className="material-symbols-outlined text-lg">logout</span>
          {loggingOut ? 'Keluar...' : 'Logout Admin'}
        </button>
      </div>
    </div>
  );
}
