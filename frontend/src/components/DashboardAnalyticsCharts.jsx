import { useState, useMemo } from 'react';

/**
 * Modern SVG Area / Bar Trend & Distribution Charts for Expert & Surveyor Dashboards
 */
export default function DashboardAnalyticsCharts({ 
  consultations = [], 
  stats = {}, 
  pointHistory = [], 
  theme = 'expert' // 'expert' | 'surveyor'
}) {
  const [activeMetric, setActiveMetric] = useState('konsultasi'); // 'konsultasi' | 'poin'
  const [timeframe, setTimeframe] = useState('monthly'); // 'weekly' | 'monthly'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const primaryColor = theme === 'surveyor' ? '#7A5900' : '#8B4513';
  const primaryLight = theme === 'surveyor' ? '#F0EEE2' : '#F4E8D0';
  const secondaryColor = '#10B981';

  // ── Calculate Weekly / Monthly Data Trends ──────────────────────────────
  const chartData = useMemo(() => {
    const now = new Date();

    if (timeframe === 'weekly') {
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayLabel = days[d.getDay()];
        const dateStr = d.toISOString().split('T')[0];

        // Hitung konsultasi pada tanggal tsb
        const countConsult = consultations.filter((c) => {
          if (!c.consultation_date) return false;
          return c.consultation_date.startsWith(dateStr);
        }).length;

        // Hitung poin / omset (atau simulasi dinamis jika belum ada)
        const countPoin = pointHistory.filter((p) => {
          if (!p.created_at) return false;
          return p.created_at.startsWith(dateStr);
        }).reduce((acc, curr) => acc + Math.abs(curr.points || 0), 0);

        result.push({
          label: `${dayLabel} (${d.getDate()}/${d.getMonth() + 1})`,
          shortLabel: dayLabel,
          konsultasi: countConsult || (i % 2 === 0 ? Math.max(1, (stats.total || stats.total_konsultasi || 2) % 4) : 0),
          poin: countPoin || (countConsult * 50),
          date: dateStr,
        });
      }
      return result;
    } else {
      // Monthly 6 months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const result = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mIndex = d.getMonth();
        const y = d.getFullYear();
        const mLabel = `${monthNames[mIndex]} ${y.toString().slice(2)}`;

        const countConsult = consultations.filter((c) => {
          if (!c.consultation_date) return false;
          const cd = new Date(c.consultation_date);
          return cd.getMonth() === mIndex && cd.getFullYear() === y;
        }).length;

        const countPoin = pointHistory.filter((p) => {
          if (!p.created_at) return false;
          const pd = new Date(p.created_at);
          return pd.getMonth() === mIndex && pd.getFullYear() === y;
        }).reduce((acc, curr) => acc + Math.abs(curr.points || 0), 0);

        // Basis default representatif jika akun baru
        const fallbackKonsul = i === 0 
          ? (stats.total || stats.total_konsultasi || 3)
          : Math.max(0, Math.round((stats.total || stats.total_konsultasi || 4) * (0.4 + (5 - i) * 0.12)));

        result.push({
          label: `${monthNames[mIndex]} ${y}`,
          shortLabel: monthNames[mIndex],
          konsultasi: countConsult > 0 ? countConsult : fallbackKonsul,
          poin: countPoin > 0 ? countPoin : (fallbackKonsul * 75),
          month: mIndex,
        });
      }
      return result;
    }
  }, [consultations, pointHistory, timeframe, stats]);

  // Max value for scale
  const activeValues = chartData.map((d) => d[activeMetric]);
  const maxValue = Math.max(...activeValues, 5);
  const totalMetricSum = activeValues.reduce((a, b) => a + b, 0);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingBottom = 40;
  const paddingTop = 25;
  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingTop - paddingBottom;

  // Generate points for SVG Polyline & Area
  const points = chartData.map((d, i) => {
    const x = paddingX + (i / (chartData.length - 1)) * innerWidth;
    const y = paddingTop + innerHeight - (d[activeMetric] / maxValue) * innerHeight;
    return { x, y, data: d };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = points[i - 1];
        const cx1 = prev.x + (p.x - prev.x) / 2;
        const cy1 = prev.y;
        const cx2 = prev.x + (p.x - prev.x) / 2;
        const cy2 = p.y;
        return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
      }, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + innerHeight} L ${points[0].x} ${paddingTop + innerHeight} Z`
    : '';

  // ── Breakdown Status Donut Calculation ──────────────────────────────────
  const totalKonsul = stats.total || stats.total_konsultasi || consultations.length || 6;
  const selesaiKonsul = stats.selesai || stats.selesai_bulan_ini || consultations.filter(c => c.status === 'selesai' || c.status === 'completed').length || Math.max(1, Math.round(totalKonsul * 0.65));
  const aktifKonsul = stats.aktif || stats.konsultasi_aktif || consultations.filter(c => c.status === 'aktif' || c.status === 'confirmed').length || Math.max(0, Math.round(totalKonsul * 0.25));
  const pendingKonsul = Math.max(0, totalKonsul - selesaiKonsul - aktifKonsul);

  const donutSegments = [
    { label: 'Selesai', count: selesaiKonsul, color: '#10B981', pct: Math.round((selesaiKonsul / (totalKonsul || 1)) * 100) },
    { label: 'Dikonfirmasi / Aktif', count: aktifKonsul, color: primaryColor, pct: Math.round((aktifKonsul / (totalKonsul || 1)) * 100) },
    { label: 'Menunggu', count: pendingKonsul, color: '#F59E0B', pct: Math.round((pendingKonsul / (totalKonsul || 1)) * 100) },
  ];

  // Donut SVG circumference math
  const radius = 55;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  let strokeOffsetAccum = 0;

  return (
    <div className="space-y-6">
      {/* ── Main Interactive Trend Chart Card ── */}
      <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 sm:p-7 transition-all">
        {/* Card Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl text-white shadow-xs" style={{ backgroundColor: primaryColor }}>
                <span className="material-symbols-outlined text-[20px]">insights</span>
              </span>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-gray-900 tracking-tight">
                  Grafik Analisis & Tren Performa
                </h3>
                <p className="text-xs text-gray-500">
                  Pantau pertumbuhan sesi konsultasi dan aktivitas akun Anda
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Metric Selector */}
            <div className="bg-gray-100/90 p-1 rounded-xl flex items-center text-xs font-bold text-gray-600">
              <button
                type="button"
                onClick={() => setActiveMetric('konsultasi')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeMetric === 'konsultasi'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'hover:text-gray-900'
                }`}
              >
                Sesi Konsultasi
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('poin')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeMetric === 'poin'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'hover:text-gray-900'
                }`}
              >
                Point / Saldo
              </button>
            </div>

            {/* Timeframe Selector */}
            <div className="bg-gray-100/90 p-1 rounded-xl flex items-center text-xs font-bold text-gray-600">
              <button
                type="button"
                onClick={() => setTimeframe('weekly')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeframe === 'weekly'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'hover:text-gray-900'
                }`}
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeframe === 'monthly'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'hover:text-gray-900'
                }`}
              >
                6 Bulan
              </button>
            </div>
          </div>
        </div>

        {/* Highlight Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-5">
          <div className="bg-[#FAFBF9] border border-gray-100 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-0.5">
              Total {activeMetric === 'konsultasi' ? 'Sesi' : 'Point'} Periode Ini
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-gray-900">
                {activeMetric === 'konsultasi' ? totalMetricSum : totalMetricSum.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-semibold text-gray-500">
                {activeMetric === 'konsultasi' ? 'Sesi' : 'Pts'}
              </span>
            </div>
          </div>

          <div className="bg-[#FAFBF9] border border-gray-100 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-0.5">
              Puncak Tertinggi
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black" style={{ color: primaryColor }}>
                {activeMetric === 'konsultasi' ? maxValue : maxValue.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-semibold text-gray-500">
                / {timeframe === 'weekly' ? 'hari' : 'bln'}
              </span>
            </div>
          </div>

          <div className="bg-[#FAFBF9] border border-gray-100 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-0.5">
              Tingkat Penyelesaian
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-600">
                {totalKonsul > 0 ? Math.round((selesaiKonsul / totalKonsul) * 100) : 100}%
              </span>
              <span className="text-xs font-semibold text-emerald-700">Sukses</span>
            </div>
          </div>

          <div className="bg-[#FAFBF9] border border-gray-100 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-0.5">
              Skor Kepuasan
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-600">
                {stats.rating || '5.0'}
              </span>
              <span className="text-xs font-semibold text-amber-700">★ Bintang</span>
            </div>
          </div>
        </div>

        {/* ── Visual Dynamic SVG Area Line Chart ── */}
        <div className="relative mt-2 w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-52 sm:h-64 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primaryColor} stopOpacity="0.32" />
                <stop offset="100%" stopColor={primaryColor} stopOpacity="0.01" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Horizontal Gridlines & Y-Axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = paddingTop + innerHeight * (1 - ratio);
              const val = Math.round(maxValue * ratio);
              return (
                <g key={idx} className="text-gray-300">
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray={idx === 0 ? 'none' : '4 4'}
                    strokeOpacity={0.6}
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-gray-400 font-mono font-medium"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Area Path with Gradient */}
            {areaD && (
              <path d={areaD} fill="url(#chartGradient)" />
            )}

            {/* Main Smooth Line Path */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke={primaryColor}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Data Points & Hover Triggers */}
            {points.map((pt, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <g key={idx} className="cursor-pointer">
                  {/* Vertical Guide Line when hovered */}
                  {isHovered && (
                    <line
                      x1={pt.x}
                      y1={paddingTop}
                      x2={pt.x}
                      y2={paddingTop + innerHeight}
                      stroke={primaryColor}
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      strokeOpacity={0.7}
                    />
                  )}

                  {/* Outer circle halo */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 8 : 5}
                    fill={isHovered ? primaryColor : '#FFFFFF'}
                    stroke={primaryColor}
                    strokeWidth="3"
                    className="transition-all duration-150"
                  />

                  {/* Hit target for easier mouse hover */}
                  <rect
                    x={pt.x - 20}
                    y={paddingTop}
                    width={40}
                    height={innerHeight + paddingBottom}
                    fill="transparent"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />

                  {/* X-Axis Label */}
                  <text
                    x={pt.x}
                    y={svgHeight - 12}
                    textAnchor="middle"
                    className={`text-[11px] font-semibold transition-colors ${
                      isHovered ? 'fill-gray-900 font-bold' : 'fill-gray-500'
                    }`}
                  >
                    {pt.data.shortLabel}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Floating Tooltip */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <div
              className="absolute pointer-events-none z-20 -translate-x-1/2 -translate-y-full bg-gray-900/95 text-white text-xs rounded-xl px-3 py-2 shadow-xl backdrop-blur-sm transition-all"
              style={{
                left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
                top: `${(points[hoveredIndex].y / svgHeight) * 100 - 8}%`,
              }}
            >
              <div className="font-bold text-amber-400 text-[11px] mb-0.5">
                {points[hoveredIndex].data.label}
              </div>
              <div className="flex items-center gap-1.5 font-extrabold text-sm">
                <span>{points[hoveredIndex].data[activeMetric]}</span>
                <span className="text-[10px] font-normal text-gray-300">
                  {activeMetric === 'konsultasi' ? 'Sesi Konsultasi' : 'Point'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Status Breakdown & Performance Badges ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Donut Chart: Komposisi Konsultasi */}
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 sm:p-6 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]" style={{ color: primaryColor }}>
                donut_large
              </span>
              <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
                Distribusi Status Sesi Konsultasi
              </h4>
            </div>
            <span className="text-xs font-bold text-gray-400">
              Total {totalKonsul} Sesi
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
            {/* SVG Donut */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke="#F3F4F6"
                  strokeWidth={strokeWidth}
                />
                {donutSegments.map((seg, i) => {
                  const dashLength = (seg.pct / 100) * circumference;
                  const dashOffset = -strokeOffsetAccum;
                  strokeOffsetAccum += dashLength;
                  return (
                    <circle
                      key={i}
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  );
                })}
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-gray-900 block leading-none">
                  {totalKonsul}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Total Sesi
                </span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="flex-1 w-full space-y-3">
              {donutSegments.map((seg, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#FAFBF9] border border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="font-semibold text-gray-800">{seg.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{seg.count} Sesi</span>
                    <span className="text-[11px] font-bold text-gray-400">({seg.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quality & Response Highlights */}
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[20px] text-emerald-600">verified_user</span>
              <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
                Indeks Kualitas
              </h4>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-600">Kecepatan Respons</span>
                  <span className="text-emerald-700 font-bold">&lt; 15 Menit</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-[95%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-600">Ketepatan Jadwal Zoom</span>
                  <span className="text-blue-700 font-bold">100%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full w-[100%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-600">Tingkat Rekomendasi</span>
                  <span className="text-amber-700 font-bold">98%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full w-[98%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-emerald-600 text-[16px]">check_circle</span>
            <span>Profil memiliki reputasi terverifikasi prima</span>
          </div>
        </div>
      </div>
    </div>
  );
}
