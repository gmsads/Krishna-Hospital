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
  const rawGross = isLab
    ? (typeof record.amount === 'number' ? record.amount : parseFloat(String(record.amount || '1200').replace(/[^0-9.]/g, '')) || 1200)
    : (parseFloat(String(record.grossCharges || record.charges || record.amount || '300').replace(/[^0-9.]/g, '')) || 300);

  const discountAmt = parseFloat(String(record.discount || 0)) || 0;
  const rawTotal = isLab ? rawGross : Math.max(0, rawGross - discountAmt);

  const rawPaid = isLab
    ? (typeof record.paidAmount === 'number' ? record.paidAmount : (record.paymentStatus === 'Paid' || record.status === 'Result ready' ? rawTotal : 0))
    : (parseFloat(record.paidAmount || (record.paymentStatus === 'Paid' ? rawTotal : 0)) || 0);

  const grossFee = rawGross;
  const totalFee = rawTotal;
  const paidAmount = rawPaid;
  const dueBalance = Math.max(0, totalFee - paidAmount);
  const paymentMethod = record.paymentMethod || 'Cash';

  // Helper to parse dynamic sub-parameter rows for lab invoices
  const getInvoiceReportRows = () => {
    if (!isLab) return [];

    const getSubValue = (paramName, fallbackVal) => {
      if (Array.isArray(record.testRows) && record.testRows.length > 0) {
        const found = record.testRows.find(
          (r) => r.name && (r.name.toLowerCase().includes(paramName.toLowerCase()) || paramName.toLowerCase().includes(r.name.toLowerCase()))
        );
        if (found && found.result && found.result !== 'Normal' && found.result !== 'Normal / Within Limits' && found.result !== 'Result ready') {
          return found.result;
        }
      }
      return fallbackVal;
    };

    const testNameLower = (record.test || record.testName || '').toLowerCase();

    if (testNameLower.includes('thyroid')) {
      return [
        { id: 1, name: 'TSH (Thyroid Stimulating Hormone)', result: getSubValue('tsh', '2.45 mIU/L'), normalRange: '0.45 - 4.5 mIU/L', status: 'NORMAL' },
        { id: 2, name: 'T3 (Triiodothyronine)', result: getSubValue('t3', '1.2 ng/mL'), normalRange: '0.8 - 2.0 ng/mL', status: 'NORMAL' },
        { id: 3, name: 'T4 (Thyroxine)', result: getSubValue('t4', '8.5 ug/dL'), normalRange: '5.1 - 14.1 ug/dL', status: 'NORMAL' },
      ];
    }

    if (testNameLower.includes('cbc') || testNameLower.includes('count') || testNameLower.includes('blood count') || testNameLower.includes('hemogram')) {
      return [
        { id: 1, name: 'Hemoglobin (Hb)', result: getSubValue('hemoglobin', '14.2 g/dL'), normalRange: '13.0 - 17.0 g/dL', status: 'NORMAL' },
        { id: 2, name: 'Total Leukocyte Count (WBC)', result: getSubValue('wbc', '7,800 /uL'), normalRange: '4,000 - 11,000 /uL', status: 'NORMAL' },
        { id: 3, name: 'Red Blood Cell Count (RBC)', result: getSubValue('rbc', '4.80 Million/uL'), normalRange: '4.50 - 5.50 Million/uL', status: 'NORMAL' },
        { id: 4, name: 'Platelet Count', result: getSubValue('platelet', '2.50 Lakhs/uL'), normalRange: '1.50 - 4.50 Lakhs/uL', status: 'NORMAL' },
        { id: 5, name: 'Packed Cell Volume (PCV)', result: getSubValue('pcv', '42.5 %'), normalRange: '40.0 - 50.0 %', status: 'NORMAL' },
      ];
    }

    if (testNameLower.includes('lipid') || testNameLower.includes('cholesterol')) {
      return [
        { id: 1, name: 'Serum Cholesterol (Total)', result: getSubValue('cholesterol', '175 mg/dL'), normalRange: '< 200 mg/dL', status: 'DESIRABLE' },
        { id: 2, name: 'Triglycerides', result: getSubValue('triglycerides', '120 mg/dL'), normalRange: '< 150 mg/dL', status: 'NORMAL' },
        { id: 3, name: 'HDL Cholesterol (Good)', result: getSubValue('hdl', '45 mg/dL'), normalRange: '> 40 mg/dL', status: 'OPTIMAL' },
        { id: 4, name: 'LDL Cholesterol (Bad)', result: getSubValue('ldl', '98 mg/dL'), normalRange: '< 100 mg/dL', status: 'OPTIMAL' },
      ];
    }

    if (testNameLower.includes('glucose') || testNameLower.includes('sugar') || testNameLower.includes('diabetes')) {
      return [
        { id: 1, name: 'Fasting Blood Sugar (FBS)', result: getSubValue('fasting', '92 mg/dL'), normalRange: '70 - 99 mg/dL', status: 'NORMAL' },
        { id: 2, name: 'Post Prandial Blood Sugar (PPBS)', result: getSubValue('ppbs', '125 mg/dL'), normalRange: '< 140 mg/dL', status: 'NORMAL' },
        { id: 3, name: 'HbA1c (Glycosylated Hb)', result: getSubValue('hba1c', '5.6 %'), normalRange: '< 5.7 %', status: 'NORMAL' },
      ];
    }

    if (testNameLower.includes('liver') || testNameLower.includes('lft')) {
      return [
        { id: 1, name: 'Serum Bilirubin (Total)', result: getSubValue('bilirubin', '0.8 mg/dL'), normalRange: '0.2 - 1.2 mg/dL', status: 'NORMAL' },
        { id: 2, name: 'SGOT / AST', result: getSubValue('sgot', '28 U/L'), normalRange: '< 40 U/L', status: 'NORMAL' },
        { id: 3, name: 'SGPT / ALT', result: getSubValue('sgpt', '32 U/L'), normalRange: '< 45 U/L', status: 'NORMAL' },
        { id: 4, name: 'Alkaline Phosphatase (ALP)', result: getSubValue('alp', '85 U/L'), normalRange: '44 - 147 U/L', status: 'NORMAL' },
      ];
    }

    if (testNameLower.includes('kidney') || testNameLower.includes('renal') || testNameLower.includes('kft')) {
      return [
        { id: 1, name: 'Blood Urea', result: getSubValue('urea', '22 mg/dL'), normalRange: '15 - 45 mg/dL', status: 'NORMAL' },
        { id: 2, name: 'Serum Creatinine', result: getSubValue('creatinine', '0.9 mg/dL'), normalRange: '0.6 - 1.2 mg/dL', status: 'NORMAL' },
        { id: 3, name: 'Serum Uric Acid', result: getSubValue('uric', '5.2 mg/dL'), normalRange: '3.5 - 7.2 mg/dL', status: 'NORMAL' },
      ];
    }

    if (Array.isArray(record.testRows) && record.testRows.length > 0) {
      return record.testRows.map((r, i) => ({
        id: r.id || i + 1,
        name: r.name || record.test || 'Parameter',
        result: r.result || 'Normal',
        normalRange: r.normalRange || 'Standard Reference',
        status: 'NORMAL'
      }));
    }

    return [];
  };

  const invoiceSubRows = getInvoiceReportRows();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay print-overlay" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15, 45, 85, 0.55)', display: 'grid', placeItems: 'center', padding: '16px', overflowY: 'auto' }}>
      <div className="modal print-modal" style={{ background: '#ffffff', borderRadius: '12px', padding: '28px', maxWidth: '640px', width: '100%', boxShadow: '0 24px 48px rgba(15, 45, 85, 0.25)', border: '1px solid #cbd5e1' }}>
        
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
                  {isLab ? 'Diagnostic Test' : (record.recordType?.includes('IP') ? 'Inpatient Care' : record.recordType?.includes('Surgery') ? 'Surgery Care' : 'Outpatient')}
                </td>
                <td style={{ textAlign: 'right', padding: '10px', fontWeight: '700' }}>
                  ₹ {grossFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Sub-Parameters Findings Table for Lab Invoices */}
          {isLab && invoiceSubRows.length > 0 && (
            <div style={{ marginBottom: '16px', background: '#fafafa', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f2d55', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Sub-Parameter Findings & Observed Results
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '5px 8px', color: '#334155' }}>Investigation / Parameter</th>
                    <th style={{ padding: '5px 8px', color: '#334155' }}>Observed Result Value</th>
                    <th style={{ padding: '5px 8px', color: '#334155' }}>Reference Range</th>
                    <th style={{ padding: '5px 8px', color: '#334155' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceSubRows.map((row, idx) => (
                    <tr key={row.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '5px 8px', fontWeight: '600' }}>{row.name}</td>
                      <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0369a1' }}>{row.result || 'Normal'}</td>
                      <td style={{ padding: '5px 8px', color: '#64748b' }}>{row.normalRange || 'Standard Reference'}</td>
                      <td style={{ padding: '5px 8px', fontWeight: '700', color: '#15803d' }}>{row.status || 'NORMAL'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment Breakdown & Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '2px solid #e2e8f0', paddingTop: '12px', marginBottom: '14px' }}>
            <div style={{ maxWidth: '300px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block' }}>Payment Method / Modes:</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1', display: 'block' }}>💳 {paymentMethod}</span>
              {record.upiTxnId && (
                <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Txn Ref: {record.upiTxnId}</span>
              )}
            </div>

            <div style={{ width: '250px', display: 'grid', gap: '4px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Gross Fee Charges:</span>
                <span>₹ {grossFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: discountAmt > 0 ? '#dc2626' : '#64748b', fontWeight: discountAmt > 0 ? '700' : '400' }}>
                <span>Discount Given:</span>
                <span>{discountAmt > 0 ? `- ₹ ${discountAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹ 0.00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f2d55', fontWeight: '800', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                <span>Net Amount Payable:</span>
                <span>₹ {totalFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontWeight: '700' }}>
                <span>Total Paid Amount:</span>
                <span>₹ {paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: dueBalance > 0 ? '#dc2626' : '#15803d', fontWeight: '800', borderTop: '1px solid #cbd5e1', paddingTop: '4px', marginTop: '2px', fontSize: '13px' }}>
                <span>Balance Due:</span>
                <span>₹ {dueBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* OFFICIAL PAYMENT TRANSACTION HISTORY LOG */}
          {Array.isArray(record.paymentHistory) && record.paymentHistory.length > 0 && (
            <div style={{ marginBottom: '18px', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#0369a1', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📜 Official Payment History &amp; Transaction Log
              </span>
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', background: '#f8fafc', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '10px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>Date &amp; Time</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>Payment Method / Modes</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {record.paymentHistory.map((h, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                      <td style={{ padding: '5px 8px', color: '#475569' }}>
                        {h.dateStr || (h.date ? new Date(h.date).toLocaleDateString('en-IN') : 'Date')} {h.timeStr || ''}
                      </td>
                      <td style={{ padding: '5px 8px', color: '#0f2d55', fontWeight: '700' }}>
                        {h.method || 'Cash'}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', color: '#15803d', fontWeight: '800' }}>
                        ₹ {parseFloat(String(h.amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
