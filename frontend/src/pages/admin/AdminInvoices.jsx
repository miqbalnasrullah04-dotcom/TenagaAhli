import { useSearchParams } from 'react-router-dom';

export default function AdminInvoices() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') || 'Semua';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#6B3410]/15 p-6 min-h-[500px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1B1C1A]">Manajemen Invoice</h2>
          <p className="text-sm text-[#414844]/70 mt-1">Status: {status.charAt(0).toUpperCase() + status.slice(1)}</p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center h-64 text-[#414844]/50">
        <span className="material-symbols-outlined text-[48px] mb-4">receipt_long</span>
        <p>Halaman ini sedang dalam pengembangan.</p>
        <p className="text-xs mt-2">Filter Data: {status}</p>
      </div>
    </div>
  );
}
