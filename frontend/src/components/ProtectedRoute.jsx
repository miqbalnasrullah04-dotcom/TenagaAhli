import { Navigate } from 'react-router-dom';

/**
 * requiredRole values:
 *   'admin'        — hanya admin
 *   'tenaga_ahli'  — hanya tenaga ahli (role_type)
 *   'surveyor'     — hanya surveyor (role_type)
 *   'expert_any'   — tenaga_ahli ATAU surveyor (punya dashboard)
 *   'user'         — semua user yang login (termasuk klien)
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const token   = localStorage.getItem('amdal_token');
  const userRaw = localStorage.getItem('amdal_user');

  let user = null;
  try { user = userRaw ? JSON.parse(userRaw) : null; } catch { user = null; }

  // Tidak ada sesi → ke login
  if (!token || !user) return <Navigate to="/sign-in" replace />;

  const role     = user.role;       // 'user' | 'admin'
  const roleType = user.role_type;  // 'klien' | 'tenaga_ahli' | 'surveyor'

  const isClient = roleType === 'klien' || roleType === 'client' || role === 'klien' || role === 'client' || (role !== 'admin' && roleType !== 'tenaga_ahli' && roleType !== 'surveyor' && roleType !== 'tenaga_teknis');

  // Fungsi helper redirect berdasarkan role aktual
  const defaultRedirect = () => {
    if (role === 'admin')                                           return <Navigate to="/admin"              replace />;
    if (roleType === 'surveyor')                                    return <Navigate to="/dashboard-surveyor" replace />;
    if (roleType === 'tenaga_ahli' || roleType === 'tenaga_teknis') return <Navigate to="/dashboard"          replace />;
    return                                                                 <Navigate to="/akun"               replace />;
  };

  // Validasi berdasarkan requiredRole
  switch (requiredRole) {
    case 'admin':
      if (role !== 'admin') return defaultRedirect();
      break;

    case 'tenaga_ahli':
      if ((roleType !== 'tenaga_ahli' && roleType !== 'tenaga_teknis') || isClient) return defaultRedirect();
      break;

    case 'surveyor':
      if (roleType !== 'surveyor' || isClient) return defaultRedirect();
      break;

    case 'expert_any':
      // Tenaga ahli, surveyor, atau tenaga teknis (punya dashboard) — Klien DILARANG
      if ((roleType !== 'tenaga_ahli' && roleType !== 'surveyor' && roleType !== 'tenaga_teknis') || isClient) return defaultRedirect();
      break;

    case 'klien':
      if (!isClient) return defaultRedirect();
      break;

    case 'user':
      // Semua yang sudah login — termasuk klien
      if (role === 'admin') return <Navigate to="/admin" replace />;
      break;

    default:
      // Tidak ada guard → boleh masuk asal sudah login
      break;
  }

  return children;
}
