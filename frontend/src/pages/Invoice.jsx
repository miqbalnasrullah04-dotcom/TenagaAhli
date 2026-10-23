import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client.js';
import logo from '../assets/new logo.png';
import { useTranslation } from '../context/LanguageContext.jsx';
import InvoiceNotFound from './InvoiceNotFound.jsx';

/* ─── helpers ─────────────────────────────────────────────────── */
function formatRupiah(v) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v ?? 0);
}

function formatDate(dateStr, opts = {}) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...opts,
  });
}

function formatPaymentMethod(method) {
  if (!method) return 'Transfer Bank';
  const m = String(method).toLowerCase();
  if (m.includes('qris')) return 'QRIS';
  if (m.includes('point') || m.includes('poin')) return 'Point';
  if (m.includes('midtrans')) return 'Midtrans';
  if (m.includes('gopay')) return 'GoPay';
  if (m.includes('ovo')) return 'OVO';
  if (m.includes('dana')) return 'DANA';
  if (m.includes('shopee')) return 'ShopeePay';
  if (m.includes('bca')) return 'BCA';
  if (m.includes('mandiri')) return 'Mandiri';
  if (m.includes('bni')) return 'BNI';
  if (m.includes('bri')) return 'BRI';
  if (m.includes('manual') || m.includes('transfer') || m.includes('bank')) return 'Transfer Bank';
  return method.length > 18 ? method.slice(0, 18) : method;
}

const getSTATUSMAP = (t) => ({
  menunggu_pembayaran: {
    label: t('invoice.status.waiting_payment', 'Menunggu Pembayaran'),
    color: '#92400E',
    bg: '#FEF3C7',
    border: '#FCD34D',
    icon: 'schedule',
    dot: '#F59E0B',
  },
  pending: {
    label: t('invoice.status.waiting_payment', 'Menunggu Pembayaran'),
    color: '#92400E',
    bg: '#FEF3C7',
    border: '#FCD34D',
    icon: 'schedule',
    dot: '#F59E0B',
  },
  menunggu_verifikasi: {
    label: t('invoice.status.waiting_verification', 'Menunggu Verifikasi'),
    color: '#1E40AF',
    bg: '#DBEAFE',
    border: '#93C5FD',
    icon: 'pending',
    dot: '#3B82F6',
  },
  verified: {
    label: t('invoice.status.paid', 'LUNAS'),
    color: '#065F46',
    bg: '#D1FAE5',
    border: '#6EE7B7',
    icon: 'verified',
    dot: '#10B981',
  },
  paid: {
    label: t('invoice.status.paid', 'LUNAS'),
    color: '#065F46',
    bg: '#D1FAE5',
    border: '#6EE7B7',
    icon: 'verified',
    dot: '#10B981',
  },
  rejected: {
    label: t('invoice.status.cancelled', 'Dibatalkan'),
    color: '#991B1B',
    bg: '#FEE2E2',
    border: '#FCA5A5',
    icon: 'cancel',
    dot: '#EF4444',
  },
  cancelled: {
    label: t('invoice.status.cancelled', 'Dibatalkan'),
    color: '#991B1B',
    bg: '#FEE2E2',
    border: '#FCA5A5',
    icon: 'cancel',
    dot: '#EF4444',
  },
  expired: {
    label: t('invoice.status.expired', 'Kedaluwarsa'),
    color: '#4B5563',
    bg: '#F3F4F6',
    border: '#E5E7EB',
    icon: 'timer_off',
    dot: '#9CA3AF',
  },
});

/* ─── StatusPill ───────────────────────────────────────────────── */
function StatusPill({ status, t }) {
  const STATUS_MAP = getSTATUSMAP(t);
  const d = STATUS_MAP[status] || {
    label: status || 'Pending',
    color: '#374151',
    bg: '#F3F4F6',
    border: '#D1D5DB',
    icon: 'info',
    dot: '#6B7280',
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest"
      style={{ color: d.color, backgroundColor: d.bg, border: `1px solid ${d.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: d.dot }} />
      {d.label}
    </span>
  );
}

/* ─── InfoRow ──────────────────────────────────────────────────── */
function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{label}</span>
      <span className={`text-sm font-semibold text-gray-800 text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

/* ─── Main ─────────────────────────────────────────────────────── */
export default function Invoice() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const printRef = useRef(null);

  // If passed from PilihPaket via location.state, use it immediately
  const passedOrder = location.state?.order;
  const [order, setOrder] = useState(() => {
    if (!passedOrder) return null;
    const pkgName = typeof passedOrder.package === 'object' && passedOrder.package !== null
      ? passedOrder.package.name
      : (typeof passedOrder.package === 'string' ? passedOrder.package : (passedOrder.package_name || 'Premium'));
    const isMembership = pkgName || passedOrder.type === 'upgrade' || passedOrder.type === 'renewal' || String(passedOrder.reference_code || '').startsWith('MBRS-');
    return {
      ...passedOrder,
      package: pkgName || passedOrder.package_name || 'Premium',
      package_name: isMembership ? (pkgName || passedOrder.package_name || 'Premium Membership') : (passedOrder.package_name || pkgName || 'Paket'),
      amount: passedOrder.amount ?? passedOrder.total_price ?? 0,
      total_price: passedOrder.total_price ?? passedOrder.amount ?? 0,
      status: passedOrder.status || passedOrder.payment_status || 'pending',
      order_number: passedOrder.order_number || passedOrder.reference_code || `ORD-${passedOrder.id || id}`,
      payment_method: passedOrder.payment_method || (isMembership ? 'Transfer Bank Manual' : 'Transfer Bank'),
      original_price: passedOrder.original_price || passedOrder.price || passedOrder.amount || 0,
      discount_percentage: passedOrder.discount_percentage || passedOrder.discount || 0,
      discount_amount: passedOrder.discount_amount || 0,
      type: isMembership ? 'membership' : 'order'
    };
  });
  const [loading, setLoading] = useState(!passedOrder);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('amdal_user');
      if (raw) setUser(JSON.parse(raw));
    } catch { /* ignore */ }

    console.log('🔍 Invoice.jsx - Searching for ID:', id);

    const idStr = String(id || '').trim();
    const isOrdPrefix = idStr.startsWith('ORD-') || idStr.startsWith('PROD-');
    const isMbrsPrefix = idStr.startsWith('MBRS-') || idStr.startsWith('MEMBER-');

    // 1. Prioritaskan endpoint terpadu /my/invoices/:id
    const profilePromise = api.get('/my/profile').catch(() => ({ data: null }));
    const unifiedInvoicePromise = api.get(`/my/invoices/${encodeURIComponent(idStr)}`).catch(() => null);

    Promise.all([profilePromise, unifiedInvoicePromise])
      .then(async ([profileRes, unifiedRes]) => {
        if (profileRes?.data) {
          setUser((prev) => ({ ...prev, ...profileRes.data }));
        }

        if (unifiedRes?.data?.data) {
          const inv = unifiedRes.data.data;
          setOrder({
            id: inv.id,
            reference_code: inv.reference_code,
            order_number: inv.reference_code || inv.invoice_number,
            invoice_number: inv.invoice_number,
            category: inv.category,
            category_label: inv.category_label,
            category_icon: inv.category_icon,
            package_name: inv.title || inv.package_name,
            package: inv.package_name || inv.title,
            amount: inv.amount,
            total_price: inv.total_price || inv.amount,
            original_price: inv.original_price || inv.amount,
            discount_amount: inv.discount_amount || 0,
            status: inv.status,
            payment_method: inv.payment_method,
            created_at: inv.created_at,
            verified_at: inv.verified_at,
            customer: inv.customer,
            items: inv.items,
            type: inv.category,
          });
          return;
        }

        // Fallback untuk legacy direct routes
        let directPromise;
        if (isOrdPrefix) {
          directPromise = api.get(`/orders/${id}`).catch(() => null);
        } else if (isMbrsPrefix) {
          directPromise = api.get(`/membership/transactions/${id}`).catch(() => null);
        } else {
          directPromise = api.get(`/orders/${id}`)
            .catch(() => api.get(`/membership/transactions/${id}`).catch(() => null));
        }

        const directRes = await directPromise;
        let found = directRes?.data?.data || directRes?.data;

        // If not found from direct endpoint, fallback to history search
        if (!found) {
          const [ordersRes, membershipRes] = await Promise.all([
            !isMbrsPrefix ? api.get('/orders/history').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
            !isOrdPrefix ? api.get('/membership/membership-history?limit=50').catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
          ]);

          const orders = Array.isArray(ordersRes?.data) ? ordersRes.data : (Array.isArray(ordersRes?.data?.data) ? ordersRes.data.data : []);
          const memberships = Array.isArray(membershipRes?.data) ? membershipRes.data : (Array.isArray(membershipRes?.data?.data) ? membershipRes.data.data : []);

          found = orders.find((o) => String(o.id) === idStr || o.reference_code === idStr);
          if (!found) {
            found = memberships.find((m) => String(m.id) === idStr || m.reference_code === idStr);
          }
        }

        // Format as order
        if (found) {
          const pkgName = typeof found.package === 'object' && found.package !== null
            ? found.package.name
            : (typeof found.package === 'string' ? found.package : null);
          const isMembership = pkgName || found.type === 'upgrade' || found.type === 'renewal' || String(found.reference_code || '').startsWith('MBRS-');
          const formatted = {
            ...found,
            package: pkgName || found.package_name || 'Premium',
            package_name: isMembership ? (pkgName || found.package_name || 'Premium Membership') : (found.package_name || pkgName || 'Paket'),
            amount: found.amount ?? found.total_price ?? 0,
            total_price: found.total_price ?? found.amount ?? 0,
            status: found.payment_status || found.status || 'pending',
            order_number: found.reference_code || found.order_number || `ORD-${found.id}`,
            payment_method: found.payment_method || (isMembership ? 'Transfer Bank Manual' : 'Transfer Bank'),
            original_price: found.price || found.original_price || found.total_price || found.amount || 0,
            discount_percentage: found.discount ?? found.discount_percentage ?? 0,
            discount_amount: found.discount_amount || 0,
            type: isMembership ? 'membership' : 'order'
          };
          setOrder(formatted);
        } else if (!passedOrder) {
          // If neither found nor passed from state, fallback if in development or set null
          if (import.meta.env.DEV) {
            setOrder({
              id: parseInt(id) || id,
              order_number: `MBRS-${id}`,
              reference_code: `MBRS-${id}`,
              package_name: 'Premium Membership',
              package: 'premium',
              amount: 250000,
              total_price: 250000,
              original_price: 250000,
              discount_percentage: 0,
              discount_amount: 0,
              status: 'pending',
              payment_status: 'pending',
              payment_method: 'Transfer Bank Manual',
              created_at: new Date().toISOString(),
              verified_at: null,
              type: 'membership',
              started_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            });
          } else {
            setOrder(null);
          }
        }
      })
      .catch((err) => {
        console.error('Critical error loading invoice:', err);
        if (!passedOrder) {
          setOrder(null);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0F4F8' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#8B4513] animate-spin" />
          <p className="text-gray-500 text-sm font-medium">{t('Memuat invoice...')}</p>
        </div>
      </div>
    );
  }

  /* ── Not Found ── */
  if (!order) {
    return <InvoiceNotFound />;
  }

  const STATUS_MAP = getSTATUSMAP(t);
  const statusConfig = STATUS_MAP[order?.status] || STATUS_MAP['menunggu_pembayaran'];
  
  const handlePay = () => {
    if (order.category === 'topup') {
      navigate('/top-up');
      return;
    }
    if (order.category === 'berita') {
      navigate('/kelola-berita');
      return;
    }
    if (order.category === 'konsultasi') {
      navigate('/jadwal-konsultasi');
      return;
    }
    if (order.category === 'produk') {
      navigate('/pesanan-saya');
      return;
    }
    navigate('/pembayaran', {
      state: {
        order,
        package: {
          id: order.package_id || 2,
          name: order.package_name || order.package || 'Paket Premium',
          price: order.amount ?? order.total_price ?? 200000
        }
      }
    });
  };

  const isPaid = order.status === 'verified' || order.status === 'paid';
  const isPending = order.status === 'menunggu_pembayaran' || order.status === 'pending';
  
  // Format dates strictly and safely
  const rawCreatedAt = order.created_at ? new Date(order.created_at) : new Date();
  const validCreatedAt = isNaN(rawCreatedAt.getTime()) ? new Date() : rawCreatedAt;
  const invoiceDateShort = validCreatedAt.toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
  
  const dueRaw = new Date(validCreatedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
  const dueDateLong = dueRaw.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const invoiceNumber = order.reference_code || order.order_number || order.id;
  const amount = order.amount ?? order.total_price ?? 0;
  
  const customerName = order.user?.name || user?.name || '[Customer name here]';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { background-color: #F8FAFC !important; margin: 0; }
        .invoice-wrapper {
          font-family: 'Inter', sans-serif;
          color: #111827;
        }
        .invoice-paper {
          background: white;
          border-radius: 8px;
          border: 1px solid #E5E7EB;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          width: 100%;
          max-width: 800px;
          margin: 40px auto;
          padding: 48px;
          position: relative;
        }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .invoice-paper { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>

      <div className="invoice-wrapper min-h-screen py-6 px-4">
        
        {/* Action bar */}
        <div className="no-print max-w-[800px] mx-auto mb-6 flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-semibold text-sm">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            {t('Kembali')}
          </button>
          <div className="flex gap-2">
            {!isPaid && (
              <button 
                onClick={handlePay} 
                className="bg-[#8B4513] text-white font-bold px-5 py-2 rounded-lg text-sm transition-colors shadow-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">payments</span>
                {t('Bayar Sekarang')}
              </button>
            )}
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold px-4 py-2 rounded-lg text-sm transition-colors border border-gray-300 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">print</span>
              {t('Cetak')}
            </button>
          </div>
        </div>

        {/* Invoice Paper */}
        <div ref={printRef} className="invoice-paper">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <img src={logo} alt="TenagaAhli.com" className="h-10 w-auto" style={{ filter: 'grayscale(0%)' }} />
            <div className="text-right">
              <h1 className="text-3xl font-extrabold text-[#374151] tracking-tight uppercase">{t('INVOICE')}</h1>
              <p className="text-[#4B5563] text-sm font-semibold mt-1">{invoiceNumber}</p>
            </div>
          </div>

          {/* Due Date & Status Pill */}
          <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
            <span className="inline-block bg-[#FEF3C7] text-[#92400E] px-4 py-1.5 rounded-full text-sm font-bold">
              {t('Due date:')} {dueDateLong}
            </span>
            <StatusPill status={order.status} t={t} />
          </div>

          {/* 3 Columns Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-[13px]">
            {/* From */}
            <div className="pr-4">
              <p className="font-bold text-gray-900 mb-1">{t('From:')}</p>
              <p className="text-gray-700 leading-relaxed">
                <strong>TenagaAhli.com</strong><br />
                Jl. Saturnus No.13 Blk. F, RT.2/RW.5, Ciherang<br />
                Kec. Dramaga, Kabupaten Bogor<br />
                Jawa Barat 16680<br />
                0811-1520-900<br />
                www.tenagaahli.com<br />
                help@tenagaahli.com
              </p>
            </div>

            {/* Bill to */}
            <div className="pr-4">
              <p className="font-bold text-gray-900 mb-1">{t('Bill to:')}</p>
              <p className="text-gray-700 leading-relaxed">
                {order.customer?.name || customerName}<br />
                {order.customer?.email || order.user?.email || user?.email || '-'}<br />
                {order.customer?.phone || order.user?.phone || user?.phone || '-'}
              </p>
            </div>

            {/* Pay via */}
            <div>
              <div className="bg-[#F3F4F6] rounded-xl p-4 w-full h-full">
                <p className="font-bold text-gray-900 mb-1">{t('Pay via:')}</p>
                <p className="text-gray-700 font-semibold">{formatPaymentMethod(order.payment_method)}</p>
                {isPaid && (
                  <div className="mt-2 text-green-600 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    {t('PAID')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reference */}
          <div className="mb-8 text-[13px] flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="font-bold text-gray-900 mr-2">{t('Reference:')}</span>
              <span className="text-gray-700">
                {order.title || order.package_name || order.package || 'Tagihan Transaksi TenagaAhli'}
              </span>
            </div>
            {order.category_label && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#8B4513]/10 text-[#8B4513]">
                <span className="material-symbols-outlined text-[14px]">{order.category_icon || 'receipt'}</span>
                <span>{order.category_label}</span>
              </span>
            )}
          </div>

          {/* Amount Due Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {t('Total amount due:')} {formatRupiah(amount)}
            </h2>
            <p className="text-sm font-bold text-gray-900">
              {t('Order ID:')} <span className="font-semibold">{invoiceNumber}</span>
            </p>
          </div>

          {/* Table */}
          <div className="w-full text-[13px]">
            {/* Thead */}
            <div className="flex font-bold text-gray-900 py-3 border-b border-gray-200">
              <div className="flex-[4]">{t('Description')}</div>
              <div className="flex-1 text-center">{t('Qty')}</div>
              <div className="flex-[1.5] text-right">{t('Price (Rp)')}</div>
              <div className="flex-[1.5] text-right">{t('Total (Rp)')}</div>
            </div>
            
            {/* Rows */}
            {Array.isArray(order.items) && order.items.length > 0 ? (
              order.items.map((it, idx) => (
                <div key={idx} className="flex text-gray-700 py-3.5 border-b border-gray-100 items-start">
                  <div className="flex-[4] pr-4">
                    <p className="font-bold text-gray-900 mb-0.5">{it.name}</p>
                    {it.description && <p className="text-gray-500 text-[12px] leading-relaxed">{it.description}</p>}
                  </div>
                  <div className="flex-1 text-center font-medium">{it.qty || 1}</div>
                  <div className="flex-[1.5] text-right font-medium">{formatRupiah(it.price).replace('Rp', '').trim()}</div>
                  <div className="flex-[1.5] text-right font-bold text-gray-900">{formatRupiah(it.total || it.price).replace('Rp', '').trim()}</div>
                </div>
              ))
            ) : (
              <div className="flex text-gray-700 py-3 border-b border-gray-100">
                <div className="flex-[4] pr-4">
                  <p className="mb-1 font-bold text-gray-900">
                    {order.package_name || order.package || 'Layanan TenagaAhli'}
                  </p>
                  <p className="text-gray-500 text-[12px]">
                    {order.type === 'membership' || order.type === 'membership_test' 
                      ? t('Membership Premium TenagaAhli') 
                      : t('Pembayaran Transaksi Resmi TenagaAhli.com')
                    }
                  </p>
                  {order.expires_at && (
                    <p className="text-gray-500 text-[12px] mt-1">
                      {t('Berlaku hingga:')} {formatDate(order.expires_at, { dateOnly: true })}
                    </p>
                  )}
                </div>
                <div className="flex-1 text-center font-medium">1</div>
                <div className="flex-[1.5] text-right font-medium">{formatRupiah(order.original_price || amount).replace('Rp', '').trim()}</div>
                <div className="flex-[1.5] text-right font-bold text-gray-900">{formatRupiah(amount).replace('Rp', '').trim()}</div>
              </div>
            )}

            {/* Footer rows */}
            <div className="flex justify-end py-2">
              <div className="font-bold text-gray-900 w-32 text-right pr-6">{t('Subtotal')}</div>
              <div className="text-gray-700 w-24 text-right">
                {formatRupiah(order.original_price || order.total_price || amount).replace('Rp', '').trim()}
              </div>
            </div>
            
            {/* Show discount if applicable */}
            {order.discount_percentage > 0 && (
              <div className="flex justify-end py-2">
                <div className="text-gray-600 w-32 text-right pr-6">
                  {t('Discount')} ({order.discount_percentage}%)
                </div>
                <div className="text-red-600 w-24 text-right">
                  -{formatRupiah(order.discount_amount || 0).replace('Rp', '').trim()}
                </div>
              </div>
            )}
            
            {!order.discount_percentage && (
              <div className="flex justify-end py-2">
                <div className="text-gray-600 w-32 text-right pr-6">{t('Discount')}</div>
                <div className="text-gray-700 w-24 text-right">0</div>
              </div>
            )}
            <div className="flex justify-end py-2">
              <div className="text-gray-600 w-32 text-right pr-6">{t('Tax')}</div>
              <div className="text-gray-700 w-24 text-right">0</div>
            </div>
            <div className="flex justify-end py-2 border-b border-gray-200">
              <div className="text-gray-600 w-32 text-right pr-6">{t('Shipping')}</div>
              <div className="text-gray-700 w-24 text-right">0</div>
            </div>
            <div className="flex justify-end py-3">
              <div className="font-bold text-gray-900 w-48 text-right pr-6">{t('Total amount due')}</div>
              <div className="font-bold text-gray-900 w-24 text-right">{formatRupiah(amount).replace('Rp', '').trim()}</div>
            </div>
          </div>

          {/* Signature area */}
          <div className="flex justify-end mt-12 mb-16 mr-10">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-[13px] text-gray-900">{t('Admin TenagaAhli,')}</p>
                <p className="font-bold text-[13px] text-gray-900">{t('Director')}</p>
              </div>
              {/* Dummy signature drawn with SVG to mimic the blue signature */}
              <svg width="80" height="50" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                <path d="M10,40 Q20,10 30,30 T50,20 T70,35 T90,25" stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M25,25 Q35,5 45,35 T65,15" stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
          </div>

          {/* Footer Notes & Payment Methods */}
          <div className="grid grid-cols-[120px_1fr] gap-3 text-[12px] text-gray-700 mb-6">
            <div className="font-bold text-gray-900">{t('Payment Method')}</div>
            <div className="text-gray-600 leading-relaxed space-y-0.5">
              <p>• <strong>QRIS & Transfer Bank:</strong> Mandiri, BCA, BNI (a.n. PT Triwala Mitra Bestari)</p>
              <p>• <strong>Midtrans Gateway:</strong> Virtual Account, QRIS Instan, dan E-Wallet</p>
            </div>
            <div className="font-bold text-gray-900">{t('Terms &')}<br/>{t('Conditions')}</div>
            <div className="text-gray-600 leading-relaxed">
              {t('Akses dan layanan aktif otomatis setelah pembayaran terverifikasi. Hubungi tim support jika ada kendala.')}
            </div>
          </div>

          {/* Bottom Branding */}
          <div className="flex justify-between items-center text-[11px] pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1 text-gray-400">
              {t('Powered by')} <span className="font-bold text-[#8B4513] ml-1 tracking-tighter text-sm">{t('TenagaAhli.com')}</span>
            </div>
            <div className="font-bold text-gray-900">{t('Page 1 of 1')}</div>
          </div>

        </div>
      </div>
    </>
  );
}
