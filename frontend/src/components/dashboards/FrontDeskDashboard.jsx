import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  UserCheck,
  UserPlus,
  Bed,
  Zap,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { TimeFilterBar } from '../common/TimeFilterBar';
import { PanelHeader } from '../common/PanelHeader';
import { PatientTable } from '../common/PatientTable';
import { initialOPRecords } from '../data/initialData';

function QuickAction({ icon, label, color, onClick }) {
  return (
    <button className="quick-action" onClick={onClick}>
      <div className={`quick-icon ${color}`}>{icon}</div>
      <span>{label}</span>
    </button>
  );
}

export function FrontDeskDashboard({ profile, onNavigate, onAddOPRecord, onViewPatientHistory, opRecords = initialOPRecords, notify }) {
  const firstName = profile.full_name.split(' ')[0];
  const [filterState, setFilterState] = useState({ filterMode: 'all' });

  const opCountDiff = opRecords.length - initialOPRecords.length;
  let multiplier = 1;
  if (filterState.filterMode === 'monthly') multiplier = 24;
  if (filterState.filterMode === 'yearly') multiplier = 280;

  const totalRecords = opRecords.length * multiplier;
  const rawOpsCount = opRecords.filter(r => !(r.recordType || '').startsWith('IP') && !(r.recordType || '').startsWith('Emergency')).length * multiplier;
  const rawIpsCount = opRecords.filter(r => (r.recordType || '').startsWith('IP')).length * multiplier;
  const rawEmergencyCount = opRecords.filter(r => (r.recordType || '').startsWith('Emergency')).length * multiplier;

  const opsCount = rawOpsCount;
  const ipsCount = rawIpsCount;
  const emergencyCount = rawEmergencyCount;

  const getDetailText = () => {
    if (filterState.filterMode === 'date') return `Date: ${filterState.selectedDate}`;
    if (filterState.filterMode === 'monthly') return `Month: ${filterState.selectedMonth}`;
    if (filterState.filterMode === 'yearly') return `Year: ${filterState.selectedYear}`;
    return 'Click to view OP records';
  };

  const stats = [
    {
      label: 'Total OPs',
      value: opsCount.toString(),
      change: 'Outpatients',
      trend: 'up',
      detail: getDetailText(),
      icon: <ClipboardList />,
      tone: 'blue',
      onClick: () => onNavigate('OP Records', 'OP'),
    },
    {
      label: 'Total IPs',
      value: ipsCount.toString(),
      change: 'Inpatients',
      trend: 'up',
      detail: 'Admissions & surgery care',
      icon: <Bed />,
      tone: 'teal',
      onClick: () => onNavigate('OP Records', 'IP'),
    },
    {
      label: 'Total Emergency',
      value: emergencyCount.toString(),
      change: 'Urgent Care',
      trend: 'up',
      detail: 'Emergency room cases',
      icon: <Zap />,
      tone: 'red',
      onClick: () => onNavigate('OP Records', 'Emergency'),
    },
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Front Desk Outpatient Workspace</div>
          <h1>Good morning, {firstName}</h1>
          <p>Manage outpatient registrations, OP visits, and patient history at the front desk.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" onClick={() => onNavigate('OP Records')}>
            View All Records
          </button>
          <button className="primary-button" onClick={onAddOPRecord}>
            <Plus size={17} /> Add Record
          </button>
        </div>
      </div>

      {/* Date-wise, Monthly & Yearly Filter Bar */}
      <TimeFilterBar
        title="Filter Front Desk OP Analytics"
        onChange={(state) => setFilterState(state)}
      />

      {/* Clickable Stat Cards */}
      <section className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <div className="dashboard-grid">
        <section className="panel patient-panel">
          <PanelHeader 
            title="Front Desk OP Registrations Queue" 
            subtitle="Today's OP patient consultations" 
            action="View All Records" 
            onAction={() => onNavigate('OP Records')} 
          />
          <PatientTable compact onViewHistory={onViewPatientHistory} onNotify={notify} />
        </section>

        <section className="panel quick-panel">
          <PanelHeader title="Front Desk Quick Actions" subtitle="Outpatient management shortcuts" />
          <div className="quick-actions">
            <QuickAction
              icon={<Plus />}
              label="Add Record"
              color="blue"
              onClick={onAddOPRecord}
            />
            <QuickAction
              icon={<ClipboardList />}
              label="View All Records"
              color="sky"
              onClick={() => onNavigate('OP Records')}
            />
          </div>
        </section>
      </div>
    </>
  );
}

export default FrontDeskDashboard;
