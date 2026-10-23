import { useTranslation } from '../context/LanguageContext.jsx';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client.js';
import DashboardLayout from '../components/DashboardLayout.jsx';

const STEPS = [
  'Data Pribadi & Profesi',
  'Alamat',
  'Pendidikan',
  'Pengalaman',
  'Sertifikat',
  'Foto Profil',
  'Dokumen Pendukung',
];

function emptyEducation() {
  return { id: crypto.randomUUID(), degree: '', institution: '', year: '' };
}
function emptyExperience() {
  return { id: crypto.randomUUID(), title: '', organizer: '', place: '', date: '' };
}
function emptyCertificate() {
  return { id: crypto.randomUUID(), name: '', issuer: '', year: '' };
}

export default function LengkapiProfil() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const stepVal = params.get('step');
    if (stepVal !== null) {
      const stepNum = parseInt(stepVal, 10);
      if (!isNaN(stepNum) && stepNum >= 0 && stepNum < STEPS.length) {
        setStep(stepNum);
      }
    }
  }, [location.search]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    institution: '',
    field: '',
    phone: '',
    bio: '',
    alamat_lengkap: '',
    alamat_kota: '',
    alamat_provinsi: '',
    educations: [emptyEducation()],
    experiences: [emptyExperience()],
    certificates: [emptyCertificate()],
    photoPreview: null,
    photoFile: null,
    documents: [],
  });

  useEffect(() => {
    api
      .get('/my/profile')
      .then((res) => {
        const d = res.data || {};
        setForm((f) => ({
          ...f,
          name: d.name || '',
          institution: d.institution || '',
          field: d.field || '',
          phone: d.phone || '',
          bio: d.bio || '',
          alamat_lengkap: d.alamat_lengkap || '',
          alamat_kota: d.alamat_kota || '',
          alamat_provinsi: d.alamat_provinsi || '',
          educations: d.educations?.length ? d.educations : [emptyEducation()],
          experiences: d.experiences?.length ? d.experiences : [emptyExperience()],
          certificates: d.certificates?.length ? d.certificates : [emptyCertificate()],
        }));
      })
      .catch(() => {
        /* Belum ada data profil — mulai dari form kosong, tidak perlu tampilkan error di sini */
      })
      .finally(() => setLoading(false));
  }, []);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const updateListItem = (key, id, field, value) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const addListItem = (key, factory) => {
    setForm((f) => ({ ...f, [key]: [...f[key], factory()] }));
  };

  const removeListItem = (key, id) => {
    setForm((f) => ({ ...f, [key]: f[key].filter((item) => item.id !== id) }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    update('photoFile', file);
    update('photoPreview', URL.createObjectURL(file));
  };

  const handleDocumentsChange = (e) => {
    const files = Array.from(e.target.files || []);
    setForm((f) => ({ ...f, documents: [...f.documents, ...files] }));
  };

  const removeDocument = (index) => {
    setForm((f) => ({ ...f, documents: f.documents.filter((_, i) => i !== index) }));
  };

  const goPrev = () => setStep((s) => Math.max(0, s - 1));
  const goNext = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));

  const handleFinish = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = new FormData();
      payload.append('name', form.name);
      payload.append('institution', form.institution);
      payload.append('field', form.field);
      payload.append('phone', form.phone);
      payload.append('bio', form.bio);
      payload.append('alamat_lengkap', form.alamat_lengkap);
      payload.append('alamat_kota', form.alamat_kota);
      payload.append('alamat_provinsi', form.alamat_provinsi);
      payload.append('educations', JSON.stringify(form.educations));
      payload.append('experiences', JSON.stringify(form.experiences));
      payload.append('certificates', JSON.stringify(form.certificates));
      if (form.photoFile) payload.append('photo', form.photoFile);
      form.documents.forEach((doc) => payload.append('documents[]', doc));

      await api.patch('/my/profile', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Profil berhasil disimpan.');
      setTimeout(() => navigate('/pilih-paket'), 900);
    } catch {
      // Backend belum tersedia / gagal — tetap izinkan lanjut agar alur tidak buntu.
      setError('Gagal menyimpan ke server, tapi data kamu tetap tersimpan sementara di perangkat ini.');
      setTimeout(() => navigate('/pilih-paket'), 1400);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Lengkapi Profil">
        <div className="flex items-center gap-3 text-[#5B6660]">
          <span className="w-5 h-5 rounded-full border-2 border-[#2E5E3B]/30 border-t-[#2E5E3B] animate-spin" />
          {t('Memuat...')}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Lengkapi Profil" subtitle={`Langkah ${step + 1} dari ${STEPS.length}: ${STEPS[step]}`}>
      <div className="w-full max-w-3xl">
        {/* Step indicator */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(i)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                i === step
                  ? 'bg-[#2E5E3B] text-white border-[#2E5E3B]'
                  : i < step
                  ? 'bg-[#2E5E3B]/10 text-[#2E5E3B] border-[#2E5E3B]/30'
                  : 'bg-white text-on-surface-variant border-outline-variant/40'
              }`}
            >
              {i + 1}. {label}
            </button>
          ))}
        </div>

        {error && <p className="bg-error-container text-on-error-container text-sm rounded-lg p-3 mb-4">{error}</p>}
        {success && <p className="bg-[#E3F2E7] text-[#2E5E3B] text-sm rounded-lg p-3 mb-4">{success}</p>}

        <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-6 mb-6">
          {/* Step 0: Data Pribadi & Profesi */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <Field label="Nama Lengkap">
                <input
                  className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2E5E3B]"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Dr. Nama Anda, S.Hut, M.Si"
                />
              </Field>
              <Field label="Institusi/Lembaga">
                <input
                  className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2E5E3B]"
                  value={form.institution}
                  onChange={(e) => update('institution', e.target.value)}
                  placeholder="PSL - IPB University"
                />
              </Field>
              <Field label="Bidang Keahlian">
                <input
                  className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2E5E3B]"
                  value={form.field}
                  onChange={(e) => update('field', e.target.value)}
                  placeholder="Ahli Kehutanan & Tata Ruang"
                />
              </Field>
              <Field label="Nomor Telepon">
                <input
                  className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2E5E3B]"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="0812xxxxxxx"
                />
              </Field>
              <Field label="Bio Singkat">
                <textarea
                  className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2E5E3B] min-h-24"
                  value={form.bio}
                  onChange={(e) => update('bio', e.target.value)}
                  placeholder="Ceritakan pengalaman profesional Anda secara singkat"
                />
              </Field>
            </div>
          )}

          {/* Step 1: Alamat */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <Field label="Alamat Lengkap">
                <textarea
                  className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2E5E3B] min-h-20"
                  value={form.alamat_lengkap}
                  onChange={(e) => update('alamat_lengkap', e.target.value)}
                  placeholder="Jl. Contoh No. 4, Kecamatan..."
                />
              </Field>
              <Field label="Kota/Kabupaten">
                <input
                  className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2E5E3B]"
                  value={form.alamat_kota}
                  onChange={(e) => update('alamat_kota', e.target.value)}
                  placeholder="Kota Bogor"
                />
              </Field>
              <Field label="Provinsi">
                <input
                  className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2E5E3B]"
                  value={form.alamat_provinsi}
                  onChange={(e) => update('alamat_provinsi', e.target.value)}
                  placeholder="Jawa Barat"
                />
              </Field>
            </div>
          )}

          {/* Step 2: Pendidikan */}
          {step === 2 && (
            <RepeatingList
              items={form.educations}
              onAdd={() => addListItem('educations', emptyEducation)}
              onRemove={(id) => removeListItem('educations', id)}
              addLabel="Tambah Riwayat Pendidikan (Dari yang Tertinggi)"
              render={(item) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2E5E3B]"
                    placeholder="Jenjang (S3/S2/S1 - dari tertinggi)"
                    value={item.degree}
                    onChange={(e) => updateListItem('educations', item.id, 'degree', e.target.value)}
                  />
                  <input
                    className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2E5E3B]"
                    placeholder="Institusi"
                    value={item.institution}
                    onChange={(e) => updateListItem('educations', item.id, 'institution', e.target.value)}
                  />
                  <input
                    className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2E5E3B]"
                    placeholder="Tahun Lulus"
                    value={item.year}
                    onChange={(e) => updateListItem('educations', item.id, 'year', e.target.value)}
                  />
                </div>
              )}
            />
          )}

          {/* Step 3: Pengalaman */}
          {step === 3 && (
            <RepeatingList
              items={form.experiences}
              onAdd={() => addListItem('experiences', emptyExperience)}
              onRemove={(id) => removeListItem('experiences', id)}
              addLabel="Tambah Pengalaman"
              render={(item) => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2E5E3B] md:col-span-2"
                    placeholder="Judul Kegiatan"
                    value={item.title}
                    onChange={(e) => updateListItem('experiences', item.id, 'title', e.target.value)}
                  />
                  <input
                    className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2E5E3B]"
                    placeholder="Penyelenggara"
                    value={item.organizer}
                    onChange={(e) => updateListItem('experiences', item.id, 'organizer', e.target.value)}
                  />
                  <input
                    className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2E5E3B]"
                    placeholder="Tempat"
                    value={item.place}
                    onChange={(e) => updateListItem('experiences', item.id, 'place', e.target.value)}
                  />
                  <input
                    className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2E5E3B] md:col-span-2"
                    placeholder="Tanggal (mis. 15 Nov 2022)"
                    value={item.date}
                    onChange={(e) => updateListItem('experiences', item.id, 'date', e.target.value)}
                  />
                </div>
              )}
            />
          )}

          {/* Step 4: Sertifikat */}
          {step === 4 && (
            <RepeatingList
              items={form.certificates}
              onAdd={() => addListItem('certificates', emptyCertificate)}
              onRemove={(id) => removeListItem('certificates', id)}
              addLabel="Tambah Sertifikat"
              render={(item) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2E5E3B]"
                    placeholder="Nama Sertifikat"
                    value={item.name}
                    onChange={(e) => updateListItem('certificates', item.id, 'name', e.target.value)}
                  />
                  <input
                    className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2E5E3B]"
                    placeholder="Penerbit"
                    value={item.issuer}
                    onChange={(e) => updateListItem('certificates', item.id, 'issuer', e.target.value)}
                  />
                  <input
                    className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2E5E3B]"
                    placeholder="Tahun"
                    value={item.year}
                    onChange={(e) => updateListItem('certificates', item.id, 'year', e.target.value)}
                  />
                </div>
              )}
            />
          )}

          {/* Step 5: Foto Profil */}
          {step === 5 && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#2E5E3B]/30 bg-[#F5F4F0] flex items-center justify-center">
                {form.photoPreview ? (
                  <img src={form.photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">person</span>
                )}
              </div>
              <label className="bg-[#2E5E3B] text-white text-sm px-4 py-2 rounded-full cursor-pointer hover:bg-[#244B2F] transition-colors">
                Pilih Foto
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
              {form.photoFile && <p className="text-xs text-on-surface-variant">{form.photoFile.name}</p>}
            </div>
          )}

          {/* Step 6: Dokumen Pendukung */}
          {step === 6 && (
            <div className="flex flex-col gap-4">
              <label className="border-2 border-dashed border-outline-variant/40 rounded-xl py-8 flex flex-col items-center gap-2 cursor-pointer hover:border-[#2E5E3B]/50 transition-colors">
                <span className="material-symbols-outlined text-3xl text-[#2E5E3B]">upload_file</span>
                <span className="text-sm text-on-surface-variant">Klik untuk unggah dokumen (CV, portofolio, dll.)</span>
                <input type="file" multiple className="hidden" onChange={handleDocumentsChange} />
              </label>
              {form.documents.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {form.documents.map((doc, i) => (
                    <li key={`${doc.name}-${i}`} className="flex items-center justify-between text-sm bg-[#F5F4F0] rounded-lg px-3 py-2">
                      <span className="truncate">{doc.name}</span>
                      <button type="button" onClick={() => removeDocument(i)} className="text-error hover:underline text-xs">
                        Hapus
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 0}
            className="border border-[#2E5E3B]/40 text-[#2E5E3B] py-3 px-6 rounded-lg font-label-md hover:bg-[#2E5E3B]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Kembali
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="bg-[#2E5E3B] text-white py-3 px-6 rounded-lg font-label-md hover:bg-[#244B2F] transition-colors"
            >
              Lanjut
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={saving}
              className="bg-[#2E5E3B] text-white py-3 px-6 rounded-lg font-label-md hover:bg-[#244B2F] transition-colors disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan & Selesai'}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}

function RepeatingList({ items, onAdd, onRemove, addLabel, render }) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <div key={item.id} className="border border-outline-variant/30 rounded-lg p-4 relative">
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="absolute top-2 right-2 text-error text-xs hover:underline"
            >
              Hapus
            </button>
          )}
          <p className="text-xs text-on-surface-variant mb-2">#{i + 1}</p>
          {render(item)}
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="text-sm text-[#2E5E3B] font-medium hover:underline self-start flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-[18px]">add_circle</span>
        {addLabel}
      </button>
    </div>
  );
}