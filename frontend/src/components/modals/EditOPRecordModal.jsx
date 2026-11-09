import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, UserCheck, Stethoscope, Activity, CreditCard, AlertCircle, XCircle } from 'lucide-react';

export function EditOPRecordModal({ record, onClose, onSave, onNotify }) {
  if (!record) return null;

  // Patient Info
  const [patientName, setPatientName] = useState(record.patient || record.patientName || '');
  const [phone, setPhone] = useState(record.phone || '');
  const [age, setAge] = useState((record.age || '').replace(/[^0-9]/g, '') || '');
  const [gender, setGender] = useState(record.gender || 'Male');
  const [bloodGroup, setBloodGroup] = useState(record.bloodGroup || record.vitals?.bloodGroup || '');
  const [address, setAddress] = useState(record.address || '');
  const [dob, setDob] = useState(record.dob || '');

  // Registration Date & Time
  const initialRegDate = record.regDate || record.date || new Date().toISOString().split('T')[0];
  const initialRegTime = record.regTime || record.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const [regDate, setRegDate] = useState(initialRegDate);
  const [regTime, setRegTime] = useState(initialRegTime);

  // Clinical & Doctor Info
  const [recordType, setRecordType] = useState(record.recordType || 'OP');
  const [doctor, setDoctor] = useState(record.doctor || '');
  const [department, setDepartment] = useState(record.department || 'General medicine');
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [notes, setNotes] = useState(record.notes || record.complaints || record.clinicalNotes || '');

  // Cancellation State
  const initialCancelled = record.paymentStatus === 'Cancelled' || record.isCancelled || record.status === 'Cancelled';
  const [isCancelled, setIsCancelled] = useState(initialCancelled);

  // Vitals
  const vitalsObj = record.vitals || {};
  const [bp, setBp] = useState(vitalsObj.bp || record.bp || '120/80');
  const [pr, setPr] = useState(vitalsObj.pr || record.pr || '72');
  const [temp, setTemp] = useState(vitalsObj.temp || record.temp || '98.6');
  const [weight, setWeight] = useState(vitalsObj.weight || record.weight || '65');
  const [height, setHeight] = useState(vitalsObj.height || record.height || '170');
  const [spo2, setSpo2] = useState(vitalsObj.spo2 || record.spo2 || '98%');

  // Charges & Billing
  const rawCharges = record.grossCharges || record.charges || (parseFloat(String(record.amount || '300').replace(/[^0-9.]/g, '')) || 300);
  const [charges, setCharges] = useState(rawCharges.toString());
  const [discount, setDiscount] = useState((record.discount || 0).toString());
  const [paymentStatus, setPaymentStatus] = useState(record.paymentStatus || 'Paid');
  const [paymentMethod, setPaymentMethod] = useState(record.paymentMethod || 'Cash');

  // Fetch registered hospital doctors from database
  useEffect(() => {
    const token = localStorage.getItem('kh_auth_token');
    const branchQuery = record.branch && record.branch !== 'All' ? `?branch=${encodeURIComponent(record.branch)}` : '';
    fetch(`/api/v1/doctors${branchQuery}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setAvailableDoctors(data.data);
        } else {
          // Fallback to all doctors
          fetch('/api/v1/doctors', {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          })
            .then((r) => r.json())
            .then((allData) => {
              if (allData.success && Array.isArray(allData.data)) {
                setAvailableDoctors(allData.data);
              }
            })
            .catch(() => {});
        }
      })
      .catch((err) => console.warn('Could not fetch doctors in EditOPRecordModal:', err.message));
  }, [record.branch]);

  const handleDoctorChange = (docName) => {
    setDoctor(docName);
    const matched = availableDoctors.find((d) => d.name === docName);
    if (matched && matched.department) {
      setDepartment(matched.department);
    }
  };

  const handleToggleCancel = () => {
    const nextVal = !isCancelled;
    setIsCancelled(nextVal);
    if (nextVal) {
      setPaymentStatus('Cancelled');
    } else {
      setPaymentStatus('Paid');
    }
  };

  const handlePaymentStatusChange = (val) => {
    setPaymentStatus(val);
    if (val === 'Cancelled') {
      setIsCancelled(true);
    } else {
      setIsCancelled(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      onNotify && onNotify('Patient name is required.');
      return;
    }

    const grossNum = parseFloat(String(charges).replace(/[^0-9.]/g, '')) || 0;
    const discNum = parseFloat(String(discount).replace(/[^0-9.]/g, '')) || 0;
    const netNum = Math.max(0, grossNum - discNum);

    const isRecordCancelled = isCancelled || paymentStatus === 'Cancelled';
    const finalPaymentStatus = isRecordCancelled ? 'Cancelled' : paymentStatus;
    const finalPaid = isRecordCancelled ? 0 : paymentStatus === 'Paid' ? netNum : paymentStatus === 'Payment Due' ? 0 : Math.min(netNum, parseFloat(record.paidAmount || 0));
    const finalDue = isRecordCancelled ? 0 : Math.max(0, netNum - finalPaid);

    const updatedRecord = {
      ...record,
      patient: patientName.trim(),
      patientName: patientName.trim(),
      phone: phone.trim(),
      age: age ? `${age} Yrs` : record.age,
      gender,
      bloodGroup,
      dob,
      address: address.trim(),
      regDate: regDate,
      date: regDate,
      regTime: regTime,
      time: regTime,
      recordType,
      doctor: doctor.trim(),
      department: department.trim(),
      notes: notes.trim(),
      clinicalNotes: notes.trim(),
      charges: charges,
      grossCharges: grossNum,
      discount: discNum,
      netAmount: isRecordCancelled ? 0 : netNum,
      amount: isRecordCancelled ? '₹ 0 (Cancelled)' : `₹ ${netNum}`,
      totalAmount: isRecordCancelled ? 0 : netNum,
      paidAmount: finalPaid,
      amountPaid: String(finalPaid),
      dueBalance: finalDue,
      paymentStatus: finalPaymentStatus,
      paymentMethod: isRecordCancelled ? 'Cancelled (Void)' : paymentMethod,
      isCancelled: isRecordCancelled,
      status: isRecordCancelled ? 'Cancelled' : (record.status || 'Active'),
      vitals: {
        ...vitalsObj,
        bp,
        pr,
        temp,
        weight,
        height,
        spo2,
        bloodGroup,
      },
      bp,
      pr,
      spo2,
    };

    onSave && onSave(updatedRecord);
    if (isRecordCancelled) {
      onNotify && onNotify(`❌ OP Record for ${patientName} marked as CANCELLED (removed from Revenue/Finance)!`);
    } else {
      onNotify && onNotify(`✓ OP Record for ${patientName} updated successfully!`);
    }
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 150,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        className="modal"
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #cbd5e1',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#eff6ff',
                display: 'grid',
                placeItems: 'center',
                border: '1px solid #bfdbfe',
              }}
            >
              <UserCheck size={20} color="#2563eb" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                Edit OP Registration Record
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                Reg No: <strong style={{ color: '#2563eb' }}>{record.regNo || record.id}</strong> | Branch: {record.branch || 'Central Campus'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: 'none',
              background: '#f1f5f9',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} color="#64748b" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Section 1: Patient Information */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={15} color="#2563eb" /> Patient Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Patient Full Name *
                  </span>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required
                    placeholder="e.g. John Doe"
                    style={{ padding: '8px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Phone Number *
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+91 9876543210"
                    style={{ padding: '8px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '10px' }}>
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Age (Years)
                  </span>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="32"
                    style={{ padding: '8px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Gender
                  </span>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={{ padding: '8px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box', background: '#fff' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Blood Group
                  </span>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    style={{ padding: '8px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box', background: '#fff' }}
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Address / City
                </span>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, Area, City"
                  style={{ padding: '8px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Registration Date *
                  </span>
                  <input
                    type="date"
                    value={regDate}
                    onChange={(e) => setRegDate(e.target.value)}
                    required
                    style={{ padding: '8px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Registration Time
                  </span>
                  <input
                    type="text"
                    value={regTime}
                    onChange={(e) => setRegTime(e.target.value)}
                    placeholder="10:30 AM"
                    style={{ padding: '8px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Clinical & Doctor Assignment */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Stethoscope size={15} color="#059669" /> Doctor & Department Assignment
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Consulting Doctor *
                  </span>
                  <select
                    value={doctor}
                    onChange={(e) => handleDoctorChange(e.target.value)}
                    required
                    style={{ padding: '8px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box', background: '#fff', fontWeight: '700', color: '#0f172a' }}
                  >
                    {doctor && !availableDoctors.some((d) => d.name === doctor) && (
                      <option value={doctor}>{doctor}</option>
                    )}
                    {availableDoctors.map((doc) => (
                      <option key={doc._id || doc.id || doc.name} value={doc.name}>
                        {doc.name} {doc.specialization ? `(${doc.specialization})` : ''}
                      </option>
                    ))}
                    {availableDoctors.length === 0 && (
                      <option value={doctor || 'Dr. Meera Nair'}>{doctor || 'Dr. Meera Nair'}</option>
                    )}
                  </select>
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Department
                  </span>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Cardiology"
                    style={{ padding: '8px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Visit Type / Service
                  </span>
                  <select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value)}
                    style={{ padding: '8px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box', background: '#fff', fontWeight: '600' }}
                  >
                    <option value="OP">General OP</option>
                    <option value="Review / Follow-up">Review / Follow-up</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Special Consultation">Special Consultation</option>
                    <option value="IP">In-Patient (IP)</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Treatment">Treatment</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Clinical Vitals */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={15} color="#d97706" /> Patient Vitals
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                <div className="field">
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '3px' }}>BP</span>
                  <input
                    type="text"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    placeholder="120/80"
                    style={{ padding: '7px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
                  />
                </div>
                <div className="field">
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '3px' }}>Pulse</span>
                  <input
                    type="text"
                    value={pr}
                    onChange={(e) => setPr(e.target.value)}
                    placeholder="72"
                    style={{ padding: '7px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
                  />
                </div>
                <div className="field">
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '3px' }}>Temp (°F)</span>
                  <input
                    type="text"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    placeholder="98.6"
                    style={{ padding: '7px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
                  />
                </div>
                <div className="field">
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '3px' }}>Weight (kg)</span>
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="65"
                    style={{ padding: '7px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
                  />
                </div>
                <div className="field">
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '3px' }}>Height (cm)</span>
                  <input
                    type="text"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="170"
                    style={{ padding: '7px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
                  />
                </div>
                <div className="field">
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '3px' }}>SpO2 (%)</span>
                  <input
                    type="text"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    placeholder="98%"
                    style={{ padding: '7px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Charges & Payment Status */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={15} color="#7c3aed" /> Charges & Payment Status
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1fr', gap: '12px' }}>
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Fee / Charges (₹)
                  </span>
                  <input
                    type="number"
                    value={charges}
                    onChange={(e) => setCharges(e.target.value)}
                    placeholder="300"
                    style={{ padding: '8px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box', fontWeight: '700', color: '#0f172a' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Discount (₹)
                  </span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0"
                    style={{ padding: '8px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Payment Status
                  </span>
                  <select
                    value={paymentStatus}
                    onChange={(e) => handlePaymentStatusChange(e.target.value)}
                    style={{ padding: '8px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box', background: '#fff', fontWeight: '700' }}
                  >
                    <option value="Paid">✓ Paid</option>
                    <option value="Payment Due">⏳ Payment Due</option>
                    <option value="Partial">⚡ Partial</option>
                    <option value="Pay Later (Pending)">Pay Later (Pending)</option>
                    <option value="Cancelled">❌ Cancelled (Void OP)</option>
                  </select>
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Payment Method
                  </span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ padding: '8px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box', background: '#fff' }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Free">Free / Complimentary</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 5: Clinical Notes */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                Chief Complaints & Clinical Notes (Optional)
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Enter patient symptoms or consultation notes..."
                style={{ padding: '8px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            {/* Cancel OP Consultation Option */}
            <div
              style={{
                borderTop: '1px solid #fee2e2',
                paddingTop: '12px',
                background: isCancelled ? '#fef2f2' : '#f8fafc',
                padding: '12px 14px',
                borderRadius: '8px',
                border: isCancelled ? '1.5px solid #fca5a5' : '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <strong style={{ fontSize: '12px', color: isCancelled ? '#dc2626' : '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <XCircle size={15} color={isCancelled ? '#dc2626' : '#64748b'} />
                  {isCancelled ? '❌ OP Consultation is CANCELLED' : 'Cancel OP Consultation'}
                </strong>
                <span style={{ fontSize: '11px', color: isCancelled ? '#991b1b' : '#64748b', display: 'block', marginTop: '2px' }}>
                  {isCancelled
                    ? 'This OP is cancelled: it will show in OP list as Cancelled and its amount is removed from Revenue & Finance.'
                    : 'If the patient leaves or cancels, mark as cancelled. It stays in OP records but is removed from Finance.'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleCancel}
                style={{
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: '800',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: isCancelled ? '1px solid #16a34a' : '1px solid #dc2626',
                  background: isCancelled ? '#f0fdf4' : '#fee2e2',
                  color: isCancelled ? '#15803d' : '#dc2626',
                }}
              >
                {isCancelled ? '✓ Restore OP' : '❌ Cancel OP'}
              </button>
            </div>

          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '14px 22px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              background: '#f8fafc',
            }}
          >
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '700' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              style={{
                padding: '8px 20px',
                fontSize: '12px',
                fontWeight: '800',
                gap: '6px',
                background: '#2563eb',
                borderColor: '#1d4ed8',
              }}
            >
              <CheckCircle2 size={16} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditOPRecordModal;
