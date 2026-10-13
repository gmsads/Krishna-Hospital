import React, { useState, useMemo } from 'react';
import { Activity, ChevronDown, ClipboardList, FlaskConical, Plus, X, CheckCircle2, Stethoscope, Printer, FileText, Download, WalletCards, CreditCard } from 'lucide-react';
import { initialLabTests } from '../data/initialData';
import { PathologyLabReportPDFModal } from '../modals/PathologyLabReportPDFModal';
import { HospitalInvoiceModal } from '../modals/HospitalInvoiceModal';

export function LaboratoryPage({ tests = initialLabTests, isDoctor = false, doctorName = '', branding = null, onEnterResult, onUpdateLabOrder, onNotify }) {
  const [activeModalTest, setActiveModalTest] = useState(null);
  const [activeInvoiceRecord, setActiveInvoiceRecord] = useState(null);
  const [activeSourceTab, setActiveSourceTab] = useState('All'); // 'All', 'Doctor Assigned', 'Self Created'

  // Lab Payment Settlement Modal State (Multi-Select & Split Collections)
  const [paymentModalTest, setPaymentModalTest] = useState(null);
  const [selectedSettlementMethods, setSelectedSettlementMethods] = useState({
    Cash: true,
    UPI: false,
    Card: false,
    Cheque: false,
    'Bank Transfer': false,
    Free: false,
    Others: false,
  });
  const [settlementSplitAmounts, setSettlementSplitAmounts] = useState({
    Cash: '1200',
    UPI: '0',
    Card: '0',
    Cheque: '0',
    'Bank Transfer': '0',
    Free: '0',
    Others: '0',
  });
  const [settlementUpiHandle, setSettlementUpiHandle] = useState('krishnalab@ybl');
  const [settlementTxnId, setSettlementTxnId] = useState('');

  const handleOpenLabPaymentModal = (testObj) => {
    setPaymentModalTest(testObj);
    const total = typeof testObj.amount === 'number'
      ? testObj.amount
      : (parseFloat(String(testObj.amount || testObj.testFee || '1200').replace(/[^0-9.]/g, '')) || 1200);
    const prevPaid = typeof testObj.paidAmount === 'number'
      ? testObj.paidAmount
      : (parseFloat(String(testObj.amountPaid || testObj.paidAmount || '0').replace(/[^0-9.]/g, '')) || (testObj.paymentStatus === 'Paid' || testObj.status === 'Result ready' ? total : 0));
    const due = Math.max(0, total - prevPaid);
    const initialDueStr = due > 0 ? due.toString() : total.toString();

    setSelectedSettlementMethods({
      Cash: true,
      UPI: false,
      Card: false,
      Cheque: false,
      'Bank Transfer': false,
      Free: false,
      Others: false,
    });
    setSettlementSplitAmounts({
      Cash: initialDueStr,
      UPI: '0',
      Card: '0',
      Cheque: '0',
      'Bank Transfer': '0',
      Free: '0',
      Others: '0',
    });
    setSettlementUpiHandle('krishnalab@ybl');
    setSettlementTxnId('');
  };

  const toggleSettlementMethod = (modeKey) => {
    setSelectedSettlementMethods((prev) => {
      if (modeKey === 'Free') {
        const isFreeOn = !prev.Free;
        if (isFreeOn) {
          const total = typeof paymentModalTest?.amount === 'number' ? paymentModalTest.amount : (parseFloat(String(paymentModalTest?.testFee || paymentModalTest?.amount || '1200').replace(/[^0-9.]/g, '')) || 1200);
          const prevPaid = typeof paymentModalTest?.paidAmount === 'number' ? paymentModalTest.paidAmount : (parseFloat(String(paymentModalTest?.amountPaid || '0').replace(/[^0-9.]/g, '')) || 0);
          const due = Math.max(0, total - prevPaid);
          setSettlementSplitAmounts((ps) => ({ ...ps, Free: due.toString() }));
          return { Cash: false, UPI: false, Card: false, Cheque: false, 'Bank Transfer': false, Free: true, Others: false };
        } else {
          return { ...prev, Cash: true, Free: false };
        }
      }
      const nextState = { ...prev, [modeKey]: !prev[modeKey], Free: false };
      const anyChecked = Object.keys(nextState).some((k) => nextState[k]);
      if (!anyChecked) nextState.Cash = true;
      return nextState;
    });
  };

  const handleSettlementSplitAmountChange = (modeKey, val) => {
    setSettlementSplitAmounts((prev) => ({
      ...prev,
      [modeKey]: val,
    }));
  };

  const handleQuickFillSettlement = (amountVal) => {
    const activeKeys = Object.keys(selectedSettlementMethods).filter((k) => selectedSettlementMethods[k] && k !== 'Free');
    const targetKey = activeKeys.length > 0 ? activeKeys[0] : 'Cash';
    setSettlementSplitAmounts((prev) => ({
      ...prev,
      [targetKey]: amountVal.toString(),
    }));
  };

  const activeSettlementModes = Object.keys(selectedSettlementMethods).filter((k) => selectedSettlementMethods[k]);
  const isSettlementFree = !!selectedSettlementMethods.Free;

  const calculatedSettlementTotal = isSettlementFree
    ? (paymentModalTest ? Math.max(0, (typeof paymentModalTest.amount === 'number' ? paymentModalTest.amount : parseFloat(String(paymentModalTest.testFee || paymentModalTest.amount || '1200').replace(/[^0-9.]/g, '')) || 1200) - (typeof paymentModalTest.paidAmount === 'number' ? paymentModalTest.paidAmount : parseFloat(String(paymentModalTest.amountPaid || '0').replace(/[^0-9.]/g, '')) || 0)) : 0)
    : activeSettlementModes.reduce((sum, key) => {
        const val = parseFloat(String(settlementSplitAmounts[key] || '0').replace(/[^0-9.]/g, '')) || 0;
        return sum + val;
      }, 0);

  const settlementSummaryParts = activeSettlementModes
    .map((key) => {
      const amt = parseFloat(String(settlementSplitAmounts[key] || '0').replace(/[^0-9.]/g, '')) || 0;
      return amt > 0 ? `${key} (₹${amt})` : null;
    })
    .filter(Boolean);

  const settlementSummaryStr = isSettlementFree ? 'Free / Complimentary' : settlementSummaryParts.join(' + ');

  // Helper to reliably check if a test was prescribed by a Doctor vs created manually by Lab Assistant
  const isDoctorPrescribed = (t) => {
    if (t.isSelfCreated === true) return false;
    const doc = (t.doctor || t.orderingDoctor || '').trim();
    const lowerDoc = doc.toLowerCase();
    if (!doc || lowerDoc.includes('self') || lowerDoc.includes('unassigned') || lowerDoc.includes('walk-in') || lowerDoc.includes('walkin') || lowerDoc.includes('lab assistant')) {
      return false;
    }
    return true;
  };

  // Filter tests strictly assigned to this doctor when in Doctor mode, or by source tab
  const displayTests = useMemo(() => {
    let list = tests;
    if (isDoctor && doctorName) {
      const docFirstName = doctorName.split(' ')[0] || '';
      list = list.filter((t) => {
        if (!t.doctor) return true;
        return t.doctor === doctorName || t.doctor.toLowerCase().includes(docFirstName.toLowerCase());
      });
    }

    if (activeSourceTab === 'Hospital Records') {
      list = list.filter((t) => isDoctorPrescribed(t));
    } else if (activeSourceTab === 'Self Created') {
      list = list.filter((t) => !isDoctorPrescribed(t));
    }

    return list;
  }, [tests, isDoctor, doctorName, activeSourceTab]);

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{isDoctor ? 'Doctor Lab Directory' : 'Laboratory operations'}</div>
          <h1>{isDoctor ? 'Assigned Patient Lab Reports' : 'Lab Queue'}</h1>
          <p>{isDoctor ? 'Pathology lab orders and test findings.' : 'Diagnostic test requests, result processing, and invoice generation.'}</p>
        </div>
        <div className="heading-actions">
          {!isDoctor && (
            <button
              className="primary-button"
              onClick={() => onEnterResult(null)}
              style={{ gap: '6px' }}
            >
              <Plus size={16} /> Enter Test
            </button>
          )}
        </div>
      </div>
      
      <section className="panel full-panel">
        <div className="list-toolbar" style={{ flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Recorded Laboratory Tests ({displayTests.length})</h2>

          {/* Filter Source Tabs: All vs Hospital Records vs Self Created Walk-In */}
          {!isDoctor && (
            <div style={{ display: 'flex', gap: '6px', background: '#f0f4f8', padding: '4px', borderRadius: '9px', flexWrap: 'wrap', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              <button
                className="secondary-button"
                onClick={() => setActiveSourceTab('All')}
                style={{
                  fontSize: '11px',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  background: activeSourceTab === 'All' ? '#ffffff' : 'transparent',
                  color: activeSourceTab === 'All' ? '#1769d7' : '#64748b',
                  fontWeight: '700',
                  flex: '1 1 auto',
                  whiteSpace: 'nowrap',
                  boxShadow: activeSourceTab === 'All' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                All ({tests.length})
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveSourceTab('Hospital Records')}
                style={{
                  fontSize: '11px',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  background: activeSourceTab === 'Hospital Records' ? '#ffffff' : 'transparent',
                  color: activeSourceTab === 'Hospital Records' ? '#1769d7' : '#64748b',
                  fontWeight: '700',
                  flex: '1 1 auto',
                  whiteSpace: 'nowrap',
                  boxShadow: activeSourceTab === 'Hospital Records' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                🏥 Hospital Records
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveSourceTab('Self Created')}
                style={{
                  fontSize: '11px',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  background: activeSourceTab === 'Self Created' ? '#ffffff' : 'transparent',
                  color: activeSourceTab === 'Self Created' ? '#1769d7' : '#64748b',
                  fontWeight: '700',
                  flex: '1 1 auto',
                  whiteSpace: 'nowrap',
                  boxShadow: activeSourceTab === 'Self Created' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                🔬 Self Created (Walk-In)
              </button>
            </div>
          )}
        </div>

        <div className="lab-cards">
          {displayTests.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              No lab test reports found.
            </div>
          ) : (
            displayTests.map((test, idx) => {
              const totalFee = typeof test.amount === 'number' ? test.amount : (parseFloat(String(test.amount || '1200').replace(/[^0-9.]/g, '')) || 1200);
              const paidFee = typeof test.paidAmount === 'number' ? test.paidAmount : (test.paymentStatus === 'Paid' || test.status === 'Result ready' ? totalFee : 0);
              const dueFee = Math.max(0, totalFee - paidFee);
              const isPaid = dueFee <= 0;
              const hasDocPrescriber = isDoctorPrescribed(test);
              const isSelf = !hasDocPrescriber;

              return (
                <div className="lab-card" key={`${test.id || 'test'}-${test.test || 'name'}-${idx}`} style={{ borderLeft: test.priority === 'Urgent / Stat' ? '4px solid #dc2626' : '4px solid #1769d7' }}>
                  <div className="lab-card-icon"><FlaskConical size={18} color={test.priority === 'Urgent / Stat' ? '#dc2626' : '#1769d7'} /></div>
                  <div className="lab-card-main">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '14px', color: '#162d4a' }}>{test.test}</strong>

                      {/* Source Tag Badge */}
                      {hasDocPrescriber ? (
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '1px 7px',
                            borderRadius: '10px',
                            fontWeight: '800',
                            background: '#f0f6fe',
                            color: '#1769d7',
                            border: '1px solid #b8d5f7',
                          }}
                        >
                          🏥 Hospital Record (Reg: {test.opNumber || 'OPD-240618-086'})
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '1px 7px',
                            borderRadius: '10px',
                            fontWeight: '800',
                            background: '#f0fdf4',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                          }}
                        >
                          🔬 Walk-In Self Created (Lab ID: {test.labSelfId || test.id || 'LAB-SELF-103'})
                        </span>
                      )}

                      {/* Payment Status Badge - Hidden for Doctor Role */}
                      {!isDoctor && (
                        isPaid ? (
                          <span style={{ fontSize: '10px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '1px 7px', borderRadius: '10px', fontWeight: '800' }}>
                            ✓ Paid (₹{totalFee})
                          </span>
                        ) : paidFee > 0 ? (
                          <span style={{ fontSize: '10px', background: '#fffbebf0', color: '#d97706', border: '1px solid #fcd34d', padding: '1px 7px', borderRadius: '10px', fontWeight: '800' }}>
                            ⚡ Partial (Paid ₹{paidFee}, Due ₹{dueFee})
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '1px 7px', borderRadius: '10px', fontWeight: '800' }}>
                            ⏳ Fee Due (₹{dueFee})
                          </span>
                        )
                      )}

                      {/* Branch Tag Badge */}
                      <span style={{ fontSize: '10px', background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '1px 7px', borderRadius: '10px', fontWeight: '800' }}>
                        🏥 {test.branch || 'Central Campus'} ({test.branchCode || (test.branch === 'City Extension' ? 'EXT-CITY' : test.branch === 'North Hospital' ? 'NORTH-MED' : 'HQ-CENTRAL')})
                      </span>

                      {test.priority === 'Urgent / Stat' && (
                        <span style={{ fontSize: '10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '1px 6px', borderRadius: '10px', fontWeight: '800' }}>
                          URGENT / STAT
                        </span>
                      )}
                    </div>

                    <span style={{ display: 'block', marginTop: '3px', fontSize: '12px', color: '#475569' }}>
                      Patient: <strong>{test.patient}</strong> {test.opNumber ? `(${test.opNumber})` : ''}
                    </span>

                    {hasDocPrescriber ? (
                      <span style={{ fontSize: '11px', color: '#1769d7', fontWeight: '700', display: 'block', marginTop: '3px' }}>
                        🩺 Prescribed by Doctor: {test.doctor || test.orderingDoctor}
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '700', display: 'block', marginTop: '3px' }}>
                        🔬 Created by: Self / Walk-in (Lab Assistant)
                      </span>
                    )}

                    {test.notes && (
                      <div style={{ background: '#f0f6fe', border: '1px solid #d4e4f7', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', color: '#1a3354', marginTop: '4px' }}>
                        <strong>Doctor Notes:</strong> {test.notes}
                      </div>
                    )}

                    {test.result ? (
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#15803d', fontWeight: '600' }}>
                        Result: {test.result}
                      </p>
                    ) : (
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#8b9bb0', italic: 'true' }}>
                        Awaiting lab technician result entry
                      </p>
                    )}
                  </div>

                  <div className="lab-card-meta">
                    <span>{test.requested}</span>
                    <b className={`lab-status ${test.status === 'Result ready' ? 'ready' : test.status === 'Awaiting sample' ? 'waiting' : ''}`}>
                      {test.status}
                    </b>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Toggle: Show Collect Fee when dues are pending (Non-Doctor only) */}
                    {!isDoctor && (
                      dueFee > 0 ? (
                        <button
                          className="primary-button"
                          style={{ padding: '6px 12px', fontSize: '11px', gap: '4px', background: '#ef4444', borderColor: '#dc2626' }}
                          onClick={() => handleOpenLabPaymentModal(test)}
                          title="Collect lab test fee payment"
                        >
                          <WalletCards size={13} /> Collect Fee
                        </button>
                      ) : (
                        test.status === 'Result ready' && (
                          <button
                            className="secondary-button"
                            style={{ padding: '6px 12px', fontSize: '11px', gap: '4px', background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d', fontWeight: '700' }}
                            onClick={() => setActiveInvoiceRecord(test)}
                            title="Print official lab tax invoice"
                          >
                            <Printer size={13} /> Print Invoice
                          </button>
                        )
                      )
                    )}

                    {test.status === 'Result ready' ? (
                      <button
                        className="primary-button"
                        style={{ padding: '6px 12px', fontSize: '11px', gap: '4px', background: '#15803d', borderColor: '#15803d' }}
                        onClick={() => setActiveModalTest(test)}
                      >
                        <Printer size={13} /> View PDF Report
                      </button>
                    ) : (
                      !isDoctor && (
                        <button
                          className="secondary-button"
                          style={{ padding: '6px 12px', fontSize: '11px' }}
                          onClick={() => onEnterResult(test)}
                        >
                          Enter Result
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* PDF Report & Print Preview Modal */}
      {activeModalTest && (
        <PathologyLabReportPDFModal
          test={activeModalTest}
          branding={branding}
          onClose={() => setActiveModalTest(null)}
          onNotify={onNotify}
        />
      )}

      {/* Official Pathology Lab Tax Invoice Modal */}
      <HospitalInvoiceModal
        isOpen={!!activeInvoiceRecord}
        onClose={() => setActiveInvoiceRecord(null)}
        record={activeInvoiceRecord}
        type="lab"
        branding={branding}
      />

      {/* COLLECT LAB FEE SETTLEMENT MODAL */}
      {paymentModalTest && (() => {
        const total = typeof paymentModalTest.amount === 'number' ? paymentModalTest.amount : (parseFloat(String(paymentModalTest.testFee || paymentModalTest.amount || '1200').replace(/[^0-9.]/g, '')) || 1200);
        const prevPaid = typeof paymentModalTest.paidAmount === 'number' ? paymentModalTest.paidAmount : (parseFloat(String(paymentModalTest.amountPaid || paymentModalTest.paidAmount || '0').replace(/[^0-9.]/g, '')) || (paymentModalTest.paymentStatus === 'Paid' || paymentModalTest.status === 'Result ready' ? total : 0));
        const due = Math.max(0, total - prevPaid);

        const handleConfirmLabPaymentSubmit = async (e) => {
          e.preventDefault();
          const isFree = isSettlementFree;
          const payingNum = isFree ? due : calculatedSettlementTotal;
          if (!isFree && payingNum <= 0) {
            onNotify && onNotify('Please enter a valid amount being paid.');
            return;
          }

          const newTotalPaid = isFree ? total : (prevPaid + payingNum);
          const newBalance = isFree ? 0 : Math.max(0, total - newTotalPaid);
          const newStatus = isFree ? 'Paid' : (newBalance <= 0 ? 'Paid' : newTotalPaid > 0 ? 'Partial' : 'Pay Later (Pending)');

          const finalMethod = settlementSummaryStr || (activeSettlementModes.join(', ') || 'Cash');

          const splitBreakdown = {};
          activeSettlementModes.forEach((k) => {
            splitBreakdown[k] = parseFloat(String(settlementSplitAmounts[k] || '0').replace(/[^0-9.]/g, '')) || 0;
          });

          let combinedPaymentMethod = finalMethod;
          const prevMethod = paymentModalTest.paymentMethod;
          if (prevMethod && prevMethod !== finalMethod && prevPaid > 0 && !prevMethod.toLowerCase().includes('pay later')) {
            combinedPaymentMethod = `${prevMethod} + ${finalMethod}`;
          }

          const now = new Date();
          const historyEntry = {
            date: now.toISOString(),
            dateStr: now.toISOString().split('T')[0],
            timeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            amount: payingNum,
            method: finalMethod,
            breakdown: splitBreakdown,
            type: 'Lab Settlement Payment',
          };

          const existingHistory = Array.isArray(paymentModalTest.paymentHistory) && paymentModalTest.paymentHistory.length > 0
            ? paymentModalTest.paymentHistory
            : (prevPaid > 0 ? [{
                date: paymentModalTest.requested || now.toISOString(),
                dateStr: (paymentModalTest.requested || now.toISOString()).split('T')[0],
                timeStr: 'Initial',
                amount: prevPaid,
                method: paymentModalTest.paymentMethod || 'Cash',
                breakdown: paymentModalTest.splitBreakdown || { [paymentModalTest.paymentMethod || 'Cash']: prevPaid },
                type: 'Initial Lab Payment',
              }] : []);

          const updatedHistory = [...existingHistory, historyEntry];

          const updatedOrderPayload = {
            ...paymentModalTest,
            amountPaid: String(newTotalPaid),
            paidAmount: newTotalPaid,
            dueBalance: newBalance,
            paymentStatus: newStatus,
            paymentMethod: combinedPaymentMethod,
            paymentHistory: updatedHistory,
            paymentBreakdown: splitBreakdown,
            splitBreakdown: splitBreakdown,
            ...(selectedSettlementMethods.UPI && settlementTxnId ? { upiTxnId: settlementTxnId } : {}),
            ...(selectedSettlementMethods.UPI ? { upiHandle: settlementUpiHandle } : {}),
          };

          const token = localStorage.getItem('kh_auth_token');
          const orderId = paymentModalTest._id || paymentModalTest.labOrderNo || paymentModalTest.id;

          try {
            const res = await fetch(`/api/v1/laboratory/${orderId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(updatedOrderPayload),
            });

            const data = await res.json();
            if (res.ok && data.success) {
              onNotify && onNotify(`💳 Lab Fee Payment of ₹ ${payingNum.toLocaleString('en-IN')} saved to backend for ${paymentModalTest.patient}!`);
            }
          } catch (err) {
            console.warn('Could not save lab payment to backend API:', err.message);
          }

          if (onUpdateLabOrder) {
            onUpdateLabOrder(updatedOrderPayload);
          } else {
            paymentModalTest.paidAmount = newTotalPaid;
            paymentModalTest.amountPaid = String(newTotalPaid);
            paymentModalTest.dueBalance = newBalance;
            paymentModalTest.paymentStatus = newStatus;
            paymentModalTest.paymentMethod = combinedPaymentMethod;
            paymentModalTest.paymentHistory = updatedHistory;
            paymentModalTest.paymentBreakdown = splitBreakdown;
            if (settlementTxnId) paymentModalTest.upiTxnId = settlementTxnId;
          }

          setPaymentModalTest(null);
          onNotify && onNotify(`💳 Lab Fee Payment of ₹ ${payingNum.toLocaleString('en-IN')} recorded for ${paymentModalTest.patient}!`);
        };

        const remainingBal = isSettlementFree ? 0 : Math.max(0, due - calculatedSettlementTotal);

        return (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(15, 45, 85, 0.45)', display: 'grid', placeItems: 'center', padding: '16px', overflowY: 'auto' }}>
            <div className="modal" style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(16, 45, 85, 0.2)', border: '1px solid #dbe6f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f8', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <WalletCards size={20} color="#dc2626" />
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#162d4a', fontWeight: '800' }}>Collect Pathology Lab Test Fee</h3>
                </div>
                <button className="icon-button" onClick={() => setPaymentModalTest(null)} aria-label="Close modal">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmLabPaymentSubmit} style={{ display: 'grid', gap: '14px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748b' }}>Patient Name:</span>
                    <strong style={{ color: '#0f2d55' }}>{paymentModalTest.patient}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748b' }}>Test Title:</span>
                    <strong style={{ color: '#1769d7' }}>{paymentModalTest.test}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderTop: '1px solid #cbd5e1', paddingTop: '6px', marginTop: '2px' }}>
                    <span style={{ color: '#475569', fontWeight: '700' }}>Total Test Fee:</span>
                    <strong style={{ color: '#dc2626' }}>₹ {total.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#475569', fontWeight: '700' }}>Previously Paid:</span>
                    <strong style={{ color: '#15803d' }}>₹ {prevPaid.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* Outstanding Due & Quick Fill Buttons */}
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#dc2626', textTransform: 'uppercase' }}>OUTSTANDING BALANCE DUE</span>
                    <strong style={{ fontSize: '18px', color: '#dc2626', display: 'block' }}>₹ {due.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleQuickFillSettlement(due)}
                      style={{ border: '1px solid #b8d5f7', background: '#f4f8fe', color: '#1769d7', fontSize: '11px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}
                    >
                      ⚡ Full Due (₹{due})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFillSettlement(Math.round(due / 2))}
                      style={{ border: '1px solid #fed7aa', background: '#fff7ed', color: '#c2410c', fontSize: '11px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}
                    >
                      Half Due (₹{Math.round(due / 2)})
                    </button>
                  </div>
                </div>

                {/* Live Remaining Balance Result Box */}
                <div
                  style={{
                    background: remainingBal <= 0 ? '#f0fdf4' : '#fffbeb',
                    border: `1px solid ${remainingBal <= 0 ? '#bbf7d0' : '#fde68a'}`,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: '700', color: remainingBal <= 0 ? '#15803d' : '#b45309' }}>
                    {remainingBal <= 0 ? '✓ Settlement Result: FULLY PAID (Zero Balance)' : '⚠️ Settlement Result: PARTIAL PAYMENT'}
                  </span>
                  <strong style={{ fontSize: '15px', color: remainingBal <= 0 ? '#15803d' : '#b45309' }}>
                    Balance: ₹ {remainingBal.toLocaleString('en-IN')}
                  </strong>
                </div>

                {/* MULTI-SELECT SETTLEMENT PAYMENT METHODS (TICKS) & SPLIT AMOUNTS */}
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f2d55', display: 'block', marginBottom: '6px' }}>
                    Payment Method *
                  </span>

                  {/* CHECKBOXES ROW */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #dde7f1', marginBottom: '10px' }}>
                    {[
                      { key: 'Cash', label: 'Cash' },
                      { key: 'UPI', label: 'UPI' },
                      { key: 'Card', label: 'Card' },
                      { key: 'Cheque', label: 'Cheque' },
                      { key: 'Bank Transfer', label: 'Bank Transfer' },
                      { key: 'Free', label: 'Free / Complimentary' },
                      { key: 'Others', label: 'Others / PO' },
                    ].map((m) => (
                      <label key={m.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: selectedSettlementMethods[m.key] ? '#1769d7' : '#475569' }}>
                        <input
                          type="checkbox"
                          checked={!!selectedSettlementMethods[m.key]}
                          onChange={() => toggleSettlementMethod(m.key)}
                          style={{ width: '16px', height: '16px', accentColor: '#1769d7', cursor: 'pointer' }}
                        />
                        <span>{m.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* SPLIT AMOUNT INPUTS FOR CHECKED MODES */}
                  {!isSettlementFree && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                      {activeSettlementModes.map((modeKey) => (
                        <div key={modeKey} className="field">
                          <span style={{ color: '#15803d', fontSize: '10px', fontWeight: '800' }}>
                            {modeKey} Amount (₹) *
                          </span>
                          <input
                            type="number"
                            step="any"
                            value={settlementSplitAmounts[modeKey] || ''}
                            onChange={(e) => handleSettlementSplitAmountChange(modeKey, e.target.value)}
                            placeholder={`Enter ${modeKey} amount...`}
                            required
                            style={{ padding: '6px 8px', border: '1px solid #86efac', borderRadius: '5px', fontSize: '12px', fontWeight: '800', color: '#15803d', background: '#ffffff', width: '100%', boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* COLLECTED TOTAL SUMMARY BANNER */}
                  {!isSettlementFree && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', background: '#e0f2fe', border: '1px solid #7dd3fc', padding: '8px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: '800', color: '#0369a1' }}>
                      <span>Total Collecting Now: <strong>₹ {calculatedSettlementTotal.toLocaleString('en-IN')}</strong> {settlementSummaryStr ? `(${settlementSummaryStr})` : ''}</span>
                    </div>
                  )}

                  {/* CONDITIONAL UPI HANDLES & REF ID */}
                  {selectedSettlementMethods.UPI && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                      <div className="field">
                        <span style={{ color: '#0284c7', fontSize: '10px', fontWeight: '700' }}>Hospital Available UPI Handle *</span>
                        <select
                          value={settlementUpiHandle}
                          onChange={(e) => setSettlementUpiHandle(e.target.value)}
                          style={{ padding: '7px 8px', border: '1px solid #93c5fd', borderRadius: '6px', background: '#f0f9ff', fontWeight: '700', color: '#0284c7', fontSize: '11px', width: '100%', boxSizing: 'border-box' }}
                        >
                          <option value="krishnalab@ybl">💳 krishnalab@ybl</option>
                          <option value="krishnahospital@okicici">💳 krishnahospital@okicici</option>
                          <option value="krishnaglobal@hdfcbank">💳 krishnaglobal@hdfcbank</option>
                        </select>
                      </div>

                      <div className="field">
                        <span style={{ color: '#4a5e7a', fontSize: '10px', fontWeight: '700' }}>UPI Transaction Ref ID (Optional)</span>
                        <input
                          value={settlementTxnId}
                          onChange={(e) => setSettlementTxnId(e.target.value)}
                          placeholder="e.g. UPI-940284019"
                          style={{ padding: '7px 8px', border: '1px solid #dde7f1', borderRadius: '6px', fontSize: '11px', width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button type="button" className="secondary-button" onClick={() => setPaymentModalTest(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-button" style={{ background: '#15803d', borderColor: '#15803d', gap: '6px' }}>
                    <CheckCircle2 size={16} /> Confirm Lab Fee Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </>
  );
}

export default LaboratoryPage;
