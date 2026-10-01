import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  FlaskConical,
  Plus,
  UserCheck,
  UserPlus,
  UserRound,
  WalletCards,
  Stethoscope,
  Receipt,
  BarChart3,
  Building2,
  TrendingUp,
  ArrowUpRight,
  Bed,
  Zap,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { TimeFilterBar } from '../common/TimeFilterBar';
import { PanelHeader } from '../common/PanelHeader';
import { PatientTable } from '../common/PatientTable';
import { initialOPRecords, initialLabTests, initialStaff, initialDoctors, initialExpenses } from '../data/initialData';

function QuickAction({ icon, label, color, onClick }) {
  return (
    <button className="quick-action" onClick={onClick}>
      <div className={`quick-icon ${color}`}>{icon}</div>
      <span>{label}</span>
    </button>
  );
}

export function AdminDashboard({
  profile,
  onNavigate,
  onAddPatient,
  onAddOPRecord,
  onEnterResult,
  onRequestLabTest,
  onAddStaff,
  onViewPatientHistory,
  opRecords = initialOPRecords,
  labTests = initialLabTests,
  staff = initialStaff,
  doctorsList = initialDoctors,
  expensesList = initialExpenses,
  branchesList = [],
  effectiveBranch = 'All',
  notify,
}) {
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Admin';
  const isSuperAdmin = profile?.role === 'Super Admin';
  const branchName = profile?.branch || (isSuperAdmin ? 'All Branches' : (branchesList[0]?.name || 'Main Campus'));

  const [filterState, setFilterState] = useState({ filterMode: 'all' });

  // REAL-TIME BRANCH-WISE / TIME-WISE ANALYTICS COMPUTATION FROM MONGODB DATABASE
  const analyticsData = useMemo(() => {
    const isBranchMatch = (itemBranch, itemBranchCode, bName) => {
      if (!itemBranch && !itemBranchCode) return true;
      const ib = (itemBranch || '').trim().toLowerCase();
      const target = (bName || '').trim().toLowerCase();
      return ib === target || ib.includes(target) || target.includes(ib);
    };

    const getItemDate = (item) => {
      if (!item) return null;
      const raw = item.createdAt || item.date || item.expenseDate || item.registrationDate || item.sampleCollectedAt || item.timestamp;
      if (!raw) return null;
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    };

    let scopedOPs = opRecords;
    let scopedLabs = labTests;
    let scopedExps = expensesList;

    if (effectiveBranch && effectiveBranch !== 'All') {
      scopedOPs = opRecords.filter((r) => isBranchMatch(r.branch, r.branchCode, effectiveBranch));
      scopedLabs = labTests.filter((l) => isBranchMatch(l.branch, l.branchCode, effectiveBranch));
      scopedExps = expensesList.filter((e) => isBranchMatch(e.branch, e.branchCode, effectiveBranch));
    }

    if (filterState.filterMode === 'date' && filterState.selectedDate) {
      const targetDate = filterState.selectedDate;
      const matchesDate = (item) => {
        const d = getItemDate(item);
        if (!d) return false;
        const yearStr = d.getFullYear();
        const monthStr = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        return `${yearStr}-${monthStr}-${dayStr}` === targetDate;
      };
      scopedOPs = scopedOPs.filter(matchesDate);
      scopedLabs = scopedLabs.filter(matchesDate);
      scopedExps = scopedExps.filter(matchesDate);
    }

    // 1. MONTHLY FILTER MODE -> WEEK-WISE BREAKDOWN
    if (filterState.filterMode === 'monthly') {
      const [selYear, selMonth] = (filterState.selectedMonth || '').split('-').map(Number);
      const targetYear = selYear || new Date().getFullYear();
      const targetMonth = selMonth || (new Date().getMonth() + 1);

      const weekRanges = [
        { name: 'Week 1 (1-7)', start: 1, end: 7 },
        { name: 'Week 2 (8-14)', start: 8, end: 14 },
        { name: 'Week 3 (15-21)', start: 15, end: 21 },
        { name: 'Week 4 (22-28)', start: 22, end: 28 },
        { name: 'Week 5 (29-31)', start: 29, end: 31 },
      ];

      const items = weekRanges.map((w) => {
        const wRecords = scopedOPs.filter((r) => {
          const d = getItemDate(r);
          return d && d.getFullYear() === targetYear && (d.getMonth() + 1) === targetMonth && d.getDate() >= w.start && d.getDate() <= w.end;
        });

        const opRev = wRecords.reduce((acc, r) => {
          const total = parseFloat(String(r.charges || r.amount || '300').replace(/[^0-9.]/g, '')) || 300;
          const paid = parseFloat(String(r.amountPaid || r.paidAmount || r.amountCollectingNow || (r.paymentStatus === 'Paid' ? total : 0)).replace(/[^0-9.]/g, '')) || total;
          return acc + paid;
        }, 0);

        const wLabOrders = scopedLabs.filter((l) => {
          const d = getItemDate(l);
          return d && d.getFullYear() === targetYear && (d.getMonth() + 1) === targetMonth && d.getDate() >= w.start && d.getDate() <= w.end;
        });

        const labRev = wLabOrders.reduce((acc, l) => {
          const total = parseFloat(String(l.amount || l.testFee || '0').replace(/[^0-9.]/g, '')) || 0;
          const paid = parseFloat(String(l.paidAmount || l.amountPaid || l.amountPaidNow || (l.paymentStatus === 'Paid' ? total : 0)).replace(/[^0-9.]/g, '')) || total;
          return acc + paid;
        }, 0);

        const rev = opRev + labRev;

        const wExpenses = scopedExps.filter((e) => {
          const d = getItemDate(e);
          return d && d.getFullYear() === targetYear && (d.getMonth() + 1) === targetMonth && d.getDate() >= w.start && d.getDate() <= w.end;
        });

        const exp = wExpenses.reduce((acc, e) => {
          const amt = parseFloat(String(e.amount ?? 0).replace(/[^0-9.]/g, '')) || 0;
          return acc + amt;
        }, 0);

        return {
          name: w.name,
          revenue: rev,
          opRevenue: opRev,
          labRevenue: labRev,
          expenses: exp,
          netProfit: rev - exp,
          opCount: wRecords.length,
          labCount: wLabOrders.length,
        };
      });

      const globalTotalRevenue = items.reduce((sum, i) => sum + i.revenue, 0);
      const globalTotalExpenses = items.reduce((sum, i) => sum + i.expenses, 0);
      const globalNetProfit = globalTotalRevenue - globalTotalExpenses;
      const maxVal = Math.max(...items.map((i) => Math.max(i.revenue, i.expenses)), 1000);

      return {
        mode: 'monthly',
        chartTitle: `Financial Performance — Week-wise Breakdown (${filterState.selectedMonth || 'Selected Month'})`,
        items,
        globalTotalRevenue,
        globalTotalExpenses,
        globalNetProfit,
        maxVal,
      };
    }

    // 2. YEARLY FILTER MODE -> MONTH-WISE BREAKDOWN
    if (filterState.filterMode === 'yearly') {
      const targetYear = parseInt(filterState.selectedYear, 10) || new Date().getFullYear();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const items = monthNames.map((mName, mIdx) => {
        const mRecords = scopedOPs.filter((r) => {
          const d = getItemDate(r);
          return d && d.getFullYear() === targetYear && d.getMonth() === mIdx;
        });

        const opRev = mRecords.reduce((acc, r) => {
          const total = parseFloat(String(r.charges || r.amount || '300').replace(/[^0-9.]/g, '')) || 300;
          const paid = parseFloat(String(r.amountPaid || r.paidAmount || r.amountCollectingNow || (r.paymentStatus === 'Paid' ? total : 0)).replace(/[^0-9.]/g, '')) || total;
          return acc + paid;
        }, 0);

        const mLabOrders = scopedLabs.filter((l) => {
          const d = getItemDate(l);
          return d && d.getFullYear() === targetYear && d.getMonth() === mIdx;
        });

        const labRev = mLabOrders.reduce((acc, l) => {
          const total = parseFloat(String(l.amount || l.testFee || '0').replace(/[^0-9.]/g, '')) || 0;
          const paid = parseFloat(String(l.paidAmount || l.amountPaid || l.amountPaidNow || (l.paymentStatus === 'Paid' ? total : 0)).replace(/[^0-9.]/g, '')) || total;
          return acc + paid;
        }, 0);

        const rev = opRev + labRev;

        const mExpenses = scopedExps.filter((e) => {
          const d = getItemDate(e);
          return d && d.getFullYear() === targetYear && d.getMonth() === mIdx;
        });

        const exp = mExpenses.reduce((acc, e) => {
          const amt = parseFloat(String(e.amount ?? 0).replace(/[^0-9.]/g, '')) || 0;
          return acc + amt;
        }, 0);

        return {
          name: mName,
          revenue: rev,
          opRevenue: opRev,
          labRevenue: labRev,
          expenses: exp,
          netProfit: rev - exp,
          opCount: mRecords.length,
          labCount: mLabOrders.length,
        };
      });

      const globalTotalRevenue = items.reduce((sum, i) => sum + i.revenue, 0);
      const globalTotalExpenses = items.reduce((sum, i) => sum + i.expenses, 0);
      const globalNetProfit = globalTotalRevenue - globalTotalExpenses;
      const maxVal = Math.max(...items.map((i) => Math.max(i.revenue, i.expenses)), 1000);

      return {
        mode: 'yearly',
        chartTitle: `Financial Performance — Month-wise Breakdown (${targetYear})`,
        items,
        globalTotalRevenue,
        globalTotalExpenses,
        globalNetProfit,
        maxVal,
      };
    }

    // 3. DEFAULT / ALL TIME / DATE MODE -> BRANCH-WISE BREAKDOWN
    let branchNames = (branchesList || []).map((b) => b.name || b.branchName).filter(Boolean);

    if (branchNames.length === 0) {
      const recordBranches = [
        ...opRecords.map((r) => r.branch),
        ...labTests.map((l) => l.branch),
        ...staff.map((s) => s.branch),
        ...doctorsList.map((d) => d.branch),
        ...expensesList.map((e) => e.branch),
      ].filter(Boolean);
      branchNames = Array.from(new Set(recordBranches));
    }

    if (effectiveBranch && effectiveBranch !== 'All') {
      branchNames = branchNames.filter((b) => b === effectiveBranch);
    }

    const items = branchNames.map((bName) => {
      const bRecords = opRecords.filter((r) => isBranchMatch(r.branch, r.branchCode, bName));
      const opRev = bRecords.reduce((acc, r) => {
        const total = parseFloat(String(r.charges || r.amount || '300').replace(/[^0-9.]/g, '')) || 300;
        const paid = parseFloat(String(r.amountPaid || r.paidAmount || r.amountCollectingNow || (r.paymentStatus === 'Paid' ? total : 0)).replace(/[^0-9.]/g, '')) || total;
        return acc + paid;
      }, 0);

      const bLabOrders = labTests.filter((l) => isBranchMatch(l.branch, l.branchCode, bName));
      const labRev = bLabOrders.reduce((acc, l) => {
        const total = parseFloat(String(l.amount || l.testFee || '0').replace(/[^0-9.]/g, '')) || 0;
        const paid = parseFloat(String(l.paidAmount || l.amountPaid || l.amountPaidNow || (l.paymentStatus === 'Paid' ? total : 0)).replace(/[^0-9.]/g, '')) || total;
        return acc + paid;
      }, 0);

      const rev = opRev + labRev;

      const bExpensesList = expensesList.filter((e) => isBranchMatch(e.branch, e.branchCode, bName));
      const exp = bExpensesList.reduce((acc, e) => {
        const amtStr = String(e.amount ?? 0);
        const amt = parseFloat(amtStr.replace(/[^0-9.]/g, '')) || 0;
        return acc + amt;
      }, 0);

      const netProfit = rev - exp;
      const bStaffCount = staff.filter((s) => isBranchMatch(s.branch, s.branchCode, bName)).length;
      const bDoctorCount = doctorsList.filter((d) => isBranchMatch(d.branch, d.branchCode, bName)).length;

      return {
        name: bName,
        revenue: rev,
        opRevenue: opRev,
        labRevenue: labRev,
        expenses: exp,
        netProfit,
        opCount: bRecords.length,
        labCount: bLabOrders.length,
        expCount: bExpensesList.length,
        staffCount: bStaffCount,
        doctorCount: bDoctorCount,
      };
    });

    const globalTotalRevenue = items.reduce((sum, b) => sum + b.revenue, 0);
    const globalTotalExpenses = items.reduce((sum, b) => sum + b.expenses, 0);
    const globalNetProfit = globalTotalRevenue - globalTotalExpenses;
    const maxVal = items.length > 0 ? Math.max(...items.map((b) => Math.max(b.revenue, b.expenses)), 1000) : 1000;

    return {
      mode: 'branch',
      chartTitle: `Financial Performance (${effectiveBranch === 'All' ? 'All Campuses' : effectiveBranch})`,
      items,
      globalTotalRevenue,
      globalTotalExpenses,
      globalNetProfit,
      maxVal,
    };
  }, [opRecords, expensesList, labTests, staff, doctorsList, branchesList, effectiveBranch, filterState]);

  // STRICT REAL-TIME CALCULATIONS FROM DATABASE
  const rawOpsCount = opRecords.filter(r => !(r.recordType || '').startsWith('IP') && !(r.recordType || '').startsWith('Emergency')).length;
  const rawIpsCount = opRecords.filter(r => (r.recordType || '').startsWith('IP')).length;
  const rawEmergencyCount = opRecords.filter(r => (r.recordType || '').startsWith('Emergency')).length;

  const opsCount = rawOpsCount;
  const ipsCount = rawIpsCount;
  const emergencyCount = rawEmergencyCount;

  const opRecordsRevenue = opRecords.reduce((acc, r) => {
    const total = parseFloat(String(r.charges || r.amount || '300').replace(/[^0-9.]/g, '')) || 300;
    const paid = parseFloat(String(r.amountPaid || r.paidAmount || r.amountCollectingNow || (r.paymentStatus === 'Paid' ? total : 0)).replace(/[^0-9.]/g, '')) || total;
    return acc + paid;
  }, 0);

  const labTestsRevenue = labTests.reduce((acc, l) => {
    const total = parseFloat(String(l.amount || l.testFee || '0').replace(/[^0-9.]/g, '')) || 0;
    const paid = parseFloat(String(l.paidAmount || l.amountPaid || l.amountPaidNow || (l.paymentStatus === 'Paid' ? total : 0)).replace(/[^0-9.]/g, '')) || total;
    return acc + paid;
  }, 0);

  const totalCalculatedRevenue = opRecordsRevenue + labTestsRevenue;

  const totalBranchExpenses = expensesList.reduce((acc, e) => {
    const amtStr = String(e.amount ?? 0);
    const amt = parseFloat(amtStr.replace(/[^0-9.]/g, '')) || 0;
    return acc + amt;
  }, 0);

  const getDetailText = () => {
    if (filterState.filterMode === 'date') return `Date: ${filterState.selectedDate}`;
    if (filterState.filterMode === 'monthly') return `Month: ${filterState.selectedMonth}`;
    if (filterState.filterMode === 'yearly') return `Year: ${filterState.selectedYear}`;
    return isSuperAdmin ? 'All Branches Scope' : `Branch: ${branchName}`;
  };

  // 8 Stat Cards
  const stats = [
    {
      label: 'Total OPs',
      value: opsCount.toString(),
      change: 'Outpatients',
      trend: 'up',
      detail: getDetailText(),
      icon: <ClipboardList />,
      tone: 'blue',
      onClick: () => onNavigate('OP Records', 'OP'),
    },
    {
      label: 'Total IPs',
      value: ipsCount.toString(),
      change: 'Inpatients',
      trend: 'up',
      detail: 'Specified admissions & care',
      icon: <Bed />,
      tone: 'teal',
      onClick: () => onNavigate('OP Records', 'IP'),
    },
    {
      label: 'Total Emergency',
      value: emergencyCount.toString(),
      change: 'Urgent Care',
      trend: 'up',
      detail: 'Emergency room admissions',
      icon: <Zap />,
      tone: 'red',
      onClick: () => onNavigate('OP Records', 'Emergency'),
    },
    {
      label: 'Branch Revenue',
      value: `₹ ${totalCalculatedRevenue.toLocaleString('en-IN')}`,
      change: 'Collected',
      trend: 'up',
      detail: 'Consultation revenue',
      icon: <WalletCards />,
      tone: 'amber',
      onClick: () => onNavigate('Finance'),
    },
    {
      label: 'Branch Expenses',
      value: `₹ ${totalBranchExpenses.toLocaleString('en-IN')}`,
      change: `${expensesList.length} Items`,
      trend: 'down',
      detail: 'Branch expenditure',
      icon: <Receipt />,
      tone: 'amber',
      onClick: () => onNavigate('Expenses'),
    },
    {
      label: 'Branch Doctors',
      value: (doctorsList ? doctorsList.length : 0).toString(),
      change: 'Active',
      trend: 'up',
      detail: 'Consultant specialists',
      icon: <Stethoscope />,
      tone: 'sky',
      onClick: () => onNavigate('Doctors'),
    },
    {
      label: 'Branch Staff',
      value: (staff ? staff.length : 0).toString(),
      change: 'Active',
      trend: 'up',
      detail: 'Branch staff members',
      icon: <UserRound />,
      tone: 'teal',
      onClick: () => onNavigate('Staff'),
    },
    {
      label: 'Branch Lab Reports',
      value: (labTests ? labTests.length : 0).toString(),
      change: 'Laboratory',
      trend: 'up',
      detail: 'Pathology lab reports',
      icon: <FlaskConical />,
      tone: 'blue',
      onClick: () => onNavigate('Laboratory'),
    },
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{isSuperAdmin ? 'Super Admin Executive Workspace' : `Branch Admin Workspace (${branchName})`}</div>
          <h1>Hospital Overview</h1>
          <p>Welcome back, {firstName}. Showing activity strictly for {isSuperAdmin ? 'All Hospital Branches' : `Branch: ${branchName}`}.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" onClick={onAddStaff}>
            <UserRound size={16} /> Add staff member
          </button>
          <button className="primary-button" onClick={onAddOPRecord}>
            <Plus size={17} /> Add Record
          </button>
        </div>
      </div>

      {/* Date-wise, Monthly & Yearly Interactive Filter Bar */}
      <TimeFilterBar
        title="Filter Dashboard Analytics & Registrations"
        onChange={(state) => setFilterState(state)}
      />

      {/* SUPER ADMIN SPACIOUS SINGLE-LINE WIDGET CARD: VERTICAL BAR GRAPH */}
      {isSuperAdmin && (
        <section style={{ width: '100%', marginBottom: '20px', padding: '18px 22px', background: '#ffffff', borderRadius: '14px', border: '1px solid #dce7f5', boxShadow: '0 4px 16px rgba(15, 45, 85, 0.06)' }}>
          {/* Card Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #edf2f8', paddingBottom: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} color="#1769d7" />
              <h3 style={{ margin: 0, fontSize: '15px', color: '#0f2d55', fontWeight: '800' }}>
                {analyticsData.chartTitle}
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', fontWeight: '700' }}>
              <span style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '9px', height: '9px', background: '#16a34a', borderRadius: '3px', display: 'inline-block' }}></span> Revenue
              </span>
              <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '9px', height: '9px', background: '#ef4444', borderRadius: '3px', display: 'inline-block' }}></span> Expenses
              </span>
            </div>
          </div>

          {/* SINGLE LINE SPACIOUS VERTICAL BAR GRAPH WITH RESPONSIVE SCROLL WRAPPER */}
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '6px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${analyticsData.items.length}, 1fr)`,
                minWidth: `${Math.max(650, analyticsData.items.length * 60)}px`,
                gap: '12px',
                alignItems: 'end',
                padding: '16px 12px 12px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                marginBottom: '14px',
              }}
            >
              {analyticsData.items.map((b) => {
                const revHeight = b.revenue > 0 ? Math.max(16, Math.round((b.revenue / analyticsData.maxVal) * 125)) : 4;
                const expHeight = b.expenses > 0 ? Math.max(16, Math.round((b.expenses / analyticsData.maxVal) * 125)) : 4;

                const formatBarVal = (val) => {
                  if (!val || val === 0) return '';
                  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
                  return `₹${val}`;
                };

                return (
                  <div
                    key={b.name}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 4px',
                    }}
                  >
                    {/* Pair of Vertical Bars */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '145px', paddingBottom: '4px', borderBottom: '2px solid #cbd5e1', width: '100%', justifyContent: 'center' }}>
                      {/* Revenue Bar */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#15803d', minHeight: '14px', textAlign: 'center' }}>
                          {formatBarVal(b.revenue)}
                        </span>
                        <div
                          style={{
                            width: '20px',
                            height: `${revHeight}px`,
                            background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                            borderRadius: '5px 5px 0 0',
                            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                            transition: 'height 0.3s ease',
                            opacity: b.revenue === 0 ? 0.3 : 1,
                          }}
                          title={`${b.name} Total Revenue: ₹ ${b.revenue.toLocaleString('en-IN')} (OP: ₹ ${(b.opRevenue || 0).toLocaleString('en-IN')} | Lab: ₹ ${(b.labRevenue || 0).toLocaleString('en-IN')})`}
                        />
                      </div>

                      {/* Expenses Bar */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#dc2626', minHeight: '14px', textAlign: 'center' }}>
                          {formatBarVal(b.expenses)}
                        </span>
                        <div
                          style={{
                            width: '20px',
                            height: `${expHeight}px`,
                            background: 'linear-gradient(180deg, #f87171 0%, #ef4444 100%)',
                            borderRadius: '5px 5px 0 0',
                            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.25)',
                            transition: 'height 0.3s ease',
                            opacity: b.expenses === 0 ? 0.3 : 1,
                          }}
                          title={`${b.name} Expenses: ₹ ${b.expenses.toLocaleString('en-IN')}`}
                        />
                      </div>
                    </div>

                    {/* Branch / Time Period Name & Net Margin */}
                    <div style={{ textAlign: 'center', marginTop: '2px' }}>
                      <strong style={{ fontSize: '11px', color: '#0f2d55', display: 'block', lineHeight: '1.2', whiteSpace: 'nowrap' }}>{b.name}</strong>
                      <span style={{ fontSize: '10px', color: b.netProfit >= 0 ? '#15803d' : '#dc2626', fontWeight: '700', display: 'block', marginTop: '2px' }}>
                        Prof: ₹{b.netProfit >= 1000 || b.netProfit <= -1000 ? `${(b.netProfit / 1000).toFixed(1)}k` : b.netProfit.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SINGLE-LINE TOTALS SUMMARY ROW BELOW BARS */}
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '10px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#0369a1' }}>
              <Building2 size={16} color="#0284c7" />
              <span>{analyticsData.mode === 'monthly' ? 'Monthly Totals Summary:' : analyticsData.mode === 'yearly' ? 'Yearly Totals Summary:' : (effectiveBranch === 'All' ? 'Total For All Branches:' : `${effectiveBranch} Totals:`)}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px', fontWeight: '700' }}>
              <span style={{ color: '#15803d' }}>
                Total Revenue: <strong>₹ {analyticsData.globalTotalRevenue.toLocaleString('en-IN')}</strong>
              </span>
              <span style={{ color: '#dc2626' }}>
                Total Expenses: <strong>₹ {analyticsData.globalTotalExpenses.toLocaleString('en-IN')}</strong>
              </span>
              <span style={{ color: analyticsData.globalNetProfit >= 0 ? '#0369a1' : '#dc2626' }}>
                Net Profit: <strong>₹ {analyticsData.globalNetProfit.toLocaleString('en-IN')}</strong>
              </span>
            </div>
          </div>
        </section>
      )}

      {/* STAT CARDS SECTION (BELOW SUPER ADMIN TOP GRAPH CARD) */}
      <section className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <div className="dashboard-grid">
        <section className="panel patient-panel">
          <PanelHeader
            title="Recent Patient Registrations"
            subtitle="Live outpatient registration feed"
            action="View all patients"
            onAction={() => onNavigate('OP Records')}
          />
          <PatientTable compact onViewHistory={onViewPatientHistory} onRequestLabTest={onRequestLabTest} onNotify={notify} />
        </section>

        <section className="panel quick-panel">
          <PanelHeader title="Quick Actions" subtitle="Hospital administrative shortcuts" />
          <div className="quick-actions">
            <QuickAction
              icon={<Plus />}
              label="Register New Patient"
              color="blue"
              onClick={onAddPatient}
            />
            <QuickAction
              icon={<ClipboardList />}
              label="Add Record"
              color="sky"
              onClick={onAddOPRecord}
            />
            <QuickAction
              icon={<FlaskConical />}
              label="Enter Lab Result"
              color="amber"
              onClick={onEnterResult}
            />
            <QuickAction
              icon={<UserRound />}
              label="Add Staff Member"
              color="teal"
              onClick={onAddStaff}
            />
          </div>
        </section>
      </div>
    </>
  );
}

export default AdminDashboard;
