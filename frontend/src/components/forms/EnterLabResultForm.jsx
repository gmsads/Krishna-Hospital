import React, { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { initialLabTests, initialOPRecords, initialMasterLabServices } from '../data/initialData';

// Preset generator helper for sub-parameter rows (Loads custom sub-categories defined in Master Services first)
const getInitialRowsForTest = (testName, masterServices = []) => {
  const foundSrv = masterServices.find(
    (s) => s.name === testName || (s.name && s.name.toLowerCase() === (testName || '').toLowerCase())
  );
  if (foundSrv && Array.isArray(foundSrv.subCategories) && foundSrv.subCategories.length > 0) {
    return foundSrv.subCategories.map((sub, idx) => ({
      id: Date.now() + idx,
      name: sub.name,
      result: '',
      normalRange: sub.normalRange || 'Standard Reference',
    }));
  }

  const lower = (testName || '').toLowerCase();
  if (lower.includes('thyroid')) {
    return [
      { id: 1, name: 'TSH (Serum)', result: '', normalRange: '0.45 - 4.5 mIU/L' },
      { id: 2, name: 'T3 (Triiodothyronine)', result: '', normalRange: '0.8 - 2.0 ng/mL' },
      { id: 3, name: 'T4 (Thyroxine)', result: '', normalRange: '5.1 - 14.1 ug/dL' },
    ];
  }
  if (lower.includes('count') || lower.includes('cbc') || lower.includes('blood count')) {
    return [
      { id: 1, name: 'Hemoglobin (Hb)', result: '', normalRange: '13.0 - 17.0 g/dL' },
      { id: 2, name: 'Total Leukocyte Count (WBC)', result: '', normalRange: '4,000 - 11,000 /uL' },
      { id: 3, name: 'Platelet Count', result: '', normalRange: '1.5 - 4.5 Lakhs /uL' },
    ];
  }
  if (lower.includes('lipid') || lower.includes('cholesterol')) {
    return [
      { id: 1, name: 'Serum Cholesterol (Total)', result: '', normalRange: '< 200 mg/dL' },
      { id: 2, name: 'Triglycerides', result: '', normalRange: '< 150 mg/dL' },
      { id: 3, name: 'HDL Cholesterol', result: '', normalRange: '> 40 mg/dL' },
      { id: 4, name: 'LDL Cholesterol', result: '', normalRange: '< 100 mg/dL' },
    ];
  }
  if (lower.includes('glucose') || lower.includes('sugar')) {
    return [
      { id: 1, name: 'Fasting Blood Sugar', result: '', normalRange: '70 - 99 mg/dL' },
      { id: 2, name: 'Post Prandial (PPBS)', result: '', normalRange: '< 140 mg/dL' },
    ];
  }
  return [
    { id: 1, name: '', result: '', normalRange: 'Standard Reference' },
  ];
};

export function EnterLabResultForm({
  tests = [],
  opRecords = [],
  masterServices = [],
  initialSelectedTest = null,
  effectiveBranch = 'All',
  branchesList = [],
  onSave,
  onCancel,
  notify,
}) {
  const [selectedTestId, setSelectedTestId] = useState(initialSelectedTest?.id || '');

  // Patient & Doctor Form State (No hardcoded mock data)
  const [opNumber, setOpNumber] = useState(initialSelectedTest?.opNumber || initialSelectedTest?.labOrderNo || 'LAB-0001');
  const [patientName, setPatientName] = useState(initialSelectedTest?.patientName || initialSelectedTest?.patient || '');
  const [phone, setPhone] = useState(initialSelectedTest?.phone || '');
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [doctor, setDoctor] = useState(initialSelectedTest?.doctor || initialSelectedTest?.orderingDoctor || 'Self Created / Walk-In');
  const [status, setStatus] = useState(initialSelectedTest?.status || 'Sample collected');
  const [autoFetchSuccess, setAutoFetchSuccess] = useState(false);

  // Auto-fetch branch-scoped next Lab Record Number starting from LAB-0001 from backend
  React.useEffect(() => {
    if (!initialSelectedTest) {
      const targetBranch = effectiveBranch === 'All' ? (branchesList[0]?.name || 'Central Campus') : effectiveBranch;
      const branchQuery = targetBranch ? `?branch=${encodeURIComponent(targetBranch)}` : '';

      fetch(`/api/v1/laboratory/next-labno${branchQuery}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.nextLabNo) {
            setOpNumber(data.data.nextLabNo);
          }
        })
        .catch((err) => console.warn('Could not fetch next labno from backend:', err.message));
    }
  }, [effectiveBranch, branchesList, initialSelectedTest]);

  // Fetch doctors dynamically from database for assigned branch
  React.useEffect(() => {
    const targetBranch = effectiveBranch === 'All' ? (branchesList[0]?.name || 'Central Campus') : effectiveBranch;
    const branchQuery = targetBranch ? `?branch=${encodeURIComponent(targetBranch)}` : '';
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
        }
      })
      .catch((err) => console.warn('Could not fetch doctors in EnterLabResultForm:', err.message));
  }, [effectiveBranch, branchesList, initialSelectedTest]);

  // Main Test Name (Selected from Admin Catalogue)
  const initialMainTest = initialSelectedTest?.test || (masterServices[0]?.name || '');
  const [testName, setTestName] = useState(initialMainTest);

  // Dynamic Multi-Row Sub-Parameter State (e.g. T1, T2, T3, T4, TSH)
  const [testRows, setTestRows] = useState(
    initialSelectedTest?.testRows && initialSelectedTest.testRows.length > 0
      ? initialSelectedTest.testRows
      : getInitialRowsForTest(initialMainTest, masterServices)
  );

  const [notes, setNotes] = useState(initialSelectedTest?.notes || '');

  // Auto-sync sub-parameter rows and test name when masterServices loads from API
  React.useEffect(() => {
    if (!initialSelectedTest && (!testRows || testRows.length === 0 || (testRows.length === 1 && !testRows[0].name)) && masterServices.length > 0) {
      const activeTest = testName || masterServices[0]?.name || '';
      if (!testName && masterServices[0]?.name) {
        setTestName(masterServices[0].name);
        setTestFee((parseFloat(masterServices[0].rate) || 0).toString());
      }
      setTestRows(getInitialRowsForTest(activeTest, masterServices));
    }
  }, [masterServices, testName]);

  // Lab Fee & Upfront Payment State
  const initialFee = initialSelectedTest?.amount || (parseFloat(masterServices.find(s => s.name === initialMainTest)?.rate) || 0);
  const [testFee, setTestFee] = useState(initialFee.toString());

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
    Cash: initialFee.toString(),
    UPI: '0',
    Card: '0',
    Cheque: '0',
    'Bank Transfer': '0',
    Free: '0',
    Others: '0',
  });

  const upiHandles = ['krishnahospital@okicici', 'krishnalab@ybl', 'krishnaglobal@hdfcbank'];
  const [selectedUpiHandle, setSelectedUpiHandle] = useState('krishnalab@ybl');
  const [upiTxnId, setUpiTxnId] = useState(initialSelectedTest?.upiTxnId || '');

  // EDITABLE FEE HANDLER
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

  // MULTI-SELECT PAYMENT TOGGLE (Exact Match to OP Record)
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

  // Sync state when editing an existing test
  React.useEffect(() => {
    if (initialSelectedTest) {
      if (initialSelectedTest.opNumber || initialSelectedTest.labOrderNo) {
        setOpNumber(initialSelectedTest.opNumber || initialSelectedTest.labOrderNo);
      }
      if (initialSelectedTest.patientName || initialSelectedTest.patient) {
        setPatientName(initialSelectedTest.patientName || initialSelectedTest.patient);
      }
      if (initialSelectedTest.phone) setPhone(initialSelectedTest.phone);
      if (initialSelectedTest.doctor || initialSelectedTest.orderingDoctor) {
        setDoctor(initialSelectedTest.doctor || initialSelectedTest.orderingDoctor);
      }
      if (initialSelectedTest.status) {
        setStatus(initialSelectedTest.status);
      }
      if (initialSelectedTest.test || initialSelectedTest.testName) {
        const tName = initialSelectedTest.test || initialSelectedTest.testName;
        setTestName(tName);
        if (initialSelectedTest.testRows && initialSelectedTest.testRows.length > 0) {
          setTestRows(initialSelectedTest.testRows);
        } else {
          setTestRows(getInitialRowsForTest(tName, masterServices));
        }
      }
      if (initialSelectedTest.notes) setNotes(initialSelectedTest.notes);
      if (initialSelectedTest.amount || initialSelectedTest.testFee) {
        const fee = initialSelectedTest.amount || parseFloat(initialSelectedTest.testFee) || 1200;
        setTestFee(fee.toString());
        const paid = typeof initialSelectedTest.paidAmount === 'number' ? initialSelectedTest.paidAmount : (parseFloat(initialSelectedTest.amountPaid) || fee);
        
        const method = initialSelectedTest.paymentMethod || 'Cash';
        if (method.includes('Free')) {
          setSelectedMethods({ Cash: false, UPI: false, Card: false, Cheque: false, 'Bank Transfer': false, Free: true, Others: false, 'Pay Later': false });
          setSplitAmounts((prev) => ({ ...prev, Free: fee.toString() }));
        } else if (method.includes('Pay Later') || initialSelectedTest.paymentStatus === 'Pay Later (Pending)') {
          setSelectedMethods({ Cash: false, UPI: false, Card: false, Cheque: false, 'Bank Transfer': false, Free: false, Others: false, 'Pay Later': true });
        } else {
          const newMethods = { Cash: false, UPI: false, Card: false, Cheque: false, 'Bank Transfer': false, Free: false, Others: false, 'Pay Later': false };
          const newSplits = { Cash: '0', UPI: '0', Card: '0', Cheque: '0', 'Bank Transfer': '0', Free: '0', Others: '0' };
          let matchedAny = false;
          ['Cash', 'UPI', 'Card', 'Cheque', 'Bank Transfer', 'Others'].forEach((k) => {
            if (method.toLowerCase().includes(k.toLowerCase())) {
              newMethods[k] = true;
              matchedAny = true;
            }
          });
          if (!matchedAny) newMethods.Cash = true;
          const activeKeys = Object.keys(newMethods).filter((k) => newMethods[k]);
          newSplits[activeKeys[0] || 'Cash'] = paid.toString();
          setSelectedMethods(newMethods);
          setSplitAmounts(newSplits);
        }
      }
      if (initialSelectedTest.upiTxnId) setUpiTxnId(initialSelectedTest.upiTxnId);
      if (initialSelectedTest.upiHandle) setSelectedUpiHandle(initialSelectedTest.upiHandle);
    }
  }, [initialSelectedTest]);

  // Handle Main Test Selection -> Auto-populate presets & rates
  const handleMainTestChange = (selectedName) => {
    setTestName(selectedName);
    setTestRows(getInitialRowsForTest(selectedName, masterServices));
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

  // Add a new Sub-Parameter Row (+ Button)
  const handleAddRow = () => {
    setTestRows((prev) => [
      ...prev,
      { id: Date.now(), name: '', result: '', normalRange: '' },
    ]);
  };

  // Remove a Sub-Parameter Row
  const handleRemoveRow = (index) => {
    if (testRows.length === 1) {
      notify && notify('At least one sub-parameter row is required.');
      return;
    }
    setTestRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Update a field in a Sub-Parameter Row
  const handleRowChange = (index, field, value) => {
    setTestRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  // Auto-fill patient info if OP Number changes
  const handleOpNumberChange = (val) => {
    setOpNumber(val);
    const query = val.trim().toLowerCase();
    if (!query) {
      setAutoFetchSuccess(false);
      return;
    }

    const foundOp = opRecords.find((r) => r.id.toLowerCase() === query || (r.opNumber && r.opNumber.toLowerCase() === query));
    if (foundOp) {
      setPatientName(foundOp.patient);
      if (foundOp.doctor) setDoctor(foundOp.doctor);
      if (foundOp.phone) setPhone(foundOp.phone);
      setAutoFetchSuccess(true);
    } else {
      setAutoFetchSuccess(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!opNumber.trim() || !patientName.trim() || !testName.trim()) {
      notify && notify('Please fill in Lab record number, patient name, and main test name.');
      return;
    }

    const feeNum = parseFloat(String(testFee || '0').replace(/[^0-9.]/g, '')) || 1200;
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
      type: 'Initial Lab Payment',
    }] : [];

    const existingHistory = Array.isArray(initialSelectedTest?.paymentHistory) && initialSelectedTest.paymentHistory.length > 0
      ? initialSelectedTest.paymentHistory
      : [];
    const finalPaymentHistory = existingHistory.length > 0 ? existingHistory : initialHistoryEntry;

    // Format main result summary string for cards
    const summaryResult = testRows
      .map((r) => `${r.name}: ${r.result}`)
      .filter(Boolean)
      .join(', ');

    const targetBranch = effectiveBranch === 'All' ? (branchesList[0]?.name || 'Central Campus') : effectiveBranch;
    const assignedDoctor = initialSelectedTest?.doctor || initialSelectedTest?.orderingDoctor || doctor || 'Self Created / Walk-In';
    const isSelfCreated = !assignedDoctor || assignedDoctor === 'Self Created / Walk-In' || assignedDoctor === 'Self / Walk-in' || assignedDoctor === 'Unassigned' || assignedDoctor === 'Walk-In';

    const payload = {
      id: initialSelectedTest?.id || initialSelectedTest?._id || opNumber.trim(),
      labOrderNo: opNumber.trim(),
      opNumber: opNumber.trim(),
      patient: patientName.trim(),
      patientName: patientName.trim(),
      phone: phone.trim(),
      doctor: assignedDoctor,
      orderingDoctor: assignedDoctor,
      test: testName.trim(),
      testName: testName.trim(),
      amount: feeNum,
      testFee: feeNum.toString(),
      paidAmount: paidNum,
      amountPaid: paidNum.toString(),
      amountPaidNow: paidNum.toString(),
      dueBalance: dueNum,
      paymentStatus: payStatus,
      paymentMethod: savedPaymentMethod,
      paymentBreakdown: splitBreakdown,
      paymentHistory: finalPaymentHistory,
      upiTxnId: selectedMethods.UPI ? upiTxnId : '',
      upiHandle: selectedMethods.UPI ? selectedUpiHandle : '',
      splitBreakdown,
      result: summaryResult || (status === 'Result ready' ? 'Pathology Report Available' : status),
      testRows,
      status: status || 'Result ready',
      notes: notes.trim(),
      requested: initialSelectedTest?.requested || 'Today, just now',
      branch: targetBranch,
      createdBy: isSelfCreated ? 'Lab Assistant' : (initialSelectedTest?.createdBy || 'Doctor'),
      isSelfCreated,
    };

    const token = localStorage.getItem('kh_auth_token');
    try {
      const res = await fetch('/api/v1/laboratory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        const savedRecord = {
          ...data.data,
          id: data.data.labOrderNo || data.data._id || payload.id,
          patient: data.data.patientName || payload.patient,
          test: data.data.testName || payload.test,
          isSelfCreated,
        };
        onSave(savedRecord);
        return;
      }
    } catch (err) {
      console.warn('Backend Lab Result direct DB save fallback:', err.message);
    }

    onSave(payload);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Laboratory Test Entry Form</div>
          <h1>Enter Test</h1>
          <p>Record self-created diagnostic tests, status, and dynamic multi-row sub-parameters with normal ranges.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Back to Lab Queue
          </button>
        </div>
      </div>

      <section className="panel full-panel" style={{ maxWidth: '920px', width: '100%' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>

          {/* Patient & Lab Record Details (OP Record Form Style) */}
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
            {/* Lab Record Number */}
            <div className="field">
              <span style={{ color: '#1769d7', fontSize: '11px', fontWeight: '700' }}>Lab Record Number *</span>
              <input
                value={opNumber}
                onChange={(e) => handleOpNumberChange(e.target.value)}
                placeholder="e.g. LAB-0001"
                required
                style={{ padding: '9px 10px', border: '1px solid #b8d5f7', borderRadius: '7px', fontWeight: '700', color: '#1769d7', background: '#f4f8fe', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Patient Full Name */}
            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '11px', fontWeight: '700' }}>Patient Full Name *</span>
              <input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Enter patient full name"
                required
                style={{ padding: '9px 10px', border: '1px solid #dde7f1', borderRadius: '7px', background: '#fff', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Phone Number & Test Status */}
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '11px', fontWeight: '700' }}>Phone Number *</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98470 00000"
                required
                style={{ padding: '9px 10px', border: '1px solid #dde7f1', borderRadius: '7px', background: '#fff', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '11px', fontWeight: '700' }}>Test Status *</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
                style={{ padding: '9px 10px', border: '1px solid #dde7f1', borderRadius: '7px', background: '#fff', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
              >
                <option value="Result ready">Result ready</option>
                <option value="Processing">Processing</option>
                <option value="Sample collected">Sample collected</option>
                <option value="Awaiting sample">Awaiting sample</option>
              </select>
            </div>
          </div>

          {/* Main Lab Test Selection (From Admin Master Catalogue) */}
          <div className="field">
            <span style={{ color: '#1769d7', fontSize: '12px', fontWeight: '700' }}>Main Lab Test Name (Admin Master Catalogue) *</span>
            <select
              value={testName}
              onChange={(e) => handleMainTestChange(e.target.value)}
              required
              style={{ padding: '12px 14px', border: '1px solid #b8d5f7', borderRadius: '9px', fontSize: '13px', background: '#fff', fontWeight: '700', color: '#1769d7' }}
            >
              {masterServices.length === 0 ? (
                <option value="">No lab services available (Add in Admin)</option>
              ) : (
                masterServices.map((srv) => (
                  <option key={srv.id || srv.name} value={srv.name}>
                    {srv.name} (Master Rate: ₹ {srv.rate})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Test Fee & Upfront Multi-Select Payment Section (Exact match to OP Record) */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '9px', border: '1px solid #dde7f1', display: 'grid', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#dc2626' }}>Test Fee Total Amount (₹) *</span>
                <input
                  type="number"
                  step="any"
                  value={testFee}
                  onChange={(e) => handleFeeChargesChange(e.target.value)}
                  required
                  placeholder="Test fee..."
                  style={{ padding: '9px 12px', border: '1px solid #fca5a5', borderRadius: '7px', fontSize: '13px', fontWeight: '800', color: '#dc2626', background: '#fef2f2', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#15803d' }}>Final Net Payable (₹)</span>
                <input
                  type="number"
                  disabled
                  value={testFee}
                  style={{ padding: '9px 12px', border: '1px solid #86efac', borderRadius: '7px', fontSize: '13px', fontWeight: '800', color: '#15803d', background: '#f0fdf4', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* MULTI-SELECT PAYMENT METHOD CHECKBOXES & SPLIT AMOUNTS */}
            <div className="field" style={{ borderTop: '1px solid #edf2f7', paddingTop: '10px' }}>
              <span style={{ color: '#0f2d55', fontSize: '11px', fontWeight: '800', display: 'block', marginBottom: '8px' }}>
                Payment Method *
              </span>

              {/* CHECKBOXES ROW */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dde7f1', marginBottom: '12px' }}>
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
                  <label key={m.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: selectedMethods[m.key] ? '#1769d7' : '#475569' }}>
                    <input
                      type="checkbox"
                      checked={!!selectedMethods[m.key]}
                      onChange={() => togglePaymentMethod(m.key)}
                      style={{ width: '16px', height: '16px', accentColor: '#1769d7', cursor: 'pointer' }}
                    />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>

              {/* SPLIT AMOUNT INPUTS FOR CHECKED METHODS */}
              {!selectedMethods['Pay Later'] && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                  {activeModes.map((modeKey) => (
                    <div key={modeKey} className="field">
                      <span style={{ color: '#15803d', fontSize: '10px', fontWeight: '800' }}>
                        {modeKey} Amount (₹) *
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={splitAmounts[modeKey] || ''}
                        onChange={(e) => handleSplitAmountChange(modeKey, e.target.value)}
                        placeholder={`Enter ${modeKey} amount...`}
                        required
                        style={{ padding: '7px 10px', border: '1px solid #86efac', borderRadius: '6px', fontSize: '12px', fontWeight: '800', color: '#15803d', background: '#ffffff', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* COLLECTED TOTAL SUMMARY BANNER */}
              {!selectedMethods['Pay Later'] && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', background: '#e0f2fe', border: '1px solid #7dd3fc', padding: '8px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: '800', color: '#0369a1' }}>
                  <span>Total Collecting Now: <strong>₹ {calculatedTotalCollected.toLocaleString('en-IN')}</strong> {paymentSummaryStr ? `(${paymentSummaryStr})` : ''}</span>
                  <button
                    type="button"
                    onClick={handleCollectFullFee}
                    style={{ fontSize: '10px', background: '#0284c7', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: '800' }}
                  >
                    ⚡ Auto-Set Full Fee (₹ {testFee})
                  </button>
                </div>
              )}

              {/* CONDITIONAL UPI HANDLES DROPDOWN */}
              {selectedMethods.UPI && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                  <div className="field">
                    <span style={{ color: '#0284c7', fontSize: '10px', fontWeight: '700' }}>Hospital Available UPI Handle *</span>
                    <select
                      value={selectedUpiHandle}
                      onChange={(e) => setSelectedUpiHandle(e.target.value)}
                      style={{ padding: '8px 6px', border: '1px solid #93c5fd', borderRadius: '6px', background: '#f0f9ff', fontWeight: '700', color: '#0284c7', fontSize: '11px', width: '100%', boxSizing: 'border-box' }}
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
                      style={{ padding: '8px 10px', border: '1px solid #dde7f1', borderRadius: '6px', fontSize: '11px', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {/* CONDITIONAL PAY LATER WARNING BANNER */}
              {selectedMethods['Pay Later'] && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 12px', borderRadius: '8px', fontSize: '11px', color: '#b45309', fontWeight: '700', marginTop: '10px' }}>
                  ⚠️ Pay Later Selected: Lab investigation registered without upfront payment collection. Complete fee (₹{testFee}) will be billed for post-investigation settlement.
                </div>
              )}
            </div>
          </div>

          {/* DYNAMIC MULTI-ROW SUB-PARAMETER BUILDER (T1, T2, T3, T4, TSH, Hb, etc.) - ONLY VISIBLE WHEN STATUS IS 'Result ready' */}
          {status === 'Result ready' ? (
            <div style={{ background: '#f4f8fe', padding: '18px', borderRadius: '10px', border: '1px solid #d4e4f7', display: 'grid', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #d3e2f5', paddingBottom: '10px' }}>
                <div>
                  <strong style={{ fontSize: '13px', color: '#1769d7' }}>
                    Sub-Test Parameters & Readings ({testRows.length})
                  </strong>
                  <span style={{ fontSize: '11px', color: '#576c85', display: 'block' }}>
                    Add sub-fields (e.g. T1, T2, T3, T4, TSH) with measured results and normal reference ranges.
                  </span>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ background: '#fff', border: '1px solid #1769d7', color: '#1769d7', fontWeight: '700', padding: '6px 14px', fontSize: '12px' }}
                  onClick={handleAddRow}
                >
                  <Plus size={15} />Add
                </button>
              </div>

              {/* Sub-Parameter Rows List */}
              <div style={{ display: 'grid', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
                {testRows.map((row, index) => (
                  <div
                    key={row.id || index}
                    className="form-row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1fr 1fr auto',
                      gap: '10px',
                      alignItems: 'center',
                      background: '#fff',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e1eaf4',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* 1. Sub-Test / Parameter Name */}
                    <div className="field">
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#576c85' }}>Sub-Parameter Name *</span>
                      <input
                        value={row.name}
                        onChange={(e) => handleRowChange(index, 'name', e.target.value)}
                        placeholder="e.g. T3, T4, TSH, Hb"
                        required
                        style={{ padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #dde7f1' }}
                      />
                    </div>

                    {/* 2. Measured Result */}
                    <div className="field">
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#1769d7' }}>Result *</span>
                      <input
                        value={row.result}
                        onChange={(e) => handleRowChange(index, 'result', e.target.value)}
                        placeholder="e.g. 1.2 ng/mL"
                        required
                        style={{ padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #b8d5f7', fontWeight: '700', color: '#1769d7' }}
                      />
                    </div>

                    {/* 3. Normal Range */}
                    <div className="field">
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#576c85' }}>Normal Range *</span>
                      <input
                        value={row.normalRange}
                        onChange={(e) => handleRowChange(index, 'normalRange', e.target.value)}
                        placeholder="e.g. 0.8 - 2.0 ng/mL"
                        required
                        style={{ padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #dde7f1' }}
                      />
                    </div>

                    {/* Remove Row Button */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingTop: '16px' }}>
                      <button
                        type="button"
                        className="icon-button"
                        style={{ width: '32px', height: '32px', padding: 0 }}
                        onClick={() => handleRemoveRow(index)}
                        title="Remove Sub-Parameter Row"
                      >
                        <Trash2 size={15} color="#dc2626" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: '#fff8e6', padding: '14px', borderRadius: '10px', border: '1px solid #ffe0b2', color: '#b45309', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>ℹ️ Status is currently <strong>"{status}"</strong>. Parameter result readings can be entered once status is updated to <strong>"Result ready"</strong>.</span>
            </div>
          )}

          {/* Pathology Remarks & Notes */}
          <div className="field">
            <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Pathology Remarks & Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter lab technician observations, double-checked findings, or notes..."
              rows={3}
              style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', fontFamily: 'inherit', background: '#fff' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button type="submit" className="primary-button" style={{ padding: '12px 28px', flex: '1 1 auto', justifyContent: 'center' }}>
              <Save size={17} /> Save Lab Result
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

export default EnterLabResultForm;
