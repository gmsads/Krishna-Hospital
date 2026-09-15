import React, { useState } from 'react';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  FlaskConical,
  Stethoscope,
  ClipboardList,
  Printer,
} from 'lucide-react';
import { initialPatients, initialPatientHistory } from '../data/initialData';
import { PathologyLabReportPDFModal } from '../modals/PathologyLabReportPDFModal';

export function PatientHistoryPage({ patient = initialPatients[0], patientHistoryMap = initialPatientHistory, onRequestLabTest, onBack }) {
  const [activePdfModalTest, setActivePdfModalTest] = useState(null);

  const patientName = patient?.name || 'Ananya Sharma';
  const historyList = patientHistoryMap[patientName] || [
    {
      visitNo: 1,
      date: patient?.lastVisit || 'Today, 09:42 AM',
      time: '09:42 AM',
      opNumber: 'OPD-240813-086',
      department: 'General medicine',
      doctor: patient?.doctor || 'Dr. Meera Nair',
      referralDoctor: 'Self',
      charges: '₹ 850',
      paymentMethod: 'Cash',
      status: 'In consultation',
      vitals: { temp: '98.6 °F', weight: '68 kg', height: '165 cm', bmi: '25.0', bloodGroup: patient?.bloodGroup || 'O+', bp: '120/80 mmHg' },
      complaints: 'Patient registered for OPD consultation.',
      labTests: [
        { test: 'Complete blood count', status: 'Processing', result: 'Pending', notes: 'Sample submitted for analysis.' }
      ]
    }
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Medical Record Directory</div>
          <h1>Patient Medical History</h1>
          <p>Complete multi-visit clinical history table, vitals logs, and lab findings for {patientName}.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" type="button" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Patients Directory
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => onRequestLabTest && onRequestLabTest({ name: patientName, opNumber: historyList[0]?.opNumber })}
          >
            <FlaskConical size={16} /> Request Lab Test
          </button>
        </div>
      </div>

      {/* Patient Overview Card Header (Clean layout without patient ID tag) */}
      <section className="panel" style={{ background: 'linear-gradient(135deg, #f0f6ff 0%, #e6effc 100%)', border: '1px solid #cce0f7', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div className="avatar avatar-blue" style={{ width: '54px', height: '54px', fontSize: '20px', flexShrink: 0 }}>
            {patientName.split(' ').map((w) => w[0]).join('')}
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#142a48' }}>{patientName}</h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#5f7594', lineHeight: '1.4' }}>
              {patient?.age ? `${patient.age} Yrs` : ''}{patient?.age && patient?.gender ? ' · ' : ''}{patient?.gender || ''}{(patient?.age || patient?.gender) && patient?.phone ? ' · ' : ''}Phone: <strong>{patient?.phone || 'Not specified'}</strong>
            </p>
            {patient?.address && (
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#7e93af' }}>Address: {patient.address}</p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ background: '#fff', padding: '8px 14px', borderRadius: '8px', border: '1px solid #d3e2f5', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: '#687c96', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Total Visits</span>
              <strong style={{ fontSize: '16px', color: '#1769d7' }}>{historyList.length}</strong>
            </div>
            <div style={{ background: '#fff', padding: '8px 14px', borderRadius: '8px', border: '1px solid #d3e2f5', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: '#687c96', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Blood Group</span>
              <strong style={{ fontSize: '16px', color: '#e11d48' }}>{patient?.bloodGroup || 'O+'}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Main Clinical History Table */}
      <section className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #edf2f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: '#1a3354' }}>Visits & Consultation Log</h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Showing {historyList.length} recorded consultation visits</span>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="patient-history-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px', width: '60px' }}>Visit</th>
                <th style={{ padding: '12px', minWidth: '130px' }}>Date & OP No</th>
                <th style={{ padding: '12px', minWidth: '160px' }}>Doctor & Dept</th>
                <th style={{ padding: '12px', minWidth: '170px' }}>Vitals Log</th>
                <th style={{ padding: '12px', minWidth: '200px' }}>Complaints & Diagnosis</th>
                <th style={{ padding: '12px', minWidth: '180px' }}>Lab Reports</th>
                <th style={{ padding: '12px', minWidth: '100px' }}>Fee</th>
                <th style={{ padding: '12px', width: '110px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {historyList.map((visit, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '12px', verticalAlign: 'top' }}>
                  {/* Visit Badge */}
                  <td style={{ padding: '12px', fontWeight: '700', color: '#1769d7' }}>
                    <span style={{ background: '#eff6ff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                      #{visit.visitNo || historyList.length - index}
                    </span>
                  </td>

                  {/* Date & OP Number */}
                  <td style={{ padding: '12px', minWidth: '130px' }}>
                    <strong style={{ display: 'block', color: '#0f172a' }}>{visit.date}</strong>
                    <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                      {visit.opNumber}
                    </span>
                  </td>

                  {/* Doctor & Department */}
                  <td style={{ padding: '12px', minWidth: '160px' }}>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#1769d7' }}>{visit.doctor}</strong>
                    <span style={{ fontSize: '11px', color: '#576c85', display: 'block' }}>{visit.department}</span>
                    {visit.referralDoctor && visit.referralDoctor !== 'None' && (
                      <span style={{ display: 'block', fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Ref: {visit.referralDoctor}</span>
                    )}
                  </td>

                  {/* Vitals Log */}
                  <td style={{ padding: '12px', fontSize: '11px', color: '#334155', whiteSpace: 'nowrap', lineHeight: '1.5' }}>
                    <div>BP: <strong>{visit.vitals?.bp || '120/80'}</strong></div>
                    <div>Temp: <strong>{visit.vitals?.temp || '98.6 °F'}</strong></div>
                    <div>Wt: <strong>{visit.vitals?.weight || '68 kg'}</strong> (BMI: {visit.vitals?.bmi || '25.0'})</div>
                  </td>

                  {/* Complaints & Clinical Notes */}
                  <td style={{ padding: '12px', fontSize: '12px', color: '#1e293b', minWidth: '200px' }}>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 10px', borderRadius: '6px', color: '#166534', lineHeight: '1.4' }}>
                      {visit.complaints}
                    </div>
                  </td>

                  {/* Lab Reports: IF RESULT READY SHOW VIEW PDF BUTTON, OTHERWISE SHOW STATUS */}
                  <td style={{ padding: '12px', fontSize: '11px', minWidth: '180px' }}>
                    {visit.labTests && visit.labTests.length > 0 ? (
                      visit.labTests.map((t, idx) => (
                        <div key={idx} style={{ marginBottom: '6px', background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <strong style={{ color: '#0f172a', display: 'block', fontSize: '12px' }}>{t.test}</strong>
                          {t.status === 'Result ready' ? (
                            <button
                              type="button"
                              className="primary-button"
                              style={{
                                marginTop: '6px',
                                padding: '5px 10px',
                                fontSize: '10px',
                                gap: '4px',
                                background: '#15803d',
                                borderColor: '#15803d',
                                width: '100%',
                                justifyContent: 'center',
                              }}
                              onClick={() =>
                                setActivePdfModalTest({
                                  test: t.test,
                                  patient: patientName,
                                  opNumber: visit.opNumber,
                                  doctor: visit.doctor,
                                  status: 'Result ready',
                                  result: t.result || 'Normal Findings',
                                  requested: visit.date,
                                })
                              }
                            >
                              <Printer size={12} /> View PDF & Print
                            </button>
                          ) : (
                            <span
                              style={{
                                display: 'block',
                                color: '#b45309',
                                fontWeight: '700',
                                fontSize: '10px',
                                marginTop: '4px',
                                background: '#fffbeb',
                                border: '1px solid #fde68a',
                                padding: '4px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              ⏳ Status: {t.status || 'Sample collected'}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <span style={{ color: '#94a3b8' }}>No lab requested</span>
                    )}
                  </td>

                  {/* Fee & Payment */}
                  <td style={{ padding: '12px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    <strong style={{ color: '#0f172a', display: 'block' }}>{visit.charges}</strong>
                    <span style={{ display: 'block', fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{visit.paymentMethod}</span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                    <span className={`status ${visit.status === 'Completed' ? 'status-returning' : 'status-new'}`}>
                      <i /> {visit.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Printable Pathology PDF Report Modal */}
      {activePdfModalTest && (
        <PathologyLabReportPDFModal
          test={activePdfModalTest}
          onClose={() => setActivePdfModalTest(null)}
        />
      )}
    </>
  );
}

export default PatientHistoryPage;
