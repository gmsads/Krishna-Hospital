import React, { useState, useMemo } from 'react';
import { Activity, ChevronDown, ClipboardList, FlaskConical, Plus, X, CheckCircle2, Stethoscope, Printer, FileText, Download, WalletCards, CreditCard } from 'lucide-react';
import { initialLabTests } from '../data/initialData';
import { PathologyLabReportPDFModal } from '../modals/PathologyLabReportPDFModal';
import { HospitalInvoiceModal } from '../modals/HospitalInvoiceModal';

export function LaboratoryPage({ tests = initialLabTests, isDoctor = false, doctorName = '', branding = null, onEnterResult, onUpdateLabOrder, onNotify }) {
  const [activeModalTest, setActiveModalTest] = useState(null);
  const [activeInvoiceRecord, setActiveInvoiceRecord] = useState(null);
  const [activeSourceTab, setActiveSourceTab] = useState('All'); // 'All', 'Doctor Assigned', 'Self Created'

  // Lab Payment Settlement Modal State
  const [paymentModalTest, setPaymentModalTest] = useState(null);
  const [amountPayingNow, setAmountPayingNow] = useState('1200');
  const [settlementMethod, setSettlementMethod] = useState('Cash');
  const [settlementUpiHandle, setSettlementUpiHandle] = useState('krishnalab@ybl');
  const [settlementTxnId, setSettlementTxnId] = useState('');

  const handleOpenLabPaymentModal = (testObj) => {
    setPaymentModalTest(testObj);
    const total = typeof testObj.amount === 'number' ? testObj.amount : (parseFloat(String(testObj.amount || '1200').replace(/[^0-9.]/g, '')) || 1200);
    const paid = typeof testObj.paidAmount === 'number' ? testObj.paidAmount : (testObj.paymentStatus === 'Paid' || testObj.status === 'Result ready' ? total : 0);
    const due = Math.max(0, total - paid);

    setAmountPayingNow(due > 0 ? due.toString() : total.toString());
    setSettlementMethod('Cash');
    setSettlementTxnId('');
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
      list = list.filter((t) => (t.createdBy === 'Doctor' || (t.doctor && t.doctor !== 'Self Created / Walk-In' && t.doctor !== 'Dr. Unassigned')) && !t.isSelfCreated);
    } else if (activeSourceTab === 'Self Created') {
      list = list.filter((t) => t.createdBy === 'Lab Assistant' || t.createdBy === 'Self Created' || t.isSelfCreated === true || t.doctor === 'Self Created / Walk-In' || t.labOrderNo?.startsWith('LAB-') || t.opNumber?.startsWith('LAB-'));
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
            displayTests.map((test) => {
              const totalFee = typeof test.amount === 'number' ? test.amount : (parseFloat(String(test.amount || '1200').replace(/[^0-9.]/g, '')) || 1200);
              const paidFee = typeof test.paidAmount === 'number' ? test.paidAmount : (test.paymentStatus === 'Paid' || test.status === 'Result ready' ? totalFee : 0);
              const dueFee = Math.max(0, totalFee - paidFee);
              const isPaid = dueFee <= 0;

              return (
                <div className="lab-card" key={test.id || test.test} style={{ borderLeft: test.priority === 'Urgent / Stat' ? '4px solid #dc2626' : '4px solid #1769d7' }}>
                  <div className="lab-card-icon"><FlaskConical size={18} color={test.priority === 'Urgent / Stat' ? '#dc2626' : '#1769d7'} /></div>
                  <div className="lab-card-main">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '14px', color: '#162d4a' }}>{test.test}</strong>

                      {/* Source Tag Badge */}
                      {test.createdBy === 'Doctor' || test.createdBy === 'Hospital Record' || !!test.doctor ? (
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

                      {/* Payment Status Badge */}
                      {isPaid ? (
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

                    <span style={{ fontSize: '11px', color: '#1769d7', fontWeight: '700', display: 'block', marginTop: '3px' }}>
                      🩺 Prescribed by Doctor: {test.doctor || 'Self / Walk-in'}
                    </span>

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
                    {/* Toggle: Show Collect Fee when dues are pending, replace with Print Invoice once cleared */}
                    {dueFee > 0 && !isDoctor ? (
                      <button
                        className="primary-button"
                        style={{ padding: '6px 12px', fontSize: '11px', gap: '4px', background: '#ef4444', borderColor: '#dc2626' }}
                        onClick={() => handleOpenLabPaymentModal(test)}
                        title="Collect lab test fee payment"
                      >
                        <WalletCards size={13} /> Collect Fee
                      </button>
                    ) : (
                      <button
                        className="secondary-button"
                        style={{ padding: '6px 12px', fontSize: '11px', gap: '4px', background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d', fontWeight: '700' }}
                        onClick={() => setActiveInvoiceRecord(test)}
                        title="Print official lab tax invoice"
                      >
                        <Printer size={13} /> Print Invoice
                      </button>
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
                      <button
                        className="secondary-button"
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                        onClick={() => {
                          if (isDoctor) {
                            setActiveModalTest(test);
                          } else {
                            onEnterResult(test);
                          }
                        }}
                      >
                        {isDoctor ? 'View Report' : 'Enter Result'}
                      </button>
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
          const payingNum = parseFloat(amountPayingNow) || 0;
          if (payingNum <= 0) {
            onNotify && onNotify('Please enter a valid amount being paid.');
            return;
          }

          const newTotalPaid = prevPaid + payingNum;
          const newBalance = Math.max(0, total - newTotalPaid);
          const newStatus = newBalance <= 0 ? 'Paid' : 'Partial';

          const updatedOrderPayload = {
            ...paymentModalTest,
            amountPaid: String(newTotalPaid),
            paidAmount: newTotalPaid,
            dueBalance: newBalance,
            paymentStatus: newStatus,
            paymentMethod: settlementMethod,
            ...(settlementTxnId ? { upiTxnId: settlementTxnId } : {}),
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
            paymentModalTest.paymentMethod = settlementMethod;
            if (settlementTxnId) paymentModalTest.upiTxnId = settlementTxnId;
          }

          setPaymentModalTest(null);
          onNotify && onNotify(`💳 Lab Fee Payment of ₹ ${payingNum.toLocaleString('en-IN')} recorded for ${paymentModalTest.patient}!`);
        };

        return (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(15, 45, 85, 0.45)', display: 'grid', placeItems: 'center', padding: '16px', overflowY: 'auto' }}>
            <div className="modal" style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 40px rgba(16, 45, 85, 0.2)', border: '1px solid #dbe6f5' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800', background: '#fef2f2', padding: '6px 8px', borderRadius: '6px', marginTop: '2px' }}>
                    <span style={{ color: '#b91c1c' }}>Current Balance Due:</span>
                    <strong style={{ color: '#dc2626' }}>₹ {due.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#15803d' }}>Amount Collecting Now (₹) *</span>
                  <input
                    type="number"
                    value={amountPayingNow}
                    onChange={(e) => setAmountPayingNow(e.target.value)}
                    placeholder="Enter amount collecting..."
                    required
                    style={{ padding: '10px 12px', border: '1px solid #86efac', borderRadius: '7px', fontSize: '14px', fontWeight: '800', color: '#15803d', background: '#f0fdf4' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Payment Mode *</span>
                  <select
                    value={settlementMethod}
                    onChange={(e) => setSettlementMethod(e.target.value)}
                    style={{ padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '12px' }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI / Online">UPI / QR Payment</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                {settlementMethod === 'UPI / Online' && (
                  <div className="field">
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1' }}>UPI Transaction Ref ID</span>
                    <input
                      value={settlementTxnId}
                      onChange={(e) => setSettlementTxnId(e.target.value)}
                      placeholder="e.g. UPI-940284019"
                      style={{ padding: '8px 10px', border: '1px solid #93c5fd', borderRadius: '6px', fontSize: '12px' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
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
