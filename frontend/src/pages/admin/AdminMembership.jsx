import { useEffect, useState } from 'react';
import { TrophyIcon } from '@heroicons/react/24/solid';
import api from '../../api/client.js';

function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-2xl border border-black/5 shadow-sm ${className}`}>{children}</div>;
}

function Badge({ level, color, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white ${className}`}
      style={{ backgroundColor: color }}
    >
      {level}
    </span>
  );
}

function StatusBadge({ status, className = '' }) {
  const colors = {
    premium: 'bg-[#6B3410] text-white',
    free: 'bg-[#6B7280] text-white',
    expired: 'bg-[#B3261E] text-white',
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${colors[status] || colors.free} ${className}`}>
      {status === 'premium' ? 'Premium' : status === 'free' ? 'Free' : 'Expired'}
    </span>
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminMembership() {
  const [activeTab, setActiveTab] = useState('overview');
  const [statistics, setStatistics] = useState(null);
  const [users, setUsers] = useState([]);
  const [pointTransactions, setPointTransactions] = useState([]);
  const [membershipTransactions, setMembershipTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [userFilters, setUserFilters] = useState({
    search: '',
    package: '',
    level: '',
    per_page: 15,
    page: 1,
  });

  const [transactionFilters, setTransactionFilters] = useState({
    type: '',
    payment_status: '',
    per_page: 15,
    page: 1,
  });

  const loadStatistics = async () => {
    try {
      const response = await api.get('/admin/membership/statistics');
      setStatistics(response.data.data);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams(userFilters);
      const response = await api.get(`/admin/membership/users?${params}`);
      setUsers(response.data.data);
    } catch (err) {
      setError('Gagal memuat data users');
    }
  };

  const loadPointTransactions = async () => {
    try {
      const response = await api.get('/admin/membership/point-transactions');
      setPointTransactions(response.data.data);
    } catch (err) {
      console.error('Failed to load point transactions:', err);
    }
  };

  const loadMembershipTransactions = async () => {
    try {
      const params = new URLSearchParams(transactionFilters);
      const response = await api.get(`/admin/membership/membership-transactions?${params}`);
      setMembershipTransactions(response.data.data);
    } catch (err) {
      console.error('Failed to load membership transactions:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      await Promise.all([
        loadStatistics(),
        activeTab === 'users' ? loadUsers() : Promise.resolve(),
        activeTab === 'points' ? loadPointTransactions() : Promise.resolve(),
        activeTab === 'transactions' ? loadMembershipTransactions() : Promise.resolve(),
      ]);
    } catch (err) {
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, userFilters, transactionFilters]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleProcessExpired = async () => {
    if (!confirm('Proses membership yang expired? Ini akan mengubah status premium menjadi free untuk user yang sudah expired.')) {
      return;
    }

    try {
      const response = await api.post('/admin/membership/process-expired');
      alert(response.data.message);
      loadStatistics();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memproses expired membership');
    }
  };

  if (loading && !statistics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#6B3410]/20 border-t-[#6B3410]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#414844]/60 font-bold uppercase tracking-wider">Total Users</p>
                <p className="text-2xl font-black text-[#1F2A22]">{statistics.total_users}</p>
              </div>
              <span className="material-symbols-outlined text-[32px] text-[#6B3410]/20">people</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#414844]/60 font-bold uppercase tracking-wider">Premium Users</p>
                <p className="text-2xl font-black text-[#6B3410]">{statistics.premium_users}</p>
                <p className="text-xs text-[#414844]/60">Aktif</p>
              </div>
              <span className="material-symbols-outlined text-[32px] text-[#6B3410]/20">star</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#414844]/60 font-bold uppercase tracking-wider">Revenue Total</p>
                <p className="text-lg font-black text-[#F59E0B]">{formatCurrency(statistics.total_premium_revenue)}</p>
              </div>
              <span className="material-symbols-outlined text-[32px] text-[#F59E0B]/20">payments</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#414844]/60 font-bold uppercase tracking-wider">Revenue Bulan Ini</p>
                <p className="text-lg font-black text-[#059669]">{formatCurrency(statistics.monthly_premium_revenue)}</p>
              </div>
              <span className="material-symbols-outlined text-[32px] text-[#059669]/20">trending_up</span>
            </div>
          </Card>
        </div>
      )}

      {/* Level Distribution */}
      {statistics && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#1F2A22]">Distribusi Level Membership</h3>
            <button
              onClick={handleProcessExpired}
              className="bg-[#B3261E] text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-[#93000A] transition-all"
            >
              Proses Expired
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(statistics.level_distribution).map(([level, count]) => {
              const colors = {
                basic: '#9CA3AF',
                silver: '#6B7280',
                gold: '#F59E0B',
                platinum: '#8B5CF6'
              };
              return (
                <div key={level} className="text-center p-4 bg-[#F5F4EF] rounded-xl">
                  <Badge level={level.charAt(0).toUpperCase() + level.slice(1)} color={colors[level]} className="mb-2" />
                  <p className="text-lg font-bold text-[#1F2A22]">{count}</p>
                  <p className="text-xs text-[#414844]/60">users</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Card className="p-0 overflow-hidden">
        <div className="border-b border-black/5">
          <nav className="flex">
            {[
              { key: 'overview', label: 'Overview', icon: 'dashboard' },
              { key: 'users', label: 'Users', icon: 'people' },
              { key: 'points', label: 'Point History', icon: 'stars' },
              { key: 'transactions', label: 'Transactions', icon: 'receipt' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${
                  activeTab === tab.key
                    ? 'border-[#6B3410] text-[#6B3410] bg-[#6B3410]/5'
                    : 'border-transparent text-[#414844]/60 hover:text-[#414844] hover:bg-black/2'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-[56px] text-[#6B3410]/20 mb-3 block">insights</span>
              <h3 className="text-base font-bold text-[#1F2A22] mb-2">Statistik Membership & Point</h3>
              <p className="text-sm text-[#414844]/60">Pilih tab di atas untuk melihat detail data users, point history, atau transaksi</p>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex flex-wrap gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Cari nama atau email..."
                  value={userFilters.search}
                  onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="flex-1 min-w-[200px] rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3410]/30"
                />
                <select
                  value={userFilters.package}
                  onChange={(e) => setUserFilters(prev => ({ ...prev, package: e.target.value }))}
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3410]/30"
                >
                  <option value="">Semua Paket</option>
                  <option value="free">Free</option>
                  <option value="premium">Premium Aktif</option>
                  <option value="expired">Premium Expired</option>
                </select>
                <select
                  value={userFilters.level}
                  onChange={(e) => setUserFilters(prev => ({ ...prev, level: e.target.value }))}
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3410]/30"
                >
                  <option value="">Semua Level</option>
                  <option value="basic">Basic</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="text-left py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">User</th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">Paket</th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">Level</th>
                      <th className="text-right py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">Points</th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">Premium</th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">Next Level</th>
                      <th className="text-right py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">Sisa Hari</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.data?.map((user) => (
                      <tr key={user.id} className="border-b border-black/5 hover:bg-black/2">
                        <td className="py-3 px-2">
                          <div>
                            <p className="text-sm font-bold text-[#1F2A22]">{user.name}</p>
                            <p className="text-xs text-[#414844]/60">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <StatusBadge status={user.package} />
                        </td>
                        <td className="py-3 px-2">
                          <Badge level={user.level_display_name} color={user.level_badge_color} />
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-sm font-bold text-[#1F2A22]">{user.points}</span>
                          <span className="text-xs text-[#414844]/60 ml-1">pts</span>
                        </td>
                        <td className="py-3 px-2">
                          {user.is_premium ? (
                            <div className="text-xs">
                              <p className="text-[#059669] font-bold">Aktif</p>
                              <p className="text-[#414844]/60">{formatDate(user.premium_expires_at)}</p>
                            </div>
                          ) : user.package === 'premium' ? (
                            <div className="text-xs">
                              <p className="text-[#B3261E] font-bold">Expired</p>
                              <p className="text-[#414844]/60">{formatDate(user.premium_expires_at)}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-[#414844]/60">Tidak aktif</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {user.next_level_info?.next_level ? (
                            <div className="text-xs">
                              <p className="text-[#6B3410] font-bold">{user.next_level_info.next_level}</p>
                              <p className="text-[#414844]/60">{user.next_level_info.points_needed} pts</p>
                              <div className="w-full bg-black/5 rounded-full h-1 mt-1">
                                <div
                                  className="bg-[#6B3410] h-1 rounded-full transition-all"
                                  style={{ width: `${user.next_level_info.progress_percentage}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-[#F59E0B] font-bold">
                              <TrophyIcon className="w-3.5 h-3.5" />
                              Max Level
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {user.is_premium ? (
                            <span className="text-sm font-bold text-[#F59E0B]">{user.remaining_days}</span>
                          ) : (
                            <span className="text-xs text-[#414844]/60">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {users.data?.length === 0 && (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-[56px] text-[#414844]/20 mb-3 block">people</span>
                  <p className="text-sm text-[#414844]/60">Tidak ada data user</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'points' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="text-left py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">User</th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">Type</th>
                      <th className="text-right py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">Points</th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">Description</th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pointTransactions.data?.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-black/5 hover:bg-black/2">
                        <td className="py-3 px-2">
                          <div>
                            <p className="text-sm font-bold text-[#1F2A22]">{transaction.user?.name}</p>
                            <p className="text-xs text-[#414844]/60">{transaction.user?.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                            transaction.type === 'upgrade_premium'
                              ? 'bg-[#6B3410] text-white'
                              : 'bg-[#F59E0B] text-white'
                          }`}>
                            {transaction.type === 'upgrade_premium' ? 'Upgrade' : 'Renewal'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-sm font-bold text-[#059669]">+{transaction.points}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-sm text-[#414844]">{transaction.description}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-xs text-[#414844]/60">{formatDate(transaction.created_at)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pointTransactions.data?.length === 0 && (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-[56px] text-[#F59E0B]/20 mb-3 block">stars</span>
                  <p className="text-sm text-[#414844]/60">Belum ada transaksi point</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <div className="flex flex-wrap gap-3 mb-4">
                <select
                  value={transactionFilters.type}
                  onChange={(e) => setTransactionFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3410]/30"
                >
                  <option value="">Semua Type</option>
                  <option value="upgrade">Upgrade</option>
                  <option value="renewal">Renewal</option>
                </select>
                <select
                  value={transactionFilters.payment_status}
                  onChange={(e) => setTransactionFilters(prev => ({ ...prev, payment_status: e.target.value }))}
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3410]/30"
                >
                  <option value="">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="text-left py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">User</th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">Type</th>
                      <th className="text-right py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">Price</th>
                      <th className="text-right py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">Discount</th>
                      <th className="text-right py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">Total</th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-[#414844]/60 uppercase tracking-wider">Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membershipTransactions.data?.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-black/5 hover:bg-black/2">
                        <td className="py-3 px-2">
                          <div>
                            <p className="text-sm font-bold text-[#1F2A22]">{transaction.user?.name}</p>
                            <p className="text-xs text-[#414844]/60">{transaction.user?.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                            transaction.type === 'upgrade'
                              ? 'bg-[#6B3410] text-white'
                              : 'bg-[#F59E0B] text-white'
                          }`}>
                            {transaction.type === 'upgrade' ? 'Upgrade' : 'Renewal'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right text-xs text-[#414844]/60">
                          {formatCurrency(transaction.price)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-xs font-bold text-[#F59E0B]">{transaction.discount}%</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-sm font-bold text-[#1F2A22]">{formatCurrency(transaction.total_price)}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                            transaction.payment_status === 'paid'
                              ? 'bg-[#059669] text-white'
                              : transaction.payment_status === 'pending'
                              ? 'bg-[#F59E0B] text-white'
                              : 'bg-[#B3261E] text-white'
                          }`}>
                            {transaction.payment_status}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="text-xs">
                            <p className="text-[#414844]">{formatDate(transaction.started_at)}</p>
                            <p className="text-[#414844]/60">s/d {formatDate(transaction.expires_at)}</p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {membershipTransactions.data?.length === 0 && (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-[56px] text-[#414844]/20 mb-3 block">receipt</span>
                  <p className="text-sm text-[#414844]/60">Belum ada transaksi membership</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}