import React, { useState, useMemo } from 'react';
import {
  Activity,
  ClipboardList,
  FlaskConical,
  Plus,
  Stethoscope,
  AlertCircle,
  UserCheck,
  Filter,
  Printer,
  FileText,
  Building2,
  Edit2,
  Trash2,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { TimeFilterBar } from '../common/TimeFilterBar';
import { PanelHeader } from '../common/PanelHeader';
import { initialLabTests } from '../data/initialData';
import { PathologyLabReportPDFModal } from '../modals/PathologyLabReportPDFModal';
import { getNormalizedDateParts } from '../../lib/dateUtils';

function QuickAction({ icon, label, color, onClick }) {
  return (
    <button className="quick-action" onClick={onClick}>
      <div className={`quick-icon ${color}`}>{icon}</div>
      <span>{label}</span>
    </button>
  );
}

export function LabAssistantDashboard({ profile, onNavigate, onEnterResult, onDeleteLabOrder, labTests = initialLabTests, notify }) {
  const firstName = profile.full_name.split(' ')[0];
  const [filterState, setFilterState] = useState({ filterMode: 'all' });
  const [activeSourceTab, setActiveSourceTab] = useState('All'); // 'All', 'Doctor Assigned', 'Self Created'
  const [activePdfModalTest, setActivePdfModalTest] = useState(null);

  const handleDeleteTest = (test) => {
    if (onDeleteLabOrder) {
      onDeleteLabOrder(test);
    } else {
      const targetId = test._id || test.labOrderNo || test.id;
      const patientName = test.patient || test.patientName || 'patient';
      const label = test.labOrderNo || test.id || 'lab order';
      if (window.confirm(`Are you sure you want to delete lab record ${label} for ${patientName}?`)) {
        const token = localStorage.getItem('kh_auth_token');
        if (targetId) {
          fetch(`/api/v1/laboratory/${encodeURIComponent(targetId)}`, {
            method: 'DELETE',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }).catch((err) => console.warn('Backend lab delete warning:', err.message));
        }
        notify && notify(`Lab record ${label} deleted`);
      }
    }
  };

  const isHospitalAssigned = (t) => {
    const creator = (t.createdBy || '').toLowerCase();
    const from = (t.assignedFrom || '').toLowerCase();
    const doc = (t.doctor || t.orderingDoctor || '').toLowerCase();
    return (
      creator.includes('admin') ||
      creator.includes('front desk') ||
      creator.includes('frontdesk') ||
      creator.includes('hospital') ||
      from.includes('hospital') ||
      doc.includes('hospital')
    );
  };

  const isDoctorPrescribed = (t) => {
    if (isHospitalAssigned(t)) return false;
    const doc = (t.doctor || t.orderingDoctor || '').trim();
    const lowerDoc = doc.toLowerCase();
    if (!doc || lowerDoc.includes('self') || lowerDoc.includes('unassigned') || lowerDoc.includes('walk-in') || lowerDoc.includes('walkin') || lowerDoc.includes('lab assistant')) {
      return false;
    }
    return true;
  };

  const filteredTests = useMemo(() => {
    return labTests.filter((t) => {
      if (activeSourceTab === 'Doctor Assigned' && !isDoctorPrescribed(t) && !isHospitalAssigned(t)) return false;
      if (activeSourceTab === 'Self Created' && (isDoctorPrescribed(t) || isHospitalAssigned(t))) return false;

      if (filterState && filterState.filterMode && filterState.filterMode !== 'all') {
        const { year, month, fullDate } = getNormalizedDateParts(t);
        if (filterState.filterMode === 'date') return Boolean(fullDate && fullDate === filterState.selectedDate);
        if (filterState.filterMode === 'today') {
          const todayStr = new Date().toISOString().split('T')[0];
          return Boolean(fullDate && fullDate === todayStr);
        }
        if (filterState.filterMode === 'monthly') return Boolean(month && month === filterState.selectedMonth);
        if (filterState.filterMode === 'yearly') return Boolean(year && year === filterState.selectedYear);
      }
      return true;
    });
  }, [labTests, activeSourceTab, filterState]);

  const doctorAssignedCount = filteredTests.filter((t) => (isDoctorPrescribed(t) || isHospitalAssigned(t)) && t.status !== 'Completed' && t.status !== 'Result ready').length;
  const samplesCollectedCount = filteredTests.filter((t) => t.status === 'Sample Collected' || t.status === 'In Progress').length;
  const readyCount = filteredTests.filter((t) => t.status === 'Completed' || t.status === 'Result ready').length;

  const getDetailText = (fallback) => {
    if (filterState.filterMode === 'today') return `Today: ${new Date().toISOString().split('T')[0]}`;
    if (filterState.filterMode === 'date') return `Date: ${filterState.selectedDate}`;
    if (filterState.filterMode === 'monthly') return `Month: ${filterState.selectedMonth}`;
    if (filterState.filterMode === 'yearly') return `Year: ${filterState.selectedYear}`;
    return fallback;
  };

  const stats = [
    { label: 'Hospital & Doctor assigned requests', value: doctorAssignedCount.toString(), change: 'Hospital / Doctor', trend: 'down', detail: getDetailText('Awaiting sample / result'), icon: <FlaskConical />, tone: 'amber', onClick: () => onNavigate('Laboratory') },
    { label: 'Samples collected', value: samplesCollectedCount.toString(), change: `${samplesCollectedCount}`, trend: 'up', detail: getDetailText('Processing in lab'), icon: <Activity />, tone: 'teal', onClick: () => onNavigate('Laboratory') },
    { label: 'Results completed', value: readyCount.toString(), change: `${readyCount}`, trend: 'up', detail: getDetailText('Ready for review'), icon: <ClipboardList />, tone: 'blue', onClick: () => onNavigate('Laboratory') },
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Laboratory Operations Workspace</div>
          <h1>Good morning, {firstName}</h1>
          <p>Track doctor-prescribed lab test requests, sample processing, and pathology PDF results.</p>
        </div>
        <div className="heading-actions">
          <button className="primary-button" onClick={() => onEnterResult()}>
            <Plus size={17} /> Add / Enter Lab Test
          </button>
        </div>
      </div>

      {/* Date-wise, Monthly & Yearly Filter Bar */}
      <TimeFilterBar
        title="Filter Laboratory Queue & Pathology Analytics"
        onChange={(state) => setFilterState(state)}
      />

      <section className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', color: '#162d4a' }}>Laboratory Task Queue</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#687c96' }}>View Doctor-Assigned tasks vs Self-Created lab tests</p>
            </div>

            {/* Filter Tabs: All, Doctor Assigned, Self Created */}
            <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '3px', borderRadius: '8px', flexWrap: 'wrap' }}>
              <button
                className="secondary-button"
                onClick={() => setActiveSourceTab('All')}
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeSourceTab === 'All' ? '#ffffff' : 'transparent',
                  color: activeSourceTab === 'All' ? '#1769d7' : '#64748b',
                  fontWeight: '700',
                  boxShadow: activeSourceTab === 'All' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                All ({labTests.length})
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveSourceTab('Doctor Assigned')}
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeSourceTab === 'Doctor Assigned' ? '#ffffff' : 'transparent',
                  color: activeSourceTab === 'Doctor Assigned' ? '#1769d7' : '#64748b',
                  fontWeight: '700',
                  boxShadow: activeSourceTab === 'Doctor Assigned' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                🩺 Doctor & Hospital Prescribed ({labTests.filter((t) => isDoctorPrescribed(t) || isHospitalAssigned(t)).length})
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveSourceTab('Self Created')}
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeSourceTab === 'Self Created' ? '#ffffff' : 'transparent',
                  color: activeSourceTab === 'Self Created' ? '#1769d7' : '#64748b',
                  fontWeight: '700',
                  boxShadow: activeSourceTab === 'Self Created' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                🔬 Self Created ({labTests.filter((t) => !isDoctorPrescribed(t) && !isHospitalAssigned(t)).length})
              </button>
            </div>
          </div>

          <div className="lab-cards" style={{ marginTop: '16px', display: 'grid', gap: '12px' }}>
            {filteredTests.map((test, idx) => {
              const hasHospitalAssigned = isHospitalAssigned(test);
              const hasDocPrescriber = isDoctorPrescribed(test);

              return (
                <div
                  className="lab-card"
                  key={`${test.id || 'test'}-${test.test || 'name'}-${idx}`}
                  style={{
                    borderLeft: test.priority === 'Urgent / Stat' ? '4px solid #dc2626' : '4px solid #1769d7',
                    background: test.status === 'Awaiting sample' ? '#fbfcfe' : '#fff',
                  }}
                >
                  <div className="lab-card-icon">
                    <FlaskConical size={18} color={test.priority === 'Urgent / Stat' ? '#dc2626' : '#1769d7'} />
                  </div>
                  
                  <div className="lab-card-main">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '14px', color: '#162d4a' }}>{test.test}</strong>
                      
                      {/* Source Tag Badge */}
                      {hasHospitalAssigned ? (
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '1px 7px',
                            borderRadius: '10px',
                            fontWeight: '800',
                            background: '#fef3c7',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                          }}
                        >
                          🏥 From Hospital
                        </span>
                      ) : hasDocPrescriber ? (
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
                          🩺 Doctor Prescribed
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
                          🔬 Self Created
                        </span>
                      )}

                      {test.priority === 'Urgent / Stat' && (
                        <span style={{ fontSize: '10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '1px 6px', borderRadius: '10px', fontWeight: '800' }}>
                          URGENT / STAT
                        </span>
                      )}
                    </div>

                    <span style={{ display: 'block', marginTop: '3px', fontSize: '12px', color: '#475569' }}>
                      Patient: <strong>{test.patient}</strong> {test.opNumber ? `(${test.opNumber})` : ''}
                    </span>

                    <span
                      style={{
                        fontSize: '11px',
                        color: hasHospitalAssigned ? '#b45309' : hasDocPrescriber ? '#1769d7' : '#15803d',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '3px',
                      }}
                    >
                      {hasHospitalAssigned ? (
                        <>
                          <Building2 size={12} /> Assigned from: Hospital ({test.createdBy || 'Admin / Front Desk'})
                          {test.doctor && !test.doctor.toLowerCase().includes('self') && !test.doctor.toLowerCase().includes('walk') && !test.doctor.toLowerCase().includes('hospital') ? ` • Dr. ${test.doctor.replace(/^Dr\.\s*/i, '')}` : ''}
                        </>
                      ) : hasDocPrescriber ? (
                        <>
                          <Stethoscope size={12} /> Assigned Doctor: {test.doctor || test.orderingDoctor}
                        </>
                      ) : (
                        <>
                          Created by: Self / Walk-in (Lab Assistant)
                        </>
                      )}
                    </span>

                  {test.notes && (
                    <div style={{ background: '#f0f6fe', border: '1px solid #d4e4f7', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', color: '#1a3354', marginTop: '6px' }}>
                      <strong>Doctor Notes:</strong> {test.notes}
                    </div>
                  )}

                  {test.result && (
                    <div style={{ marginTop: '6px', display: 'grid', gap: '3px' }}>
                      {test.result.includes(' | ') ? (
                        test.result.split(' | ').map((subRes, sIdx) => (
                          <div key={sIdx} style={{ fontSize: '11px', color: '#15803d', fontWeight: '700', background: '#f0fdf4', padding: '2px 8px', borderRadius: '4px', border: '1px solid #dcfce7' }}>
                            🔬 {subRes}
                          </div>
                        ))
                      ) : (
                        <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#15803d', fontWeight: '700' }}>
                          Completed Findings: {test.result}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="lab-card-meta">
                  <span>{test.requested}</span>
                  <b className={`lab-status ${test.status === 'Result ready' ? 'ready' : test.status === 'Awaiting sample' ? 'waiting' : ''}`}>
                    {test.status}
                  </b>
                </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {test.status === 'Result ready' ? (
                      <button
                        className="primary-button"
                        style={{ padding: '6px 12px', fontSize: '11px', gap: '4px', background: '#15803d', borderColor: '#15803d' }}
                        onClick={() => setActivePdfModalTest(test)}
                      >
                        <Printer size={13} /> View PDF & Print
                      </button>
                    ) : null}

                    <button
                      className="secondary-button"
                      style={{ padding: '6px 12px', fontSize: '11px', gap: '4px', color: '#1769d7', borderColor: '#b8d5f7', background: '#f4f8fe', fontWeight: '700' }}
                      onClick={() => onEnterResult(test)}
                      title="Edit lab test record, add more tests, and clinical findings"
                    >
                      <Edit2 size={13} /> {test.result || test.status === 'Result ready' ? 'Edit' : 'Enter Result'}
                    </button>

                    <button
                      className="icon-button"
                      style={{ width: '32px', height: '32px', padding: 0, border: '1px solid #fecaca', background: '#fef2f2', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      onClick={() => handleDeleteTest(test)}
                      title="Delete Lab Record"
                    >
                      <Trash2 size={14} color="#dc2626" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel quick-panel">
          <PanelHeader title="Lab Quick Actions" subtitle="Pathology shortcuts" />
          <div className="quick-actions">
            <QuickAction icon={<Plus />} label="Add / Enter Lab Test" color="blue" onClick={() => onEnterResult()} />
            <QuickAction icon={<FlaskConical />} label="View Pending Tests" color="amber" onClick={() => onNavigate('Laboratory')} />
          </div>
        </section>
      </div>

      {/* PDF Report & Print Preview Modal */}
      {activePdfModalTest && (
        <PathologyLabReportPDFModal
          test={activePdfModalTest}
          onClose={() => setActivePdfModalTest(null)}
          onNotify={notify}
        />
      )}
    </>
  );
}

export default LabAssistantDashboard;
