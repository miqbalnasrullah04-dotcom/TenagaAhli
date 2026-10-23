import React from 'react';

// Reusable animated skeleton elements
export function SkeletonPulse({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded-md ${className}`} />
  );
}

// 1. Skeleton Card for Experts (Grid Lists)
export function SkeletonExpertCard() {
  return (
    <div className="animate-pulse relative rounded-xl overflow-hidden shadow-md bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-0 flex flex-col">
      {/* Cover Image Placeholder */}
      <div className="h-48 md:h-52 bg-gray-200 dark:bg-slate-700 w-full" />
      
      {/* Content Area */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {/* Photo/Avatar Placeholder */}
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 shrink-0" />
          
          {/* Name & Title Placeholder */}
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-4/5" />
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. Skeleton Row for Tables (Member, Payments, etc.)
export function SkeletonTableRow({ cols = 3 }) {
  return (
    <tr className="animate-pulse border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
      {Array.from({ length: cols }).map((_, idx) => (
        <td key={idx} className="px-6 py-4">
          <div className={`h-4 bg-gray-200 dark:bg-slate-700 rounded ${
            idx === 0 ? 'w-2/3' : idx === 1 ? 'w-1/2' : 'w-1/3'
          }`} />
        </td>
      ))}
    </tr>
  );
}

// 3. Skeleton Card for Pamflet/Brochures/Articles
export function SkeletonDocumentCard() {
  return (
    <div className="animate-pulse bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      <div className="h-44 bg-gray-200 dark:bg-slate-700" />
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6" />
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
        <div className="mt-auto h-8 bg-gray-200 dark:bg-slate-700 rounded-lg w-full" />
      </div>
    </div>
  );
}

// 4. Skeleton Loader for Profil Detail Page (ProfilAhli, ProfilSaya)
export function SkeletonProfile() {
  return (
    <div className="animate-pulse bg-white dark:bg-slate-900 min-h-screen">
      {/* Cover Banner */}
      <div className="h-64 md:h-80 bg-gray-200 dark:bg-slate-700 w-full" />
      
      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pb-16">
        <div className="relative -mt-24 md:-mt-32 flex flex-col md:flex-row md:items-end gap-6 mb-8">
          {/* Profile Photo */}
          <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-white bg-gray-200 dark:bg-slate-700 shadow-lg shrink-0" />
          
          {/* Header Info */}
          <div className="flex-1 flex flex-col gap-3 pb-2">
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-2/3 md:w-1/2" />
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
          </div>
        </div>

        {/* Two-Column Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.2fr] gap-8">
          {/* Sidebar Skeletons */}
          <div className="flex flex-col gap-6">
            <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full" />
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-5/6" />
            </div>
            
            <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded-full w-16" />
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded-full w-20" />
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded-full w-24" />
              </div>
            </div>
          </div>

          {/* Main Skeletons */}
          <div className="flex flex-col gap-6">
            <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-6 space-y-6">
              <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
              
              <div className="space-y-4">
                {/* ListItem 1 */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded bg-gray-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
                  </div>
                </div>
                {/* ListItem 2 */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded bg-gray-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 5. Skeleton Loader for Dashboard Area
export function SkeletonDashboard() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Banner/Header Skeleton */}
      <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-xl w-full" />
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl" />
        <div className="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl" />
        <div className="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl" />
      </div>

      {/* Main Content Area */}
      <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/5" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
      </div>
    </div>
  );
}

// 6. Skeleton Loader for Jadwal & Tarif Page
export function SkeletonJadwalTarif({ activeTab = 'jadwal' }) {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      {activeTab === 'tarif' ? (
        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded-md w-56" />
              <div className="h-3 bg-gray-100 rounded-md w-80" />
            </div>
            <div className="h-7 bg-amber-100 rounded-full w-48" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chat Card Skeleton */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-200" />
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-28" />
                    <div className="h-3 bg-gray-200 rounded w-20" />
                  </div>
                </div>
                <div className="w-10 h-5 bg-gray-200 rounded-full" />
              </div>
              <div className="h-10 bg-gray-200 rounded-lg w-full" />
              <div className="p-3 bg-gray-100 rounded-xl space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>

            {/* Zoom Card Skeleton */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-200" />
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-28" />
                    <div className="h-3 bg-gray-200 rounded w-20" />
                  </div>
                </div>
                <div className="w-10 h-5 bg-gray-200 rounded-full" />
              </div>
              <div className="h-10 bg-gray-200 rounded-lg w-full" />
              <div className="h-9 bg-gray-200 rounded-lg w-full" />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <div className="h-10 bg-amber-200/60 rounded-xl w-44" />
          </div>
        </div>
      ) : (
        <>
          {/* Card 1: Pengaturan Jadwal Rutin Skeleton */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-amber-100/70 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-5 bg-gray-200 rounded-md w-64" />
                <div className="h-3 bg-gray-100 rounded-md w-96 max-w-full" />
              </div>
            </div>

            {/* Day Selector Skeleton */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-36" />
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-gray-100 border border-gray-200/60" />
                ))}
              </div>
            </div>

            {/* Time Pickers Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-28" />
                <div className="h-10 bg-gray-100 rounded-xl border border-gray-200/60" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-28" />
                <div className="h-10 bg-gray-100 rounded-xl border border-gray-200/60" />
              </div>
              <div className="space-y-1.5 sm:pt-5">
                <div className="h-6 bg-gray-100 rounded-lg w-40" />
              </div>
            </div>

            {/* Button Skeleton */}
            <div className="pt-2 flex items-center justify-between">
              <div className="h-3 bg-gray-100 rounded w-48" />
              <div className="h-10 bg-amber-200/70 rounded-xl w-48" />
            </div>
          </div>

          {/* Card 2: Kalender & Ketersediaan Sesi Skeleton */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100/70 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-5 bg-gray-200 rounded-md w-72" />
                  <div className="h-3 bg-gray-100 rounded-md w-80 max-w-full" />
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="w-8 h-8 rounded-lg bg-gray-100" />
                <div className="h-6 bg-gray-200 rounded w-28" />
                <div className="w-8 h-8 rounded-lg bg-gray-100" />
              </div>
            </div>

            {/* Calendar Days Header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                <div key={d} className="h-4 bg-gray-100 rounded text-center" />
              ))}
            </div>

            {/* Calendar 35 days grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 sm:h-16 rounded-xl bg-gray-50 border border-gray-100 p-1 flex flex-col justify-between"
                >
                  <div className="h-3.5 w-5 bg-gray-200 rounded" />
                  <div className="h-2 w-10 bg-gray-200/70 rounded" />
                </div>
              ))}
            </div>

            {/* Slots Detail Box Skeleton */}
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/60 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-52" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-8 w-20 rounded-lg bg-gray-200" />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 7. Skeleton Loader for Dashboard Tenaga Ahli & Tenaga Teknis
export function SkeletonDashboardExpert() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Saldo Point Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-amber-900/60 to-amber-950/60 border border-amber-900/40 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-2">
          <div className="h-3 bg-white/20 rounded w-28" />
          <div className="h-8 bg-white/30 rounded-lg w-44" />
          <div className="h-3 bg-white/20 rounded w-56" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-white/20 rounded-xl" />
          <div className="h-10 w-28 bg-white/30 rounded-xl" />
        </div>
      </div>

      {/* Account Status / Verification Alert Banner */}
      <div className="rounded-2xl p-5 border border-gray-200/80 bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-48" />
            <div className="h-3 bg-gray-100 rounded w-full max-w-md" />
          </div>
        </div>
        <div className="h-9 w-36 bg-gray-200 rounded-xl shrink-0" />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-black/5 shadow-2xs p-4 sm:p-5 flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gray-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-6 bg-gray-300 rounded w-24" />
              <div className="h-2.5 bg-gray-100 rounded w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Grid */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-4">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-100 bg-gray-50/70 flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Analytics / Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="h-44 bg-gray-100 rounded-xl w-full" />
        </div>
        <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="h-44 bg-gray-100 rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
}

// 8. Skeleton Loader for Dashboard Surveyor
export function SkeletonDashboardSurveyor() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse pb-12">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-br from-stone-700 to-stone-800 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 shrink-0" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-6 bg-white/30 rounded w-48" />
              <div className="h-5 bg-white/20 rounded-full w-24" />
            </div>
            <div className="h-3 bg-white/20 rounded w-72" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-white/20 rounded-xl" />
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-black/5 shadow-2xs p-4 sm:p-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-6 bg-gray-300 rounded w-16" />
              <div className="h-2.5 bg-gray-100 rounded w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Grid */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-36" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-100 bg-gray-50/70 flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="h-3 bg-gray-200 rounded w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Consultation List / Main Content */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <div className="h-5 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-100 rounded w-20" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 bg-gray-200 rounded w-36" />
                  <div className="h-3 bg-gray-100 rounded w-48" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 bg-gray-200 rounded-full w-20" />
                <div className="h-8 bg-gray-200 rounded-lg w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 9. Skeleton Loader for Profil Saya (Wizard & Form Sections)
export function SkeletonProfilSaya() {
  return (
    <div className="space-y-6 animate-pulse pb-12">
      {/* Header Banner & Profile Overview */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gray-200 shrink-0 border-2 border-white shadow-xs" />
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded-md w-52" />
              <div className="h-3.5 bg-gray-100 rounded w-64" />
              <div className="flex gap-2 pt-1">
                <div className="h-5 bg-amber-100 rounded-full w-24" />
                <div className="h-5 bg-gray-100 rounded-full w-28" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 bg-gray-100 rounded-xl w-32" />
            <div className="h-10 bg-amber-200 rounded-xl w-36" />
          </div>
        </div>

        {/* Tab Navigation Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-28 bg-gray-100 rounded-xl shrink-0" />
          ))}
        </div>
      </div>

      {/* Main Form Card Skeleton */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="h-5 bg-gray-200 rounded w-44" />
          <div className="h-3 bg-gray-100 rounded w-28" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 bg-gray-200 rounded w-28" />
              <div className="h-10 bg-gray-50 border border-gray-200/80 rounded-xl w-full" />
            </div>
          ))}
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
          <div className="h-10 bg-gray-100 rounded-xl w-24" />
          <div className="h-10 bg-[#8B4513]/25 rounded-xl w-36" />
        </div>
      </div>
    </div>
  );
}

// 10. Skeleton Loader for Kelola Konsultasi
export function SkeletonKonsultasi() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-black/5 shadow-2xs p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 bg-gray-200 rounded w-16" />
              <div className="h-5 bg-gray-300 rounded w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="h-9 bg-gray-100 rounded-xl w-40" />
          <div className="h-9 bg-gray-100 rounded-xl w-40" />
        </div>
      </div>

      {/* Consultation Cards List */}
      <div className="space-y-3.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-3.5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 bg-gray-200 rounded w-36" />
                  <div className="h-3 bg-gray-100 rounded w-48" />
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="h-6 bg-gray-200 rounded-full w-20" />
                <div className="h-6 bg-emerald-100 rounded-full w-16" />
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl space-y-1.5">
              <div className="h-3 bg-gray-200 rounded w-28" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <div className="h-3 bg-gray-100 rounded w-32" />
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded-lg w-24" />
                <div className="h-8 bg-[#8B4513]/25 rounded-lg w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 11. Skeleton Loader for Pendapatan
export function SkeletonPendapatan() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-amber-900/30 border border-amber-900/40 space-y-3">
          <div className="h-3 bg-white/40 rounded w-28" />
          <div className="h-8 bg-white/50 rounded-lg w-36" />
          <div className="h-3 bg-white/30 rounded w-44" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white border border-[#E5E2D9] shadow-2xs space-y-3">
            <div className="h-3 bg-gray-200 rounded w-32" />
            <div className="h-7 bg-gray-300 rounded w-36" />
            <div className="h-3 bg-gray-100 rounded w-40" />
          </div>
        ))}
      </div>

      {/* Main Content Area: Withdrawal & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-4">
          <div className="h-5 bg-gray-200 rounded w-36" />
          <div className="h-10 bg-gray-100 rounded-xl w-full" />
          <div className="h-10 bg-gray-100 rounded-xl w-full" />
          <div className="h-10 bg-[#8B4513]/30 rounded-xl w-full" />
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <div className="h-5 bg-gray-200 rounded w-44" />
            <div className="h-4 bg-gray-100 rounded w-20" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3.5 bg-gray-50 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="h-3.5 bg-gray-200 rounded w-36" />
                  <div className="h-2.5 bg-gray-100 rounded w-24" />
                </div>
                <div className="h-5 bg-gray-200 rounded-full w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 12. Skeleton Loader for Kelola Produk & Marketplace
export function SkeletonProduk() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Quota Progress Banner */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-200 rounded w-36" />
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full w-full" />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-black/5 shadow-2xs p-4 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-20" />
            <div className="h-6 bg-gray-300 rounded w-16" />
          </div>
        ))}
      </div>

      {/* Table / Card List */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div className="h-5 bg-gray-200 rounded w-32" />
          <div className="h-9 bg-[#8B4513]/25 rounded-xl w-36" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gray-200 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 bg-gray-200 rounded w-48" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 bg-emerald-100 rounded-full w-16" />
                <div className="h-8 bg-gray-200 rounded-lg w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 13. Skeleton Loader for Pesanan Saya
export function SkeletonPesananSaya() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Tabs & Search */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-4 flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-gray-200 rounded-xl" />
          <div className="h-9 w-24 bg-gray-100 rounded-xl" />
        </div>
        <div className="h-9 w-56 bg-gray-100 rounded-xl" />
      </div>

      {/* Orders List */}
      <div className="space-y-3.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-3">
            <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
              <div className="h-3.5 bg-gray-200 rounded w-36" />
              <div className="h-5 bg-emerald-100 rounded-full w-20" />
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-xl bg-gray-200 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-52" />
                <div className="h-3.5 bg-gray-100 rounded w-28" />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2.5 border-t border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-28" />
              <div className="h-8 bg-[#8B4513]/25 rounded-xl w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 14. Skeleton Loader for Kelola Berita
export function SkeletonBerita() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner & Stats */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1.5">
            <div className="h-5 bg-gray-200 rounded w-56" />
            <div className="h-3 bg-gray-100 rounded w-80" />
          </div>
          <div className="h-9 bg-[#8B4513]/25 rounded-xl w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-6 bg-gray-300 rounded w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-4">
        <div className="flex gap-2 pb-3 border-b border-gray-100">
          <div className="h-8 bg-gray-200 rounded-lg w-20" />
          <div className="h-8 bg-gray-100 rounded-lg w-24" />
          <div className="h-8 bg-gray-100 rounded-lg w-32" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3.5 rounded-xl border border-gray-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gray-200 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 bg-gray-200 rounded w-64 max-w-full" />
                  <div className="h-3 bg-gray-100 rounded w-28" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 bg-emerald-100 rounded-full w-20" />
                <div className="h-8 bg-gray-200 rounded-lg w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 15. Skeleton Loader for Tiket
export function SkeletonTiket() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-black/5 shadow-2xs p-4 space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="h-6 bg-gray-300 rounded w-12" />
          </div>
        ))}
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded-lg w-20" />
            <div className="h-8 bg-gray-100 rounded-lg w-24" />
          </div>
          <div className="h-9 bg-[#8B4513]/25 rounded-xl w-32" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-100 space-y-2.5">
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <div className="h-4 bg-gray-200 rounded w-48" />
                  <div className="h-3 bg-gray-100 rounded w-32" />
                </div>
                <div className="h-6 bg-amber-100 rounded-full w-20" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-full max-w-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 16. Skeleton Loader for Ulasan
export function SkeletonUlasan() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-6 text-center space-y-3">
          <div className="h-10 bg-gray-300 rounded-lg w-20 mx-auto" />
          <div className="h-5 bg-amber-200 rounded-full w-32 mx-auto" />
          <div className="h-3 bg-gray-100 rounded w-24 mx-auto" />
        </div>
        <div className="md:col-span-2 bg-white rounded-2xl border border-black/5 shadow-2xs p-6 space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 bg-gray-200 rounded w-12" />
              <div className="h-3 bg-gray-100 rounded-full flex-1" />
              <div className="h-3 bg-gray-200 rounded w-8" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-100 rounded w-20" />
                </div>
              </div>
              <div className="h-4 bg-amber-100 rounded w-24" />
            </div>
            <div className="h-3.5 bg-gray-100 rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 17. Skeleton Loader for Pengaturan
export function SkeletonPengaturan() {
  return (
    <div className="space-y-6 animate-pulse max-w-4xl">
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-32 bg-gray-100 rounded-xl shrink-0" />
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-6 space-y-6">
        <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
          <div className="w-20 h-20 rounded-full bg-gray-200 shrink-0" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-36" />
            <div className="h-8 bg-gray-100 rounded-xl w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 bg-gray-200 rounded w-28" />
              <div className="h-10 bg-gray-50 border border-gray-200 rounded-xl w-full" />
            </div>
          ))}
        </div>

        <div className="pt-4 flex justify-end">
          <div className="h-10 bg-[#8B4513]/25 rounded-xl w-36" />
        </div>
      </div>
    </div>
  );
}

// 18. Skeleton Loader for Membership
export function SkeletonMembership() {
  return (
    <div className="space-y-6 animate-pulse max-w-4xl">
      <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3.5 bg-gray-200 rounded w-32" />
          <div className="h-7 bg-amber-200/80 rounded-lg w-44" />
          <div className="h-3 bg-gray-100 rounded w-56" />
        </div>
        <div className="h-10 bg-[#8B4513]/25 rounded-xl w-36" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-28" />
            <div className="h-7 bg-gray-300 rounded w-32" />
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
              <div className="h-3 bg-gray-100 rounded w-4/6" />
            </div>
            <div className="h-9 bg-gray-100 rounded-xl w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
