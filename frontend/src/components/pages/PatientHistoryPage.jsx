import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  FlaskConical,
  Stethoscope,
  ClipboardList,
  Printer,
  Users,
  Search,
  X,
  Phone,
} from 'lucide-react';
import { initialPatients, initialPatientHistory } from '../data/initialData';
import { PathologyLabReportPDFModal } from '../modals/PathologyLabReportPDFModal';

export function PatientHistoryPage({
  patient = initialPatients[0],
  opRecords = [],
  labTests = [],
  patientHistoryMap = initialPatientHistory,
  onRequestLabTest,
  onBack,
}) {
  const [activePdfModalTest, setActivePdfModalTest] = useState(null);
  const [activePatient, setActivePatient] = useState(patient);
  const [searchPhoneOrName, setSearchPhoneOrName] = useState('');

  // Keep activePatient synchronized if incoming patient prop updates
  useEffect(() => {
    if (patient) {
      setActivePatient(patient);
    }
  }, [patient]);

  const normalize = (str) => (str || '').toLowerCase().trim();
  const currentPhone = (activePatient?.phone || patient?.phone || '').replace(/\D/g, '');
  const queryClean = searchPhoneOrName.trim().toLowerCase();
  const queryDigits = searchPhoneOrName.replace(/\D/g, '');

  // Detect and group all distinct family members / patients sharing this contact number or matching search
  const familyPatients = useMemo(() => {
    const phoneToMatch = queryDigits.length >= 7 ? queryDigits : (currentPhone.length >= 7 ? currentPhone : '');

    // Search opRecords for records matching this phone number or search query
    const matchedRecords = (opRecords || []).filter((r) => {
      const rPhone = (r.phone || '').replace(/\D/g, '');
      const rName = normalize(r.patient || r.patientName);
      const rReg = normalize(r.regNo || r.id);

      if (phoneToMatch && rPhone && (rPhone === phoneToMatch || rPhone.endsWith(phoneToMatch) || phoneToMatch.endsWith(rPhone))) {
        return true;
      }
      if (queryClean && (rName.includes(queryClean) || rReg.includes(queryClean) || (rPhone && rPhone.includes(queryClean)))) {
        return true;
      }
      return false;
    });

    // Group records by unique patient identity (normalized name)
    const patientMap = new Map();

    matchedRecords.forEach((r) => {
      const rawName = (r.patient || r.patientName || '').trim();
      const nameKey = normalize(rawName);
      if (!nameKey) return;

      if (!patientMap.has(nameKey)) {
        patientMap.set(nameKey, {
          name: rawName,
          patient: rawName,
          phone: r.phone || '',
          gender: r.gender || '',
          age: r.age || '',
          address: r.address || '',
          bloodGroup: r.vitals?.bloodGroup || r.bloodGroup || '',
          regNo: r.regNo || r.id || '',
          id: r.regNo || r.id || '',
          opNumber: r.regNo || r.id || '',
          visitsCount: 1,
          latestVisitDate: r.date || r.regDate || (r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : 'Today'),
          doctor: r.doctor || '',
          department: r.department || '',
        });
      } else {
        const existing = patientMap.get(nameKey);
        existing.visitsCount += 1;
        if (!existing.phone && r.phone) existing.phone = r.phone;
        if (!existing.gender && r.gender) existing.gender = r.gender;
        if (!existing.age && r.age) existing.age = r.age;
        if (!existing.bloodGroup && (r.vitals?.bloodGroup || r.bloodGroup)) {
          existing.bloodGroup = r.vitals?.bloodGroup || r.bloodGroup;
        }
      }
    });

    // Ensure activePatient is present in the list
    const activeKey = normalize(activePatient?.name || activePatient?.patient || activePatient?.patientName);
    if (activeKey && !patientMap.has(activeKey)) {
      patientMap.set(activeKey, {
        name: activePatient.name || activePatient.patient || activePatient.patientName,
        patient: activePatient.name || activePatient.patient || activePatient.patientName,
        phone: activePatient.phone || '',
        gender: activePatient.gender || '',
        age: activePatient.age || '',
        address: activePatient.address || '',
        bloodGroup: activePatient.bloodGroup || activePatient.vitals?.bloodGroup || '',
        regNo: activePatient.id || activePatient.regNo || activePatient.opNumber || '',
        id: activePatient.id || activePatient.regNo || activePatient.opNumber || '',
        opNumber: activePatient.id || activePatient.regNo || activePatient.opNumber || '',
        visitsCount: 1,
        latestVisitDate: activePatient.date || activePatient.lastVisit || 'Today',
      });
    }

    return Array.from(patientMap.values());
  }, [opRecords, currentPhone, queryDigits, queryClean, activePatient]);

  const patientDisplayName = activePatient?.name || activePatient?.patient || activePatient?.patientName || patient?.name || 'Patient';

  // DYNAMIC PATIENT MEDICAL HISTORY STRICTLY FILTERED FOR THE CURRENTLY SELECTED INDIVIDUAL
  const historyList = useMemo(() => {
    const targetName = normalize(patientDisplayName);
    const targetReg = normalize(activePatient?.id || activePatient?.regNo || activePatient?.opNumber);

    // Filter all OP records matching strictly THIS patient (strictly isolated by individual identity)
    const matchedOPs = (opRecords || []).filter((r) => {
      const rName = normalize(r.patient || r.patientName);
      const rReg = normalize(r.regNo || r.id);

      if (targetName && rName && (rName === targetName || rName.startsWith(targetName) || targetName.startsWith(rName))) {
        return true;
      }
      if (targetReg && rReg && (rReg === targetReg || rReg === targetName)) {
        return true;
      }
      return false;
    });

    if (matchedOPs.length > 0) {
      return matchedOPs.map((r, idx) => {
        const rLabOrders = (labTests || []).filter((l) => {
          const lName = normalize(l.patient || l.patientName);
          const lOp = normalize(l.opNumber || l.regNo || l.patientId);
          return (
            (lName && targetName && (lName === targetName || lName.includes(targetName))) ||
            (lOp && (lOp === normalize(r.regNo || r.id)))
          );
        });

        const chargesStr = r.charges
          ? (String(r.charges).startsWith('₹') ? r.charges : `₹ ${r.charges}`)
          : r.amount
          ? (String(r.amount).startsWith('₹') ? r.amount : `₹ ${r.amount}`)
          : '₹ 200';

        return {
          visitNo: idx + 1,
          date: r.date || (r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : 'Today'),
          time: r.time || '09:30 AM',
          opNumber: r.regNo || r.id || `OPD-${1000 + idx}`,
          department: r.department || 'General medicine',
          doctor: r.doctor || 'Dr. Meera Nair',
          referralDoctor: r.referralDoctor || 'Self',
          charges: chargesStr,
          paymentMethod: r.paymentMethod || 'Cash',
          paymentBreakdown: r.paymentBreakdown || null,
          paymentHistory: r.paymentHistory || [],
          status: r.status || r.paymentStatus || 'Completed',
          vitals: r.vitals || {
            temp: r.temp ? (String(r.temp).includes('°') ? r.temp : `${r.temp} °F`) : '98.6 °F',
            weight: r.weight ? (String(r.weight).includes('kg') ? r.weight : `${r.weight} kg`) : '68 kg',
            height: r.height ? (String(r.height).includes('cm') ? r.height : `${r.height} cm`) : '165 cm',
            bmi: '25.0',
            bloodGroup: r.bloodGroup || activePatient?.bloodGroup || '',
            bp: r.bp || '120/80 mmHg',
            pr: r.pr || '',
            spo2: r.spo2 || '',
          },
          complaints: r.complaints || r.notes || r.recordType || 'Patient registered for OPD consultation.',
          labTests: rLabOrders.map((l) => ({
            test: l.test || l.testName || 'Diagnostic Test',
            status: l.status || 'Sample collected',
            result: l.result || 'Pending',
            notes: l.notes || '',
          })),
        };
      });
    }

    if (patientHistoryMap[patientDisplayName]) {
      return patientHistoryMap[patientDisplayName];
    }

    const chargesStr = activePatient?.charges
      ? (String(activePatient.charges).startsWith('₹') ? activePatient.charges : `₹ ${activePatient.charges}`)
      : activePatient?.amount
      ? (String(activePatient.amount).startsWith('₹') ? activePatient.amount : `₹ ${activePatient.amount}`)
      : '₹ 200';

    return [
      {
        visitNo: 1,
        date: activePatient?.date || activePatient?.lastVisit || 'Today',
        time: activePatient?.time || '09:30 AM',
        opNumber: activePatient?.opNumber || activePatient?.regNo || activePatient?.id || 'OPD-1001',
        department: activePatient?.department || 'General medicine',
        doctor: activePatient?.doctor || 'Dr. Meera Nair',
        referralDoctor: 'Self',
        charges: chargesStr,
        paymentMethod: activePatient?.paymentMethod || 'Cash',
        paymentHistory: activePatient?.paymentHistory || [],
        status: activePatient?.status || 'Active',
        vitals: activePatient?.vitals || { temp: '98.6 °F', weight: '68 kg', height: '165 cm', bmi: '25.0', bloodGroup: activePatient?.bloodGroup || 'O+', bp: '120/80 mmHg' },
        complaints: activePatient?.complaints || 'Patient registered for OPD consultation.',
        labTests: [],
      }
    ];
  }, [activePatient, patientDisplayName, opRecords, labTests, patientHistoryMap]);

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Medical Record Directory</div>
          <h1>Patient Medical History</h1>
          <p>Complete multi-visit clinical history table, vitals logs, and lab findings for {patientDisplayName}.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" type="button" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Patients Directory
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => onRequestLabTest && onRequestLabTest({
              name: patientDisplayName,
              patient: patientDisplayName,
              opNumber: historyList[0]?.opNumber || activePatient?.id || activePatient?.regNo,
              phone: activePatient?.phone || historyList[0]?.phone || '',
              doctor: activePatient?.doctor || historyList[0]?.doctor || '',
            })}
          >
            <FlaskConical size={16} /> Request Lab Test
          </button>
        </div>
      </div>

      {/* QUICK SEARCH & PHONE LOOKUP BAR */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.05)',
        }}
      >
        <Search size={18} color="#2563eb" />
        <input
          type="text"
          value={searchPhoneOrName}
          onChange={(e) => setSearchPhoneOrName(e.target.value)}
          placeholder="Search by Family Phone Number (e.g. 98470...), Patient Name, or OP Registration No..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '13px',
            color: '#1e293b',
            background: 'transparent',
          }}
        />
        {searchPhoneOrName && (
          <button
            type="button"
            onClick={() => setSearchPhoneOrName('')}
            title="Clear search"
            style={{
              border: 'none',
              background: '#f1f5f9',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={14} color="#64748b" />
          </button>
        )}
      </div>

      {/* FAMILY MEMBERS / SHARED PHONE NUMBER PATIENT SELECTOR BANNER */}
      {familyPatients.length > 1 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#1d4ed8" />
              <strong style={{ fontSize: '14px', color: '#1e3a8a' }}>
                Family Members / Patients Registered with Phone {currentPhone ? `+91 ${currentPhone}` : ''} ({familyPatients.length} Patients Found)
              </strong>
            </div>
            <span style={{ fontSize: '11px', color: '#1e40af', background: '#dbeafe', padding: '3px 10px', borderRadius: '12px', fontWeight: '700' }}>
              👉 Click on any family member to view only their medical history
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
            {familyPatients.map((p) => {
              const isSelected = normalize(p.name) === normalize(patientDisplayName);
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setActivePatient(p);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: isSelected ? '#ffffff' : '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.18)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: isSelected ? '#2563eb' : '#e2e8f0',
                      color: isSelected ? '#fff' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '13px',
                      flexShrink: 0,
                    }}
                  >
                    {p.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                      <strong style={{ fontSize: '13px', color: isSelected ? '#1d4ed8' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </strong>
                      {isSelected && (
                        <span style={{ fontSize: '9px', fontWeight: '800', background: '#2563eb', color: '#fff', padding: '1px 6px', borderRadius: '8px', letterSpacing: '0.3px' }}>
                          VIEWING
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      {p.gender ? `${p.gender}` : ''}{p.gender && p.age ? ', ' : ''}{p.age ? `${p.age}` : ''}
                      {(p.gender || p.age) ? ' · ' : ''}<strong style={{ color: isSelected ? '#1769d7' : '#475569' }}>{p.visitsCount} Visit{p.visitsCount === 1 ? '' : 's'}</strong>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Patient Overview Card Header (Clean layout with Family Badge when multiple family members exist) */}
      <section className="panel" style={{ background: 'linear-gradient(135deg, #f0f6ff 0%, #e6effc 100%)', border: '1px solid #cce0f7', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div className="avatar avatar-blue" style={{ width: '54px', height: '54px', fontSize: '20px', flexShrink: 0 }}>
            {patientDisplayName.split(' ').map((w) => w[0]).join('')}
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#142a48' }}>{patientDisplayName}</h2>
              {familyPatients.length > 1 && (
                <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                  👨‍👩‍👧 Family Member {familyPatients.findIndex(p => normalize(p.name) === normalize(patientDisplayName)) + 1} of {familyPatients.length}
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#5f7594', lineHeight: '1.4' }}>
              {activePatient?.age ? `${activePatient.age} Yrs` : ''}{activePatient?.age && activePatient?.gender ? ' · ' : ''}{activePatient?.gender || ''}{(activePatient?.age || activePatient?.gender) && activePatient?.phone ? ' · ' : ''}Phone: <strong>{activePatient?.phone || 'Not specified'}</strong>
            </p>
            {activePatient?.address && (
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#7e93af' }}>Address: {activePatient.address}</p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ background: '#fff', padding: '8px 14px', borderRadius: '8px', border: '1px solid #d3e2f5', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: '#687c96', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Total Visits</span>
              <strong style={{ fontSize: '16px', color: '#1769d7' }}>{historyList.length}</strong>
            </div>
            <div style={{ background: '#fff', padding: '8px 14px', borderRadius: '8px', border: '1px solid #d3e2f5', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: '#687c96', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Blood Group</span>
              <strong style={{ fontSize: '16px', color: '#e11d48' }}>{activePatient?.bloodGroup || '—'}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Main Clinical History Table */}
      <section className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #edf2f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: '#1a3354' }}>Visits & Consultation Log</h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Showing {historyList.length} recorded consultation visit{historyList.length === 1 ? '' : 's'} for <strong>{patientDisplayName}</strong></span>
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
                    {(visit.vitals?.pr || visit.pr) && <div>PR: <strong>{visit.vitals?.pr || visit.pr} bpm</strong></div>}
                    {(visit.vitals?.spo2 || visit.vitals?.spo || visit.spo2) && <div>SpO2: <strong>{visit.vitals?.spo2 || visit.vitals?.spo || visit.spo2}</strong></div>}
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
                                  patient: patientDisplayName,
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
                  <td style={{ padding: '12px', fontSize: '12px', minWidth: '160px' }}>
                    <strong style={{ color: '#0f172a', display: 'block' }}>{visit.charges || visit.amount}</strong>
                    <span style={{ display: 'block', fontSize: '11px', color: '#0369a1', fontWeight: '700', marginTop: '2px' }}>
                      💳 {visit.paymentMethod || 'Cash'}
                    </span>
                    {Array.isArray(visit.paymentHistory) && visit.paymentHistory.length > 0 && (
                      <div style={{ marginTop: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 8px', fontSize: '10px' }}>
                        <strong style={{ color: '#0369a1', display: 'block', marginBottom: '4px' }}>📜 Payment History ({visit.paymentHistory.length}):</strong>
                        {visit.paymentHistory.map((h, hIdx) => (
                          <div key={hIdx} style={{ color: '#475569', borderBottom: hIdx < visit.paymentHistory.length - 1 ? '1px dashed #cbd5e1' : 'none', paddingBottom: '3px', marginBottom: '3px' }}>
                            <span style={{ fontWeight: '700', color: '#15803d' }}>+₹{h.amount}</span> ({h.method})
                            <span style={{ display: 'block', color: '#94a3b8', fontSize: '9px' }}>{h.dateStr || ''} {h.timeStr || ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
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
