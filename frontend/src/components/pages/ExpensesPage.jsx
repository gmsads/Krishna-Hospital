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

  // Financial Computations
  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const labSuppliesTotal = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.category === 'Medical & Lab Supplies')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const officeTotal = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.category === 'Office & Front Desk')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const utilitiesTotal = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.category === 'Utilities & Maintenance' || e.category === 'Staff & Operations')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const [expenseNo, setExpenseNo] = useState('');

  // Fetch next branch-scoped EXP-2026-0001 format Expense No on mount / branch change
  React.useEffect(() => {
    const assignedBranch = effectiveBranch === 'All' ? profile?.branch || 'Central Campus' : effectiveBranch;
    const branchQuery = assignedBranch ? `?branch=${encodeURIComponent(assignedBranch)}` : '';

    fetch(`http://localhost:5000/api/v1/expenses/next-expenseno${branchQuery}`)
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
          <div className="eyebrow">Hospital Operational Expenses</div>
          <h1>Hospital Expenses Tracker</h1>
          <p>
            {profile?.role === 'Super Admin'
              ? 'Super Admin Audit: View all operational expenses across hospital campuses, who created each expense (name & role), and exact amounts.'
              : profile?.role === 'Admin'
              ? `Branch Admin Audit: View all operational expenses recorded for ${profile?.branch || 'your branch'}, who created each expense (name & role), and exact amounts.`
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

      {/* STAT CARDS FOR EXPENSES */}
      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        <StatCard
          label="Total Expenses Recorded"
          value={`₹ ${totalExpenseAmount.toLocaleString('en-IN')}`}
          change={`${filteredExpenses.length} Records`}
          trend="down"
          detail={effectiveBranch === 'All' ? 'All Hospital Campuses' : effectiveBranch}
          icon={<TrendingDown />}
          tone="amber"
        />
        <StatCard
          label="Medical & Lab Supplies"
          value={`₹ ${labSuppliesTotal.toLocaleString('en-IN')}`}
          change="Lab Reagents & Kits"
          trend="up"
          detail="Pathology & clinical consumables"
          icon={<WalletCards />}
          tone="sky"
        />
        <StatCard
          label="Office & Front Desk"
          value={`₹ ${officeTotal.toLocaleString('en-IN')}`}
          change="Stationery & Prints"
          trend="up"
          detail="OP counters & receipts"
          icon={<FileText />}
          tone="blue"
        />
        <StatCard
          label="Utilities & Operations"
          value={`₹ ${utilitiesTotal.toLocaleString('en-IN')}`}
          change="Maintenance & Staff"
          trend="down"
          detail="AC servicing & waste disposal"
          icon={<Building2 />}
          tone="teal"
        />
      </div>

      {/* EXPENSE TOOLBAR & SEARCH */}
      <section className="panel full-panel">
        <div className="list-toolbar" style={{ flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Recorded Hospital Expenses ({filteredExpenses.length})</h2>
            <p>Audited operational expenditures and vendor receipts.</p>
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

            {/* Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} color="#1769d7" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #b8d5f7', borderRadius: '7px', fontSize: '12px', background: '#fff', fontWeight: '700', color: '#1769d7' }}
              >
                <option value="All">All Categories</option>
                <option value="Medical & Lab Supplies">Medical & Lab Supplies</option>
                <option value="Office & Front Desk">Office & Front Desk</option>
                <option value="Utilities & Maintenance">Utilities & Maintenance</option>
                <option value="Staff & Operations">Staff & Operations</option>
                <option value="Marketing">Marketing</option>
                <option value="Miscellaneous">Miscellaneous</option>
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
                <th>Title & Category</th>
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
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No hospital expense records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>
                      <span className="muted-code">{exp.expenseNo || exp.id}</span>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#0369a1', marginTop: '2px' }}>
                        📄 {exp.billNo || exp.referenceNo || 'BILL-10029'}
                      </div>
                    </td>
                    <td>
                      <div><strong>{exp.title}</strong></div>
                      <span style={{ fontSize: '11px', color: '#1769d7', background: '#f4f8fe', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '2px' }}>
                        {exp.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '12px' }}>
                        🏥 {exp.branch || 'Central Campus'} ({exp.branchCode || (exp.branch === 'City Extension' ? 'EXT-CITY' : exp.branch === 'North Hospital' ? 'NORTH-MED' : 'HQ-CENTRAL')})
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
                ))
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
                    <option value="Medical & Lab Supplies">Medical & Lab Supplies</option>
                    <option value="Office & Front Desk">Office & Front Desk</option>
                    <option value="Utilities & Maintenance">Utilities & Maintenance</option>
                    <option value="Staff & Operations">Staff & Operations</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Miscellaneous">Miscellaneous</option>
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

              <div className="form-row">
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
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7' }}>Target Hospital Branch</span>
                  <input
                    value={effectiveBranch === 'All' ? profile?.branch || 'Central Campus' : effectiveBranch}
                    disabled
                    style={{ padding: '10px 12px', border: '1px solid #bae6fd', borderRadius: '7px', fontSize: '13px', background: '#f0f9ff', fontWeight: '700', color: '#0284c7' }}
                  />
                </div>
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
