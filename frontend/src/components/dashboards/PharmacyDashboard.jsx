import React, { useState, useMemo } from 'react';
import {
  Pill,
  Plus,
  WalletCards,
  Receipt,
  ShoppingBag,
  TrendingUp,
  BarChart3,
  Search,
  Trash2,
  Calendar,
  Building2,
  CheckCircle2,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { TimeFilterBar } from '../common/TimeFilterBar';
import { AddPharmacySaleForm } from '../forms/AddPharmacySaleForm';

export function PharmacyDashboard({
  profile,
  onNavigate,
  onAddPharmacySale,
  onSavePharmacySale,
  pharmacySales = [],
  branchesList = [],
  effectiveBranch = 'All',
  onNotify,
}) {
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Pharmacist';
  const isSuperAdmin = profile?.role === 'Super Admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState({ filterMode: 'all' });
  const [localSales, setLocalSales] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);

  // Safely combine parent pharmacySales & locally added sales without infinite loop
  const activeSales = useMemo(() => {
    const combined = [...localSales, ...(pharmacySales || [])];
    const seen = new Set();
    return combined.filter((s) => {
      const key = s._id || s.id || s.saleNo;
      if (!key || seen.has(key) || deletedIds.includes(key)) return false;
      seen.add(key);
      return true;
    });
  }, [pharmacySales, localSales, deletedIds]);

  // Branch-wise Analytics Computation
  const branchAnalyticsData = useMemo(() => {
    let branchNames = (branchesList || []).map((b) => b.name || b.branchName).filter(Boolean);

    if (branchNames.length === 0) {
      const recordBranches = activeSales.map((s) => s.branch).filter(Boolean);
      branchNames = Array.from(new Set(recordBranches));
    }

    if (effectiveBranch && effectiveBranch !== 'All') {
      branchNames = branchNames.filter((b) => b === effectiveBranch);
    }

    const isBranchMatch = (itemBranch, itemBranchCode, bName) => {
      if (!itemBranch && !itemBranchCode) return true;
      const ib = (itemBranch || '').trim().toLowerCase();
      const target = (bName || '').trim().toLowerCase();
      return ib === target || ib.includes(target) || target.includes(ib);
    };

    const branches = branchNames.map((bName) => {
      const bSales = activeSales.filter((s) => isBranchMatch(s.branch, s.branchCode, bName));
      
      const rev = bSales.reduce((sum, s) => {
        const amt = parseFloat(String(s.collectingAmount || s.totalCollection || '0').replace(/[^0-9.]/g, '')) || 0;
        return sum + amt;
      }, 0);

      const exp = bSales.reduce((sum, s) => {
        const amt = parseFloat(String(s.totalExpense || '0').replace(/[^0-9.]/g, '')) || 0;
        return sum + amt;
      }, 0);

      const pur = bSales.reduce((sum, s) => {
        const amt = parseFloat(String(s.totalPurchase || '0').replace(/[^0-9.]/g, '')) || 0;
        return sum + amt;
      }, 0);

      const netProfit = rev - (exp + pur);

      return {
        name: bName,
        revenue: rev,
        expenses: exp,
        purchases: pur,
        netProfit,
        saleCount: bSales.length,
      };
    });

    const globalTotalRevenue = branches.reduce((sum, b) => sum + b.revenue, 0);
    const globalTotalExpenses = branches.reduce((sum, b) => sum + b.expenses, 0);
    const globalTotalPurchases = branches.reduce((sum, b) => sum + b.purchases, 0);
    const globalNetProfit = globalTotalRevenue - (globalTotalExpenses + globalTotalPurchases);
    const maxVal = branches.length > 0 ? Math.max(...branches.map((b) => Math.max(b.revenue, b.expenses + b.purchases)), 1000) : 1000;

    return {
      branches,
      globalTotalRevenue,
      globalTotalExpenses,
      globalTotalPurchases,
      globalNetProfit,
      maxVal,
    };
  }, [activeSales, branchesList, effectiveBranch]);

  // Overall Totals
  const totalCollections = useMemo(() => {
    return activeSales.reduce((sum, s) => {
      const amt = parseFloat(String(s.collectingAmount || s.totalCollection || '0').replace(/[^0-9.]/g, '')) || 0;
      return sum + amt;
    }, 0);
  }, [activeSales]);

  const totalExpenses = useMemo(() => {
    return activeSales.reduce((sum, s) => {
      const amt = parseFloat(String(s.totalExpense || '0').replace(/[^0-9.]/g, '')) || 0;
      return sum + amt;
    }, 0);
  }, [activeSales]);

  const totalPurchases = useMemo(() => {
    return activeSales.reduce((sum, s) => {
      const amt = parseFloat(String(s.totalPurchase || '0').replace(/[^0-9.]/g, '')) || 0;
      return sum + amt;
    }, 0);
  }, [activeSales]);

  // Filtered sales for table
  const filteredSales = useMemo(() => {
    return activeSales.filter((s) =>
      `${s.saleNo} ${s.patientName} ${s.branch} ${s.paymentMethod} ${s.notes}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [activeSales, searchQuery]);

  // Delete sale handler
  const handleDeleteSale = async (sale) => {
    const saleId = sale._id || sale.id || sale.saleNo;
    const token = localStorage.getItem('kh_auth_token');

    try {
      if (saleId && String(saleId).length > 5) {
        await fetch(`http://localhost:5000/api/v1/pharmacy/${saleId}`, {
          method: 'DELETE',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });
      }
    } catch (err) {
      console.warn('Could not delete pharmacy sale from backend:', err.message);
    }

    setDeletedIds((prev) => [...prev, saleId]);
    setLocalSales((prev) => prev.filter((item) => (item._id || item.id || item.saleNo) !== saleId));
    onNotify && onNotify(`Deleted pharmacy receipt ${sale.saleNo || sale.id}`);
  };

  const stats = [
    {
      label: 'Pharmacy Total Collections',
      value: `₹ ${totalCollections.toLocaleString('en-IN')}`,
      change: `${activeSales.length} Transactions`,
      trend: 'up',
      detail: 'Mandatory collection total',
      icon: <WalletCards />,
      tone: 'teal',
      onClick: () => {},
    },
    {
      label: 'Pharmacy Total Expenses',
      value: `₹ ${totalExpenses.toLocaleString('en-IN')}`,
      change: 'Operational',
      trend: 'down',
      detail: 'Optional recorded expenses',
      icon: <Receipt />,
      tone: 'red',
      onClick: () => {},
    },
    {
      label: 'Total Medicine Purchases',
      value: `₹ ${totalPurchases.toLocaleString('en-IN')}`,
      change: 'Inventory',
      trend: 'down',
      detail: 'Optional inventory purchases',
      icon: <ShoppingBag />,
      tone: 'amber',
      onClick: () => {},
    },
    {
      label: 'Total Completed Sales',
      value: activeSales.length.toString(),
      change: 'Completed',
      trend: 'up',
      detail: 'Branch pharmacy transactions',
      icon: <Pill />,
      tone: 'blue',
      onClick: () => {},
    },
  ];

  const [showForm, setShowForm] = useState(true);

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Pharmacy Operations & Inventory</div>
          <h1>Pharmacy Workspace</h1>
          <p>Welcome back, {firstName}. Manage branch collections, medicine purchases, and operational expenses.</p>
        </div>
        <div className="heading-actions">
          <button
            className="primary-button"
            onClick={() => setShowForm((prev) => !prev)}
            style={{ background: '#15803d', borderColor: '#15803d', gap: '6px' }}
          >
            <Plus size={17} /> {showForm ? 'Hide Form' : 'Add Record'}
          </button>
        </div>
      </div>

      {/* Interactive Filter Bar */}
      <TimeFilterBar
        title="Filter Pharmacy Analytics & Collections"
        onChange={(state) => setFilterState(state)}
      />

      {/* RECORD PHARMACY COLLECTION FORM EMBEDDED INLINE */}
      {showForm && (
        <section style={{ marginBottom: '24px' }}>
          <AddPharmacySaleForm
            onSave={(newSale) => {
              setLocalSales((prev) => [newSale, ...prev]);
              if (onSavePharmacySale) onSavePharmacySale(newSale);
              onNotify && onNotify(`Pharmacy record ${newSale.saleNo || newSale.id} registered!`);
            }}
            notify={onNotify}
            effectiveBranch={effectiveBranch}
            branchesList={branchesList}
          />
        </section>
      )}

      {/* STAT CARDS SECTION */}
      <section className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '20px' }}>
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      {/* SINGLE LINE VERTICAL BAR GRAPH */}
      {isSuperAdmin && branchAnalyticsData.branches.length > 0 && (
        <section style={{ width: '100%', marginBottom: '20px', padding: '18px 22px', background: '#ffffff', borderRadius: '14px', border: '1px solid #dce7f5', boxShadow: '0 4px 16px rgba(15, 45, 85, 0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #edf2f8', paddingBottom: '10px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} color="#15803d" />
              <h3 style={{ margin: 0, fontSize: '15px', color: '#0f2d55', fontWeight: '800' }}>
                Pharmacy Financial Performance ({effectiveBranch === 'All' ? 'All Campuses' : effectiveBranch})
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', fontWeight: '700' }}>
              <span style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '9px', height: '9px', background: '#16a34a', borderRadius: '3px', display: 'inline-block' }}></span> Collections
              </span>
              <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '9px', height: '9px', background: '#ef4444', borderRadius: '3px', display: 'inline-block' }}></span> Expenses & Purchases
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${branchAnalyticsData.branches.length}, 1fr)`, gap: '16px', alignItems: 'end', padding: '16px 14px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
            {branchAnalyticsData.branches.map((b) => {
              const revHeight = Math.max(16, Math.round((b.revenue / branchAnalyticsData.maxVal) * 125));
              const expHeight = Math.max(16, Math.round(((b.expenses + b.purchases) / branchAnalyticsData.maxVal) * 125));

              return (
                <div key={b.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '145px', paddingBottom: '4px', borderBottom: '2px solid #cbd5e1', width: '100%', justifyContent: 'center' }}>
                    {/* Collection Bar */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#15803d' }}>
                        ₹{(b.revenue / 1000).toFixed(1)}k
                      </span>
                      <div
                        style={{
                          width: '24px',
                          height: `${revHeight}px`,
                          background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                          borderRadius: '5px 5px 0 0',
                          boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                        }}
                        title={`${b.name} Collections: ₹ ${b.revenue.toLocaleString('en-IN')}`}
                      />
                    </div>

                    {/* Expense & Purchase Bar */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#dc2626' }}>
                        ₹{((b.expenses + b.purchases) / 1000).toFixed(1)}k
                      </span>
                      <div
                        style={{
                          width: '24px',
                          height: `${expHeight}px`,
                          background: 'linear-gradient(180deg, #f87171 0%, #ef4444 100%)',
                          borderRadius: '5px 5px 0 0',
                          boxShadow: '0 2px 6px rgba(239, 68, 68, 0.25)',
                        }}
                        title={`${b.name} Expenses: ₹ ${b.expenses.toLocaleString('en-IN')} | Purchases: ₹ ${b.purchases.toLocaleString('en-IN')}`}
                      />
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '2px' }}>
                    <strong style={{ fontSize: '12px', color: '#0f2d55', display: 'block', lineHeight: '1.2' }}>{b.name}</strong>
                    <span style={{ fontSize: '11px', color: b.netProfit >= 0 ? '#15803d' : '#dc2626', fontWeight: '700' }}>
                      Net: ₹{b.netProfit.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* PHARMACY TRANSACTIONS TABLE PANEL */}
      <section className="panel full-panel" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #dce7f5', boxShadow: '0 4px 16px rgba(15, 45, 85, 0.05)', padding: '20px' }}>
        <div className="list-toolbar" style={{ flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #edf2f8', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: '#f0fdf4', borderRadius: '8px', display: 'grid', placeItems: 'center', border: '1px solid #bbf7d0' }}>
              <Pill size={18} color="#15803d" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', color: '#0f2d55', fontWeight: '800' }}>
                Pharmacy Sales & Collections ({filteredSales.length})
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Audited medicine sales and mandatory collection receipts
              </span>
            </div>
          </div>

          <div style={{ position: 'relative', maxWidth: '320px', width: '100%' }}>
            <input
              type="text"
              placeholder="Search receipt, customer, branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', background: '#f8fafc' }}
            />
            <Search size={15} color="#64748b" style={{ position: 'absolute', left: '11px', top: '10px' }} />
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '720px', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: '800', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Receipt / Sale No</th>
                <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: '800', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Patient / Customer</th>
                <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#15803d', fontWeight: '800', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Collecting Amount (Mandatory)</th>
                <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: '800', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Total Collection</th>
                <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: '800', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Expense</th>
                <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: '800', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Purchase</th>
                <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: '800', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Branch Campus</th>
                <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: '800', borderBottom: '2px solid #e2e8f0', textAlign: 'center', whiteSpace: 'nowrap' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <tr key={sale._id || sale.id || sale.saleNo} style={{ borderBottom: '1px solid #edf2f8' }}>
                    <td style={{ padding: '12px' }}>
                      <strong style={{ color: '#0f2d55', fontSize: '12px', fontFamily: 'monospace' }}>{sale.saleNo || sale.id}</strong>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '700', color: '#162d4a', fontSize: '12px' }}>{sale.patientName || 'Walk-In Customer'}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: '#15803d', fontSize: '13px', fontWeight: '900', background: '#f0fdf4', padding: '4px 8px', borderRadius: '6px', border: '1px solid #bbf7d0', display: 'inline-block' }}>
                        ₹ {parseFloat(sale.collectingAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: '#0369a1', fontWeight: '700', fontSize: '12px' }}>
                        ₹ {parseFloat(sale.totalCollection || sale.collectingAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: '#dc2626', fontSize: '12px' }}>
                        ₹ {parseFloat(sale.totalExpense || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: '#d97706', fontSize: '12px' }}>
                        ₹ {parseFloat(sale.totalPurchase || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontWeight: '700', color: '#1769d7', fontSize: '11px' }}>
                        {sale.branch || 'Main Branch'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        className="icon-button"
                        style={{ width: '30px', height: '30px', border: '1px solid #fecaca', background: '#fef2f2', borderRadius: '6px', cursor: 'pointer', display: 'inline-grid', placeItems: 'center' }}
                        onClick={() => handleDeleteSale(sale)}
                        title="Delete Sale Record from Database"
                      >
                        <Trash2 size={14} color="#dc2626" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', background: '#fafbfc' }}>
                    <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#f0fdf4', display: 'grid', placeItems: 'center', border: '1px solid #bbf7d0' }}>
                        <Pill size={22} color="#16a34a" />
                      </div>
                      <h4 style={{ margin: 0, fontSize: '14px', color: '#0f2d55', fontWeight: '800' }}>No Pharmacy Collections Recorded</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                        No pharmacy receipts match your filter. Click <strong>Pharmacy &gt; Record Collection</strong> in the sidebar to register a sale.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default PharmacyDashboard;
