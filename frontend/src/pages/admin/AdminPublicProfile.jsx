export default function AdminPublicProfile() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#6B3410]/15 p-6 min-h-[500px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1B1C1A]">Pengaturan Profil Publik</h2>
          <p className="text-sm text-[#414844]/70 mt-1">Kelola data profil publik TenagaAhli.</p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center h-64 text-[#414844]/50">
        <span className="material-symbols-outlined text-[48px] mb-4">public</span>
        <p>Halaman ini sedang dalam pengembangan.</p>
      </div>
    </div>
  );
}
