import React, { useState, useMemo } from 'react';
import { Calendar, ChevronDown, ClipboardList, History, Plus, UserCheck, UserPlus, WalletCards, Filter, FlaskConical, X, Upload, CheckCircle2, CreditCard, Printer, FileText, Trash2 } from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { initialOPRecords } from '../data/initialData';
import { HospitalInvoiceModal } from '../modals/HospitalInvoiceModal';

export function OPRecordsPage({
  records = initialOPRecords,
  upiHandles = ['krishnahospital@okicici', 'krishnalab@ybl', 'krishnaglobal@hdfcbank'],
  isDoctor = false,
  initialRecordTypeFilter = 'all',
  onAddOP,
  onViewHistory,
  onRequestLabTest,
  onUpdateOPRecord,
  onDeleteOPRecord,
  onNotify,
}) {
  const [activeInvoiceRecord, setActiveInvoiceRecord] = useState(null);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentYearStr = now.getFullYear().toString();

  // Filter State (Date-wise, Monthly, Yearly, Payment Status & Record Type)
  const [filterMode, setFilterMode] = useState('all');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [recordTypeFilter, setRecordTypeFilter] = useState(initialRecordTypeFilter);

  // COLLECT PAYMENT SETTLEMENT MODAL STATE
  const [paymentModalRecord, setPaymentModalRecord] = useState(null);
  const [amountPayingNow, setAmountPayingNow] = useState('300');
  const [settlementMethod, setSettlementMethod] = useState('Cash');
  const [settlementUpiHandle, setSettlementUpiHandle] = useState(upiHandles[0] || 'krishnahospital@okicici');
  const [settlementTxnId, setSettlementTxnId] = useState('');
  const [settlementReceipt, setSettlementReceipt] = useState(null);
  const [settlementReceiptName, setSettlementReceiptName] = useState('');

  const handleOpenSettlementModal = (record) => {
    setPaymentModalRecord(record);
    const total = parseFloat((record.amount || '300').replace(/[^0-9.]/g, '')) || 300;
    const paid = parseFloat(record.paidAmount || (record.paymentStatus === 'Paid' ? total : 0)) || 0;
    const due = Math.max(0, total - paid);
    
    setAmountPayingNow(due > 0 ? due.toString() : total.toString());
    setSettlementMethod('Cash');
    setSettlementUpiHandle(upiHandles[0] || 'krishnahospital@okicici');
    setSettlementTxnId('');
    setSettlementReceipt(null);
    setSettlementReceiptName('');
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSettlementReceipt(event.target?.result);
        setSettlementReceiptName(file.name);
        onNotify && onNotify(`Attached payment receipt proof: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmSettlementSubmit = (e) => {
    e.preventDefault();
    if (!paymentModalRecord) return;

    const payingNum = parseFloat(amountPayingNow) || 0;
    if (payingNum <= 0) {
      onNotify && onNotify('Please enter a valid amount being paid.');
      return;
    }

    const total = parseFloat((paymentModalRecord.amount || '300').replace(/[^0-9.]/g, '')) || 300;
    const prevPaid = parseFloat(paymentModalRecord.paidAmount || (paymentModalRecord.paymentStatus === 'Paid' ? total : 0)) || 0;
    const newTotalPaid = prevPaid + payingNum;
    const newBalance = Math.max(0, total - newTotalPaid);

    let newStatus = 'Paid';
    if (newBalance > 0 && newTotalPaid > 0) {
      newStatus = 'Partial';
    } else if (newTotalPaid === 0) {
      newStatus = 'Pay Later (Pending)';
    }

    const finalMethod = settlementMethod === 'UPI / Online' ? `UPI (${settlementUpiHandle})` : settlementMethod;

    const updatedRecord = {
      ...paymentModalRecord,
      paidAmount: newTotalPaid,
      dueBalance: newBalance,
      paymentStatus: newStatus,
      paymentMethod: finalMethod,
      selectedUpiHandle: settlementMethod === 'UPI / Online' ? settlementUpiHandle : null,
      upiTxnId: settlementMethod === 'UPI / Online' ? settlementTxnId : null,
      receiptImage: settlementReceipt || paymentModalRecord.receiptImage || null,
    };

    if (onUpdateOPRecord) {
      onUpdateOPRecord(updatedRecord);
    }

    setPaymentModalRecord(null);
    setSettlementReceipt(null);
    setSettlementReceiptName('');

    if (newBalance <= 0) {
      onNotify && onNotify(`✓ Full Payment of ₹ ${payingNum} collected for ${paymentModalRecord.patient}! Status set to PAID.`);
    } else {
      onNotify && onNotify(`⚡ Partial Payment of ₹ ${payingNum} collected for ${paymentModalRecord.patient}! Remaining Balance: ₹ ${newBalance}`);
    }
  };

  // Dynamic Filtering Logic
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const recDate = r.date || todayStr;
      let dateMatch = true;
      if (filterMode === 'date') dateMatch = recDate === selectedDate;
      if (filterMode === 'monthly') dateMatch = recDate.startsWith(selectedMonth);
      if (filterMode === 'yearly') dateMatch = recDate.startsWith(selectedYear);

      const total = parseFloat((r.amount || '300').replace(/[^0-9.]/g, '')) || 300;
      const paid = parseFloat(r.paidAmount || (r.paymentStatus === 'Paid' ? total : 0)) || 0;
      const isDue = (total - paid) > 0 || r.paymentStatus === 'Pay Later (Pending)' || r.paymentMethod === 'Pay Later (Post-Pay)';
      
      let paymentMatch = true;
      if (paymentFilter === 'paid') paymentMatch = !isDue;
      if (paymentFilter === 'due') paymentMatch = isDue;

      let typeMatch = true;
      if (recordTypeFilter !== 'all') {
        typeMatch = (r.recordType || 'OP').toUpperCase().startsWith(recordTypeFilter.toUpperCase());
      }

      return dateMatch && paymentMatch && typeMatch;
    });
  }, [records, filterMode, selectedDate, selectedMonth, selectedYear, paymentFilter, recordTypeFilter, todayStr]);

  const totalOPsAttended = filteredRecords.length;
  const pendingDueCount = useMemo(() => {
    return records.filter((r) => {
      const total = parseFloat((r.amount || '300').replace(/[^0-9.]/g, '')) || 300;
      const paid = parseFloat(r.paidAmount || (r.paymentStatus === 'Paid' ? total : 0)) || 0;
      return (total - paid) > 0 || r.paymentStatus === 'Pay Later (Pending)' || r.paymentMethod === 'Pay Later (Post-Pay)';
    }).length;
  }, [records]);

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Hospital Patient Records Directory</div>
          <h1>All Records</h1>
          <p>Track all outpatient (OP), inpatient (IP with specifications), and emergency patient records across branches.</p>
        </div>
        <div className="heading-actions">
          <button className="primary-button" onClick={onAddOP}>
            <Plus size={17} /> Add Record
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="stat-grid" style={{ gridTemplateColumns: isDoctor ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)' }}>
        <StatCard
          label="Total Attended Records"
          value={totalOPsAttended.toString()}
          change="8.4%"
          trend="up"
          detail={filterMode === 'all' ? 'All time patient records' : filterMode === 'date' ? `Date: ${selectedDate}` : filterMode === 'monthly' ? `Month: ${selectedMonth}` : `Year: ${selectedYear}`}
          icon={<ClipboardList />}
          tone="blue"
        />
        <StatCard
          label="New Registrations"
          value={Math.ceil(totalOPsAttended * 0.3).toString()}
          change="30%"
          trend="up"
          detail="First-time registrations"
          icon={<UserPlus />}
          tone="sky"
        />
        <StatCard
          label="Returning Visits"
          value={Math.floor(totalOPsAttended * 0.7).toString()}
          change="70%"
          trend="up"
          detail="Multi-visit patients"
          icon={<UserCheck />}
          tone="teal"
        />
        {!isDoctor && (
          <StatCard
            label="Pending Fees Dues"
            value={pendingDueCount.toString()}
            change="Action Needed"
            trend="down"
            detail="for selected period"
            icon={<WalletCards />}
            tone="amber"
          />
        )}
      </div>

      {/* Record Type, Date-wise, Monthly, Yearly & Payment Due Filter Bar */}
      <section className="panel" style={{ background: '#f4f8fe', borderColor: '#d3e2f5', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="#1769d7" />
            <strong style={{ fontSize: '13px', color: '#1a3354' }}>Filter Patient Records</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Record Type Tabs: Strictly OP, IP, Emergency */}
            <div style={{ display: 'flex', background: '#fff', padding: '3px', borderRadius: '8px', border: '1px solid #cce0f5', flexWrap: 'wrap', gap: '2px' }}>
              {[
                { key: 'all', label: 'All Types' },
                { key: 'OP', label: '🔵 OP (Outpatient)' },
                { key: 'IP', label: '🟣 IP (Inpatient)' },
                { key: 'Emergency', label: '⚡ Emergency' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`secondary-button ${recordTypeFilter === tab.key ? 'active' : ''}`}
                  style={{
                    padding: '5px 10px',
                    fontSize: '11px',
                    border: '0',
                    background: recordTypeFilter === tab.key ? '#0284c7' : 'transparent',
                    color: recordTypeFilter === tab.key ? '#fff' : '#4a5e7a',
                    fontWeight: '700',
                  }}
                  onClick={() => setRecordTypeFilter(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Payment Status Tabs: All, Paid, Due */}
            <div style={{ display: 'flex', background: '#fff', padding: '3px', borderRadius: '8px', border: '1px solid #cce0f5' }}>
              <button
                type="button"
                className={`secondary-button ${paymentFilter === 'all' ? 'active' : ''}`}
                style={{ padding: '5px 10px', fontSize: '11px', border: '0', background: paymentFilter === 'all' ? '#0f2d55' : 'transparent', color: paymentFilter === 'all' ? '#fff' : '#4a5e7a', fontWeight: '700' }}
                onClick={() => setPaymentFilter('all')}
              >
                All Payments
              </button>
              <button
                type="button"
                className={`secondary-button ${paymentFilter === 'paid' ? 'active' : ''}`}
                style={{ padding: '5px 10px', fontSize: '11px', border: '0', background: paymentFilter === 'paid' ? '#15803d' : 'transparent', color: paymentFilter === 'paid' ? '#fff' : '#4a5e7a', fontWeight: '700' }}
                onClick={() => setPaymentFilter('paid')}
              >
                ✓ Paid Only
              </button>
              <button
                type="button"
                className={`secondary-button ${paymentFilter === 'due' ? 'active' : ''}`}
                style={{ padding: '5px 10px', fontSize: '11px', border: '0', background: paymentFilter === 'due' ? '#b45309' : 'transparent', color: paymentFilter === 'due' ? '#fff' : '#4a5e7a', fontWeight: '700' }}
                onClick={() => setPaymentFilter('due')}
              >
                ⚠️ Due ({pendingDueCount})
              </button>
            </div>

            <div style={{ display: 'flex', background: '#fff', padding: '3px', borderRadius: '8px', border: '1px solid #cce0f5' }}>
              <button
                type="button"
                className={`secondary-button ${filterMode === 'all' ? 'active' : ''}`}
                style={{ padding: '6px 12px', fontSize: '11px', border: '0', background: filterMode === 'all' ? '#1769d7' : 'transparent', color: filterMode === 'all' ? '#fff' : '#4a5e7a' }}
                onClick={() => setFilterMode('all')}
              >
                All Time / Today
              </button>
              <button
                type="button"
                className={`secondary-button ${filterMode === 'date' ? 'active' : ''}`}
                style={{ padding: '6px 12px', fontSize: '11px', border: '0', background: filterMode === 'date' ? '#1769d7' : 'transparent', color: filterMode === 'date' ? '#fff' : '#4a5e7a' }}
                onClick={() => setFilterMode('date')}
              >
                Date-wise
              </button>
              <button
                type="button"
                className={`secondary-button ${filterMode === 'monthly' ? 'active' : ''}`}
                style={{ padding: '6px 12px', fontSize: '11px', border: '0', background: filterMode === 'monthly' ? '#1769d7' : 'transparent', color: filterMode === 'monthly' ? '#fff' : '#4a5e7a' }}
                onClick={() => setFilterMode('monthly')}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`secondary-button ${filterMode === 'yearly' ? 'active' : ''}`}
                style={{ padding: '6px 12px', fontSize: '11px', border: '0', background: filterMode === 'yearly' ? '#1769d7' : 'transparent', color: filterMode === 'yearly' ? '#fff' : '#4a5e7a' }}
                onClick={() => setFilterMode('yearly')}
              >
                Yearly
              </button>
            </div>

            {/* Date-wise Picker */}
            {filterMode === 'date' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #b8d5f7', borderRadius: '7px', fontSize: '12px', background: '#fff' }}
              />
            )}

            {/* Monthly Picker */}
            {filterMode === 'monthly' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #b8d5f7', borderRadius: '7px', fontSize: '12px', background: '#fff' }}
              />
            )}

            {/* Yearly Picker */}
            {filterMode === 'yearly' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #b8d5f7', borderRadius: '7px', fontSize: '12px', background: '#fff' }}
              >
                <option value="2026">Year 2026</option>
                <option value="2025">Year 2025</option>
                <option value="2024">Year 2024</option>
              </select>
            )}
          </div>
        </div>
      </section>
      
      <section className="panel full-panel">
        <div className="list-toolbar">
          <div>
            <h2>Patient Registrations & Consultations ({totalOPsAttended})</h2>
            <p>
              {filterMode === 'all'
                ? "All time consultation and admission records"
                : filterMode === 'date'
                ? `Showing records for date: ${selectedDate}`
                : filterMode === 'monthly'
                ? `Showing records for month: ${selectedMonth}`
                : `Showing records for year: ${selectedYear}`}
            </p>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Reg / OP No</th>
                <th>Type & Specifications</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Hospital Branch</th>
                <th>Payment Status</th>
                <th>Time / Date</th>
                {!isDoctor && <th>Balance Due</th>}
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const total = parseFloat((record.amount || '300').replace(/[^0-9.]/g, '')) || 300;
                const paid = parseFloat(record.paidAmount || (record.paymentStatus === 'Paid' ? total : 0)) || 0;
                const due = Math.max(0, total - paid);
                const hasDue = due > 0 || record.paymentStatus === 'Pay Later (Pending)' || record.paymentMethod === 'Pay Later (Post-Pay)';
                const recType = (record.recordType || 'OP').trim();

                const badgeStyle = recType.startsWith('Emergency')
                  ? { bg: '#fff1f2', border: '#fda4af', color: '#e11d48', label: recType.includes('(') ? `⚡ ${recType}` : '⚡ Emergency' }
                  : recType.startsWith('IP')
                  ? { bg: '#f3e8ff', border: '#e9d5ff', color: '#7e22ce', label: recType.includes('(') ? `🟣 ${recType}` : '🟣 IP (Inpatient)' }
                  : { bg: '#f0f9ff', border: '#bae6fd', color: '#0284c7', label: recType.includes('(') ? `🔵 ${recType}` : '🔵 OP (Outpatient)' };

                const bCode = record.branchCode || (record.branch === 'City Extension' ? 'EXT-CITY' : record.branch === 'North Hospital' ? 'NORTH-MED' : 'HQ-CENTRAL');

                return (
                  <tr key={record.id}>
                    <td><span className="muted-code">{record.id}</span></td>
                    <td>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: badgeStyle.color, background: badgeStyle.bg, border: `1px solid ${badgeStyle.border}`, padding: '2px 8px', borderRadius: '12px' }}>
                        {badgeStyle.label}
                      </span>
                    </td>
                    <td><strong>{record.patient}</strong></td>
                    <td>{record.doctor}</td>
                    <td>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '12px' }}>
                        🏥 {record.branch || 'Central Campus'} ({bCode})
                      </span>
                    </td>
                    <td>
                      {due <= 0 && record.paymentStatus === 'Paid' ? (
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '3px 9px', borderRadius: '12px' }}>
                          ✓ Paid ({record.paymentMethod || 'Cash'})
                        </span>
                      ) : paid > 0 && due > 0 ? (
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#d97706', background: '#fffbebf0', border: '1px solid #fcd34d', padding: '3px 9px', borderRadius: '12px' }}>
                          ⚡ Partial (Paid ₹{paid}, Due ₹{due})
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', padding: '3px 9px', borderRadius: '12px' }}>
                          ⏳ Payment Due (Due ₹{due})
                        </span>
                      )}
                    </td>
                    <td>{record.date || 'Today'}, {record.time}</td>
                    {!isDoctor && (
                      <td>
                        {due <= 0 ? (
                          <>
                            <strong style={{ fontSize: '13px', color: '#15803d', display: 'block' }}>₹ 0.00</strong>
                            <span style={{ fontSize: '10px', color: '#166534', fontWeight: '600' }}>Cleared (Fee ₹{total})</span>
                          </>
                        ) : (
                          <>
                            <strong style={{ fontSize: '14px', color: '#dc2626', fontWeight: '800', display: 'block' }}>₹ {due.toFixed(2)}</strong>
                            <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Fee: ₹{total} | Paid: ₹{paid}</span>
                          </>
                        )}
                      </td>
                    )}
                    <td style={{ textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {hasDue ? (
                        <button
                          type="button"
                          className="primary-button"
                          style={{
                            padding: '5px 12px',
                            fontSize: '11px',
                            gap: '4px',
                            background: '#ef4444',
                            borderColor: '#dc2626',
                            color: '#ffffff',
                            fontWeight: '800',
                            borderRadius: '6px',
                            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.25)',
                          }}
                          onClick={() => handleOpenSettlementModal(record)}
                          title="Collect payment (Full or Partial)"
                        >
                          <WalletCards size={13} color="#fff" /> Collect
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="primary-button"
                          style={{
                            padding: '5px 12px',
                            fontSize: '11px',
                            gap: '4px',
                            background: '#15803d',
                            borderColor: '#15803d',
                            color: '#ffffff',
                            fontWeight: '800',
                            borderRadius: '6px',
                          }}
                          onClick={() => setActiveInvoiceRecord(record)}
                          title="Create and Print Official Tax Invoice"
                        >
                          <Printer size={13} color="#fff" /> Print Invoice
                        </button>
                      )}
                      <button
                        className="secondary-button"
                        style={{ padding: '5px 10px', fontSize: '11px', gap: '4px', background: '#f4f8fe', borderColor: '#b8d5f7', color: '#1769d7', fontWeight: '700' }}
                        onClick={() => onRequestLabTest && onRequestLabTest({ name: record.patient, opNumber: record.id })}
                        title="Order Lab Test for Patient"
                      >
                        <FlaskConical size={13} /> Order Lab
                      </button>
                      <button
                        className="secondary-button"
                        style={{ padding: '5px 10px', fontSize: '11px', gap: '5px' }}
                        onClick={() => {
                          const targetPatient = {
                            name: record.patient,
                            id: record.patientId || record.id || record.regNo,
                            phone: record.phone || '',
                            gender: record.gender || '',
                            age: record.age || '',
                            address: record.address || '',
                            bloodGroup: record.vitals?.bloodGroup || record.bloodGroup || '',
                            lastVisit: `${record.date || 'Today'}, ${record.time || ''}`,
                            doctor: record.doctor,
                          };
                          if (onViewHistory) {
                            onViewHistory(targetPatient);
                          } else if (onNotify) {
                            onNotify(`Opening medical history for ${record.patient}`);
                          }
                        }}
                        title="View complete patient multi-visit history"
                      >
                        <History size={14} color="#1769d7" /> View History
                      </button>
                      <button
                        className="icon-button"
                        style={{ width: '30px', height: '30px', border: '1px solid #fecaca', background: '#fef2f2', borderRadius: '6px' }}
                        onClick={async () => {
                          const token = localStorage.getItem('kh_auth_token');
                          const recordMongoId = record._id || record.id;
                          if (recordMongoId && String(recordMongoId).length > 10) {
                            try {
                              await fetch(`http://localhost:5000/api/v1/op-records/${recordMongoId}`, {
                                method: 'DELETE',
                                headers: {
                                  ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                                },
                              });
                            } catch (err) {
                              console.warn('Could not delete OP record from backend:', err.message);
                            }
                          }
                          if (onDeleteOPRecord) onDeleteOPRecord(record.id || record._id);
                          onNotify && onNotify(`Deleted record for ${record.patient}`);
                        }}
                        title="Delete Record from Database"
                      >
                        <Trash2 size={14} color="#dc2626" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* COLLECT PAYMENT SETTLEMENT MODAL */}
      {paymentModalRecord && (() => {
        const totalFee = parseFloat((paymentModalRecord.amount || '300').replace(/[^0-9.]/g, '')) || 300;
        const paidSoFar = parseFloat(paymentModalRecord.paidAmount || (paymentModalRecord.paymentStatus === 'Paid' ? totalFee : 0)) || 0;
        const currentDue = Math.max(0, totalFee - paidSoFar);
        const payingNum = parseFloat(amountPayingNow) || 0;
        const remainingBal = Math.max(0, currentDue - payingNum);

        return (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(15, 45, 85, 0.45)', display: 'grid', placeItems: 'center', padding: '16px', overflowY: 'auto' }}>
            <div className="modal" style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 40px rgba(16, 45, 85, 0.2)', border: '1px solid #dbe6f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f8', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <WalletCards size={20} color="#dc2626" />
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#162d4a', fontWeight: '800' }}>Record Payment Settlement</h3>
                </div>
                <button className="icon-button" onClick={() => setPaymentModalRecord(null)} aria-label="Close modal">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmSettlementSubmit} style={{ display: 'grid', gap: '14px' }}>
                {/* Patient Summary Header */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', display: 'grid', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '14px', color: '#0f2d55' }}>{paymentModalRecord.patient}</strong>
                    <span style={{ fontSize: '11px', color: '#4a5e7a', fontWeight: '700' }}>OP ID: {paymentModalRecord.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                    <span>Total Consultation Fee: <strong>₹ {totalFee}</strong></span>
                    <span>Paid So Far: <strong style={{ color: '#15803d' }}>₹ {paidSoFar}</strong></span>
                  </div>
                </div>

                {/* Amount Being Paid Input & Quick Fill Buttons */}
                <div className="field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626' }}>Amount Being Paid Now (₹) *</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setAmountPayingNow(currentDue.toString())}
                        style={{ border: '1px solid #b8d5f7', background: '#f4f8fe', color: '#1769d7', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: '700' }}
                      >
                        Full Due (₹{currentDue})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAmountPayingNow((Math.round(currentDue / 2)).toString())}
                        style={{ border: '1px solid #fed7aa', background: '#fff7ed', color: '#c2410c', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: '700' }}
                      >
                        Half (₹{Math.round(currentDue / 2)})
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={currentDue}
                    value={amountPayingNow}
                    onChange={(e) => setAmountPayingNow(e.target.value)}
                    required
                    style={{ padding: '10px 12px', border: '1px solid #fca5a5', borderRadius: '7px', fontSize: '16px', background: '#fef2f2', fontWeight: '800', color: '#dc2626' }}
                  />
                </div>

                {/* Live Remaining Balance Box */}
                <div
                  style={{
                    background: remainingBal <= 0 ? '#f0fdf4' : '#fffbeb',
                    border: `1px solid ${remainingBal <= 0 ? '#bbf7d0' : '#fde68a'}`,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: '700', color: remainingBal <= 0 ? '#15803d' : '#b45309' }}>
                    {remainingBal <= 0 ? '✓ Settlement Result: FULLY PAID (Zero Balance)' : '⚠️ Settlement Result: PARTIAL PAYMENT'}
                  </span>
                  <strong style={{ fontSize: '15px', color: remainingBal <= 0 ? '#15803d' : '#b45309' }}>
                    Balance: ₹ {remainingBal}
                  </strong>
                </div>

                {/* Payment Method */}
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Settlement Payment Method *</span>
                  <select
                    value={settlementMethod}
                    onChange={(e) => setSettlementMethod(e.target.value)}
                    required
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', fontSize: '13px', background: '#fff', fontWeight: '700' }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI / Online">UPI / Online</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                  </select>
                </div>

                {/* CONDITIONAL UPI HANDLES DROPDOWN (Configured in Settings) */}
                {settlementMethod === 'UPI / Online' && (
                  <>
                    <div className="field">
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7' }}>Hospital Available UPI Handle *</span>
                      <select
                        value={settlementUpiHandle}
                        onChange={(e) => setSettlementUpiHandle(e.target.value)}
                        required
                        style={{ padding: '10px 12px', border: '1px solid #93c5fd', borderRadius: '7px', fontSize: '13px', background: '#f0f9ff', fontWeight: '700', color: '#0284c7' }}
                      >
                        {upiHandles.map((h) => (
                          <option key={h} value={h}>💳 {h}</option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>UPI Transaction Ref ID (Optional)</span>
                      <input
                        value={settlementTxnId}
                        onChange={(e) => setSettlementTxnId(e.target.value)}
                        placeholder="e.g. 402918239102"
                        style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', fontSize: '13px' }}
                      />
                    </div>
                  </>
                )}

                {/* OPTIONAL RECEIPT PROOF PICTURE UPLOAD */}
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Payment Receipt / Voucher Picture (Optional)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <label className="secondary-button" style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', gap: '6px' }}>
                      <Upload size={14} /> Upload Receipt Picture (Optional)
                      <input type="file" accept="image/*" onChange={handleReceiptUpload} style={{ display: 'none' }} />
                    </label>
                    {settlementReceipt ? (
                      <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> {settlementReceiptName || 'Receipt Attached'}
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', color: '#64748b' }}>No receipt picture selected (Optional)</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" className="secondary-button" onClick={() => setPaymentModalRecord(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-button" style={{ background: '#ef4444', borderColor: '#dc2626', gap: '6px' }}>
                    <CheckCircle2 size={16} /> Confirm Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Hospital Tax Invoice Modal */}
      <HospitalInvoiceModal
        isOpen={!!activeInvoiceRecord}
        onClose={() => setActiveInvoiceRecord(null)}
        record={activeInvoiceRecord}
        type="record"
      />
    </>
  );
}

export default OPRecordsPage;
