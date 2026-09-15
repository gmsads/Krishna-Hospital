import React, { useState } from 'react';
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
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { TimeFilterBar } from '../common/TimeFilterBar';
import { PanelHeader } from '../common/PanelHeader';
import { initialLabTests } from '../data/initialData';
import { PathologyLabReportPDFModal } from '../modals/PathologyLabReportPDFModal';

function QuickAction({ icon, label, color, onClick }) {
  return (
    <button className="quick-action" onClick={onClick}>
      <div className={`quick-icon ${color}`}>{icon}</div>
      <span>{label}</span>
    </button>
  );
}

export function LabAssistantDashboard({ profile, onNavigate, onEnterResult, labTests = initialLabTests, notify }) {
  const firstName = profile.full_name.split(' ')[0];
  const [filterState, setFilterState] = useState({ filterMode: 'all' });
  const [activeSourceTab, setActiveSourceTab] = useState('All'); // 'All', 'Doctor Assigned', 'Self Created'
  const [activePdfModalTest, setActivePdfModalTest] = useState(null);

  let multiplier = 1;
  if (filterState.filterMode === 'monthly') multiplier = 24;
  if (filterState.filterMode === 'yearly') multiplier = 280;

  const filteredTests = labTests.filter((t) => {
    if (activeSourceTab === 'Doctor Assigned') return t.createdBy === 'Doctor' || (t.doctor && !t.doctor.includes('Self'));
    if (activeSourceTab === 'Self Created') return t.createdBy === 'Lab Assistant' || (t.doctor && t.doctor.includes('Self'));
    return true;
  });

  const doctorAssignedCount = labTests.filter((t) => (t.createdBy === 'Doctor' || (t.doctor && !t.doctor.includes('Self'))) && t.status !== 'Completed' && t.status !== 'Result ready').length * multiplier;
  const samplesCollectedCount = labTests.filter((t) => t.status === 'Sample Collected' || t.status === 'In Progress').length * multiplier;
  const readyCount = labTests.filter((t) => t.status === 'Completed' || t.status === 'Result ready').length * multiplier;

  const stats = [
    { label: 'Doctor assigned lab requests', value: doctorAssignedCount.toString(), change: 'Doctor Assigned', trend: 'down', detail: 'Awaiting sample / result', icon: <FlaskConical />, tone: 'amber', onClick: () => onNavigate('Laboratory') },
    { label: 'Samples collected', value: samplesCollectedCount.toString(), change: `${samplesCollectedCount}`, trend: 'up', detail: 'Processing in lab', icon: <Activity />, tone: 'teal', onClick: () => onNavigate('Laboratory') },
    { label: 'Results completed', value: readyCount.toString(), change: `${readyCount}`, trend: 'up', detail: 'Ready for review', icon: <ClipboardList />, tone: 'blue', onClick: () => onNavigate('Laboratory') },
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
            <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
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
                🩺 Doctor Prescribed ({labTests.filter((t) => t.createdBy === 'Doctor' || (t.doctor && !t.doctor.includes('Self'))).length})
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
                🔬 Self Created ({labTests.filter((t) => t.createdBy === 'Lab Assistant' || (t.doctor && t.doctor.includes('Self'))).length})
              </button>
            </div>
          </div>

          <div className="lab-cards" style={{ marginTop: '16px', display: 'grid', gap: '12px' }}>
            {filteredTests.map((test) => (
              <div
                className="lab-card"
                key={test.id || test.test}
                style={{
                  borderLeft: test.priority === 'Urgent / Stat' ? '4px solid #dc2626' : '4px solid #1769d7',
                  background: test.status === 'Awaiting sample' ? '#fbfcfe' : '#fff',
                }}
              >
                <div className="lab-card-icon">
                  <FlaskConical size={18} color={test.priority === 'Urgent / Stat' ? '#dc2626' : '#1769d7'} />
                </div>
                
                <div className="lab-card-main">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '14px', color: '#162d4a' }}>{test.test}</strong>
                    
                    {/* Source Tag Badge */}
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 7px',
                        borderRadius: '10px',
                        fontWeight: '800',
                        background: test.createdBy === 'Doctor' || !!test.doctor ? '#f0f6fe' : '#f0fdf4',
                        color: test.createdBy === 'Doctor' || !!test.doctor ? '#1769d7' : '#15803d',
                        border: '1px solid',
                        borderColor: test.createdBy === 'Doctor' || !!test.doctor ? '#b8d5f7' : '#bbf7d0',
                      }}
                    >
                      {test.createdBy === 'Doctor' || !!test.doctor ? '🩺 Doctor Prescribed' : '🔬 Self Created'}
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

                  <span style={{ fontSize: '11px', color: '#1769d7', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                    <Stethoscope size={12} /> Assigned Doctor: {test.doctor || 'Self / Walk-in'}
                  </span>

                  {test.notes && (
                    <div style={{ background: '#f0f6fe', border: '1px solid #d4e4f7', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', color: '#1a3354', marginTop: '6px' }}>
                      <strong>Doctor Notes:</strong> {test.notes}
                    </div>
                  )}

                  {test.result && (
                    <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#15803d', fontWeight: '700' }}>
                      Completed Findings: {test.result}
                    </p>
                  )}
                </div>

                <div className="lab-card-meta">
                  <span>{test.requested}</span>
                  <b className={`lab-status ${test.status === 'Result ready' ? 'ready' : test.status === 'Awaiting sample' ? 'waiting' : ''}`}>
                    {test.status}
                  </b>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {test.status === 'Result ready' ? (
                    <button
                      className="primary-button"
                      style={{ padding: '6px 12px', fontSize: '11px', gap: '4px', background: '#15803d', borderColor: '#15803d' }}
                      onClick={() => setActivePdfModalTest(test)}
                    >
                      <Printer size={13} /> View PDF & Print
                    </button>
                  ) : null}

                  <button className="secondary-button" style={{ padding: '6px 12px', fontSize: '11px', gap: '4px' }} onClick={() => onEnterResult(test)}>
                    <Plus size={14} /> {test.result ? 'Edit result' : 'Enter result'}
                  </button>
                </div>
              </div>
            ))}
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
