/**
 * NavbarBackground
 *
 * Kotak gradasi coklat di belakang Navbar (z-40).
 * Tinggi disesuaikan persis dengan tinggi Navbar.jsx:
 *   - Navbar pakai py-4 (16px atas + 16px bawah = 32px)
 *   - Logo mobile  h-10 = 40px  →  40 + 32 = 72px
 *   - Logo desktop h-12 = 48px  →  48 + 32 = 80px
 */
export default function NavbarBackground() {
  return (
    <div
      className="fixed top-0 left-0 w-full h-[72px] md:h-[80px] bg-gradient-to-r from-[#8B4513] via-[#A0522D] to-[#CD853F] z-40"
      aria-hidden="true"
    />
  );
}
