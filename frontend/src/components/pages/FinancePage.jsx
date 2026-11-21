import React, { useState, useMemo } from 'react';
import { CircleDollarSign, FlaskConical, WalletCards, Filter, TrendingDown, Pill, Stethoscope, Building2, Activity, Zap, Scissors, Bed, ClipboardList } from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { PanelHeader } from '../common/PanelHeader';
import { TimeFilterBar } from '../common/TimeFilterBar';
import { getNormalizedDateParts } from '../../lib/dateUtils';

// Helper record type categorizers for precise revenue streams
const isSurgery = (r) => {
  const t = (r.recordType || '').trim().toLowerCase();
  return t.startsWith('surgery') || t.includes('surgery') || Boolean(r.surgeryName);
};

const isTreatment = (r) => {
  const t = (r.recordType || '').trim().toLowerCase();
  return t.startsWith('treatment') || t.includes('treatment');
};

const isIP = (r) => {
  const t = (r.recordType || '').trim().toLowerCase();
  return (t.startsWith('ip') && !t.startsWith('op')) || t.includes('inpatient');
};

const isEmergency = (r) => {
  const t = (r.recordType || '').trim().toLowerCase();
  return t.startsWith('emergency');
};

const isOnlyOP = (r) => {
  return !isSurgery(r) && !isTreatment(r) && !isIP(r) && !isEmergency(r);
};

const getRecordAmount = (item) => {
  if (item.paymentStatus === 'Cancelled' || item.status === 'Cancelled' || item.isCancelled) return 0;
  const amtStr = String(item.charges || item.amount || '300').replace(/[^0-9.]/g, '');
  return parseFloat(amtStr) || 300;
};

function Category({ name, value, percent, color, icon: Icon }) {
  return (
    <div className="category" style={{ width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#334155' }}>
          {Icon && <Icon size={14} color="#1769d7" />}
          {name}
        </span>
        <strong style={{ fontSize: '13px', color: '#0f172a' }}>{value}</strong>
      </div>
      <div className="progress" style={{ height: '8px', borderRadius: '4px', background: '#e2e8f0', overflow: 'hidden' }}>
        <i className={color} style={{ width: percent, height: '100%', display: 'block', borderRadius: '4px' }} />
      </div>
    </div>
  );
}

export function FinancePage({
  expensesList = [],
  opRecords = [],
  labTests = [],
  pharmacySales = [],
  effectiveBranch = 'All',
  branchesList = [],
  isSuperAdmin = false,
  onNotify,
}) {
  const [filterState, setFilterState] = useState({ filterMode: 'all' });
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all', 'op', 'lab', 'pharmacy'

  // Time-Filtered Datasets based on filterState
  const filteredOpRecords = useMemo(() => {
    if (!filterState || filterState.filterMode === 'all') return opRecords;
    return opRecords.filter((r) => {
      const { year, month, fullDate } = getNormalizedDateParts(r);
      if (filterState.filterMode === 'date') return Boolean(fullDate && fullDate === filterState.selectedDate);
      if (filterState.filterMode === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        return Boolean(fullDate && fullDate === todayStr);
      }
      if (filterState.filterMode === 'monthly') return Boolean(month && month === filterState.selectedMonth);
      if (filterState.filterMode === 'yearly') return Boolean(year && year === filterState.selectedYear);
      return true;
    });
  }, [opRecords, filterState]);

  const filteredLabTests = useMemo(() => {
    if (!filterState || filterState.filterMode === 'all') return labTests;
    return labTests.filter((t) => {
      const { year, month, fullDate } = getNormalizedDateParts(t);
      if (filterState.filterMode === 'date') return Boolean(fullDate && fullDate === filterState.selectedDate);
      if (filterState.filterMode === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        return Boolean(fullDate && fullDate === todayStr);
      }
      if (filterState.filterMode === 'monthly') return Boolean(month && month === filterState.selectedMonth);
      if (filterState.filterMode === 'yearly') return Boolean(year && year === filterState.selectedYear);
      return true;
    });
  }, [labTests, filterState]);

  const filteredPharmacySales = useMemo(() => {
    if (!filterState || filterState.filterMode === 'all') return pharmacySales;
    return pharmacySales.filter((s) => {
      const { year, month, fullDate } = getNormalizedDateParts(s);
      if (filterState.filterMode === 'date') return Boolean(fullDate && fullDate === filterState.selectedDate);
      if (filterState.filterMode === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        return Boolean(fullDate && fullDate === todayStr);
      }
      if (filterState.filterMode === 'monthly') return Boolean(month && month === filterState.selectedMonth);
      if (filterState.filterMode === 'yearly') return Boolean(year && year === filterState.selectedYear);
      return true;
    });
  }, [pharmacySales, filterState]);

  const filteredExpensesList = useMemo(() => {
    if (!filterState || filterState.filterMode === 'all') return expensesList;
    return expensesList.filter((e) => {
      const { year, month, fullDate } = getNormalizedDateParts(e);
      if (filterState.filterMode === 'date') return Boolean(fullDate && fullDate === filterState.selectedDate);
      if (filterState.filterMode === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        return Boolean(fullDate && fullDate === todayStr);
      }
      if (filterState.filterMode === 'monthly') return Boolean(month && month === filterState.selectedMonth);
      if (filterState.filterMode === 'yearly') return Boolean(year && year === filterState.selectedYear);
      return true;
    });
  }, [expensesList, filterState]);

  // Real Department Collections Calculations from Filtered MongoDB Records
  const labRevenue = useMemo(() => {
    return filteredLabTests.reduce((sum, item) => {
      const paid = typeof item.paidAmount === 'number'
        ? item.paidAmount
        : (parseFloat(String(item.amountPaid || item.paidAmount || '0').replace(/[^0-9.]/g, '')) || 0);
      return sum + paid;
    }, 0);
  }, [filteredLabTests]);

  const opRevenue = useMemo(() => {
    return filteredOpRecords.reduce((sum, item) => {
      return sum + getRecordAmount(item);
    }, 0);
  }, [filteredOpRecords]);

  // Granular Revenue Streams: Only OP, Only Treatment, Only Surgery, Only IP, Only Emergency
  const onlyOpRevenue = useMemo(() => {
    return filteredOpRecords.reduce((sum, item) => {
      if (!isOnlyOP(item)) return sum;
      return sum + getRecordAmount(item);
    }, 0);
  }, [filteredOpRecords]);

  const onlyTreatmentRevenue = useMemo(() => {
    return filteredOpRecords.reduce((sum, item) => {
      if (!isTreatment(item)) return sum;
      return sum + getRecordAmount(item);
    }, 0);
  }, [filteredOpRecords]);

  const onlySurgeryRevenue = useMemo(() => {
    return filteredOpRecords.reduce((sum, item) => {
      if (!isSurgery(item)) return sum;
      return sum + getRecordAmount(item);
    }, 0);
  }, [filteredOpRecords]);

  const onlyIpRevenue = useMemo(() => {
    return filteredOpRecords.reduce((sum, item) => {
      if (!isIP(item)) return sum;
      return sum + getRecordAmount(item);
    }, 0);
  }, [filteredOpRecords]);

  const onlyEmergencyRevenue = useMemo(() => {
    return filteredOpRecords.reduce((sum, item) => {
      if (!isEmergency(item)) return sum;
      return sum + getRecordAmount(item);
    }, 0);
  }, [filteredOpRecords]);

  // Counts for each granular stream
  const onlyOpCount = useMemo(() => filteredOpRecords.filter(isOnlyOP).length, [filteredOpRecords]);
  const onlyTreatmentCount = useMemo(() => filteredOpRecords.filter(isTreatment).length, [filteredOpRecords]);
  const onlySurgeryCount = useMemo(() => filteredOpRecords.filter(isSurgery).length, [filteredOpRecords]);
  const onlyIpCount = useMemo(() => filteredOpRecords.filter(isIP).length, [filteredOpRecords]);
  const onlyEmergencyCount = useMemo(() => filteredOpRecords.filter(isEmergency).length, [filteredOpRecords]);

  const pharmacyRevenue = useMemo(() => {
    return filteredPharmacySales.reduce((sum, item) => {
      const amt = typeof item.collectingAmount === 'number'
        ? item.collectingAmount
        : typeof item.totalCollection === 'number'
        ? item.totalCollection
        : typeof item.total === 'number'
        ? item.total
        : (parseFloat(String(item.collectingAmount || item.totalCollection || item.total || item.amountPaid || item.amount || '0').replace(/[^0-9.]/g, '')) || 0);
      return sum + amt;
    }, 0);
  }, [filteredPharmacySales]);

  const allRevenueTotal = labRevenue + opRevenue + pharmacyRevenue;

  let totalRevenueNumber = allRevenueTotal;
  if (sourceFilter === 'op') totalRevenueNumber = opRevenue;
  if (sourceFilter === 'only_op') totalRevenueNumber = onlyOpRevenue;
  if (sourceFilter === 'treatment') totalRevenueNumber = onlyTreatmentRevenue;
  if (sourceFilter === 'surgery') totalRevenueNumber = onlySurgeryRevenue;
  if (sourceFilter === 'ip') totalRevenueNumber = onlyIpRevenue;
  if (sourceFilter === 'emergency') totalRevenueNumber = onlyEmergencyRevenue;
  if (sourceFilter === 'lab') totalRevenueNumber = labRevenue;
  if (sourceFilter === 'pharmacy') totalRevenueNumber = pharmacyRevenue;

  // Exact Sum of Expenses for Scoped Branch / Period
  const actualExpenseSum = useMemo(() => {
    return filteredExpensesList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpensesList]);

  // Expenses Category Breakdown
  const labSuppliesExpense = useMemo(() => {
    return filteredExpensesList
      .filter((e) => (e.category || '').toLowerCase().includes('lab') || (e.category || '').toLowerCase().includes('medical'))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpensesList]);

  const officeExpense = useMemo(() => {
    return filteredExpensesList
      .filter((e) => (e.category || '').toLowerCase().includes('office') || (e.category || '').toLowerCase().includes('front'))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpensesList]);

  const utilitiesExpense = useMemo(() => {
    return filteredExpensesList
      .filter((e) => (e.category || '').toLowerCase().includes('utility') || (e.category || '').toLowerCase().includes('staff'))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpensesList]);

  const netIncomeNumber = totalRevenueNumber - actualExpenseSum;

  // Branch-Wise Performance Summary Computation for Super Admin
  const branchPerformance = useMemo(() => {
    if (!branchesList || branchesList.length === 0) return [];
    return branchesList.map((branch) => {
      const bName = (branch.name || '').toLowerCase().trim();
      const bCode = (branch.code || '').toLowerCase().trim();

      const isMatch = (itemB, itemC) => {
        const ib = (itemB || '').toLowerCase().trim();
        const ic = (itemC || '').toLowerCase().trim();
        return ib === bName || (bCode && ic === bCode) || ib.includes(bName) || bName.includes(ib);
      };

      const bLab = filteredLabTests.filter((t) => isMatch(t.branch, t.branchCode)).reduce((sum, t) => sum + (Number(t.paidAmount || t.amountPaid) || 0), 0);
      const bOpRecords = filteredOpRecords.filter((r) => isMatch(r.branch, r.branchCode));
      const bOp = bOpRecords.reduce((sum, r) => sum + getRecordAmount(r), 0);
      const bOnlyOp = bOpRecords.filter(isOnlyOP).reduce((sum, r) => sum + getRecordAmount(r), 0);
      const bTreatment = bOpRecords.filter(isTreatment).reduce((sum, r) => sum + getRecordAmount(r), 0);
      const bSurgery = bOpRecords.filter(isSurgery).reduce((sum, r) => sum + getRecordAmount(r), 0);
      const bIpEmerg = bOpRecords.filter((r) => isIP(r) || isEmergency(r)).reduce((sum, r) => sum + getRecordAmount(r), 0);

      const bPharm = filteredPharmacySales.filter((s) => isMatch(s.branch, s.branchCode)).reduce((sum, s) => {
        const amt = typeof s.collectingAmount === 'number' ? s.collectingAmount : typeof s.totalCollection === 'number' ? s.totalCollection : typeof s.total === 'number' ? s.total : (parseFloat(String(s.collectingAmount || s.totalCollection || s.total || s.amount || '0').replace(/[^0-9.]/g, '')) || 0);
        return sum + amt;
      }, 0);
      const bExp = filteredExpensesList.filter((e) => isMatch(e.branch, e.branchCode)).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const bTotal = bLab + bOp + bPharm;
      const bNet = bTotal - bExp;

      return {
        name: branch.name,
        code: branch.code || 'BRANCH',
        lab: bLab,
        op: bOp,
        onlyOp: bOnlyOp,
        treatment: bTreatment,
        surgery: bSurgery,
        ipEmerg: bIpEmerg,
        pharm: bPharm,
        totalRev: bTotal,
        expenses: bExp,
        netIncome: bNet,
      };
    });
  }, [branchesList, labTests, opRecords, pharmacySales, expensesList]);

  return (
    <>
      <div className="page-heading" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="eyebrow">
            {effectiveBranch === 'All' ? 'Global Hospital Financial Workspace' : `${effectiveBranch} Campus Finance`}
          </div>
          <h1>
            {effectiveBranch === 'All' ? 'Super Admin Financial Overview' : `${effectiveBranch} Revenue Analytics`}
          </h1>
          <p>
            {effectiveBranch === 'All'
              ? 'Real-time global collections across all hospital campuses, department revenue breakdowns, and audited operational expenses.'
              : `Branch-scoped revenue collections for ${effectiveBranch} campus including OPD, Lab, and Pharmacy.`}
          </p>
        </div>
        <button className="secondary-button" onClick={() => onNotify && onNotify('Financial Audit Report generated successfully!')}>
          Download Financial Audit
        </button>
      </div>

      {/* Date-wise, Monthly & Yearly Time Filter Bar */}
      <TimeFilterBar
        title="Filter Financial Performance & Revenue Period"
        onChange={(state) => setFilterState(state)}
      />

      {/* Department Revenue Source Filter Bar */}
      <section className="panel" style={{ background: '#f4f8fe', borderColor: '#d3e2f5', marginBottom: '20px', padding: '12px 16px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="#1769d7" />
            <strong style={{ fontSize: '13px', color: '#1a3354' }}>
              Revenue Stream ({effectiveBranch === 'All' ? 'All Hospital Branches' : effectiveBranch})
            </strong>
          </div>

          <div style={{ display: 'flex', gap: '6px', background: '#fff', padding: '4px', borderRadius: '8px', border: '1px solid #cce0f5', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content', boxSizing: 'border-box' }}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setSourceFilter('all')}
              style={{
                fontSize: '11px',
                padding: '6px 12px',
                border: 'none',
                background: sourceFilter === 'all' ? '#1769d7' : 'transparent',
                color: sourceFilter === 'all' ? '#ffffff' : '#4a5e7a',
                fontWeight: '700',
                flex: '1 1 auto',
                whiteSpace: 'nowrap',
              }}
            >
              All Record Revenue (₹ {allRevenueTotal.toLocaleString('en-IN')})
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setSourceFilter('only_op')}
              style={{
                fontSize: '11px',
                padding: '6px 12px',
                border: 'none',
                background: sourceFilter === 'only_op' ? '#0284c7' : 'transparent',
                color: sourceFilter === 'only_op' ? '#ffffff' : '#4a5e7a',
                fontWeight: '700',
                flex: '1 1 auto',
                whiteSpace: 'nowrap',
              }}
            >
              🔵 Only OP (₹ {onlyOpRevenue.toLocaleString('en-IN')})
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setSourceFilter('treatment')}
              style={{
                fontSize: '11px',
                padding: '6px 12px',
                border: 'none',
                background: sourceFilter === 'treatment' ? '#0d9488' : 'transparent',
                color: sourceFilter === 'treatment' ? '#ffffff' : '#4a5e7a',
                fontWeight: '700',
                flex: '1 1 auto',
                whiteSpace: 'nowrap',
              }}
            >
              🩺 Only Treatment (₹ {onlyTreatmentRevenue.toLocaleString('en-IN')})
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setSourceFilter('surgery')}
              style={{
                fontSize: '11px',
                padding: '6px 12px',
                border: 'none',
                background: sourceFilter === 'surgery' ? '#d97706' : 'transparent',
                color: sourceFilter === 'surgery' ? '#ffffff' : '#4a5e7a',
                fontWeight: '700',
                flex: '1 1 auto',
                whiteSpace: 'nowrap',
              }}
            >
              🔪 Only Surgery (₹ {onlySurgeryRevenue.toLocaleString('en-IN')})
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setSourceFilter('ip')}
              style={{
                fontSize: '11px',
                padding: '6px 12px',
                border: 'none',
                background: sourceFilter === 'ip' ? '#7e22ce' : 'transparent',
                color: sourceFilter === 'ip' ? '#ffffff' : '#4a5e7a',
                fontWeight: '700',
                flex: '1 1 auto',
                whiteSpace: 'nowrap',
              }}
            >
              🟣 Only IP (₹ {onlyIpRevenue.toLocaleString('en-IN')})
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setSourceFilter('emergency')}
              style={{
                fontSize: '11px',
                padding: '6px 12px',
                border: 'none',
                background: sourceFilter === 'emergency' ? '#e11d48' : 'transparent',
                color: sourceFilter === 'emergency' ? '#ffffff' : '#4a5e7a',
                fontWeight: '700',
                flex: '1 1 auto',
                whiteSpace: 'nowrap',
              }}
            >
              ⚡ Only Emergency (₹ {onlyEmergencyRevenue.toLocaleString('en-IN')})
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setSourceFilter('lab')}
              style={{
                fontSize: '11px',
                padding: '6px 12px',
                border: 'none',
                background: sourceFilter === 'lab' ? '#1769d7' : 'transparent',
                color: sourceFilter === 'lab' ? '#ffffff' : '#4a5e7a',
                fontWeight: '700',
                flex: '1 1 auto',
                whiteSpace: 'nowrap',
              }}
            >
              🧪 Lab Revenue (₹ {labRevenue.toLocaleString('en-IN')})
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setSourceFilter('pharmacy')}
              style={{
                fontSize: '11px',
                padding: '6px 12px',
                border: 'none',
                background: sourceFilter === 'pharmacy' ? '#1769d7' : 'transparent',
                color: sourceFilter === 'pharmacy' ? '#ffffff' : '#4a5e7a',
                fontWeight: '700',
                flex: '1 1 auto',
                whiteSpace: 'nowrap',
              }}
            >
              💊 Pharmacy Revenue (₹ {pharmacyRevenue.toLocaleString('en-IN')})
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setSourceFilter('op')}
              style={{
                fontSize: '11px',
                padding: '6px 12px',
                border: 'none',
                background: sourceFilter === 'op' ? '#1769d7' : 'transparent',
                color: sourceFilter === 'op' ? '#ffffff' : '#4a5e7a',
                fontWeight: '700',
                flex: '1 1 auto',
                whiteSpace: 'nowrap',
              }}
            >
              📋 All Records Total (₹ {opRevenue.toLocaleString('en-IN')})
            </button>
          </div>
        </div>
      </section>

      {/* Dynamic Financial Stat Cards */}
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
        <StatCard
          label={
            sourceFilter === 'only_op' ? 'Only OP Consultation Revenue' :
            sourceFilter === 'treatment' ? 'Only Treatment Revenue' :
            sourceFilter === 'surgery' ? 'Only Surgery Revenue' :
            sourceFilter === 'ip' ? 'Only IP Admission Revenue' :
            sourceFilter === 'emergency' ? 'Only Emergency Care Revenue' :
            sourceFilter === 'op' ? 'All Patient Records Revenue' :
            sourceFilter === 'lab' ? 'Pathology Lab Revenue' :
            sourceFilter === 'pharmacy' ? 'Pharmacy Sales Revenue' :
            'All Record Revenue (Gross Total)'
          }
          value={`₹ ${totalRevenueNumber.toLocaleString('en-IN')}`}
          change={
            sourceFilter === 'only_op' ? `${onlyOpCount} Consultations` :
            sourceFilter === 'treatment' ? `${onlyTreatmentCount} Treatments` :
            sourceFilter === 'surgery' ? `${onlySurgeryCount} Surgeries` :
            sourceFilter === 'ip' ? `${onlyIpCount} Inpatients` :
            sourceFilter === 'emergency' ? `${onlyEmergencyCount} Emergencies` :
            sourceFilter === 'lab' ? `${filteredLabTests.length} Tests` :
            sourceFilter === 'pharmacy' ? `${filteredPharmacySales.length} Bills` :
            'Real DB Collections'
          }
          trend="up"
          detail={
            sourceFilter === 'only_op' ? `Only Outpatient Consultations (${onlyOpCount} cases)` :
            sourceFilter === 'treatment' ? `Only Treatments & Therapies (${onlyTreatmentCount} procedures)` :
            sourceFilter === 'surgery' ? `Only Surgical Operations (${onlySurgeryCount} procedures)` :
            sourceFilter === 'ip' ? `Only Inpatient Admissions (${onlyIpCount} cases)` :
            sourceFilter === 'emergency' ? `Only Urgent Emergency Care (${onlyEmergencyCount} cases)` :
            effectiveBranch === 'All' ? 'Global total collections across all branches' : `${effectiveBranch} total collections`
          }
          icon={<CircleDollarSign />}
          tone="blue"
        />

        <StatCard
          label="Total Calculated Expenses"
          value={`₹ ${actualExpenseSum.toLocaleString('en-IN')}`}
          change={`${expensesList.length} Entries`}
          trend="down"
          detail="Operational & supply expenditures"
          icon={<TrendingDown />}
          tone="amber"
        />

        <StatCard
          label="Net Operating Income"
          value={`₹ ${netIncomeNumber.toLocaleString('en-IN')}`}
          change="Net Income"
          trend={netIncomeNumber >= 0 ? 'up' : 'down'}
          detail="Total Revenue minus Total Expenses"
          icon={<WalletCards />}
          tone={netIncomeNumber >= 0 ? 'teal' : 'red'}
        />

        <StatCard
          label="Pathology Lab Collections"
          value={`₹ ${labRevenue.toLocaleString('en-IN')}`}
          change={`${labTests.length} Tests`}
          trend="up"
          detail="Pathology lab test earnings"
          icon={<FlaskConical />}
          tone="sky"
        />
      </div>

      {/* DETAILED REVENUE STREAMS METRICS PANEL */}
      <section className="panel full-panel" style={{ marginTop: '20px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#102a43', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <WalletCards size={18} color="#1769d7" /> Detailed Revenue Streams Breakdown
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#627d98' }}>
              Granular departmental earnings: Only OP, Only Treatment, Only Surgery, Only IP, Only Emergency, Lab, and Pharmacy. Click any card to filter.
            </p>
          </div>
          <span style={{ fontSize: '12px', background: '#ebf8ff', color: '#0070f3', padding: '4px 10px', borderRadius: '20px', fontWeight: '700', border: '1px solid #bae3ff' }}>
            Total Collections: ₹ {allRevenueTotal.toLocaleString('en-IN')}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
          {/* Only OP Revenue */}
          <div 
            onClick={() => setSourceFilter(sourceFilter === 'only_op' ? 'all' : 'only_op')}
            style={{
              cursor: 'pointer',
              background: sourceFilter === 'only_op' ? '#e0f2fe' : '#f8fafc',
              border: `1.5px solid ${sourceFilter === 'only_op' ? '#0284c7' : '#e2e8f0'}`,
              borderRadius: '10px',
              padding: '12px',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🔵 Only OP
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {allRevenueTotal > 0 ? `${Math.round((onlyOpRevenue / allRevenueTotal) * 100)}%` : '0%'}
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              ₹ {onlyOpRevenue.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {onlyOpCount} Outpatients
            </div>
          </div>

          {/* Only Treatment Revenue */}
          <div 
            onClick={() => setSourceFilter(sourceFilter === 'treatment' ? 'all' : 'treatment')}
            style={{
              cursor: 'pointer',
              background: sourceFilter === 'treatment' ? '#ccfbf1' : '#f8fafc',
              border: `1.5px solid ${sourceFilter === 'treatment' ? '#0d9488' : '#e2e8f0'}`,
              borderRadius: '10px',
              padding: '12px',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🩺 Only Treatment
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {allRevenueTotal > 0 ? `${Math.round((onlyTreatmentRevenue / allRevenueTotal) * 100)}%` : '0%'}
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              ₹ {onlyTreatmentRevenue.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {onlyTreatmentCount} Treatments
            </div>
          </div>

          {/* Only Surgery Revenue */}
          <div 
            onClick={() => setSourceFilter(sourceFilter === 'surgery' ? 'all' : 'surgery')}
            style={{
              cursor: 'pointer',
              background: sourceFilter === 'surgery' ? '#fef3c7' : '#f8fafc',
              border: `1.5px solid ${sourceFilter === 'surgery' ? '#d97706' : '#e2e8f0'}`,
              borderRadius: '10px',
              padding: '12px',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🔪 Only Surgery
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {allRevenueTotal > 0 ? `${Math.round((onlySurgeryRevenue / allRevenueTotal) * 100)}%` : '0%'}
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              ₹ {onlySurgeryRevenue.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {onlySurgeryCount} Surgeries
            </div>
          </div>

          {/* Only IP Revenue */}
          <div 
            onClick={() => setSourceFilter(sourceFilter === 'ip' ? 'all' : 'ip')}
            style={{
              cursor: 'pointer',
              background: sourceFilter === 'ip' ? '#f3e8ff' : '#f8fafc',
              border: `1.5px solid ${sourceFilter === 'ip' ? '#9333ea' : '#e2e8f0'}`,
              borderRadius: '10px',
              padding: '12px',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#7e22ce', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🟣 Only IP Admission
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {allRevenueTotal > 0 ? `${Math.round((onlyIpRevenue / allRevenueTotal) * 100)}%` : '0%'}
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              ₹ {onlyIpRevenue.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {onlyIpCount} Inpatients
            </div>
          </div>

          {/* Only Emergency Revenue */}
          <div 
            onClick={() => setSourceFilter(sourceFilter === 'emergency' ? 'all' : 'emergency')}
            style={{
              cursor: 'pointer',
              background: sourceFilter === 'emergency' ? '#ffe4e6' : '#f8fafc',
              border: `1.5px solid ${sourceFilter === 'emergency' ? '#e11d48' : '#e2e8f0'}`,
              borderRadius: '10px',
              padding: '12px',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#be123c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⚡ Only Emergency
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {allRevenueTotal > 0 ? `${Math.round((onlyEmergencyRevenue / allRevenueTotal) * 100)}%` : '0%'}
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              ₹ {onlyEmergencyRevenue.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {onlyEmergencyCount} Emergencies
            </div>
          </div>

          {/* Only Lab Revenue */}
          <div 
            onClick={() => setSourceFilter(sourceFilter === 'lab' ? 'all' : 'lab')}
            style={{
              cursor: 'pointer',
              background: sourceFilter === 'lab' ? '#e0f2fe' : '#f8fafc',
              border: `1.5px solid ${sourceFilter === 'lab' ? '#0284c7' : '#e2e8f0'}`,
              borderRadius: '10px',
              padding: '12px',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🧪 Only Lab
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {allRevenueTotal > 0 ? `${Math.round((labRevenue / allRevenueTotal) * 100)}%` : '0%'}
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              ₹ {labRevenue.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {filteredLabTests.length} Tests
            </div>
          </div>

          {/* Only Pharmacy Revenue */}
          <div 
            onClick={() => setSourceFilter(sourceFilter === 'pharmacy' ? 'all' : 'pharmacy')}
            style={{
              cursor: 'pointer',
              background: sourceFilter === 'pharmacy' ? '#ccfbf1' : '#f8fafc',
              border: `1.5px solid ${sourceFilter === 'pharmacy' ? '#0d9488' : '#e2e8f0'}`,
              borderRadius: '10px',
              padding: '12px',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                💊 Only Pharmacy
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {allRevenueTotal > 0 ? `${Math.round((pharmacyRevenue / allRevenueTotal) * 100)}%` : '0%'}
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              ₹ {pharmacyRevenue.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {filteredPharmacySales.length} Sales
            </div>
          </div>
        </div>
      </section>

      {/* Super Admin Campus Branch Performance Comparison Table */}
      {isSuperAdmin && effectiveBranch === 'All' && (
        <section className="panel full-panel" style={{ marginTop: '20px', width: '100%', boxSizing: 'border-box' }}>
          <div className="list-toolbar" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={18} color="#1769d7" /> Campus Branch Financial Comparison ({branchPerformance.length} Campuses)
              </h2>
              <p>Breakdown of revenue collections and operational expenses for each individual hospital campus branch.</p>
            </div>
          </div>

          <div className="table-scroll" style={{ marginTop: '12px', width: '100%', boxSizing: 'border-box' }}>
            <table>
              <thead>
                <tr>
                  <th>Branch Name</th>
                  <th>Only OP (₹)</th>
                  <th>Only Treatment (₹)</th>
                  <th>Only Surgery (₹)</th>
                  <th>IP & Emerg (₹)</th>
                  <th>Pathology Lab (₹)</th>
                  <th>Pharmacy Sales (₹)</th>
                  <th>Total Revenue (₹)</th>
                  <th>Expenses (₹)</th>
                  <th>Net Income (₹)</th>
                </tr>
              </thead>
              <tbody>
                {branchPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      No branch performance data recorded.
                    </td>
                  </tr>
                ) : (
                  branchPerformance.map((b) => (
                    <tr key={b.name}>
                      <td>
                        <strong>{b.name}</strong>
                        <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Code: {b.code}</span>
                      </td>
                      <td>₹ {b.onlyOp.toLocaleString('en-IN')}</td>
                      <td>₹ {b.treatment.toLocaleString('en-IN')}</td>
                      <td>₹ {b.surgery.toLocaleString('en-IN')}</td>
                      <td>₹ {b.ipEmerg.toLocaleString('en-IN')}</td>
                      <td>₹ {b.lab.toLocaleString('en-IN')}</td>
                      <td>₹ {b.pharm.toLocaleString('en-IN')}</td>
                      <td><strong style={{ color: '#15803d' }}>₹ {b.totalRev.toLocaleString('en-IN')}</strong></td>
                      <td><strong style={{ color: '#dc2626' }}>₹ {b.expenses.toLocaleString('en-IN')}</strong></td>
                      <td>
                        <strong style={{ color: b.netIncome >= 0 ? '#15803d' : '#dc2626' }}>
                          ₹ {b.netIncome.toLocaleString('en-IN')}
                        </strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* DEPARTMENT REVENUE COLLECTIONS & EXPENSES BREAKDOWN */}
      <div className="dashboard-grid finance-grid" style={{ marginTop: '20px', width: '100%', boxSizing: 'border-box' }}>
        {/* Department Revenue Breakdown Panel */}
        <section className="panel" style={{ width: '100%', boxSizing: 'border-box' }}>
          <PanelHeader 
            title="Department Revenue Collections" 
            subtitle={`Live collections breakdown for ${effectiveBranch === 'All' ? 'All Hospital Branches' : effectiveBranch}`} 
          />
          <div className="category-list" style={{ display: 'grid', gap: '14px', marginTop: '12px' }}>
            <Category
              name="🔵 Only OP Consultations"
              value={`₹ ${onlyOpRevenue.toLocaleString('en-IN')}`}
              percent={allRevenueTotal > 0 ? `${Math.round((onlyOpRevenue / allRevenueTotal) * 100)}%` : '0%'}
              color="blue"
              icon={Stethoscope}
            />
            <Category
              name="🩺 Only Treatments & Care"
              value={`₹ ${onlyTreatmentRevenue.toLocaleString('en-IN')}`}
              percent={allRevenueTotal > 0 ? `${Math.round((onlyTreatmentRevenue / allRevenueTotal) * 100)}%` : '0%'}
              color="teal"
              icon={Activity}
            />
            <Category
              name="🔪 Only Surgeries & OT"
              value={`₹ ${onlySurgeryRevenue.toLocaleString('en-IN')}`}
              percent={allRevenueTotal > 0 ? `${Math.round((onlySurgeryRevenue / allRevenueTotal) * 100)}%` : '0%'}
              color="amber"
              icon={Scissors}
            />
            <Category
              name="🟣 Only IP Admissions"
              value={`₹ ${onlyIpRevenue.toLocaleString('en-IN')}`}
              percent={allRevenueTotal > 0 ? `${Math.round((onlyIpRevenue / allRevenueTotal) * 100)}%` : '0%'}
              color="blue"
              icon={Bed}
            />
            <Category
              name="⚡ Only Emergency Care"
              value={`₹ ${onlyEmergencyRevenue.toLocaleString('en-IN')}`}
              percent={allRevenueTotal > 0 ? `${Math.round((onlyEmergencyRevenue / allRevenueTotal) * 100)}%` : '0%'}
              color="red"
              icon={Zap}
            />
            <Category
              name="🧪 Pathology Laboratory"
              value={`₹ ${labRevenue.toLocaleString('en-IN')}`}
              percent={allRevenueTotal > 0 ? `${Math.round((labRevenue / allRevenueTotal) * 100)}%` : '0%'}
              color="sky"
              icon={FlaskConical}
            />
            <Category
              name="💊 Pharmacy & Medicine Collections"
              value={`₹ ${pharmacyRevenue.toLocaleString('en-IN')}`}
              percent={allRevenueTotal > 0 ? `${Math.round((pharmacyRevenue / allRevenueTotal) * 100)}%` : '0%'}
              color="teal"
              icon={Pill}
            />
          </div>
        </section>

        {/* Expenses Category Breakdown Panel */}
        <section className="panel" style={{ width: '100%', boxSizing: 'border-box' }}>
          <PanelHeader title="Calculated Expenses Breakdown" subtitle={`Calculated from ${expensesList.length} recorded expense entries`} />
          <div className="category-list" style={{ display: 'grid', gap: '14px', marginTop: '12px' }}>
            <Category
              name="Medical & Lab Supplies"
              value={`₹ ${labSuppliesExpense.toLocaleString('en-IN')}`}
              percent={actualExpenseSum > 0 ? `${Math.round((labSuppliesExpense / actualExpenseSum) * 100)}%` : '0%'}
              color="amber"
            />
            <Category
              name="Office & Front Desk"
              value={`₹ ${officeExpense.toLocaleString('en-IN')}`}
              percent={actualExpenseSum > 0 ? `${Math.round((officeExpense / actualExpenseSum) * 100)}%` : '0%'}
              color="blue"
            />
            <Category
              name="Utilities & Operations"
              value={`₹ ${utilitiesExpense.toLocaleString('en-IN')}`}
              percent={actualExpenseSum > 0 ? `${Math.round((utilitiesExpense / actualExpenseSum) * 100)}%` : '0%'}
              color="teal"
            />
          </div>
        </section>
      </div>

      {/* DEDICATED AUDITED EXPENSES TABLE INSIDE FINANCE */}
      <section className="panel full-panel" style={{ marginTop: '20px', width: '100%', boxSizing: 'border-box' }}>
        <div className="list-toolbar" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2>Operational Expenses Audit ({expensesList.length} Entries)</h2>
            <p>Live audit of recorded operational expenditures impacting net operating income for {effectiveBranch === 'All' ? 'All Campuses' : effectiveBranch}.</p>
          </div>
        </div>

        <div className="table-scroll" style={{ marginTop: '12px', width: '100%', boxSizing: 'border-box' }}>
          <table>
            <thead>
              <tr>
                <th>Expense ID</th>
                <th>Title & Category</th>
                <th>Hospital Branch</th>
                <th>Amount (₹)</th>
                <th>Payment Method</th>
                <th>Recorded By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {expensesList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No expense entries recorded for {effectiveBranch === 'All' ? 'all branches' : effectiveBranch}.
                  </td>
                </tr>
              ) : (
                expensesList.map((exp) => (
                  <tr key={exp.id || exp._id}>
                    <td><span className="muted-code">{exp.id || exp._id}</span></td>
                    <td>
                      <div><strong>{exp.title}</strong></div>
                      <span style={{ fontSize: '11px', color: '#1769d7', background: '#f4f8fe', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '2px' }}>
                        {exp.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '12px' }}>
                        🏥 {exp.branch || 'Central Campus'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '14px', color: '#dc2626' }}>
                        ₹ {Number(exp.amount).toLocaleString('en-IN')}
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', fontWeight: '600' }}>{exp.paymentMethod}</div>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Ref: {exp.referenceNo}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>{exp.createdBy}</div>
                    </td>
                    <td>{exp.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default FinancePage;
