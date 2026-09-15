import React from 'react';
import { History, Eye, FlaskConical } from 'lucide-react';
import { initialPatients } from '../data/initialData';

export function PatientTable({ compact = false, patients = initialPatients, onViewHistory, onRequestLabTest, onNotify }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Patient ID</th>
            <th>Last visit</th>
            <th>Assigned Doctor</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.slice(0, compact ? 5 : patients.length).map((patient) => {
            const displayName = patient.name || patient.patient || 'Patient';
            const displayId = patient.opNumber || patient.id || patient.regNo || 'OPD-0001';
            const displayVisit = patient.regDate || patient.lastVisit || 'Today';

            return (
              <tr key={patient._id || patient.id || displayId}>
                <td>
                  <div className="patient-cell">
                    <div className="avatar avatar-soft">
                      {displayName.split(' ').map((word) => word[0]).join('')}
                    </div>
                    <div>
                      <strong>{displayName}</strong>
                      <span>{patient.age || '35'} yrs · {patient.gender || 'Male'}</span>
                    </div>
                  </div>
                </td>
                <td><span className="muted-code">{displayId}</span></td>
                <td>{displayVisit}</td>
                <td><strong style={{ color: '#1769d7' }}>{patient.doctor || 'Unassigned'}</strong></td>
                <td>
                  <span className={`status ${patient.status === 'New' ? 'status-new' : 'status-returning'}`}>
                    <i />
                    {patient.status || 'Active'}
                  </span>
                </td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                  {/* Add Lab Button for Doctors / Admins */}
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ padding: '4px 8px', fontSize: '11px', gap: '4px', background: '#f4f8fe', borderColor: '#b8d5f7', color: '#1769d7', fontWeight: '700' }}
                    onClick={() => onRequestLabTest && onRequestLabTest(patient)}
                    title="Add Lab Test Order for this Patient"
                  >
                    <FlaskConical size={13} /> Add Lab
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    style={{ padding: '4px 8px', fontSize: '11px', gap: '4px' }}
                    onClick={() => onViewHistory && onViewHistory(patient)}
                    title="View complete multi-visit history"
                  >
                    <History size={13} color="#1769d7" /> View History
                  </button>
                  
                  <button className="secondary-button" style={{ padding: '4px 6px' }} onClick={() => onViewHistory && onViewHistory(patient)} title="Quick view patient record">
                    <Eye size={15} color="#1769d7" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
      </table>
    </div>
  );
}

export default PatientTable;
