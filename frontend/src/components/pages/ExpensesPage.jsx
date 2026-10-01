import React, { useState, useMemo } from 'react';
import {
  WalletCards,
  Plus,
  Search,
  Filter,
  Trash2,
  X,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  DollarSign,
  TrendingDown,
  User,
  RefreshCw,
  Receipt,
  FlaskConical,
  Boxes,
  ClipboardList,
  Pill,
} from 'lucide-react';
import { PanelHeader } from '../common/PanelHeader';
import { StatCard } from '../common/StatCard';

const generateAutoBillNo = () => `BILL-00001`;

export function ExpensesPage({
  expenses = [],
  profile,
  effectiveBranch = 'All',
  onAddExpense,
  onDeleteExpense,
  onNotify,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State for Record Expense
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Medical & Lab Supplies');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [referenceNo, setReferenceNo] = useState(generateAutoBillNo());
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch =
        exp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.referenceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.createdBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || exp.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, selectedCategory]);

  // Financial Computations by Department
  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const labExpensesTotal = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.category === 'Medical & Lab Supplies' || (e.category && e.category.toLowerCase().includes('lab supply')))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const labInventoryTotal = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.category === 'Lab Inventory & Machinery' || (e.category && (e.category.toLowerCase().includes('inventory') || e.category.toLowerCase().includes('machinery'))))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const opExpensesTotal = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.category === 'OP & Consultation' || (e.category && e.category.toLowerCase().includes('op ')))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const pharmacyExpensesTotal = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.category === 'Pharmacy Expenses' || (e.category && e.category.toLowerCase().includes('pharma')))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const officeUtilitiesTotal = useMemo(() => {
    return filteredExpenses
      .filter((e) => ['Office & Front Desk', 'Utilities & Maintenance', 'Staff & Operations', 'Marketing', 'Miscellaneous', 'General Expenses'].includes(e.category))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const getDepartmentBadge = (cat = '') => {
    const categoryLower = (cat || '').toLowerCase();
    if (categoryLower.includes('lab supply') || cat === 'Medical & Lab Supplies') {
      return { label: '🧪 Laboratory', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    }
    if (categoryLower.includes('inventory') || categoryLower.includes('machinery') || cat === 'Lab Inventory & Machinery') {
      return { label: '📦 Lab Inventory', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
    }
    if (categoryLower.includes('op ') || cat === 'OP & Consultation') {
      return { label: '📋 OP Department', bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' };
    }
    if (categoryLower.includes('pharma') || cat === 'Pharmacy Expenses') {
      return { label: '💊 Pharmacy', bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' };
    }
    if (cat === 'Office & Front Desk') {
      return { label: '🏢 Front Desk & Office', bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' };
    }
    if (cat === 'Utilities & Maintenance' || cat === 'Staff & Operations') {
      return { label: '⚡ Utilities & Ops', bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' };
    }
    return { label: `🏷️ ${cat || 'General'}`, bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
  };

  const [expenseNo, setExpenseNo] = useState('');

  // Fetch next branch-scoped EXP-2026-0001 format Expense No on mount / branch change
  React.useEffect(() => {
    const assignedBranch = effectiveBranch === 'All' ? profile?.branch || 'Central Campus' : effectiveBranch;
    const branchQuery = assignedBranch ? `?branch=${encodeURIComponent(assignedBranch)}` : '';

    fetch(`/api/v1/expenses/next-expenseno${branchQuery}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.nextExpenseNo) {
          setExpenseNo(data.data.nextExpenseNo);
        }
      })
      .catch((err) => console.warn('Could not fetch next expenseNo:', err.message));
  }, [effectiveBranch, profile?.branch]);

  const handleCreateExpenseSubmit = (e) => {
    e.preventDefault();

    if (!title.trim() || !amount || Number(amount) <= 0) {
      onNotify && onNotify('Please enter a valid expense title and amount.');
      return;
    }

    const assignedBranch = effectiveBranch === 'All' ? profile?.branch || 'Central Campus' : effectiveBranch;
    const finalBillNo = expenseNo || referenceNo.trim() || 'BILL-00001';

    const newExpenseObj = {
      expenseNo: finalBillNo,
      id: finalBillNo,
      title: title.trim(),
      category,
      amount: Number(amount),
      date,
      paymentMethod,
      referenceNo: finalBillNo,
      billNo: finalBillNo,
      notes: notes.trim(),
      createdBy: `${profile?.full_name || 'Staff Member'} (${profile?.role || 'Staff'})`,
      createdByEmail: profile?.email || '',
      creatorRole: profile?.role || 'Staff',
      branch: assignedBranch,
      status: 'Approved',
    };

    if (onAddExpense) {
      onAddExpense(newExpenseObj);
    }

    // Reset Form
    setTitle('');
    setAmount('');
    setNotes('');
    setReferenceNo(generateAutoBillNo());
    setIsAddModalOpen(false);
    onNotify && onNotify(`💸 Expense (${newExpenseObj.expenseNo} / Bill #${finalBillNo}) of ₹ ${Number(amount).toLocaleString('en-IN')} recorded for ${assignedBranch}!`);
  };

  const handleOpenAddModal = () => {
    setReferenceNo(generateAutoBillNo());
    setIsAddModalOpen(true);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Hospital Departmental Expenses</div>
          <h1>Hospital Expenses Tracker</h1>
          <p>
            {profile?.role === 'Super Admin'
              ? 'Super Admin Audit: View all department operational expenses across hospital campuses, creator audit logs, and totals.'
              : profile?.role === 'Admin'
              ? `Branch Admin Audit: View department expenses recorded for ${profile?.branch || 'your branch'}, creator audit logs, and totals.`
              : `Viewing your self-recorded operational expenses for ${profile?.branch || 'assigned branch'}.`}
          </p>
        </div>
        <button
          className="primary-button"
          onClick={handleOpenAddModal}
          style={{ gap: '6px', background: '#dc2626', borderColor: '#dc2626' }}
        >
          <Plus size={17} /> Record New Expense
        </button>
      </div>

      {/* STAT CARDS FOR DEPARTMENT EXPENSES */}
      <div className="stat-grid" style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <StatCard
          label="Total Overall Expenses"
          value={`₹ ${totalExpenseAmount.toLocaleString('en-IN')}`}
          change={`${filteredExpenses.length} Records`}
          trend="down"
          detail={effectiveBranch === 'All' ? 'All Hospital Campuses' : effectiveBranch}
          icon={<TrendingDown />}
          tone="amber"
        />
        <StatCard
          label="🧪 Lab Expenses"
          value={`₹ ${labExpensesTotal.toLocaleString('en-IN')}`}
          change="Lab Reagents & Testing"
          trend="up"
          detail="Pathology & clinical supplies"
          icon={<FlaskConical />}
          tone="sky"
        />
        <StatCard
          label="📦 Lab Inventory & Machines"
          value={`₹ ${labInventoryTotal.toLocaleString('en-IN')}`}
          change="Equipment & Kit Spend"
          trend="up"
          detail="Machinery & consumable kits"
          icon={<Boxes />}
          tone="teal"
        />
        <StatCard
          label="📋 OP & Consultation"
          value={`₹ ${opExpensesTotal.toLocaleString('en-IN')}`}
          change="OP Counter Stationery"
          trend="up"
          detail="OPD receipts & forms"
          icon={<ClipboardList />}
          tone="amber"
        />
        <StatCard
          label="💊 Pharmacy Expenses"
          value={`₹ ${pharmacyExpensesTotal.toLocaleString('en-IN')}`}
          change="Medicine & Suppliers"
          trend="down"
          detail="Inventory & supplier payables"
          icon={<Pill />}
          tone="purple"
        />
        <StatCard
          label="🏢 Office & Utilities"
          value={`₹ ${officeUtilitiesTotal.toLocaleString('en-IN')}`}
          change="Maintenance & Staff"
          trend="down"
          detail="Front desk, AC & operations"
          icon={<Building2 />}
          tone="blue"
        />
      </div>

      {/* EXPENSE TOOLBAR & SEARCH */}
      <section className="panel full-panel">
        <div className="list-toolbar" style={{ flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Recorded Department Expenses ({filteredExpenses.length})</h2>
            <p>Audited operational expenditures categorized clearly by hospital department.</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search expense title, invoice no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 12px 8px 34px', border: '1px solid #dde7f1', borderRadius: '7px', fontSize: '12px', width: '100%' }}
              />
              <Search size={15} color="#64748b" style={{ position: 'absolute', left: '10px', top: '9px' }} />
            </div>

            {/* Department / Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} color="#1769d7" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #b8d5f7', borderRadius: '7px', fontSize: '12px', background: '#fff', fontWeight: '700', color: '#1769d7' }}
              >
                <option value="All">All Departments</option>
                <option value="Medical & Lab Supplies">🧪 Lab Expenses</option>
                <option value="Lab Inventory & Machinery">📦 Lab Inventory & Machinery</option>
                <option value="OP & Consultation">📋 OP & Consultation Expenses</option>
                <option value="Pharmacy Expenses">💊 Pharmacy Expenses</option>
                <option value="Office & Front Desk">🏢 Office & Front Desk</option>
                <option value="Utilities & Maintenance">⚡ Utilities & Maintenance</option>
                <option value="Staff & Operations">👥 Staff & Operations</option>
                <option value="Marketing">📢 Marketing</option>
                <option value="Miscellaneous">📦 Miscellaneous</option>
              </select>
            </div>
          </div>
        </div>

        {/* EXPENSES TABLE */}
        <div className="table-scroll" style={{ marginTop: '12px' }}>
          <table>
            <thead>
              <tr>
                <th>Expense ID</th>
                <th>Title & Description</th>
                <th>Department Origin</th>
                <th>Hospital Branch</th>
                <th>Amount (₹)</th>
                <th>Payment Method</th>
                <th>Recorded By</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No hospital expense records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const deptBadge = getDepartmentBadge(exp.category);
                  return (
                    <tr key={exp.id}>
                      <td>
                        <span className="muted-code">{exp.expenseNo || exp.id}</span>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#0369a1', marginTop: '2px' }}>
                          📄 {exp.billNo || exp.referenceNo || 'BILL-10029'}
                        </div>
                      </td>
                      <td>
                        <div><strong>{exp.title}</strong></div>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'inline-block', marginTop: '2px' }}>
                          {exp.notes || exp.category}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: deptBadge.color, background: deptBadge.bg, border: `1px solid ${deptBadge.border}`, padding: '4px 10px', borderRadius: '12px', display: 'inline-block' }}>
                          {deptBadge.label}
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
                      <span style={{ fontSize: '10px', color: '#0284c7', fontWeight: '700' }}>Bill #: {exp.billNo || exp.referenceNo}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>{exp.createdBy}</div>
                    </td>
                    <td>{exp.date}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="icon-button"
                        onClick={() => onDeleteExpense && onDeleteExpense(exp.id)}
                        title="Delete expense entry"
                        style={{ color: '#dc2626' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </section>

      {/* RECORD NEW EXPENSE MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 115, background: 'rgba(15, 45, 85, 0.45)', display: 'grid', placeItems: 'center', padding: '16px', overflowY: 'auto' }}>
          <div className="modal" style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 40px rgba(16, 45, 85, 0.2)', border: '1px solid #dbe6f5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f8', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <WalletCards size={20} color="#dc2626" />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#162d4a', fontWeight: '800' }}>Record Hospital Expense</h3>
              </div>
              <button className="icon-button" onClick={() => setIsAddModalOpen(false)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateExpenseSubmit} style={{ display: 'grid', gap: '14px' }}>
              {/* TOP FIELD: AUTOMATIC BILL NO */}
              <div className="field" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Receipt size={15} /> Bill No / Voucher No (Auto-Generated) *
                  </span>
                  <button
                    type="button"
                    onClick={() => setReferenceNo(generateAutoBillNo())}
                    style={{ background: '#e0f2fe', border: '1px solid #93c5fd', borderRadius: '4px', cursor: 'pointer', color: '#0284c7', fontSize: '10px', fontWeight: '700', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Click to generate a fresh Bill No"
                  >
                    <RefreshCw size={11} /> Auto-Generate
                  </button>
                </div>
                <input
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. BILL-849201"
                  required
                  style={{ padding: '10px 12px', border: '1px solid #93c5fd', borderRadius: '7px', fontSize: '13px', background: '#fff', fontWeight: '800', color: '#0284c7' }}
                />
              </div>

              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Expense Description / Title *</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Pathology Reagents Pack, Thermal Printer Rolls..."
                  required
                  autoFocus
                  style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', fontSize: '13px' }}
                />
              </div>

              <div className="form-row">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Category *</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="Medical & Lab Supplies">🧪 Medical & Lab Supplies (Laboratory)</option>
                    <option value="Lab Inventory & Machinery">📦 Lab Inventory & Machinery</option>
                    <option value="OP & Consultation">📋 OP & Consultation (OP Department)</option>
                    <option value="Pharmacy Expenses">💊 Pharmacy Expenses (Pharmacy)</option>
                    <option value="Office & Front Desk">🏢 Office & Front Desk</option>
                    <option value="Utilities & Maintenance">⚡ Utilities & Maintenance</option>
                    <option value="Staff & Operations">👥 Staff & Operations</option>
                    <option value="Marketing">📢 Marketing</option>
                    <option value="Miscellaneous">📦 Miscellaneous</option>
                  </select>
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626' }}>Amount (₹) *</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 4500"
                    required
                    style={{ padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '7px', fontSize: '13px', fontWeight: '700', color: '#dc2626', background: '#fef2f2' }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Payment Method *</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="UPI">UPI / Online</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7' }}>Target Hospital Branch</span>
                  <input
                    value={effectiveBranch === 'All' ? profile?.branch || 'Central Campus' : effectiveBranch}
                    disabled
                    style={{ padding: '10px 12px', border: '1px solid #bae6fd', borderRadius: '7px', fontSize: '13px', background: '#f0f9ff', fontWeight: '700', color: '#0284c7' }}
                  />
                </div>
              </div>

              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Expense Date *</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', fontSize: '13px' }}
                />
              </div>

              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Vendor / Remarks Notes</span>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter vendor details, purpose or notes..."
                  style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="secondary-button" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" style={{ background: '#dc2626', borderColor: '#dc2626', gap: '6px' }}>
                  <Plus size={16} /> Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default ExpensesPage;
