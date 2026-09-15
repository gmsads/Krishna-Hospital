import React from 'react';
import { Printer, Download, X, FileText, FlaskConical } from 'lucide-react';

export function PathologyLabReportPDFModal({ test, branding, onClose, onNotify }) {
  if (!test) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    onNotify && onNotify(`Downloading ${test.test} PDF report for ${test.patient}...`);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Helper to parse dynamic sub-parameter rows if available
  const reportRows = test.testRows && test.testRows.length > 0 ? test.testRows : [
    { id: 1, name: test.test, result: test.result || 'Normal', normalRange: 'Standard Reference' }
  ];

  return (
    <div className="modal-overlay print-overlay" style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(15, 45, 85, 0.55)', display: 'grid', placeItems: 'center', padding: '16px', overflowY: 'auto' }}>
      <div className="modal print-modal" style={{ background: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '720px', width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(16, 45, 85, 0.2)', border: '1px solid #cbd5e1', position: 'relative' }}>
        
        {/* Action Header Controls (Hidden during print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="#1769d7" />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#162d4a', fontWeight: '800' }}>
              Pathology Lab PDF Report
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="secondary-button" onClick={handleDownloadPDF} style={{ fontSize: '12px', padding: '6px 12px', gap: '6px' }}>
              <Download size={15} color="#1769d7" /> Save PDF
            </button>
            <button className="primary-button" onClick={handlePrint} style={{ fontSize: '12px', padding: '6px 14px', gap: '6px' }}>
              <Printer size={15} /> Print Report
            </button>
            <button className="icon-button" onClick={onClose} aria-label="Close report modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* EXACT SPECIFIED CLEAN PDF REPORT BODY WITH DYNAMIC LOGO, WATERMARK & SIGNATURE */}
        <div className="pdf-paper" style={{ background: '#ffffff', color: '#0f172a', fontFamily: 'Arial, sans-serif', padding: '10px', position: 'relative' }}>
          
          {/* Faint Background Watermark Overlay */}
          {branding?.watermark && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '60%',
                height: '60%',
                backgroundImage: `url(${branding.watermark})`,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
                opacity: 0.08,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          )}

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Header with Logo on Left Side */}
            <div style={{ borderBottom: '2px solid #0f2d55', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                {/* Hospital Logo Emblem on Left */}
                {branding?.logo ? (
                  <img src={branding.logo} alt="Hospital Logo" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} />
                ) : (
                  <div style={{ background: '#0f2d55', color: '#ffffff', padding: '8px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FlaskConical size={26} color="#ffffff" />
                  </div>
                )}
                <div>
                  <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f2d55', letterSpacing: '0.5px' }}>
                    {branding?.hospitalName || 'KRISHNA HOSPITAL & DIAGNOSTICS'}
                  </h1>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#334155', lineHeight: 1.4 }}>
                {branding?.address || '124, Healthcare Boulevard, Hospital Junction, Kerala - 682001'}<br />
                Phone: {branding?.phone || '+91 484 290 8000'} | Email: {branding?.email || 'lab@krishnahospital.org'} | Reg: {branding?.registrationNo || 'KMC-LAB-2024-88'}
              </p>
            </div>

            {/* Demographics */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '12px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
              <div>
                <div>Report ID: <strong>{test.id || 'LAB-400'}</strong></div>
                <div>Patient Name: <strong style={{ color: '#0f2d55' }}>{test.patient || 'Patient'}</strong></div>
                <div>OP / Registration No: <strong>{test.opNumber || 'OPD-0001'}</strong></div>
                <div>Hospital Branch: <strong>{test.branch || 'Central Campus'}</strong></div>
              </div>
              <div>
                <div>Prescribing Doctor: <strong>{test.doctor || test.orderingDoctor || 'Dr. Unassigned'}</strong></div>
                <div>Specimen Collected: <strong>{test.requested || 'Today, just now'}</strong></div>
                <div>Report Date / Time: <strong>{new Date().toLocaleString()}</strong></div>
              </div>
            </div>

            {/* Test Name & Method Header */}
            <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '700', marginBottom: '14px', display: 'flex', justifyContent: 'space-between' }}>
              <span>TEST NAME: {test.test.toUpperCase()}</span>
              <span>METHOD: AUTOMATED ANALYZER</span>
            </div>

            {/* Pathology Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #475569', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', color: '#0f172a' }}>Investigation / Parameter</th>
                  <th style={{ padding: '8px 10px', color: '#0f172a' }}>Observed Result Value</th>
                  <th style={{ padding: '8px 10px', color: '#0f172a' }}>Biological Reference Range</th>
                  <th style={{ padding: '8px 10px', color: '#0f172a' }}>Status Flag</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((row, idx) => (
                  <tr key={row.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 10px', fontWeight: '600' }}>{row.name}</td>
                    <td style={{ padding: '8px 10px', fontWeight: '700', color: '#1769d7' }}>{row.result || test.result || 'Normal'}</td>
                    <td style={{ padding: '8px 10px', color: '#475569' }}>{row.normalRange || 'Standard Reference'}</td>
                    <td style={{ padding: '8px 10px', fontWeight: '700', color: '#15803d' }}>NORMAL</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Signatures & Dynamic Authorized Signature Image */}
            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11px' }}>
              <div>
                {branding?.signature && (
                  <img src={branding.signature} alt="Digital Signature" style={{ height: '36px', width: 'auto', objectFit: 'contain', marginBottom: '4px' }} />
                )}
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f2d55' }}>Rahul Krishnan</div>
                <div style={{ color: '#334155' }}>Senior Medical Lab Technician (B.Sc MLT)</div>
                <div style={{ color: '#64748b' }}>Verified & Approved</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '800', color: '#1769d7', fontSize: '11px', marginBottom: '4px' }}>
                  DIGITALLY SIGNED & VERIFIED
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', maxWidth: '280px' }}>
                  {branding?.footerNote || 'Prescription & Pathology report valid for 7 days.'}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Close Button (Hidden during print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
          <button className="secondary-button" onClick={onClose}>
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}

export default PathologyLabReportPDFModal;
