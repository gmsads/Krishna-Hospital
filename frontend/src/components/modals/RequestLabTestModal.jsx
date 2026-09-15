import React, { useState } from 'react';
import { FlaskConical, X, Send, CheckCircle2, UserCheck } from 'lucide-react';
import { initialMasterLabServices, initialOPRecords, initialPatients } from '../data/initialData';

export function RequestLabTestModal({
  initialPatient = null,
  masterServices = initialMasterLabServices,
  opRecords = initialOPRecords,
  patients = initialPatients,
  doctorsList = [],
  staffList = [],
  doctorName = '',
  isLabAssistant = false,
  onSubmitOrder,
  onClose,
  notify,
  effectiveBranch = 'All',
  branchesList = [],
}) {
  const [labOrderNo, setLabOrderNo] = useState('LAB-0001');
  const [opNumber, setOpNumber] = useState(initialPatient?.opNumber || initialPatient?.id || initialPatient?.regNo || 'Reg-2026-0001');
  const [patientName, setPatientName] = useState(initialPatient?.name || initialPatient?.patient || '');
  const [phone, setPhone] = useState(initialPatient?.phone || '');
  const [availableDoctors, setAvailableDoctors] = useState(doctorsList);
  const [orderingDoctor, setOrderingDoctor] = useState(initialPatient?.doctor || doctorName || (doctorsList[0]?.name || ''));
  const [availableLabAssistants, setAvailableLabAssistants] = useState([]);
  const [assignedLabAssistant, setAssignedLabAssistant] = useState('');
  const [testName, setTestName] = useState(masterServices[0]?.name || 'Complete blood count');
  const [priority, setPriority] = useState('Routine');
  
  const initialBranchName = effectiveBranch === 'All'
    ? (branchesList[0]?.name || '')
    : effectiveBranch;
  const [selectedBranch, setSelectedBranch] = useState(initialBranchName);

  // Sync selectedBranch whenever effectiveBranch or branchesList changes
  React.useEffect(() => {
    if (effectiveBranch !== 'All') {
      setSelectedBranch(effectiveBranch);
    } else if (branchesList.length > 0 && !selectedBranch) {
      setSelectedBranch(branchesList[0].name);
    }
  }, [effectiveBranch, branchesList]);

  // Fetch branch-scoped next LAB-0001 ID, doctors, and lab assistants from backend
  React.useEffect(() => {
    const targetBranch = selectedBranch || (effectiveBranch === 'All' ? (branchesList[0]?.name || '') : effectiveBranch);
    const branchQuery = targetBranch ? `?branch=${encodeURIComponent(targetBranch)}` : '';

    fetch(`http://localhost:5000/api/v1/laboratory/next-labno${branchQuery}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.nextLabNo) {
          setLabOrderNo(data.data.nextLabNo);
        }
      })
      .catch((err) => console.warn('Could not fetch next labOrderNo from backend:', err.message));

    const token = localStorage.getItem('kh_auth_token');
    fetch(`http://localhost:5000/api/v1/doctors${branchQuery}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setAvailableDoctors(data.data);
          if (!orderingDoctor || orderingDoctor === 'Dr. Meera Nair') {
            setOrderingDoctor(initialPatient?.doctor || data.data[0].name);
          }
        }
      })
      .catch((err) => console.warn('Could not fetch doctors in RequestLabTestModal:', err.message));

    // Fetch staff members strictly for selected branch to populate Lab Assistant options
    fetch(`http://localhost:5000/api/v1/staff${branchQuery}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const normalizeStr = (str) => (str || '').toLowerCase().replace(/\s+/g, ' ').trim();
          const tb = normalizeStr(targetBranch);

          const labStaff = data.data.filter((s) => {
            const roleStr = normalizeStr(s.role);
            const isLabRole = roleStr.includes('lab') || roleStr.includes('patholog') || roleStr.includes('technician') || roleStr === 'lab assistant';
            if (!isLabRole) return false;
            if (!tb || tb === 'all') return true;

            const sb = normalizeStr(s.branch || s.branchCode);
            return sb === tb || sb.includes(tb) || tb.includes(sb);
          });

          setAvailableLabAssistants(labStaff);
          if (labStaff.length > 0) {
            setAssignedLabAssistant(labStaff[0].name);
          } else {
            setAssignedLabAssistant('');
          }
        }
      })
      .catch((err) => console.warn('Could not fetch lab staff in RequestLabTestModal:', err.message));
  }, [selectedBranch, effectiveBranch]);
  
  // Lab Fee & Upfront Payment State
  const initialRate = parseFloat(masterServices.find(s => s.name === (masterServices[0]?.name || 'Complete blood count'))?.rate) || 1200;
  const [testFee, setTestFee] = useState(initialRate.toString());
  const [amountPaidNow, setAmountPaidNow] = useState(initialRate.toString());
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [upiTxnId, setUpiTxnId] = useState('');

  // Default Status: Automatically 'Sample Collected' (Editable)
  const [status, setStatus] = useState('Sample Collected');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [autoFetchSuccess, setAutoFetchSuccess] = useState(false);

  const handleTestSelection = (selectedName) => {
    setTestName(selectedName);
    const foundSrv = masterServices.find(s => s.name === selectedName);
    if (foundSrv && foundSrv.rate) {
      const rateStr = parseFloat(foundSrv.rate).toString();
      setTestFee(rateStr);
      setAmountPaidNow(rateStr);
    }
  };

  // Auto-fetch patient & doctor details when OP Number is typed or changed
  const handleOpNumberChange = (val) => {
    setOpNumber(val);
    const query = val.trim().toLowerCase();
    if (!query) {
      setAutoFetchSuccess(false);
      return;
    }

    const matchedOp = opRecords.find(
      (r) => (r.id && r.id.toLowerCase() === query) || (r.regNo && r.regNo.toLowerCase() === query) || (r.patient && r.patient.toLowerCase().includes(query))
    );
    const matchedPat = patients.find(
      (p) => (p.id && p.id.toLowerCase() === query) || (p.name && p.name.toLowerCase().includes(query))
    );

    const found = matchedOp || matchedPat;
    if (found) {
      if (found.patient || found.name) setPatientName(found.patient || found.name);
      if (found.phone) setPhone(found.phone);
      if (found.doctor && found.doctor !== 'Unassigned') setOrderingDoctor(found.doctor);
      setAutoFetchSuccess(true);
    } else {
      setAutoFetchSuccess(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim() || !testName.trim()) {
      notify && notify('Please enter patient name and select a test name.');
      return;
    }

    const feeNum = parseFloat(testFee) || 0;
    const paidNum = parseFloat(amountPaidNow) || 0;
    const dueNum = Math.max(0, feeNum - paidNum);
    const payStatus = dueNum <= 0 ? 'Paid' : paidNum > 0 ? 'Partial' : 'Pending';

    const assignedBranch = effectiveBranch === 'All' ? selectedBranch : effectiveBranch;
    const matchingBranchObj = branchesList.find((b) => b.name === assignedBranch);
    const assignedCode = matchingBranchObj?.code || 'HQ-CENTRAL';

    const newOrder = {
      id: labOrderNo,
      labOrderNo,
      testId: labOrderNo,
      opNumber: opNumber.trim(),
      patient: patientName.trim(),
      patientName: patientName.trim(),
      phone: phone.trim(),
      doctor: orderingDoctor.trim() || doctorName,
      orderingDoctor: orderingDoctor.trim() || doctorName,
      test: testName.trim(),
      testName: testName.trim(),
      testFee: feeNum.toString(),
      amountPaidNow: paidNum.toString(),
      amountPaid: paidNum.toString(),
      amount: feeNum,
      paidAmount: paidNum,
      dueBalance: dueNum,
      paymentStatus: payStatus,
      paymentMethod,
      upiTxnId,
      status: status,
      priority,
      clinicalNotes: clinicalNotes.trim() ? clinicalNotes.trim() : 'Laboratory Order',
      notes: clinicalNotes.trim() ? clinicalNotes.trim() : 'Laboratory Order',
      branch: assignedBranch,
      branchCode: assignedCode,
      assignedLabAssistant: assignedLabAssistant.trim() || 'General Lab Staff',
      assignedStaff: assignedLabAssistant.trim() || 'General Lab Staff',
      createdBy: isLabAssistant ? 'Lab Assistant' : 'Doctor',
    };

    const token = localStorage.getItem('kh_auth_token');
    let savedObj = newOrder;

    try {
      const res = await fetch('http://localhost:5000/api/v1/laboratory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newOrder),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        savedObj = {
          ...data.data,
          id: data.data.labOrderNo || data.data.id || labOrderNo,
          patient: data.data.patientName || newOrder.patient,
          test: data.data.testName || newOrder.test,
        };
        notify && notify(`Lab Order ${savedObj.labOrderNo} saved to MongoDB!`);
      }
    } catch (err) {
      console.warn('Backend Lab Order registration offline fallback:', err.message);
    }

    onSubmitOrder(savedObj);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 45, 85, 0.45)', display: 'grid', placeItems: 'center', padding: '12px' }}>
      <div className="modal" style={{ background: '#fff', borderRadius: '10px', padding: '16px', maxWidth: '460px', width: '100%', boxShadow: '0 15px 35px rgba(16, 45, 85, 0.18)', border: '1px solid #dbe6f5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f8', paddingBottom: '8px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FlaskConical size={16} color="#1769d7" />
            <h3 style={{ margin: 0, fontSize: '13px', color: '#162d4a', fontWeight: '800' }}>
              {isLabAssistant ? 'Create Lab Test Order' : 'Prescribe Lab Test'}
            </h3>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close modal" style={{ padding: '2px' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px' }}>
          {/* OP / Registration Number Auto-Fetch Field */}
          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#1769d7' }}>Reg / OP Number *</span>
              {autoFetchSuccess && (
                <span style={{ fontSize: '10px', color: '#15803d', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <CheckCircle2 size={12} /> Auto-fetched details
                </span>
              )}
            </div>
            <input
              value={opNumber}
              onChange={(e) => handleOpNumberChange(e.target.value)}
              placeholder="OP-240618-086"
              required
              style={{ padding: '6px 9px', border: '1px solid #b8d5f7', borderRadius: '6px', fontSize: '11px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7' }}
            />
          </div>

          {/* Patient Name & Doctor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="field">
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#4a5e7a' }}>Patient Full Name *</span>
              <input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                placeholder="Patient name"
                style={{ padding: '6px 9px', border: '1px solid #dde7f1', borderRadius: '6px', fontSize: '11px' }}
              />
            </div>

            <div className="field">
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#4a5e7a' }}>Ordering Doctor *</span>
              <select
                value={orderingDoctor}
                onChange={(e) => setOrderingDoctor(e.target.value)}
                required
                style={{ padding: '6px 9px', border: '1px solid #dde7f1', borderRadius: '6px', fontSize: '11px', background: '#fff', fontWeight: '700' }}
              >
                {availableDoctors.length > 0 ? (
                  availableDoctors.map((doc) => (
                    <option key={doc.id || doc._id || doc.name} value={doc.name}>
                      {doc.name} ({doc.department || 'Specialist'})
                    </option>
                  ))
                ) : (
                  <option value={orderingDoctor || 'Dr. Unassigned'}>{orderingDoctor || 'Dr. Unassigned'}</option>
                )}
              </select>
            </div>
          </div>

          {/* Hospital Branch Campus Selection */}
          <div className="field">
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#1769d7' }}>Hospital Branch Campus *</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              required
              style={{ padding: '6px 9px', border: '1px solid #b8d5f7', borderRadius: '6px', fontSize: '11px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7' }}
            >
              {branchesList.length > 0 ? (
                branchesList.map((b) => (
                  <option key={b.id || b.name} value={b.name}>
                    {b.name} ({b.code || 'BRANCH'})
                  </option>
                ))
              ) : (
                <option value={selectedBranch}>{selectedBranch}</option>
              )}
            </select>
          </div>

          {/* Assign to Branch Lab Assistant Selection */}
          <div className="field">
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#15803d' }}>Assign to Branch Lab Assistant *</span>
            <select
              value={assignedLabAssistant}
              onChange={(e) => setAssignedLabAssistant(e.target.value)}
              style={{ padding: '6px 9px', border: '1px solid #86efac', borderRadius: '6px', fontSize: '11px', background: '#f0fdf4', fontWeight: '700', color: '#15803d' }}
            >
              {availableLabAssistants.length > 0 ? (
                availableLabAssistants.map((stf) => (
                  <option key={stf.id || stf._id || stf.empId || stf.name} value={stf.name}>
                    👨‍🔬 {stf.name} ({stf.role || 'Lab Assistant'})
                  </option>
                ))
              ) : (
                <option value="">No lab assistants registered for {selectedBranch || 'this branch'}</option>
              )}
            </select>
          </div>

          {/* Select Lab Test Name */}
          <div className="field">
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#1769d7' }}>Lab Test Category *</span>
            <select
              value={testName}
              onChange={(e) => handleTestSelection(e.target.value)}
              required
              style={{ padding: '6px 9px', border: '1px solid #b8d5f7', borderRadius: '6px', fontSize: '11px', background: '#fff', fontWeight: '700', color: '#1769d7' }}
            >
              {masterServices.map((srv) => (
                <option key={srv.id || srv.name} value={srv.name}>
                  {srv.name} (Rate: ₹ {srv.rate})
                </option>
              ))}
            </select>
          </div>

          {/* Test Fee & Upfront Payment Compact Box */}
          <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'grid', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="field">
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#dc2626' }}>Total Fee (₹) *</span>
                <input
                  type="number"
                  value={testFee}
                  onChange={(e) => {
                    setTestFee(e.target.value);
                    setAmountPaidNow(e.target.value);
                  }}
                  required
                  style={{ padding: '6px 8px', border: '1px solid #fca5a5', borderRadius: '5px', fontSize: '11px', fontWeight: '800', color: '#dc2626', background: '#fef2f2' }}
                />
              </div>

              <div className="field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#15803d' }}>Paying Now (₹)</span>
                  <button
                    type="button"
                    onClick={() => setAmountPaidNow(testFee)}
                    style={{ fontSize: '9px', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '1px 5px', borderRadius: '3px', cursor: 'pointer', fontWeight: '800' }}
                  >
                    ⚡ Full
                  </button>
                </div>
                <input
                  type="number"
                  value={amountPaidNow}
                  onChange={(e) => setAmountPaidNow(e.target.value)}
                  style={{ padding: '6px 8px', border: '1px solid #86efac', borderRadius: '5px', fontSize: '11px', fontWeight: '800', color: '#15803d', background: '#f0fdf4' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: paymentMethod === 'UPI / Online' ? '1fr 1fr' : '1fr', gap: '8px' }}>
              <div className="field">
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#475569' }}>Payment Mode *</span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '11px' }}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI / Online">UPI / QR Payment</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                  <option value="Pay Later (Pending)">Pay Later (Post-Pay)</option>
                </select>
              </div>

              {paymentMethod === 'UPI / Online' && (
                <div className="field">
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#0369a1' }}>UPI Ref / Txn ID</span>
                  <input
                    value={upiTxnId}
                    onChange={(e) => setUpiTxnId(e.target.value)}
                    placeholder="e.g. UPI-94029104"
                    style={{ padding: '5px 8px', border: '1px solid #93c5fd', borderRadius: '5px', fontSize: '11px' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Status & Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="field">
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#15803d' }}>Initial Sample Status *</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ padding: '6px 8px', border: '1px solid #bbf7d0', borderRadius: '5px', fontSize: '11px', background: '#f0fdf4', fontWeight: '700', color: '#15803d' }}
              >
                <option value="Sample collected">Sample collected</option>
                <option value="Processing">Processing</option>
                <option value="Result ready">Result ready</option>
                <option value="Awaiting sample">Awaiting sample</option>
              </select>
            </div>

            <div className="field">
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#4a5e7a' }}>Urgency *</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{ padding: '6px 8px', border: '1px solid #dde7f1', borderRadius: '5px', fontSize: '11px', background: '#fff' }}
              >
                <option value="Routine">Routine (Standard)</option>
                <option value="Urgent / Stat">Urgent / Stat</option>
              </select>
            </div>
          </div>

          {/* Clinical Indications & Notes */}
          <div className="field">
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#4a5e7a' }}>Notes (Optional)</span>
            <textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Clinical indications or sample notes..."
              rows={1}
              style={{ padding: '5px 8px', border: '1px solid #dde7f1', borderRadius: '5px', fontSize: '11px', fontFamily: 'inherit' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button type="button" className="secondary-button" onClick={onClose} style={{ padding: '5px 12px', fontSize: '11px' }}>
              Cancel
            </button>
            <button type="submit" className="primary-button" style={{ gap: '5px', padding: '5px 14px', fontSize: '11px' }}>
              <Send size={13} /> Save Test Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RequestLabTestModal;
