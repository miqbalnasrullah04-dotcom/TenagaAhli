import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import api from '../../api/client.js';

const AVATAR_PALETTE = [
  { bg: '#6B34101A', fg: '#6B3410' },
  { bg: '#B453091A', fg: '#B45309' },
  { bg: '#6B4F3B1A', fg: '#6B4F3B' },
  { bg: '#A0522D1A', fg: '#A0522D' },
  { bg: '#4754451A', fg: '#475545' },
];

function hashColor(str) {
  const s = str || '?';
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

// ── Mini Bar Chart (Pure SVG) ────────────────────────────────────────────────
function MiniBarChart({ data, dataKeys, colors, labels }) {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.flatMap(d => dataKeys.map(k => d[k] || 0)), 1);
  const barGroupWidth = 100 / data.length;
  const barWidth = barGroupWidth / (dataKeys.length + 1);
  const chartHeight = 180;
  const chartPadding = { top: 10, bottom: 40, left: 0, right: 0 };
  const drawHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 500 ${chartHeight}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1="0" y1={chartPadding.top + drawHeight * (1 - pct)}
            x2="500" y2={chartPadding.top + drawHeight * (1 - pct)}
            stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4,4"
          />
        ))}

        {/* Bars */}
        {data.map((item, i) => {
          const groupX = i * (500 / data.length);
          return (
            <g key={i}>
              {dataKeys.map((key, ki) => {
                const val = item[key] || 0;
                const h = (val / maxVal) * drawHeight;
                const x = groupX + (ki + 0.5) * (500 / data.length / (dataKeys.length + 1));
                const w = (500 / data.length / (dataKeys.length + 1)) * 0.8;
                return (
                  <g key={key}>
                    <rect
                      x={x}
                      y={chartPadding.top + drawHeight - h}
                      width={w}
                      height={Math.max(h, 0)}
                      fill={colors[ki]}
                      rx="3"
                      opacity="0.85"
                    />
                    {val > 0 && (
                      <text
                        x={x + w / 2}
                        y={chartPadding.top + drawHeight - h - 4}
                        textAnchor="middle"
                        className="text-[9px] font-bold"
                        fill={colors[ki]}
                      >
                        {val}
                      </text>
                    )}
                  </g>
                );
              })}
              {/* Month label */}
              <text
                x={groupX + (500 / data.length) / 2}
                y={chartHeight - 6}
                textAnchor="middle"
                className="text-[10px]"
                fill="#9ca3af"
              >
                {item.month?.split(' ')[0] || ''}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-2">
        {dataKeys.map((key, ki) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colors[ki] }} />
            <span className="text-[11px] text-[#414844]/70 font-medium">{labels[ki]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Donut Chart (Pure SVG) ───────────────────────────────────────────────────
function DonutChart({ segments, size = 120 }) {
  const total = segments.reduce((sum, s) => sum + (s.value || 0), 0);
  if (total === 0) return null;

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dashLen = pct * circumference;
        const dashOffset = -offset;
        offset += dashLen;
        return (
          <circle
            key={i}
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth="14"
            strokeDasharray={`${dashLen} ${circumference - dashLen}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease' }}
          />
        );
      })}
      <text x="60" y="56" textAnchor="middle" className="text-[22px] font-black" fill="#0F172A">
        {total}
      </text>
      <text x="60" y="72" textAnchor="middle" className="text-[10px] font-medium" fill="#94a3b8">
        Total
      </text>
    </svg>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    total_pendaftar: 0,
    total_tenaga_ahli: 0,
    total_tenaga_teknis: 0,
    total_surveyor: 0,
    pending_verifikasi: 0,
    pengguna_free: 0,
    pengguna_premium: 0,
    pengguna_platinum: 0,
    monthly_trends: [],
  });
  const [recentPending, setRecentPending] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(() => {
    let cancelled = false;
    setIsLoading(true);
    setError('');

    Promise.allSettled([
      api.get('/admin/dashboard-stats'),
      api.get('/admin/experts', { params: { status: 'menunggu_verifikasi' } }),
    ]).then(([statsRes, expertsRes]) => {
      if (cancelled) return;

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }

      const experts = expertsRes.status === 'fulfilled' ? expertsRes.value.data : [];
      const expertsList = Array.isArray(experts) ? experts : [];
      setRecentPending(expertsList.slice(0, 5));

      if (statsRes.status === 'rejected' || expertsRes.status === 'rejected') {
        setError('Gagal memuat sebagian data statistik admin.');
      }
      setIsLoading(false);
      setLastUpdated(new Date());
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cancel = loadDashboard();
    return cancel;
  }, [loadDashboard]);

  const statCards = [
    { label: 'Total Pendaftar', value: stats.total_pendaftar, icon: 'person_add', accent: '#6B3410' },
    { label: 'Total Tenaga Ahli', value: stats.total_tenaga_ahli, icon: 'groups', accent: '#A0522D' },
    { label: 'Total Tenaga Teknis', value: stats.total_tenaga_teknis, icon: 'engineering', accent: '#0D7377' },
    { label: 'Total Surveyor', value: stats.total_surveyor, icon: 'explore', accent: '#2E5E3B' },
    { label: 'Pending Verifikasi', value: stats.pending_verifikasi, icon: 'how_to_reg', accent: '#B45309' },
    { label: 'Pengguna Free', value: stats.pengguna_free, icon: 'person', accent: '#475569' },
    { label: 'Pengguna Ekonomis', value: stats.pengguna_premium, icon: 'workspace_premium', accent: '#6B4F3B' },
    { label: 'Pengguna Eksklusif', value: stats.pengguna_platinum, icon: 'diamond', accent: '#7C3AED' },
  ];

  const flowSteps = [
    {
      icon: 'person_add',
      label: 'Pendaftaran',
      color: '#8B4513',
      count: stats.total_pendaftar,
      countLabel: 'total pendaftar',
    },
    {
      icon: 'fact_check',
      label: 'Verifikasi Admin',
      color: '#B45309',
      count: stats.pending_verifikasi,
      countLabel: 'menunggu verifikasi',
    },
    {
      icon: 'workspace_premium',
      label: 'Pilih Paket',
      color: '#6B3410',
      count: null,
      countLabel: null,
    },
    {
      icon: 'payments',
      label: 'Pembayaran',
      color: '#6B4F3B',
      count: stats.pengguna_premium,
      countLabel: 'sudah ekonomis',
    },
    {
      icon: 'public',
      label: 'Profil Tayang',
      color: '#A0522D',
      count: stats.total_tenaga_ahli,
      countLabel: 'profil tayang',
    },
  ];

  const totalPengguna = (stats.pengguna_free || 0) + (stats.pengguna_premium || 0) + (stats.pengguna_platinum || 0);

  const donutSegments = [
    { label: 'Pengguna Free', value: stats.pengguna_free || 0, color: '#6B3410' },
    { label: 'Pengguna Ekonomis', value: stats.pengguna_premium || 0, color: '#6B4F3B' },
    { label: 'Pengguna Eksklusif', value: stats.pengguna_platinum || 0, color: '#7C3AED' },
  ];

  const formatTime = (d) =>
    d
      ? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : '';

  return (
    <div className="pb-10">
      {/* ── Hero header ────────────────────────────────────────── */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-[#8B4513] via-[#A0522D] to-[#654321] p-6 shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('admin.dashboard.overview_title', 'Ringkasan Dashboard')}</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              {t('admin.dashboard.overview_desc', 'Pantau status pendaftaran, verifikasi, dan keanggotaan TenagaAhli.com secara real-time.')}
            </p>
            {lastUpdated && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/70">
                <span className="material-symbols-outlined text-[15px]">schedule</span>
                Terakhir diperbarui pukul {formatTime(lastUpdated)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 self-start flex-wrap">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/25 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>{t('Kembali ke Web')}</span>
            </Link>
            <button
              type="button"
              onClick={loadDashboard}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#6B3410] shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-70"
            >
              <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              {isLoading ? t('common.loading', 'Memuat...') : t('common.refresh', 'Segarkan')}
            </button>
          </div>
        </div>

        {/* ── Floating stat cards ──────────────────────────────── */}
        <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="group rounded-xl bg-white p-4 shadow-md ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${card.accent}14` }}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ color: card.accent }}>
                  {card.icon}
                </span>
              </div>
              <h3 className="mb-1 text-[10px] font-medium text-[#414844]/70 uppercase tracking-wide">{card.label}</h3>
              {isLoading ? (
                <div className="h-7 w-14 animate-pulse rounded bg-[#414844]/10" />
              ) : (
                <p className="text-xl font-bold tabular-nums" style={{ color: card.accent }}>
                  {card.value?.toLocaleString?.('id-ID') ?? card.value}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-[#FFDAD6] px-4 py-3 text-sm text-[#93000A]">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}

      {/* ── Grafik Tren Pendaftaran ──────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-[#6B3410]/10 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-[#0F172A]">
            <span className="material-symbols-outlined text-[18px] text-[#6B3410]">trending_up</span>
            {t('admin.dashboard.registration_trend', 'Tren Pendaftaran 6 Bulan Terakhir')}
          </h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#6B3410]/20 border-t-[#6B3410]" />
            </div>
          ) : stats.monthly_trends && stats.monthly_trends.length > 0 ? (
            <MiniBarChart
              data={stats.monthly_trends}
              dataKeys={['pendaftar', 'tenaga_ahli', 'tenaga_teknis', 'surveyor']}
              colors={['#8B4513', '#A0522D', '#0D7377', '#2E5E3B']}
              labels={['Total Pendaftar', 'Tenaga Ahli', 'Tenaga Teknis', 'Surveyor']}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="material-symbols-outlined text-[32px] text-[#414844]/20 mb-2">bar_chart</span>
              <p className="text-sm text-[#414844]/50">Belum ada data tren pendaftaran.</p>
            </div>
          )}
        </div>

        {/* ── Distribusi pengguna — Donut ────────────────────── */}
        <div className="rounded-xl border border-[#6B3410]/10 bg-white p-6 shadow-sm">
          <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-[#0F172A]">
            <span className="material-symbols-outlined text-[#6B4F3B]">donut_large</span>
            {t('admin.dashboard.user_distribution', 'Distribusi Pengguna')}
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#6B3410]/20 border-t-[#6B3410]" />
            </div>
          ) : totalPengguna === 0 ? (
            <p className="text-sm text-[#414844]/60">{t('admin.dashboard.no_user_data', 'Belum ada data pengguna.')}</p>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <DonutChart segments={donutSegments} />
              <div className="w-full space-y-3">
                {donutSegments.map((seg) => {
                  const pct = totalPengguna > 0 ? Math.round((seg.value / totalPengguna) * 100) : 0;
                  return (
                    <div key={seg.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                        <span className="text-xs text-[#414844]/80">{seg.label}</span>
                      </div>
                      <span className="text-xs font-bold text-[#0F172A]">
                        {seg.value} <span className="text-[#414844]/50">({pct}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="w-full flex items-center justify-between rounded-lg bg-[#6B3410]/5 px-4 py-3">
                <span className="text-xs font-medium text-[#414844]/70">Total Pengguna</span>
                <span className="text-sm font-bold text-[#6B3410]">{totalPengguna.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Alur Pendaftaran ───────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-[#6B3410]/10 bg-white p-6 shadow-sm">
        <h3 className="mb-6 flex items-center gap-2 text-sm font-bold text-[#0F172A]">
          <span className="material-symbols-outlined text-[18px] text-[#6B3410]">route</span>
          {t('admin.dashboard.flow_title', 'Alur Pendaftaran Tenaga Ahli')}
        </h3>
        <div className="flex items-start overflow-x-auto pt-3 pb-2">
          {flowSteps.map((item, i, arr) => (
            <div key={item.label} className="flex flex-1 items-start last:flex-none">
              <div className="flex min-w-[92px] flex-col items-center gap-2">
                <div
                  className="relative flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${item.color}14` }}
                >
                  <span className="material-symbols-outlined text-[22px]" style={{ color: item.color }}>
                    {item.icon}
                  </span>
                  {item.count !== null && item.count !== undefined && (
                    <span
                      className="absolute -top-2 -right-2 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white px-1 text-[10px] font-bold text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {isLoading ? '' : item.count}
                    </span>
                  )}
                </div>
                <span className="text-center text-[11px] font-semibold leading-tight text-[#414844]/80">
                  {item.label}
                </span>
                {item.countLabel && (
                  <span className="text-center text-[10px] leading-tight text-[#414844]/50">
                    {isLoading ? '···' : `${item.count} ${item.countLabel}`}
                  </span>
                )}
              </div>
              {i < arr.length - 1 && (
                <div className="mx-1 mb-6 mt-6 h-0.5 min-w-[16px] flex-1 rounded-full bg-gradient-to-r from-[#6B3410]/30 to-[#6B3410]/10" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Table — Pending Verification ─────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-[#6B3410]/10 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#6B3410]/10 p-6">
          <h3 className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
            <span className="material-symbols-outlined text-[#B45309]">pending_actions</span>
            {t('admin.dashboard.pending_experts', 'Profil Menunggu Verifikasi')}
            {stats.pending_verifikasi > 0 && (
              <span className="rounded-full bg-[#B45309]/10 px-2 py-0.5 text-xs font-bold text-[#B45309]">
                {stats.pending_verifikasi}
              </span>
            )}
          </h3>
          <Link
            to="/admin/verifikasi"
            className="inline-flex items-center gap-1 text-sm font-bold text-[#6B3410] hover:underline"
          >
            Lihat Semua
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#6B3410]/5 text-xs uppercase tracking-wide text-[#414844]/70">
                <th className="px-6 py-3 font-semibold">{t('admin.dashboard.table_name', 'Nama')}</th>
                <th className="px-6 py-3 font-semibold">{t('admin.dashboard.table_email', 'Email')}</th>
                <th className="px-6 py-3 font-semibold">{t('admin.dashboard.table_institution', 'Instansi')}</th>
                <th className="px-6 py-3 font-semibold">{t('admin.dashboard.table_field', 'Bidang')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#6B3410]/10">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(4)].map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 w-24 animate-pulse rounded bg-[#414844]/10" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : recentPending.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <span className="material-symbols-outlined mb-2 block text-[32px] text-[#414844]/30">
                      task_alt
                    </span>
                    <p className="text-[#414844]/60">Tidak ada profil yang menunggu verifikasi.</p>
                  </td>
                </tr>
              ) : (
                recentPending.map((exp) => {
                  const c = hashColor(exp.name);
                  return (
                    <tr key={exp.id} className="transition-colors hover:bg-[#6B3410]/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                            style={{ backgroundColor: c.bg, color: c.fg }}
                          >
                            {(exp.name || '?')
                              .trim()
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((w) => w[0]?.toUpperCase())
                              .join('')}
                          </div>
                          <span className="font-semibold text-[#0F172A]">{exp.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#414844]/80">{exp.user?.email || exp.email || '-'}</td>
                      <td className="px-6 py-4 text-[#414844]/80">{exp.institution || '-'}</td>
                      <td className="px-6 py-4">
                        {exp.field ? (
                          <span className="inline-block rounded-full bg-[#6B4F3B]/10 px-2.5 py-1 text-xs font-semibold text-[#6B4F3B]">
                            {exp.field}
                          </span>
                        ) : (
                          <span className="text-[#414844]/50">-</span>
                        )}
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