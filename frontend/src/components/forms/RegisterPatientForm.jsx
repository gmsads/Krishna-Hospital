import React, { useState } from 'react';
import { Plus, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { initialPatients } from '../data/initialData';

export function RegisterPatientForm({ patientsList = initialPatients, onSave, onCancel, notify }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [matchedPatient, setMatchedPatient] = useState(null);

  const handlePhoneChange = (val) => {
    setPhone(val);
    const query = val.replace(/\D/g, '');
    if (query.length >= 3) {
      const found = patientsList.find((p) => {
        const pClean = p.phone ? p.phone.replace(/\D/g, '') : '';
        return pClean && pClean.includes(query);
      });
      if (found) {
        setMatchedPatient(found);
      } else {
        setMatchedPatient(null);
      }
    } else {
      setMatchedPatient(null);
    }
  };

  const handleAutoFillMatchedPatient = () => {
    if (matchedPatient) {
      setName(matchedPatient.name || '');
      setAge(matchedPatient.age ? matchedPatient.age.toString() : '');
      setGender(matchedPatient.gender || 'Female');
      setPhone(matchedPatient.phone || phone);
      notify && notify(`✓ Auto-filled existing patient profile for ${matchedPatient.name} (${matchedPatient.id})`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !age.trim()) {
      notify && notify('Please fill in patient name, age, and phone number.');
      return;
    }

    onSave({
      id: `KH-${1050 + Math.floor(Math.random() * 90)}`,
      name: name.trim(),
      age: Number(age),
      gender,
      phone: phone.trim(),
      lastVisit: 'Today, just now',
      status: 'New',
      doctor: 'Unassigned',
    });
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Patient Registration Form</div>
          <h1>Register New Patient</h1>
          <p>Create a permanent patient profile to start consultations and OP registration.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Back to Patients List
          </button>
        </div>
      </div>

      <section className="panel full-panel" style={{ maxWidth: '840px', width: '100%' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          <div className="field">
            <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Full Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ananya Sharma"
              required
              autoFocus
              style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', background: '#fff' }}
            />
          </div>

          <div className="responsive-grid-2">
            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Age</span>
              <input
                type="number"
                min="0"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age"
                required
                style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', background: '#fff' }}
              />
            </div>

            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Gender</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', background: '#fff' }}
              >
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* EXISTING PATIENT MATCHED BANNER ALERT */}
          {matchedPatient && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCheck size={24} color="#15803d" />
                <div>
                  <strong style={{ fontSize: '13px', color: '#15803d', display: 'block' }}>
                    Existing Patient Found: {matchedPatient.name} ({matchedPatient.id})
                  </strong>
                  <span style={{ fontSize: '11px', color: '#166534' }}>
                    Age: {matchedPatient.age} Yrs · Gender: {matchedPatient.gender} · Phone: {matchedPatient.phone} · Branch: {matchedPatient.branch || 'Central Campus'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={handleAutoFillMatchedPatient}
                style={{ fontSize: '11px', padding: '6px 12px', background: '#15803d', color: '#fff', border: 'none', fontWeight: '700' }}
              >
                Auto-Fill Details
              </button>
            </div>
          )}

          <div className="field">
            <span style={{ color: '#1769d7', fontSize: '12px', fontWeight: '700' }}>Phone Number (Type to check existing patient) *</span>
            <input
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="+91 98470 00000"
              required
              style={{ padding: '12px 14px', border: '1px solid #b8d5f7', borderRadius: '9px', fontSize: '13px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button type="submit" className="primary-button" style={{ padding: '12px 24px', flex: '1 1 auto', justifyContent: 'center' }}>
              <Plus size={17} /> Register Patient
            </button>
            <button type="button" className="secondary-button" onClick={onCancel} style={{ padding: '12px 20px', flex: '1 1 auto', justifyContent: 'center' }}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

export default RegisterPatientForm;
