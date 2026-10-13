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
  const [testName, setTestName] = useState(masterServices[0]?.name || '');
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

    fetch(`/api/v1/laboratory/next-labno${branchQuery}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.nextLabNo) {
          setLabOrderNo(data.data.nextLabNo);
        }
      })
      .catch((err) => console.warn('Could not fetch next labOrderNo from backend:', err.message));

    const token = localStorage.getItem('kh_auth_token');
    fetch(`/api/v1/doctors${branchQuery}`, {
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
    fetch(`/api/v1/staff${branchQuery}`, {
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
  const initialRate = parseFloat(masterServices.find(s => s.name === (masterServices[0]?.name || ''))?.rate) || 0;
  const [testFee, setTestFee] = useState(initialRate.toString());

  // Auto-sync test name and fee when masterServices load
  React.useEffect(() => {
    if (!testName && masterServices.length > 0) {
      setTestName(masterServices[0].name);
      const r = parseFloat(masterServices[0].rate) || 0;
      setTestFee(r.toString());
    }
  }, [masterServices, testName]);

  // MULTI-SELECT PAYMENT METHODS & SPLIT AMOUNT COLLECTION (Exact Match to OP Record)
  const [selectedMethods, setSelectedMethods] = useState({
    Cash: true,
    UPI: false,
    Card: false,
    Cheque: false,
    'Bank Transfer': false,
    Free: false,
    Others: false,
    'Pay Later': false,
  });

  const [splitAmounts, setSplitAmounts] = useState({
    Cash: initialRate.toString(),
    UPI: '0',
    Card: '0',
    Cheque: '0',
    'Bank Transfer': '0',
    Free: '0',
    Others: '0',
  });

  const upiHandles = ['krishnahospital@okicici', 'krishnalab@ybl', 'krishnaglobal@hdfcbank'];
  const [selectedUpiHandle, setSelectedUpiHandle] = useState('krishnalab@ybl');
  const [upiTxnId, setUpiTxnId] = useState('');

  const handleFeeChargesChange = (val) => {
    setTestFee(val);
    const newGross = parseFloat(String(val || '0').replace(/[^0-9.]/g, '')) || 0;
    const activeKeys = Object.keys(selectedMethods).filter((k) => selectedMethods[k] && k !== 'Pay Later');
    if (activeKeys.length === 1) {
      setSplitAmounts((prev) => ({
        ...prev,
        [activeKeys[0]]: newGross.toString(),
      }));
    }
  };

  const togglePaymentMethod = (modeKey) => {
    setSelectedMethods((prev) => {
      if (modeKey === 'Free') {
        const isCurrentlySelected = prev['Free'];
        if (!isCurrentlySelected) {
          setSplitAmounts((prevSplits) => ({
            ...prevSplits,
            Free: testFee,
          }));
          return {
            Cash: false,
            UPI: false,
            Card: false,
            Cheque: false,
            'Bank Transfer': false,
            Free: true,
            Others: false,
            'Pay Later': false,
          };
        } else {
          return {
            ...prev,
            Cash: true,
            Free: false,
          };
        }
      } else if (modeKey === 'Pay Later') {
        const isCurrentlySelected = prev['Pay Later'];
        if (!isCurrentlySelected) {
          return {
            Cash: false,
            UPI: false,
            Card: false,
            Cheque: false,
            'Bank Transfer': false,
            Free: false,
            Others: false,
            'Pay Later': true,
          };
        } else {
          return {
            ...prev,
            Cash: true,
            'Pay Later': false,
          };
        }
      } else {
        const nextState = { ...prev, [modeKey]: !prev[modeKey], 'Pay Later': false, Free: false };
        const anyChecked = Object.keys(nextState).some((k) => nextState[k]);
        if (!anyChecked) {
          nextState.Cash = true;
        }
        if (nextState[modeKey] && (!splitAmounts[modeKey] || splitAmounts[modeKey] === '0')) {
          setSplitAmounts((prevSplits) => ({
            ...prevSplits,
            [modeKey]: modeKey === 'Cash' && !prev[modeKey] ? testFee : '0',
          }));
        }
        return nextState;
      }
    });
  };

  const handleSplitAmountChange = (modeKey, val) => {
    setSplitAmounts((prev) => ({
      ...prev,
      [modeKey]: val,
    }));
  };

  const handleCollectFullFee = () => {
    const feeNum = parseFloat(String(testFee || '0').replace(/[^0-9.]/g, '')) || 0;
    const activeKeys = Object.keys(selectedMethods).filter((k) => selectedMethods[k] && k !== 'Pay Later');
    if (activeKeys.length === 1) {
      setSplitAmounts((prev) => ({ ...prev, [activeKeys[0]]: feeNum.toString() }));
    } else if (activeKeys.length > 1) {
      const newSplits = { ...splitAmounts };
      newSplits[activeKeys[0]] = feeNum.toString();
      activeKeys.slice(1).forEach((k) => {
        newSplits[k] = '0';
      });
      setSplitAmounts(newSplits);
    }
  };

  const activeModes = Object.keys(selectedMethods).filter((k) => selectedMethods[k] && k !== 'Pay Later');

  const calculatedTotalCollected = selectedMethods['Pay Later']
    ? 0
    : selectedMethods['Free']
    ? (parseFloat(String(testFee || '0').replace(/[^0-9.]/g, '')) || 0)
    : activeModes.reduce((sum, key) => {
        const val = parseFloat(String(splitAmounts[key] || '0').replace(/[^0-9.]/g, '')) || 0;
        return sum + val;
      }, 0);

  const paymentSummaryParts = activeModes
    .map((key) => {
      const amt = parseFloat(String(splitAmounts[key] || '0').replace(/[^0-9.]/g, '')) || 0;
      return amt > 0 ? `${key} (₹${amt})` : null;
    })
    .filter(Boolean);

  const paymentSummaryStr = paymentSummaryParts.join(' + ');

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
      const activeKeys = Object.keys(selectedMethods).filter((k) => selectedMethods[k] && k !== 'Pay Later');
      if (activeKeys.length === 1) {
        setSplitAmounts((prev) => ({
          ...prev,
          [activeKeys[0]]: rateStr,
        }));
      }
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

    const feeNum = parseFloat(String(testFee || '0').replace(/[^0-9.]/g, '')) || 0;
    const isFree = !!selectedMethods['Free'];
    const isPayLater = !isFree && selectedMethods['Pay Later'];
    const paidNum = isFree ? feeNum : (isPayLater ? 0 : calculatedTotalCollected);
    const dueNum = isFree ? 0 : Math.max(0, feeNum - paidNum);
    const payStatus = isFree ? 'Paid' : (isPayLater ? 'Pay Later (Pending)' : dueNum <= 0 ? 'Paid' : paidNum > 0 ? 'Partial' : 'Pay Later (Pending)');
    const savedPaymentMethod = isFree ? 'Free / Complimentary' : (isPayLater ? 'Pay Later (Post-Pay)' : (paymentSummaryStr || activeModes.join(', ') || 'Cash'));

    const splitBreakdown = {};
    activeModes.forEach((k) => {
      splitBreakdown[k] = parseFloat(String(splitAmounts[k] || '0').replace(/[^0-9.]/g, '')) || 0;
    });

    const now = new Date();
    const initialHistoryEntry = paidNum > 0 ? [{
      date: now.toISOString(),
      dateStr: now.toISOString().split('T')[0],
      timeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amount: paidNum,
      method: savedPaymentMethod,
      breakdown: splitBreakdown,
      type: 'Initial Lab Order Payment',
    }] : [];

    const assignedBranch = effectiveBranch === 'All' ? selectedBranch : effectiveBranch;
    const matchingBranchObj = branchesList.find((b) => b.name === assignedBranch);
    const assignedCode = matchingBranchObj?.code || 'HQ-CENTRAL';

    const foundSrv = masterServices.find((s) => s.name === testName.trim());
    const defaultTestRows = (foundSrv && Array.isArray(foundSrv.subCategories) && foundSrv.subCategories.length > 0)
      ? foundSrv.subCategories.map((sub, idx) => ({ id: idx + 1, name: sub.name, result: '', normalRange: sub.normalRange || 'Standard Reference' }))
      : [];

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
      paymentMethod: savedPaymentMethod,
      paymentBreakdown: splitBreakdown,
      paymentHistory: initialHistoryEntry,
      upiTxnId: selectedMethods.UPI ? upiTxnId : '',
      upiHandle: selectedMethods.UPI ? selectedUpiHandle : '',
      splitBreakdown,
      status: status,
      priority,
      clinicalNotes: clinicalNotes.trim() ? clinicalNotes.trim() : 'Laboratory Order',
      notes: clinicalNotes.trim() ? clinicalNotes.trim() : 'Laboratory Order',
      branch: assignedBranch,
      branchCode: assignedCode,
      testRows: defaultTestRows,
      assignedLabAssistant: assignedLabAssistant.trim() || 'General Lab Staff',
      assignedStaff: assignedLabAssistant.trim() || 'General Lab Staff',
      createdBy: isLabAssistant ? 'Lab Assistant' : 'Doctor',
    };

    const token = localStorage.getItem('kh_auth_token');
    let savedObj = newOrder;

    try {
      const res = await fetch('/api/v1/laboratory', {
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
      <div className="modal" style={{ background: '#fff', borderRadius: '10px', padding: '16px', maxWidth: '540px', width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 15px 35px rgba(16, 45, 85, 0.18)', border: '1px solid #dbe6f5' }}>
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
              {masterServices.length === 0 ? (
                <option value="">No lab services available (Add in Admin)</option>
              ) : (
                masterServices.map((srv) => (
                  <option key={srv.id || srv.name} value={srv.name}>
                    {isLabAssistant ? `${srv.name} (Rate: ₹ ${srv.rate})` : srv.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Test Fee & Upfront Payment Section (Always visible for Doctor & Lab Assistant) */}
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #dde7f1', display: 'grid', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="field">
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#dc2626' }}>Total Fee (₹) *</span>
                <input
                  type="number"
                  step="any"
                  value={testFee}
                  onChange={(e) => handleFeeChargesChange(e.target.value)}
                  required
                  style={{ padding: '6px 8px', border: '1px solid #fca5a5', borderRadius: '5px', fontSize: '11px', fontWeight: '800', color: '#dc2626', background: '#fef2f2', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="field">
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#15803d' }}>Final Net Payable (₹)</span>
                <input
                  type="number"
                  disabled
                  value={testFee}
                  style={{ padding: '6px 8px', border: '1px solid #86efac', borderRadius: '5px', fontSize: '11px', fontWeight: '800', color: '#15803d', background: '#f0fdf4', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* MULTI-SELECT PAYMENT METHOD CHECKBOXES & SPLIT AMOUNTS */}
            <div className="field" style={{ borderTop: '1px solid #edf2f7', paddingTop: '8px' }}>
              <span style={{ color: '#0f2d55', fontSize: '10px', fontWeight: '800', display: 'block', marginBottom: '6px' }}>
                Payment Method *
              </span>

              {/* CHECKBOXES ROW */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #dde7f1', marginBottom: '8px' }}>
                {[
                  { key: 'Cash', label: 'Cash' },
                  { key: 'UPI', label: 'UPI' },
                  { key: 'Card', label: 'Card' },
                  { key: 'Cheque', label: 'Cheque' },
                  { key: 'Bank Transfer', label: 'Bank Transfer' },
                  { key: 'Free', label: 'Free / Complimentary' },
                  { key: 'Others', label: 'Others / PO' },
                  { key: 'Pay Later', label: 'Pay Later (Post-Pay)' },
                ].map((m) => (
                  <label key={m.key} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: selectedMethods[m.key] ? '#1769d7' : '#475569' }}>
                    <input
                      type="checkbox"
                      checked={!!selectedMethods[m.key]}
                      onChange={() => togglePaymentMethod(m.key)}
                      style={{ width: '14px', height: '14px', accentColor: '#1769d7', cursor: 'pointer' }}
                    />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>

              {/* SPLIT AMOUNT INPUTS FOR CHECKED METHODS */}
              {!selectedMethods['Pay Later'] && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 10px', borderRadius: '6px', marginBottom: '8px' }}>
                  {activeModes.map((modeKey) => (
                    <div key={modeKey} className="field">
                      <span style={{ color: '#15803d', fontSize: '9px', fontWeight: '800' }}>
                        {modeKey} Amount (₹) *
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={splitAmounts[modeKey] || ''}
                        onChange={(e) => handleSplitAmountChange(modeKey, e.target.value)}
                        placeholder={`Enter ${modeKey} amount...`}
                        required
                        style={{ padding: '5px 8px', border: '1px solid #86efac', borderRadius: '5px', fontSize: '11px', fontWeight: '800', color: '#15803d', background: '#ffffff', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* COLLECTED TOTAL SUMMARY BANNER */}
              {!selectedMethods['Pay Later'] && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', background: '#e0f2fe', border: '1px solid #7dd3fc', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', color: '#0369a1' }}>
                  <span>Total Collecting Now: <strong>₹ {calculatedTotalCollected.toLocaleString('en-IN')}</strong> {paymentSummaryStr ? `(${paymentSummaryStr})` : ''}</span>
                  <button
                    type="button"
                    onClick={handleCollectFullFee}
                    style={{ fontSize: '9px', background: '#0284c7', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: '800' }}
                  >
                    ⚡ Auto-Set Full Fee (₹ {testFee})
                  </button>
                </div>
              )}

              {/* CONDITIONAL UPI HANDLES DROPDOWN */}
              {selectedMethods.UPI && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                  <div className="field">
                    <span style={{ color: '#0284c7', fontSize: '10px', fontWeight: '700' }}>Hospital Available UPI Handle *</span>
                    <select
                      value={selectedUpiHandle}
                      onChange={(e) => setSelectedUpiHandle(e.target.value)}
                      style={{ padding: '6px 8px', border: '1px solid #93c5fd', borderRadius: '5px', background: '#f0f9ff', fontWeight: '700', color: '#0284c7', fontSize: '10px', width: '100%', boxSizing: 'border-box' }}
                    >
                      {upiHandles.map((h) => (
                        <option key={h} value={h}>💳 {h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <span style={{ color: '#4a5e7a', fontSize: '10px', fontWeight: '700' }}>UPI Transaction Ref ID (Optional)</span>
                    <input
                      value={upiTxnId}
                      onChange={(e) => setUpiTxnId(e.target.value)}
                      placeholder="e.g. 402918239102"
                      style={{ padding: '6px 8px', border: '1px solid #dde7f1', borderRadius: '5px', fontSize: '10px', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {/* CONDITIONAL PAY LATER WARNING BANNER */}
              {selectedMethods['Pay Later'] && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '8px 10px', borderRadius: '6px', fontSize: '10px', color: '#b45309', fontWeight: '700', marginTop: '8px' }}>
                  ⚠️ Pay Later Selected: Lab investigation ordered without upfront payment collection. Complete fee (₹{testFee}) will be billed for post-investigation settlement.
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
