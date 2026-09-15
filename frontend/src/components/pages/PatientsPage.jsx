import React from 'react';
import { Activity, CalendarDays, ChevronDown, Plus, UsersRound } from 'lucide-react';
import { PatientTable } from '../common/PatientTable';
import { initialPatients } from '../data/initialData';

export function PatientsPage({ patients = initialPatients, query = '', onAdd, onViewHistory, onNotify }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Patient management</div>
          <h1>Patients</h1>
          <p>Register, search, and view complete multi-visit history for every patient.</p>
        </div>
        <button className="primary-button" onClick={onAdd}>
          <Plus size={17} /> Register patient
        </button>
      </div>
      
      <div className="summary-strip">
        <div>
          <UsersRound size={18} />
          <span>Total patients</span>
          <strong>{patients.length}</strong>
        </div>
        <div>
          <Activity size={18} />
          <span>New this month</span>
          <strong>184</strong>
        </div>
        <div>
          <CalendarDays size={18} />
          <span>Visits today</span>
          <strong>86</strong>
        </div>
      </div>
      
      <section className="panel full-panel">
        <div className="list-toolbar">
          <div>
            <h2>All patients</h2>
            <p>{patients.length} records {query && `matching "${query}"`}</p>
          </div>
          <div className="filter-actions">
            <button className="secondary-button">All patients <ChevronDown size={14} /></button>
            <button className="secondary-button">Export list</button>
          </div>
        </div>
        <PatientTable patients={patients} onViewHistory={onViewHistory} onNotify={onNotify} />
      </section>
    </>
  );
}

export default PatientsPage;
