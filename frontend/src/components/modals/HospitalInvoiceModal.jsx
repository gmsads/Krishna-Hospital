import React from 'react';
import { X, Printer, CheckCircle2, Building2, ShieldCheck, FileText } from 'lucide-react';

export function HospitalInvoiceModal({ isOpen, onClose, record, type = 'record', branding }) {
  if (!isOpen || !record) return null;

  const hospitalName = branding?.hospitalName || 'Krishna Hospitals';
  const logo = branding?.logo;
  const invNo = record.billNo || record.referenceNo || `INV-${record.id || '10029'}`;
  const recordDate = record.date || new Date().toISOString().split('T')[0];
  const recordTime = record.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const patientName = record.patient || 'Patient Name';
  const ageGender = record.age && record.gender ? `${record.age} / ${record.gender}` : record.age || record.gender || '32 Yrs / Male';
  const patientId = record.patientId || record.id || 'KH-1048';
  const doctor = record.doctor || 'Dr. Meera Nair';
  const branch = record.branch || 'Central Campus';
  
  // Financial Math
  const isLab = type === 'lab';
  const rawTotal = isLab
    ? (typeof record.amount === 'number' ? record.amount : parseFloat(String(record.amount || '1200').replace(/[^0-9.]/g, '')) || 1200)
    : (parseFloat(String(record.amount || '300').replace(/[^0-9.]/g, '')) || 300);

  const rawPaid = isLab
    ? (typeof record.paidAmount === 'number' ? record.paidAmount : (record.paymentStatus === 'Paid' || record.status === 'Result ready' ? rawTotal : 0))
    : (parseFloat(record.paidAmount || (record.paymentStatus === 'Paid' ? rawTotal : 0)) || 0);

  const totalFee = rawTotal;
  const paidAmount = rawPaid;
  const dueBalance = Math.max(0, totalFee - paidAmount);
  const paymentMethod = record.paymentMethod || 'Cash';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15, 45, 85, 0.55)', display: 'grid', placeItems: 'center', padding: '16px', overflowY: 'auto' }}>
      <div className="modal" style={{ background: '#ffffff', borderRadius: '12px', padding: '28px', maxWidth: '640px', width: '100%', boxShadow: '0 24px 48px rgba(15, 45, 85, 0.25)', border: '1px solid #cbd5e1' }}>
        
        {/* Top Actions Header (Screen only) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="#1769d7" />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f2d55', fontWeight: '800' }}>
              Official Tax Invoice / Payment Receipt
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="primary-button"
              onClick={handlePrint}
              style={{ gap: '6px', background: '#15803d', borderColor: '#15803d', fontSize: '12px', padding: '6px 14px' }}
            >
              <Printer size={15} /> Print Invoice
            </button>
            <button className="icon-button" onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE CONTENT AREA */}
        <div id="printable-invoice" style={{ background: '#fff', color: '#0f2d55', fontFamily: 'inherit' }}>
          
          {/* Invoice Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0284c7', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {logo ? (
                <img src={logo} alt="Hospital Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
              ) : (
                <div style={{ width: '44px', height: '44px', background: '#e0f2fe', borderRadius: '10px', display: 'grid', placeItems: 'center', color: '#0284c7', fontWeight: '900', fontSize: '20px' }}>
                  K
                </div>
              )}
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#0f2d55', fontWeight: '900' }}>{hospitalName}</h2>
                <span style={{ fontSize: '11px', color: '#475569', fontWeight: '600', display: 'block' }}>
                  🏥 Campus: {branch} ({record.branchCode || (branch === 'City Extension' ? 'EXT-CITY' : branch === 'North Hospital' ? 'NORTH-MED' : 'HQ-CENTRAL')}) · Multispecialty & Research Centre
                </span>
                <span style={{ fontSize: '10px', color: '#64748b' }}>GSTIN: 36AAACK9401M1Z2 · Reg No: KH/MED/2026/8940</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <strong style={{ fontSize: '14px', color: '#0369a1', display: 'block' }}>Bill No: {invNo}</strong>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Date: {recordDate} · {recordTime}</span>
            </div>
          </div>

          {/* Patient & Consultation Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PATIENT INFORMATION</span>
              <strong style={{ fontSize: '14px', color: '#0f2d55', display: 'block', marginTop: '2px' }}>{patientName}</strong>
              <span style={{ fontSize: '11px', color: '#475569', display: 'block' }}>Reg ID: <strong>{patientId}</strong></span>
              <span style={{ fontSize: '11px', color: '#475569', display: 'block' }}>Age / Gender: {ageGender}</span>
            </div>

            <div>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CLINICAL CARE DETAILS</span>
              <strong style={{ fontSize: '13px', color: '#0369a1', display: 'block', marginTop: '2px' }}>
                {isLab ? `Microbiology & Pathology Lab` : `Department: ${record.department || 'General Medicine'}`}
              </strong>
              <span style={{ fontSize: '11px', color: '#475569', display: 'block' }}>Attending Doctor: <strong>{doctor}</strong></span>
              <span style={{ fontSize: '11px', color: '#7e22ce', fontWeight: '700', display: 'block' }}>
                Service Type: {isLab ? `Pathology Test (${record.test || 'Lab Panel'})` : (record.recordType || 'OP (Outpatient)')}
              </span>
            </div>
          </div>

          {/* Itemized Charges Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#334155' }}>Description of Service / Care</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', color: '#334155' }}>Type</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: '#334155' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px', color: '#0f2d55', fontWeight: '700' }}>
                  {isLab ? `Pathology Lab Test - ${record.test || 'Diagnostic Suite'}` : `Hospital Care Consultation Fee - ${record.recordType || 'OP'}`}
                </td>
                <td style={{ textAlign: 'center', padding: '10px', color: '#64748b' }}>
                  {isLab ? 'Diagnostic Test' : (record.recordType?.includes('IP') ? 'Inpatient Care' : 'Outpatient')}
                </td>
                <td style={{ textAlign: 'right', padding: '10px', fontWeight: '700' }}>
                  ₹ {totalFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Payment Breakdown & Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '2px solid #e2e8f0', paddingTop: '12px', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block' }}>Payment Method:</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1' }}>💳 {paymentMethod}</span>
              {record.upiTxnId && (
                <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Txn Ref: {record.upiTxnId}</span>
              )}
            </div>

            <div style={{ width: '220px', display: 'grid', gap: '4px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Subtotal:</span>
                <span>₹ {totalFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontWeight: '700' }}>
                <span>Paid Amount:</span>
                <span>₹ {paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: dueBalance > 0 ? '#dc2626' : '#15803d', fontWeight: '800', borderTop: '1px solid #cbd5e1', paddingTop: '4px', marginTop: '2px', fontSize: '13px' }}>
                <span>Balance Due:</span>
                <span>₹ {dueBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Authorised Signature & Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #cbd5e1', paddingTop: '16px' }}>
            <div style={{ fontSize: '10px', color: '#64748b', maxWidth: '320px' }}>
              <p style={{ margin: 0 }}>This is a computer-generated official payment invoice issued by {hospitalName}. Thank you for trusting us with your healthcare.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #0f2d55', width: '140px', marginBottom: '4px' }}></div>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#0f2d55', display: 'block' }}>Authorised Billing Seal</span>
              <span style={{ fontSize: '9px', color: '#64748b' }}>Accounts Department</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
