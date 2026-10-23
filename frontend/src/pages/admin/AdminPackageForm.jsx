import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client.js';

const EMPTY_FORM = {
  name:        '',
  price:       0,
  role_type:   'all',
  description: '',
  benefits:    [{ text: '', included: true }],
  is_active:   true,
  order:       0,
};

const ROLE_OPTIONS = [
  {
    value: 'all',
    label: 'Semua Role',
    desc:  'Berlaku untuk Tenaga Ahli, Tenaga Teknis, dan Surveyor',
    icon:  'grid_view',
    color: '#15803D',
    bg:    '#F0FDF4',
  },
  {
    value: 'tenaga_ahli',
    label: 'Tenaga Ahli',
    desc:  'Khusus untuk member Tenaga Ahli',
    icon:  'workspace_premium',
    color: '#8B4513',
    bg:    '#F4E8D0',
  },
  {
    value: 'tenaga_teknis',
    label: 'Tenaga Teknis',
    desc:  'Khusus untuk member Tenaga Teknis',
    icon:  'engineering',
    color: '#0D9488',
    bg:    '#CCFBF1',
  },
  {
    value: 'surveyor',
    label: 'Surveyor',
    desc:  'Khusus untuk member Surveyor',
    icon:  'map',
    color: '#1D4ED8',
    bg:    '#DBEAFE',
  },
];

function formatRupiah(v) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v);
}

export default function AdminPackageForm() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const isEdit     = !!id;

  const [form,    setForm]    = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api.get('/admin/packages')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const pkg  = data.find((p) => String(p.id) === String(id));
        if (!pkg) { setError('Paket tidak ditemukan.'); return; }

        const rawBenefits = Array.isArray(pkg.benefits) ? pkg.benefits : [];
        const parsedBenefits = rawBenefits.length > 0
          ? rawBenefits.map((b) => {
              if (typeof b === 'object' && b !== null) {
                return {
                  text: b.text || '',
                  included: b.included !== false,
                };
              }
              return {
                text: String(b || ''),
                included: true,
              };
            })
          : [{ text: '', included: true }];

        setForm({
          name:        pkg.name        || '',
          price:       pkg.price       || 0,
          role_type:   pkg.role_type   || 'all',
          description: pkg.description || '',
          benefits:    parsedBenefits,
          is_active:   !!pkg.is_active,
          order:       pkg.order       || 0,
        });
      })
      .catch(() => setError('Gagal memuat data paket.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleBenefitTextChange = (index, value) => {
    setForm((prev) => {
      const next = [...prev.benefits];
      next[index] = { ...next[index], text: value };
      return { ...prev, benefits: next };
    });
  };

  const handleToggleBenefit = (index) => {
    setForm((prev) => {
      const next = [...prev.benefits];
      next[index] = { ...next[index], included: !next[index].included };
      return { ...prev, benefits: next };
    });
  };

  const handleAddBenefit = (included = true) => {
    setForm((prev) => ({
      ...prev,
      benefits: [...prev.benefits, { text: '', included }],
    }));
  };

  const handleRemoveBenefit = (index) => {
    setForm((prev) => {
      const filtered = prev.benefits.filter((_, i) => i !== index);
      return {
        ...prev,
        benefits: filtered.length > 0 ? filtered : [{ text: '', included: true }],
      };
    });
  };

  const handleMoveBenefit = (index, direction) => {
    setForm((prev) => {
      const next = [...prev.benefits];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return { ...prev, benefits: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const cleanBenefits = form.benefits
        .map((b) => ({
          text: (b.text || '').trim(),
          included: b.included !== false,
        }))
        .filter((b) => b.text.length > 0);

      const payload = {
        ...form,
        price:    Number(form.price),
        order:    Number(form.order),
        benefits: cleanBenefits,
      };
      if (isEdit) await api.put(`/admin/packages/${id}`, payload);
      else        await api.post('/admin/packages', payload);
      navigate('/admin/paket');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan paket.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl">
        <div className="h-8 w-48 bg-[#6B3410]/10 rounded mb-6 animate-pulse" />
        <div className="bg-white rounded-xl border border-[#6B3410]/15 shadow-sm p-6 h-96 animate-pulse" />
      </div>
    );
  }

  const isPremium      = Number(form.price) > 0;
  const activeBenefits = form.benefits.filter((b) => b.text.trim());
  const selectedRole   = ROLE_OPTIONS.find((r) => r.value === form.role_type) ?? ROLE_OPTIONS[0];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/paket')}
          className="text-[#414844]/60 hover:text-[#6B3410] p-1 rounded-full hover:bg-[#6B3410]/5 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-[#6B3410]">
            {isEdit ? 'Edit Paket' : 'Tambah Paket'}
          </h2>
          <p className="text-[#414844]/80 text-sm mt-1">
            Atur detail paket keanggotaan untuk Tenaga Ahli atau Surveyor.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start max-w-5xl">

        {/* ── Form ── */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-[#6B3410]/15 shadow-sm p-6">
          {error && (
            <p className="bg-[#FFDAD6] text-[#93000A] text-sm rounded-lg p-3 mb-4">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Pilih Role — card selector */}
            <div>
              <label className="text-xs font-bold uppercase text-[#414844]/70 block mb-2">
                Berlaku Untuk <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ROLE_OPTIONS.map((opt) => {
                  const isSelected = form.role_type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, role_type: opt.value })}
                      className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-[#8B4513] shadow-sm'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={isSelected ? { backgroundColor: opt.bg, borderColor: opt.color } : {}}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: isSelected ? opt.color : '#F3F4F6',
                            color: isSelected ? 'white' : '#6B7280',
                          }}
                        >
                          <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900">{opt.label}</span>
                        {isSelected && (
                          <span
                            className="material-symbols-outlined text-[16px] ml-auto shrink-0"
                            style={{ color: opt.color }}
                          >
                            check_circle
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-tight pl-9">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nama */}
            <div>
              <label className="text-xs font-bold uppercase text-[#414844]/70">
                Nama Paket <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="mis. Paket Premium Tahunan"
                className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#6B3410]/20 focus:border-[#6B3410] focus:outline-none"
              />
            </div>

            {/* Harga */}
            <div>
              <label className="text-xs font-bold uppercase text-[#414844]/70">
                Harga (Rp, isi 0 untuk gratis) <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#414844]/50">Rp</span>
                <input
                  type="number"
                  required
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full border border-[#6B3410]/30 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#6B3410]/20 focus:border-[#6B3410] focus:outline-none"
                />
              </div>
              {Number(form.price) > 0 && (
                <p className="text-[11px] text-[#8B4513] mt-1 font-medium">
                  = {formatRupiah(form.price)} / tahun (~{formatRupiah(Math.round(form.price / 12))} / bulan)
                </p>
              )}
            </div>

            {/* Deskripsi */}
            <div>
              <label className="text-xs font-bold uppercase text-[#414844]/70">Deskripsi</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ringkasan singkat manfaat paket ini"
                className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#6B3410]/20 focus:border-[#6B3410] focus:outline-none"
              />
            </div>

            {/* Benefits */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-xs font-bold uppercase text-[#414844]/70 block">
                    Fitur & Keuntungan Paket
                  </label>
                  <span className="text-[11px] text-[#414844]/60">
                    Pilih ikon Ceklis (tersedia) atau Silang (tidak tersedia) untuk setiap fitur.
                  </span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#8B4513]/10 text-[#8B4513]">
                  {form.benefits.filter((b) => b.text.trim()).length} fitur
                </span>
              </div>

              <div className="space-y-2">
                {form.benefits.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                      item.included
                        ? 'bg-emerald-50/40 border-emerald-200/80'
                        : 'bg-red-50/40 border-red-200/80'
                    }`}
                  >
                    {/* Toggle Ceklis / Silang button */}
                    <button
                      type="button"
                      onClick={() => handleToggleBenefit(idx)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 shadow-sm ${
                        item.included
                          ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                          : 'bg-red-600 text-white border-red-700 hover:bg-red-700'
                      }`}
                      title={
                        item.included
                          ? 'Status: Ceklis (Tersedia). Klik untuk ganti ke Silang.'
                          : 'Status: Silang (Tidak Tersedia). Klik untuk ganti ke Ceklis.'
                      }
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {item.included ? 'check_circle' : 'cancel'}
                      </span>
                      <span>{item.included ? 'Ceklis' : 'Silang'}</span>
                    </button>

                    {/* Input text */}
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => handleBenefitTextChange(idx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddBenefit(true);
                        }
                      }}
                      placeholder="Tulis nama fitur / keuntungan..."
                      className="flex-1 bg-white border border-[#6B3410]/20 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#6B3410]/20 focus:border-[#6B3410] focus:outline-none"
                    />

                    {/* Move up / down buttons */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveBenefit(idx, -1)}
                        disabled={idx === 0}
                        title="Pindah ke atas"
                        className="p-1 text-gray-400 hover:text-[#6B3410] hover:bg-black/5 rounded disabled:opacity-20 disabled:pointer-events-none transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveBenefit(idx, 1)}
                        disabled={idx === form.benefits.length - 1}
                        title="Pindah ke bawah"
                        className="p-1 text-gray-400 hover:text-[#6B3410] hover:bg-black/5 rounded disabled:opacity-20 disabled:pointer-events-none transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                      </button>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(idx)}
                      title="Hapus baris ini"
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add buttons */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => handleAddBenefit(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  + Tambah Ceklis
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBenefit(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-800 border border-red-300 hover:bg-red-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  + Tambah Silang
                </button>
              </div>
            </div>

            {/* Urutan + Toggle aktif */}
            <div className="grid grid-cols-2 gap-4 items-center">
              <div>
                <label className="text-xs font-bold uppercase text-[#414844]/70">Urutan Tampil</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#6B3410]/20 focus:border-[#6B3410] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className="flex items-center gap-2 self-end mb-1 text-sm font-bold text-[#414844]"
              >
                <span
                  className={`material-symbols-outlined text-[28px] ${
                    form.is_active ? 'text-[#6B3410]' : 'text-[#414844]/30'
                  }`}
                >
                  {form.is_active ? 'toggle_on' : 'toggle_off'}
                </span>
                {form.is_active ? 'Aktif (tampil ke user)' : 'Nonaktif (disembunyikan)'}
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#6B3410] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#55290A] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {saving && (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/paket')}
                className="px-6 py-3 rounded-lg text-sm font-bold text-[#414844] border border-[#414844]/20 hover:bg-[#414844]/5 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>

        {/* ── Live preview ── */}
        <div className="lg:col-span-2 lg:sticky lg:top-6">
          <p className="text-xs font-bold uppercase text-[#414844]/50 mb-2 tracking-wide">
            Pratinjau Kartu Paket
          </p>
          <div
            className={`relative flex flex-col bg-white rounded-2xl shadow-sm p-6 border-2 ${
              isPremium ? 'border-[#6B4F3B]/25' : 'border-[#6B3410]/10'
            } ${!form.is_active ? 'opacity-60' : ''}`}
          >
            <span className="absolute top-4 right-4 text-[10px] font-bold text-[#414844]/40 bg-[#414844]/5 w-6 h-6 rounded-full flex items-center justify-center">
              {form.order || '-'}
            </span>

            {/* Badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span
                className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wide"
                style={{ backgroundColor: selectedRole.bg, color: selectedRole.color }}
              >
                {selectedRole.label}
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wide ${
                  isPremium ? 'text-[#6B4F3B] bg-[#6B4F3B]/10' : 'text-[#414844] bg-[#414844]/10'
                }`}
              >
                {isPremium ? 'Premium' : 'Free'}
              </span>
            </div>

            <h3 className="text-lg font-bold text-[#1B1C1A] mb-1">
              {form.name || 'Nama Paket'}
            </h3>
            {isPremium ? (
              <div className="mb-2">
                <p className="text-2xl font-extrabold text-[#6B3410]">
                  {formatRupiah(Math.round(form.price / 12))} <span className="text-xs font-semibold text-gray-500">/ bulan</span>
                </p>
                <p className="text-[11px] font-semibold text-[#8B4513] mt-0.5">
                  Bayar tahunan: {formatRupiah(form.price)} / tahun
                </p>
              </div>
            ) : (
              <p className="text-2xl font-extrabold text-[#6B3410] mb-2">Gratis</p>
            )}
            {form.description && (
              <p className="text-xs text-[#414844]/70 mb-4 leading-relaxed">{form.description}</p>
            )}
            <div className="flex-1">
              {activeBenefits.length > 0 ? (
                <ul className="space-y-2">
                  {activeBenefits.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs">
                      {b.included ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-emerald-500/20 shadow-xs">
                          <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-rose-500/20 shadow-xs">
                          <span className="material-symbols-outlined text-[14px] font-bold">close</span>
                        </span>
                      )}
                      <span className={`mt-0.5 leading-snug ${b.included ? 'text-[#374151]' : 'text-gray-400'}`}>
                        {b.text}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#414844]/40 italic">Tidak ada fitur khusus</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
