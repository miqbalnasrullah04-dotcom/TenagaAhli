import GraduationCapLoader from './GraduationCapLoader.jsx';

export default function PageLoader({ visible, routeKey }) {
  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-0 z-[99999] w-full h-[100dvh] min-h-screen select-none touch-none overscroll-none flex items-center justify-center
        bg-gradient-to-br from-[#1A1512] via-[#231B16] to-[#100C0A] 
        transition-opacity duration-300 ease-in-out ${
        visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative flex items-center justify-center">
        {/* Ambient warm glow di belakang */}
        <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-[#8B4513]/25 blur-3xl pointer-events-none" />

        {/* Topi wisuda yang menggambar sendiri */}
        {visible && (
          <GraduationCapLoader
            key={routeKey}
            size={120}
            duration={1.8}
            cap="#d8d4cc"
            shade="#a9a398"
            tassel="#e0a040"
          />
        )}
      </div>
    </div>
  );
}