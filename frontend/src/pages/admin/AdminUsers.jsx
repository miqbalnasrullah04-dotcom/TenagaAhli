import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../context/LanguageContext.jsx';
import api from '../../api/client.js';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';

const emptyForm = { name: '', email: '', role: 'free', password: '' };

const roleLabel = {
  admin: { text: 'Admin', color: '#7A5900', bg: '#FFF4D6' },
  premium: { text: 'Premium', color: '#6B4F3B', bg: '#F1E4D8' },
  free: { text: 'Free', color: '#414844', bg: '#F5F4F0' },
};

export default function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [formTarget, setFormTarget] = useState(null); // null = closed, {} = tambah, {...user} = edit
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = () => {
    setLoading(true);
    setError('');
    // TODO: sesuaikan endpoint dengan backend (mis. /admin/users)
    api.get('/admin/users')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setUsers(data);
      })
      .catch(() => setError(t('admin.users.error_load', 'Gagal memuat data pengguna dari server.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setFormError('');
    setFormTarget({});
  };

  const openEdit = (user) => {
    setForm({ name: user.name || '', email: user.email || '', role: user.role || 'free', password: '' });
    setFormError('');
    setFormTarget(user);
  };

  const closeForm = () => {
    setFormTarget(null);
    setForm(emptyForm);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const isEdit = !!formTarget?.id;
    try {
      if (isEdit) {
        // TODO: sesuaikan endpoint update user
        await api.put(`/admin/users/${formTarget.id}`, form);
      } else {
        // TODO: sesuaikan endpoint tambah user
        await api.post('/admin/users', form);
      }
      closeForm();
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || t('admin.users.error_save', 'Gagal menyimpan data pengguna.'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      // TODO: sesuaikan endpoint aktif/nonaktif
      await api.post(`/admin/users/${user.id}/toggle-status`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status akun.');
    }
  };

  const handleVerify = async (user) => {
    try {
      // TODO: sesuaikan endpoint verifikasi email
      await api.post(`/admin/users/${user.id}/verify`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memverifikasi akun.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      // TODO: sesuaikan endpoint hapus user
      await api.delete(`/admin/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus pengguna.');
    }
  };

  const filtered = useMemo(() => {
    const q = keyword.toLowerCase();
    return users.filter((u) => {
      const matchKeyword = (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchKeyword && matchRole;
    });
  }, [users, keyword, roleFilter]);

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#6B3410]">{t('admin.users.title', 'Manajemen Pengguna')}</h2>
          <p className="text-[#414844]/80 text-sm mt-1">{t('admin.users.subtitle', 'Kelola data seluruh akun pengguna di sistem TenagaAhli.com.')}</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#6B3410] text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-[#55290A] transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          {t('admin.users.add_user', 'Tambah Pengguna')}
        </button>
      </div>

      {error && <div className="mb-4 bg-[#FFDAD6] text-[#93000A] text-sm rounded-lg p-3">{error}</div>}

      <div className="bg-white rounded-xl border border-[#6B3410]/15 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#6B3410]/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t('admin.users.search_placeholder', 'Cari nama atau email...')}
            className="w-full max-w-sm px-4 py-2 text-sm border border-[#6B3410]/30 rounded-lg focus:ring-[#6B3410] focus:border-[#6B3410]"
          />
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Semua Role' },
              { id: 'free', label: 'Free' },
              { id: 'premium', label: 'Premium' },
              { id: 'admin', label: 'Admin' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                  roleFilter === tab.id
                    ? 'bg-[#6B3410] text-white shadow-sm'
                    : 'bg-[#6B3410]/5 text-[#414844] hover:bg-[#6B3410]/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#6B3410]/5 text-[#414844]">
                <th className="px-6 py-3">{t('admin.users.table_name', 'Nama')}</th>
                <th className="px-6 py-3">{t('admin.users.table_email', 'Email')}</th>
                <th className="px-6 py-3">{t('admin.users.table_role', 'Role')}</th>
                <th className="px-6 py-3">{t('admin.users.table_status', 'Status Akun')}</th>
                <th className="px-6 py-3">{t('admin.users.table_verification', 'Verifikasi')}</th>
                <th className="px-6 py-3">{t('admin.users.table_joined', 'Bergabung')}</th>
                <th className="px-6 py-3">{t('admin.users.table_actions', 'Aksi')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#6B3410]/10">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-[#414844]/70">Memuat data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-[#414844]/70">Tidak ada data pengguna.</td></tr>
              ) : (
                filtered.map((user) => {
                  const r = roleLabel[user.role] || roleLabel.free;
                  return (
                    <tr key={user.id} className="hover:bg-[#6B3410]/5">
                      <td className="px-6 py-4 font-semibold text-[#6B3410]">{user.name || '-'}</td>
                      <td className="px-6 py-4 text-[#414844]/80">{user.email || '-'}</td>
                      <td className="px-6 py-4">
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ color: r.color, backgroundColor: r.bg }}
                        >
                          {r.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_active === false ? (
                          <span className="text-xs font-bold text-[#B3261E] bg-[#FFDAD6] px-2.5 py-1 rounded-full">Nonaktif</span>
                        ) : (
                          <span className="text-xs font-bold text-[#6B3410] bg-[#F5EBE1] px-2.5 py-1 rounded-full">Aktif</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.email_verified_at ? (
                          <span className="text-xs font-bold text-[#6B3410] flex items-center gap-1">
                            <span className="material-symbols-outlined text-base">verified</span> Terverifikasi
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-[#414844]/50">Belum Verifikasi</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#414844]/80">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => openEdit(user)}
                            title="Edit pengguna"
                            className="flex items-center gap-1 text-[#7A5900] bg-[#7A5900]/10 hover:bg-[#7A5900]/20 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            Edit
                          </button>

                          {!user.email_verified_at && (
                            <button
                              onClick={() => handleVerify(user)}
                              title="Verifikasi akun"
                              className="flex items-center gap-1 text-[#6B3410] bg-[#6B3410]/10 hover:bg-[#6B3410]/20 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">verified</span>
                              Verifikasi
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleStatus(user)}
                            title={user.is_active === false ? 'Aktifkan akun' : 'Nonaktifkan akun'}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              user.is_active === false
                                ? 'text-[#6B3410] bg-[#6B3410]/10 hover:bg-[#6B3410]/20'
                                : 'text-[#B3261E] bg-[#B3261E]/10 hover:bg-[#B3261E]/20'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {user.is_active === false ? 'toggle_on' : 'toggle_off'}
                            </span>
                            {user.is_active === false ? 'Aktifkan' : 'Nonaktifkan'}
                          </button>

                          <button
                            onClick={() => setDeleteTarget(user)}
                            title="Hapus pengguna"
                            className="flex items-center gap-1 text-[#B3261E]/80 bg-[#B3261E]/10 hover:bg-[#B3261E]/20 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Pengguna */}
      {formTarget !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-[#6B3410]/15">
              <h3 className="text-lg font-bold text-[#6B3410]">
                {formTarget?.id ? 'Edit Pengguna' : 'Tambah Pengguna'}
              </h3>
              <button onClick={closeForm} className="text-[#414844]/60 hover:text-[#6B3410] p-1.5 rounded-full hover:bg-[#F5F4EF] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {formError && <p className="bg-[#FFDAD6] text-[#93000A] text-xs rounded-lg p-3">{formError}</p>}

              <div>
                <label className="text-xs font-bold uppercase text-[#414844]/70">Nama *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#6B3410] focus:border-[#6B3410]"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-[#414844]/70">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#6B3410] focus:border-[#6B3410]"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-[#414844]/70">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm bg-white focus:ring-[#6B3410] focus:border-[#6B3410]"
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-[#414844]/70">
                  {formTarget?.id ? 'Password (kosongkan jika tidak diubah)' : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!formTarget?.id}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#6B3410] focus:border-[#6B3410]"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#6B3410] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-[#55290A] disabled:opacity-60"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold text-[#414844] border border-[#414844]/20 hover:bg-[#414844]/5"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Yakin ingin menghapus pengguna "${deleteTarget?.name}"? Tindakan ini tidak bisa dibatalkan.`}
      />
    </div>
  );
}