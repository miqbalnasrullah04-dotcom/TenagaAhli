import { useState } from 'react';
import { OFFICIAL_BANK_ACCOUNTS, PT_COMPANY_NAME } from '../constants/bankAccounts.js';
import BankLogo from './BankLogo.jsx';

export default function ManualPaymentInstruction({
  selectedBankId = 'qris',
  onSelectBank,
  compact = false,
  className = '',
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  const activeBank = OFFICIAL_BANK_ACCOUNTS.find((b) => b.id === selectedBankId) || OFFICIAL_BANK_ACCOUNTS[0];

  const handleCopy = (text, keyLabel) => {
    if (!text) return;
    navigator.clipboard?.writeText(String(text));
    setCopiedKey(keyLabel);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* ── Selector Pilihan Bank / QRIS ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
            PILIH REKENING BANK / QRIS TUJUAN:
          </label>
          <span className="text-[11px] font-semibold text-[#8B4513] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 shadow-2xs">
            Transfer Manual Resmi
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {OFFICIAL_BANK_ACCOUNTS.map((b) => {
            const isSelected = activeBank.id === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelectBank && onSelectBank(b.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between group ${
                  isSelected
                    ? 'border-[#8B4513] bg-[#FFF9F5] ring-2 ring-[#8B4513]/25 shadow-xs'
                    : 'border-gray-200 bg-white hover:border-[#8B4513]/40 hover:bg-gray-50/70 shadow-2xs'
                }`}
              >
                {b.isQris && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-md tracking-wider shadow-2xs">
                    SCAN
                  </span>
                )}

                {/* Baris Logo Resmi Bank / QRIS (Native SVG) */}
                <div className="h-7 flex items-center mb-2.5">
                  <BankLogo bankId={b.id} className="h-6 w-auto max-w-[85px] object-contain object-left" />
                </div>

                {/* Detail Nama & Nomor Rekening */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-gray-900">{b.shortName}</span>
                  </div>
                  <div className="text-[11px] font-mono font-semibold text-gray-600 truncate mt-0.5">
                    {b.isQris ? 'Gopay Merchant' : b.accountNumber}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Box Info Detail Rekening / QRIS Terpilih ── */}
      {activeBank.isQris ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 border border-emerald-200/90 shadow-2xs space-y-3.5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-200/60">
            <div className="flex items-center gap-2.5">
              <div className="bg-white px-2.5 py-1 rounded-xl border border-emerald-200 shadow-2xs shrink-0 flex items-center">
                <BankLogo bankId="qris" className="h-5 w-auto max-w-[70px]" />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900 leading-tight">QRIS Standar Pembayaran Nasional</p>
                <p className="text-[11px] text-emerald-800 font-semibold">Gopay Merchant Resmi • Bebas Biaya Admin</p>
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold border border-emerald-200 self-start sm:self-auto">
              Scan dari Bank & E-Wallet Mana Saja
            </span>
          </div>

          {/* QRIS Image Container */}
          <div className="flex flex-col md:flex-row items-center gap-4 pt-1">
            <div className="w-48 sm:w-56 shrink-0 bg-white p-3 rounded-2xl border-2 border-emerald-200 shadow-sm text-center">
              <img
                src={activeBank.qrisImage}
                alt="QRIS TRIWALA DIGITAL, DIGITAL & KREATIF"
                className="w-full rounded-xl object-contain drop-shadow-2xs"
              />
              <span className="text-[10px] text-gray-400 block mt-2 font-mono">NMID: {activeBank.nmid}</span>
            </div>

            <div className="flex-1 space-y-2.5 text-xs">
              <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1 shadow-2xs">
                <div className="text-[11px] text-gray-500 font-semibold">Nama Merchant Resmi:</div>
                <div className="font-extrabold text-sm sm:text-base text-gray-900 text-emerald-900">
                  {activeBank.accountName}
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px] text-gray-600">
                  <span>NMID: <strong className="font-mono text-gray-800">{activeBank.nmid}</strong></span>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeBank.nmid, 'NMID')}
                    className="text-emerald-700 hover:underline font-bold inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[12px]">content_copy</span>
                    <span>{copiedKey === 'NMID' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-950 space-y-1">
                <p className="font-bold flex items-center gap-1 text-emerald-900">
                  <span className="material-symbols-outlined text-[15px]">info</span>
                  <span>Cara Pembayaran QRIS:</span>
                </p>
                <p className="text-gray-600 leading-relaxed">
                  1. Buka aplikasi m-Banking (Mandiri, BCA, BNI, dll) atau E-Wallet (GoPay, OVO, DANA, ShopeePay).<br />
                  2. Scan barcode QRIS di samping, pastikan nama tujuan adalah <strong>TRIWALA DIGITAL, DIGITAL & KREATIF</strong>.<br />
                  3. Masukkan nominal sesuai tagihan, simpan struk transfer dan upload di bawah.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <a
                  href={activeBank.qrisImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="qris-triwala-digital.png"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  <span>Unduh / Buka QRIS Penuh</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 bg-[#FAFBFB] rounded-2xl border border-gray-200/90 shadow-2xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="bg-white px-2.5 py-1 rounded-xl border border-gray-200/80 shadow-2xs shrink-0 flex items-center">
                <BankLogo bankId={activeBank.id} className="h-5 w-auto max-w-[85px]" />
              </div>
              <span className="font-bold text-gray-800 text-sm">{activeBank.bank}</span>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200/80">
              {activeBank.badge}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                Nomor Rekening:
              </span>
              <div className="font-mono font-black text-lg text-gray-900 tracking-wider">
                {activeBank.accountNumber}
              </div>
              <div className="text-xs text-gray-600 mt-0.5 font-medium">
                Atas Nama: <strong className="text-gray-900">{activeBank.accountName}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(activeBank.accountNumber, activeBank.shortName)}
              className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copiedKey === activeBank.shortName ? 'check_circle' : 'content_copy'}
              </span>
              <span>{copiedKey === activeBank.shortName ? 'Tersalin ke Clipboard!' : 'Salin Nomor Rekening'}</span>
            </button>
          </div>

          <p className="text-[11px] text-gray-500 leading-relaxed">
            Silakan lakukan transfer dari ATM, Mobile Banking, atau Internet Banking ke rekening resmi di atas. Simpan bukti struk/screenshot transfer dan lampirkan pada formulir upload.
          </p>
        </div>
      )}
    </div>
  );
}
