import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  FlaskConical,
  Plus,
  UserCheck,
  UserPlus,
  Printer,
  Bed,
  Zap,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { TimeFilterBar } from '../common/TimeFilterBar';
import { PanelHeader } from '../common/PanelHeader';
import { PatientTable } from '../common/PatientTable';
import { initialOPRecords, initialLabTests } from '../data/initialData';
import { PathologyLabReportPDFModal } from '../modals/PathologyLabReportPDFModal';

function QuickAction({ icon, label, color, onClick }) {
  return (
    <button className="quick-action" onClick={onClick}>
      <div className={`quick-icon ${color}`}>{icon}</div>
      <span>{label}</span>
    </button>
  );
}

export function DoctorDashboard({
  profile,
  onNavigate,
  onAddOPRecord,
  onViewPatientHistory,
  onRequestLabTest,
  opRecords = initialOPRecords,
  labTests = initialLabTests,
  notify,
}) {
  const doctorName = profile?.full_name || 'Dr. Meera Nair';
  const firstName = doctorName.split(' ')[0] || 'Doctor';
  const [filterState, setFilterState] = useState({ filterMode: 'all' });
  const [activePdfModalTest, setActivePdfModalTest] = useState(null);

  // Filter OP records assigned ONLY to this doctor
  const normalizeDocName = (name) => (name || '').toLowerCase().replace(/^(dr\.?|doctor)\s+/i, '').replace(/\s+/g, ' ').trim();
  const userDocNorm = useMemo(() => normalizeDocName(doctorName), [doctorName]);

  // Filter OP records assigned ONLY to this doctor
  const assignedRecords = useMemo(() => {
    return opRecords.filter((r) => {
      if (!r.doctor || r.doctor === 'Dr. Unassigned') return false;
      const recordDocNorm = normalizeDocName(r.doctor);
      return recordDocNorm === userDocNorm || recordDocNorm.includes(userDocNorm) || userDocNorm.includes(recordDocNorm);
    });
  }, [opRecords, userDocNorm]);

  // Filter Lab tests assigned ONLY to this doctor
  const assignedLabTests = useMemo(() => {
    return labTests.filter((t) => {
      if (!t.doctor || t.doctor === 'Dr. Unassigned') return false;
      const recordDocNorm = normalizeDocName(t.doctor);
      return recordDocNorm === userDocNorm || recordDocNorm.includes(userDocNorm) || userDocNorm.includes(recordDocNorm);
    });
  }, [labTests, userDocNorm]);

  let multiplier = 1;
  if (filterState.filterMode === 'monthly') multiplier = 24;
  if (filterState.filterMode === 'yearly') multiplier = 280;

  const totalAssignedPatients = assignedRecords.length * multiplier;
  const rawOpsCount = assignedRecords.filter(r => !(r.recordType || '').startsWith('IP') && !(r.recordType || '').startsWith('Emergency')).length * multiplier;
  const rawIpsCount = assignedRecords.filter(r => (r.recordType || '').startsWith('IP')).length * multiplier;
  const rawEmergencyCount = assignedRecords.filter(r => (r.recordType || '').startsWith('Emergency')).length * multiplier;

  const opsCount = rawOpsCount;
  const ipsCount = rawIpsCount;
  const emergencyCount = rawEmergencyCount;

  const stats = [
    {
      label: 'Total OPs Assigned',
      value: opsCount.toString(),
      change: 'Outpatients',
      trend: 'up',
      detail: 'OPD consultations',
      icon: <ClipboardList />,
      tone: 'blue',
      onClick: () => onNavigate('OP Records', 'OP'),
    },
    {
      label: 'Total IPs Assigned',
      value: ipsCount.toString(),
      change: 'Inpatients',
      trend: 'up',
      detail: 'Admissions & care',
      icon: <Bed />,
      tone: 'teal',
      onClick: () => onNavigate('OP Records', 'IP'),
    },
    {
      label: 'Total Emergency Cases',
      value: emergencyCount.toString(),
      change: 'Urgent Care',
      trend: 'up',
      detail: 'Emergency consultations',
      icon: <Zap />,
      tone: 'red',
      onClick: () => onNavigate('OP Records', 'Emergency'),
    },
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Doctor Consultation Portal</div>
          <h1>Good morning, {doctorName}</h1>
          <p>View your assigned OPD patient lineup, issue medical prescriptions, and review pathology lab PDF reports.</p>
        </div>
        <div className="heading-actions">
          <button className="primary-button" onClick={onAddOPRecord}>
            <Plus size={17} /> Add Record
          </button>
        </div>
      </div>

      {/* Date-wise, Monthly & Yearly Filter Bar */}
      <TimeFilterBar
        title="Filter OPD Consultations & Clinical Analytics"
        onChange={(state) => setFilterState(state)}
      />

      <section className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <div className="dashboard-grid">
        {/* Lab Test Reports for Doctor's Patients (Read-Only View with PDF Print) */}
        <section className="panel">
          <PanelHeader
            title="Lab Test Reports"
            subtitle="Lab findings entered by Lab Assistant for your assigned patients"
            action="View All Lab Reports"
            onAction={() => onNavigate('Laboratory')}
          />
          <div className="lab-cards" style={{ marginTop: '16px' }}>
            {assignedLabTests.slice(0, 3).map((test) => (
              <div className="lab-card" key={test.id || test.test}>
                <div className="lab-card-icon">
                  <FlaskConical size={18} />
                </div>
                <div className="lab-card-main">
                  <strong>{test.test}</strong>
                  <span>Patient: {test.patient}</span>
                  {test.result ? (
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#15803d', fontWeight: '700' }}>
                      Findings: {test.result}
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
                {test.status === 'Result ready' ? (
                  <button
                    className="primary-button"
                    style={{ padding: '5px 12px', fontSize: '11px', gap: '4px', background: '#15803d', borderColor: '#15803d' }}
                    onClick={() => setActivePdfModalTest(test)}
                  >
                    <Printer size={13} /> View PDF & Print
                  </button>
                ) : (
                  <span style={{ fontSize: '11px', color: '#b45309', fontWeight: '700', background: '#fffbeb', border: '1px solid #fde68a', padding: '4px 8px', borderRadius: '6px' }}>
                    ⏳ {test.status || 'Sample collected'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Doctor Quick Actions */}
        <section className="panel quick-panel">
          <PanelHeader title="Doctor Quick Actions" subtitle="OPD consultation shortcuts" />
          <div className="quick-actions">
            <QuickAction
              icon={<Plus />}
              label="Add Record"
              color="blue"
              onClick={onAddOPRecord}
            />
            <QuickAction
              icon={<ClipboardList />}
              label="View Assigned Records"
              color="sky"
              onClick={() => onNavigate('OP Records')}
            />
            <QuickAction
              icon={<FlaskConical />}
              label="View Lab Reports"
              color="amber"
              onClick={() => onNavigate('Laboratory')}
            />
          </div>
        </section>
      </div>

      {/* Assigned Patient Lineup Table */}
      <div className="lower-grid">
        <section className="panel patient-panel">
          <PanelHeader
            title="Assigned OP Consultations Today"
            subtitle="Today's OPD patient lineup"
            action="View OP Records"
            onAction={() => onNavigate('OP Records')}
          />
          <PatientTable 
            compact 
            patients={assignedRecords} 
            onViewHistory={onViewPatientHistory} 
            onRequestLabTest={onRequestLabTest} 
            onNotify={notify} 
          />
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

export default DoctorDashboard;
