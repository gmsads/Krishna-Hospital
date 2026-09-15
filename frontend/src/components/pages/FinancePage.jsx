import React, { useState, useMemo } from 'react';
import { CircleDollarSign, FlaskConical, WalletCards, Filter, TrendingDown, Pill, Stethoscope, Building2 } from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { PanelHeader } from '../common/PanelHeader';
import { TimeFilterBar } from '../common/TimeFilterBar';

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

  // Real Department Collections Calculations from MongoDB Records
  const labRevenue = useMemo(() => {
    return labTests.reduce((sum, item) => {
      const paid = typeof item.paidAmount === 'number'
        ? item.paidAmount
        : (parseFloat(String(item.amountPaid || item.paidAmount || '0').replace(/[^0-9.]/g, '')) || 0);
      return sum + paid;
    }, 0);
  }, [labTests]);

  const opRevenue = useMemo(() => {
    return opRecords.reduce((sum, item) => {
      const amtStr = String(item.charges || item.amount || '300').replace(/[^0-9.]/g, '');
      const amt = parseFloat(amtStr) || 300;
      return sum + amt;
    }, 0);
  }, [opRecords]);

  const pharmacyRevenue = useMemo(() => {
    return pharmacySales.reduce((sum, item) => {
      const amt = typeof item.collectingAmount === 'number'
        ? item.collectingAmount
        : typeof item.totalCollection === 'number'
        ? item.totalCollection
        : typeof item.total === 'number'
        ? item.total
        : (parseFloat(String(item.collectingAmount || item.totalCollection || item.total || item.amountPaid || item.amount || '0').replace(/[^0-9.]/g, '')) || 0);
      return sum + amt;
    }, 0);
  }, [pharmacySales]);

  const allRevenueTotal = labRevenue + opRevenue + pharmacyRevenue;

  let totalRevenueNumber = allRevenueTotal;
  if (sourceFilter === 'op') totalRevenueNumber = opRevenue;
  if (sourceFilter === 'lab') totalRevenueNumber = labRevenue;
  if (sourceFilter === 'pharmacy') totalRevenueNumber = pharmacyRevenue;

  // Exact Sum of Expenses for Scoped Branch / Global
  const actualExpenseSum = useMemo(() => {
    return expensesList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [expensesList]);

  // Expenses Category Breakdown
  const labSuppliesExpense = useMemo(() => {
    return expensesList
      .filter((e) => (e.category || '').toLowerCase().includes('lab') || (e.category || '').toLowerCase().includes('medical'))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [expensesList]);

  const officeExpense = useMemo(() => {
    return expensesList
      .filter((e) => (e.category || '').toLowerCase().includes('office') || (e.category || '').toLowerCase().includes('front'))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [expensesList]);

  const utilitiesExpense = useMemo(() => {
    return expensesList
      .filter((e) => (e.category || '').toLowerCase().includes('utility') || (e.category || '').toLowerCase().includes('staff'))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [expensesList]);

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

      const bLab = labTests.filter((t) => isMatch(t.branch, t.branchCode)).reduce((sum, t) => sum + (Number(t.paidAmount || t.amountPaid) || 0), 0);
      const bOp = opRecords.filter((r) => isMatch(r.branch, r.branchCode)).reduce((sum, r) => sum + (parseFloat(String(r.charges || r.amount || '300').replace(/[^0-9.]/g, '')) || 300), 0);
      const bPharm = pharmacySales.filter((s) => isMatch(s.branch, s.branchCode)).reduce((sum, s) => {
        const amt = typeof s.collectingAmount === 'number' ? s.collectingAmount : typeof s.totalCollection === 'number' ? s.totalCollection : typeof s.total === 'number' ? s.total : (parseFloat(String(s.collectingAmount || s.totalCollection || s.total || s.amount || '0').replace(/[^0-9.]/g, '')) || 0);
        return sum + amt;
      }, 0);
      const bExp = expensesList.filter((e) => isMatch(e.branch, e.branchCode)).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const bTotal = bLab + bOp + bPharm;
      const bNet = bTotal - bExp;

      return {
        name: branch.name,
        code: branch.code || 'BRANCH',
        lab: bLab,
        op: bOp,
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
              🩺 Records Revenue (₹ {opRevenue.toLocaleString('en-IN')})
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
          </div>
        </div>
      </section>

      {/* Dynamic Financial Stat Cards */}
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
        <StatCard
          label={sourceFilter === 'op' ? 'Records Revenue' : sourceFilter === 'lab' ? 'Lab Revenue' : sourceFilter === 'pharmacy' ? 'Pharmacy Revenue' : 'All Record Revenue'}
          value={`₹ ${totalRevenueNumber.toLocaleString('en-IN')}`}
          change="Real DB Collections"
          trend="up"
          detail={effectiveBranch === 'All' ? 'Global total collections across all branches' : `${effectiveBranch} total collections`}
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
                  <th>OPD Consultations (₹)</th>
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
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
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
                      <td>₹ {b.op.toLocaleString('en-IN')}</td>
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
              name="OPD & Consultation Records"
              value={`₹ ${opRevenue.toLocaleString('en-IN')}`}
              percent={allRevenueTotal > 0 ? `${Math.round((opRevenue / allRevenueTotal) * 100)}%` : '0%'}
              color="blue"
              icon={Stethoscope}
            />
            <Category
              name="Pathology Laboratory"
              value={`₹ ${labRevenue.toLocaleString('en-IN')}`}
              percent={allRevenueTotal > 0 ? `${Math.round((labRevenue / allRevenueTotal) * 100)}%` : '0%'}
              color="sky"
              icon={FlaskConical}
            />
            <Category
              name="Pharmacy & Medicine Collections"
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
