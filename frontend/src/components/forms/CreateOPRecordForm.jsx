import React, { useState } from 'react';
import { Plus, CheckCircle2, UserCheck, Upload, CreditCard, AlertTriangle, FileImage } from 'lucide-react';
import { initialPatients, initialOPRecords } from '../data/initialData';

export function CreateOPRecordForm({
  patients = initialPatients,
  opRecords = initialOPRecords,
  doctorsList = [],
  upiHandles = ['krishnahospital@okicici', 'krishnalab@ybl', 'krishnaglobal@hdfcbank'],
  onSave,
  onCancel,
  notify,
  effectiveBranch = 'All',
  branchesList = [],
}) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const initialBranchName = effectiveBranch === 'All'
    ? (branchesList[0]?.name || 'Main Campus')
    : effectiveBranch;

  const [selectedBranch, setSelectedBranch] = useState(initialBranchName);

  // Sync selectedBranch whenever effectiveBranch changes
  React.useEffect(() => {
    if (effectiveBranch !== 'All') {
      setSelectedBranch(effectiveBranch);
    } else if (branchesList.length > 0 && !selectedBranch) {
      setSelectedBranch(branchesList[0].name);
    }
  }, [effectiveBranch, branchesList]);

  // Streamlined Form State (16 Required Fields)
  const [recordType, setRecordType] = useState('OP'); // Options: OP, IP, Surgery, Emergency
  const [ipCareDetails, setIpCareDetails] = useState('');
  const [surgeryName, setSurgeryName] = useState('');
  const [opNumber, setOpNumber] = useState('Reg-2026-0001'); // Default Reg Number: Reg-2026-0001
  const [regDate, setRegDate] = useState(dateStr);
  const [regTime, setRegTime] = useState(timeStr);
  const [patientName, setPatientName] = useState('');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('32');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [availableDoctors, setAvailableDoctors] = useState(doctorsList);

  // Auto-fetch sequential Registration Number starting from Reg-2026-0001 from backend
  React.useEffect(() => {
    const targetBranch = effectiveBranch === 'All' ? selectedBranch : effectiveBranch;
    const regBranchQuery = targetBranch ? `?branch=${encodeURIComponent(targetBranch)}` : '';

    fetch(`/api/v1/op-records/next-regno${regBranchQuery}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.nextRegNo) {
          setOpNumber(data.data.nextRegNo);
        }
      })
      .catch((err) => console.warn('Could not fetch next regNo from backend:', err.message));

    // Fetch doctors strictly for selected branch
    const token = localStorage.getItem('kh_auth_token');
    const docBranchQuery = targetBranch && targetBranch !== 'All' ? `?branch=${encodeURIComponent(targetBranch)}` : '';

    fetch(`/api/v1/doctors${docBranchQuery}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setAvailableDoctors(data.data);
          if (data.data.length > 0) {
            setDoctor(data.data[0].name);
            if (data.data[0].department) {
              setDepartment(data.data[0].department);
            }
          } else {
            setDoctor('');
          }
        }
      })
      .catch((err) => console.warn('Could not fetch doctors from backend API:', err.message));
  }, [selectedBranch, effectiveBranch]);

  // Clinical Vitals
  const [temp, setTemp] = useState('98.6');
  const [weight, setWeight] = useState('68');
  const [height, setHeight] = useState('170');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [bp, setBp] = useState('120/80');

  // Doctor, Referral, Charges & Discount
  const [department, setDepartment] = useState('General medicine');
  const [doctor, setDoctor] = useState('Dr. Meera Nair');
  const [referralDoctor, setReferralDoctor] = useState('');
  const [visitValidity, setVisitValidity] = useState('15'); // Default Visit Validity: 15 Days
  const [refCommPercent, setRefCommPercent] = useState('0');
  const [charges, setCharges] = useState('300.00');
  const [discount, setDiscount] = useState('0.00');

  const grossChargesNum = parseFloat(String(charges || '0').replace(/[^0-9.]/g, '')) || 0;
  const discountNum = parseFloat(String(discount || '0').replace(/[^0-9.]/g, '')) || 0;
  const netPayableNum = Math.max(0, grossChargesNum - discountNum);

  // MULTI-SELECT PAYMENT METHODS & SPLIT AMOUNT COLLECTION
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
    Cash: '300.00',
    UPI: '0',
    Card: '0',
    Cheque: '0',
    'Bank Transfer': '0',
    Free: '0',
    Others: '0',
  });

  const [selectedUpiHandle, setSelectedUpiHandle] = useState(upiHandles[0] || 'krishnahospital@okicici');
  const [upiTxnId, setUpiTxnId] = useState('');
  const [receiptImage, setReceiptImage] = useState(null);
  const [receiptImageName, setReceiptImageName] = useState('');
  const [autoFetchMsg, setAutoFetchMsg] = useState('');

  // EDITABLE FEE & DISCOUNT HANDLERS
  const handleFeeChargesChange = (val) => {
    setCharges(val);
    const newGross = parseFloat(String(val || '0').replace(/[^0-9.]/g, '')) || 0;
    const currentDisc = parseFloat(String(discount || '0').replace(/[^0-9.]/g, '')) || 0;
    const newNet = Math.max(0, newGross - currentDisc);

    const activeKeys = Object.keys(selectedMethods).filter((k) => selectedMethods[k] && k !== 'Pay Later');
    if (activeKeys.length === 1) {
      setSplitAmounts((prev) => ({
        ...prev,
        [activeKeys[0]]: newNet.toString(),
      }));
    }
  };

  const handleDiscountChange = (val) => {
    setDiscount(val);
    const currentGross = parseFloat(String(charges || '0').replace(/[^0-9.]/g, '')) || 0;
    const newDisc = parseFloat(String(val || '0').replace(/[^0-9.]/g, '')) || 0;
    const newNet = Math.max(0, currentGross - newDisc);

    const activeKeys = Object.keys(selectedMethods).filter((k) => selectedMethods[k] && k !== 'Pay Later');
    if (activeKeys.length === 1) {
      setSplitAmounts((prev) => ({
        ...prev,
        [activeKeys[0]]: newNet.toString(),
      }));
    }
  };

  // MULTI-SELECT PAYMENT TOGGLE
  const togglePaymentMethod = (modeKey) => {
    setSelectedMethods((prev) => {
      if (modeKey === 'Free') {
        const isCurrentlySelected = prev['Free'];
        if (!isCurrentlySelected) {
          setSplitAmounts((prevSplits) => ({
            ...prevSplits,
            Free: charges,
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
            [modeKey]: modeKey === 'Cash' && !prev[modeKey] ? charges : '0',
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
    const activeKeys = Object.keys(selectedMethods).filter((k) => selectedMethods[k] && k !== 'Pay Later');
    if (activeKeys.length === 1) {
      setSplitAmounts((prev) => ({ ...prev, [activeKeys[0]]: netPayableNum.toString() }));
    } else if (activeKeys.length > 1) {
      const newSplits = { ...splitAmounts };
      newSplits[activeKeys[0]] = netPayableNum.toString();
      activeKeys.slice(1).forEach((k) => {
        newSplits[k] = '0';
      });
      setSplitAmounts(newSplits);
    }
  };

  const activeModes = Object.keys(selectedMethods).filter((k) => selectedMethods[k] && k !== 'Pay Later');

  const calculatedTotalCollected = selectedMethods['Pay Later']
    ? 0
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

  const handleReceiptImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setReceiptImage(event.target?.result);
        setReceiptImageName(file.name);
        notify && notify(`Attached receipt proof image: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate BMI
  const calcBmi = () => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return '';
  };

  // AUTO-FETCH PATIENT DETAILS BY PHONE NUMBER OR OP ID / PATIENT ID
  const handleAutoFetchCheck = (inputVal, type) => {
    const query = inputVal.trim().toLowerCase();
    if (!query || query.length < 3) {
      setAutoFetchMsg('');
      return;
    }

    const cleanQ = query.replace(/\D/g, '');

    // 1. Search existing Patients directory
    const matchedPatient = patients.find((p) => {
      if (type === 'phone') {
        const cleanP = p.phone ? p.phone.replace(/\D/g, '') : '';
        return cleanQ.length >= 10 && cleanP && (cleanP === cleanQ || cleanP.endsWith(cleanQ) || cleanQ.endsWith(cleanP));
      }
      return p.id.toLowerCase() === query || (p.name && p.name.toLowerCase() === query);
    });

    // 2. Search existing OP Records
    const matchedOp = opRecords.find((r) => {
      if (type === 'phone') {
        const cleanP = r.phone ? r.phone.replace(/\D/g, '') : '';
        return cleanQ.length >= 10 && cleanP && (cleanP === cleanQ || cleanP.endsWith(cleanQ) || cleanQ.endsWith(cleanP));
      }
      return (
        (r.id && r.id.toLowerCase() === query) ||
        (r.regNo && r.regNo.toLowerCase() === query) ||
        (r.patient && r.patient.toLowerCase() === query) ||
        (r.patientName && r.patientName.toLowerCase() === query)
      );
    });

    const found = matchedPatient || matchedOp;

    if (found) {
      const name = found.name || found.patient || found.patientName || '';
      if (name) setPatientName(name);
      if (type !== 'phone' && found.phone) setPhone(found.phone);
      if (found.gender) setGender(found.gender);
      if (found.age) setAge(found.age.replace(/[^0-9]/g, '') || '30');
      if (found.dob) setDob(found.dob);
      if (found.address) setAddress(found.address);
      if (found.doctor && found.doctor !== 'Unassigned') setDoctor(found.doctor);
      if (found.department) setDepartment(found.department);
      if (found.bloodGroup) setBloodGroup(found.bloodGroup);

      const displayTitle = name ? `${name} (${found.id || found.regNo || 'Existing Patient'})` : (found.id || found.regNo);
      setAutoFetchMsg(`✓ Auto-fetched patient profile details for ${displayTitle}!`);
      notify && notify(`✓ Auto-fetched existing patient profile for ${displayTitle}`);
    } else {
      setAutoFetchMsg('');
    }
  };

  const handleOpNumberInputChange = (val) => {
    setOpNumber(val);
    handleAutoFetchCheck(val, 'opId');
  };

  const handlePhoneInputChange = (val) => {
    setPhone(val);
    handleAutoFetchCheck(val, 'phone');
  };

  const handlePatientSelect = (name) => {
    setPatientName(name);
    handleAutoFetchCheck(name, 'name');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      notify && notify('Please enter patient name');
      return;
    }

    let finalRecordType = recordType;
    if (recordType === 'IP' && ipCareDetails.trim()) {
      finalRecordType = `IP (${ipCareDetails.trim()})`;
    } else if (recordType === 'Surgery') {
      const sName = surgeryName.trim() || ipCareDetails.trim() || 'General Surgery';
      finalRecordType = `Surgery (${sName})`;
    }

    const grossNum = parseFloat(String(charges).replace(/[^0-9.]/g, '')) || 0;
    const discNum = parseFloat(String(discount).replace(/[^0-9.]/g, '')) || 0;
    const netNum = Math.max(0, grossNum - discNum);

    const isFree = !!selectedMethods['Free'];
    const isPayLater = !isFree && selectedMethods['Pay Later'];
    const paidNum = isFree ? netNum : (isPayLater ? 0 : calculatedTotalCollected);
    const dueNum = isFree ? 0 : Math.max(0, netNum - paidNum);
    const payStatus = isFree ? 'Paid' : (isPayLater ? 'Pay Later (Pending)' : dueNum <= 0 ? 'Paid' : paidNum > 0 ? 'Partial' : 'Pay Later (Pending)');
    const savedPaymentMethod = isFree ? 'Free / Complimentary' : (isPayLater ? 'Pay Later (Post-Pay)' : (paymentSummaryStr || activeModes.join(', ') || 'Cash'));

    const splitBreakdown = {};
    activeModes.forEach((k) => {
      splitBreakdown[k] = parseFloat(String(splitAmounts[k] || '0').replace(/[^0-9.]/g, '')) || 0;
    });

    const initialHistoryEntry = paidNum > 0 ? [{
      date: new Date().toISOString(),
      dateStr: regDate,
      timeStr: regTime,
      amount: paidNum,
      method: savedPaymentMethod,
      breakdown: splitBreakdown,
      type: 'Initial Registration Payment',
    }] : [];

    const assignedBranch = effectiveBranch === 'All' ? selectedBranch : effectiveBranch;
    const matchingBranchObj = branchesList.find((b) => b.name === assignedBranch);
    const assignedCode = matchingBranchObj?.code || 'HQ-CENTRAL';

    const opRecord = {
      id: opNumber,
      regNo: opNumber,
      recordType: finalRecordType,
      ipCareDetails: ipCareDetails.trim(),
      surgeryName: surgeryName.trim() || ipCareDetails.trim(),
      patient: patientName.trim(),
      patientName: patientName.trim(),
      gender,
      age: `${age} Yrs`,
      dob,
      address: address.trim(),
      phone: phone.trim(),
      vitals: { temp, weight, height, bmi: calcBmi(), bloodGroup, bp },
      department,
      doctor,
      referralDoctor: referralDoctor.trim(),
      visitValidity: `${visitValidity} Days`,
      refCommPercent: `${refCommPercent}%`,
      time: regTime,
      date: regDate,
      charges: charges,
      discount: discNum,
      netAmount: netNum,
      amount: `₹ ${netNum}`,
      totalAmount: netNum,
      grossCharges: grossNum,
      amountPaid: paidNum.toString(),
      paidAmount: paidNum,
      dueBalance: dueNum,
      paymentMethod: savedPaymentMethod,
      paymentBreakdown: splitBreakdown,
      paymentHistory: initialHistoryEntry,
      paymentStatus: payStatus,
      selectedUpiHandle: selectedMethods.UPI ? selectedUpiHandle : null,
      upiTxnId: selectedMethods.UPI ? upiTxnId : null,
      receiptImage: isPayLater ? null : (receiptImage || null),
      branch: assignedBranch,
      branchCode: assignedCode,
    };

    const token = localStorage.getItem('kh_auth_token');
    let savedObj = opRecord;

    try {
      const res = await fetch('/api/v1/op-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(opRecord),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        savedObj = {
          ...data.data,
          id: data.data.regNo || data.data.id || opNumber,
          patient: data.data.patientName || opRecord.patient,
          amount: `₹ ${data.data.netAmount !== undefined ? data.data.netAmount : (data.data.charges || charges)}`,
        };
        notify && notify(`OP Record ${savedObj.regNo} saved to MongoDB!`);
      }
    } catch (err) {
      console.warn('Backend OP Record registration offline fallback:', err.message);
    }

    onSave(savedObj);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Hospital Patient Registration</div>
          <h1>Add Record</h1>
          <p>Select Form Type (OP, IP, Surgery, Operation, Emergency, Other) and enter patient details.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Back to All Records
          </button>
        </div>
      </div>

      {/* ULTRA-COMPACT HORIZONTAL SECTION-WISE LAYOUT (FIT ON SCREEN WITHOUT SCROLLING DOWN) */}
      <form
        onSubmit={handleSubmit}
        className="dashboard-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '16px',
          width: '100%',
          boxSizing: 'border-box',
          alignItems: 'start',
        }}
      >
        {/* Panel 1: Horizontal Registration & Patient Information (Left Box / Column) */}
        <section className="panel" style={{ display: 'grid', gap: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #edf2f8', paddingBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', color: '#1a3354', fontWeight: '800' }}>1. Registration & Patient Details</h3>
            <button
              type="button"
              className="text-button"
              onClick={() => setOpNumber(generateUniqueOpNo())}
              style={{ fontSize: '10px' }}
            >
              Generate Unique Reg No
            </button>
          </div>

          {/* Auto-Fetch Confirmation Feedback Banner */}
          {autoFetchMsg && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 12px', borderRadius: '8px', color: '#15803d', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(21, 128, 61, 0.08)' }}>
              <UserCheck size={18} color="#15803d" />
              <span style={{ flex: 1 }}>{autoFetchMsg}</span>
            </div>
          )}

          <div style={{ display: 'grid', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
            {/* Hospital Branch Campus Selection */}
            <div className="field">
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#1769d7' }}>Hospital Branch Campus *</span>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                style={{ padding: '9px 10px', border: '1px solid #b8d5f7', borderRadius: '7px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
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

            {/* Row 1: Record Type & Reg Number */}
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
              {/* Record Type / Form Type */}
              <div className="field">
                <span style={{ color: '#0284c7', fontSize: '11px', fontWeight: '800' }}>Record Type (Form Type) *</span>
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value)}
                  style={{ padding: '9px 10px', border: '1px solid #0284c7', borderRadius: '7px', background: '#f0f9ff', fontWeight: '800', color: '#0284c7', fontSize: '12px', cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}
                >
                  <option value="OP">🔵 OP (Outpatient)</option>
                  <option value="IP">🟣 IP (Inpatient)</option>
                  <option value="Surgery">🔪 Surgery</option>
                  <option value="Emergency">⚡ Emergency</option>
                </select>
                {/* CONDITIONAL SPECIFY IP DETAILS FIELD */}
                {recordType === 'IP' && (
                  <div style={{ marginTop: '6px' }}>
                    <input
                      value={ipCareDetails}
                      onChange={(e) => setIpCareDetails(e.target.value)}
                      placeholder="Specify IP Care (e.g. Treatment, Ward, ICU)"
                      required
                      style={{ padding: '8px 10px', border: '1px solid #c084fc', borderRadius: '6px', background: '#f3e8ff', fontSize: '11px', fontWeight: '700', color: '#6b21a8', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
                {/* CONDITIONAL SPECIFY SURGERY NAME FIELD */}
                {recordType === 'Surgery' && (
                  <div style={{ marginTop: '6px' }}>
                    <input
                      value={surgeryName}
                      onChange={(e) => setSurgeryName(e.target.value)}
                      placeholder="Enter Surgery Name (e.g. Appendectomy, Cataract, Orthopedic)"
                      required
                      style={{ padding: '8px 10px', border: '1px solid #f43f5e', borderRadius: '6px', background: '#fff1f2', fontSize: '11px', fontWeight: '700', color: '#be123c', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
              </div>

              {/* OP / Reg Number */}
              <div className="field">
                <span style={{ color: '#1769d7', fontSize: '11px', fontWeight: '700' }}>Reg Number *</span>
                <input
                  value={opNumber}
                  onChange={(e) => handleOpNumberInputChange(e.target.value)}
                  placeholder="OPD-0001"
                  required
                  style={{ padding: '9px 10px', border: '1px solid #b8d5f7', borderRadius: '7px', fontWeight: '700', color: '#1769d7', background: '#f4f8fe', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Row 2: Patient Name */}
            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '11px', fontWeight: '700' }}>Patient Full Name *</span>
              <input
                list="patient-lookup-list"
                value={patientName}
                onChange={(e) => handlePatientSelect(e.target.value)}
                placeholder="Full name"
                required
                autoFocus
                style={{ padding: '9px 10px', border: '1px solid #dde7f1', borderRadius: '7px', background: '#fff', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
              />
              <datalist id="patient-lookup-list">
                {patients.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>

            {/* Row 2: Reg Date & Time & MOBILE NUMBER DIRECTLY BELOW REG DATE TIME */}
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
              {/* Reg Date & Time */}
              <div className="field">
                <span style={{ color: '#4a5e7a', fontSize: '10px', fontWeight: '700' }}>Reg Date & Time *</span>
                <div style={{ display: 'flex', gap: '4px', width: '100%', boxSizing: 'border-box' }}>
                  <input
                    type="date"
                    value={regDate}
                    onChange={(e) => setRegDate(e.target.value)}
                    required
                    style={{ padding: '8px 4px', border: '1px solid #dde7f1', borderRadius: '6px', fontSize: '10px', background: '#fff', flex: 1, minWidth: 0, width: '100%', boxSizing: 'border-box' }}
                  />
                  <input
                    value={regTime}
                    onChange={(e) => setRegTime(e.target.value)}
                    required
                    style={{ padding: '8px 4px', border: '1px solid #dde7f1', borderRadius: '6px', fontSize: '10px', background: '#fff', width: '70px', minWidth: 0, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Mobile / Phone Number (POSITIONED DIRECTLY BELOW REG DATE TIME) */}
              <div className="field">
                <span style={{ color: '#1769d7', fontSize: '10px', fontWeight: '700' }}>Mobile / Phone No (Auto-fetch) *</span>
                <input
                  value={phone}
                  onChange={(e) => handlePhoneInputChange(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  required
                  style={{ padding: '8px 10px', border: '1px solid #b8d5f7', borderRadius: '6px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Row 3: Gender, Age, DOB */}
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
              <div className="field">
                <span style={{ color: '#4a5e7a', fontSize: '10px', fontWeight: '700' }}>Gender</span>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{ padding: '8px 6px', border: '1px solid #dde7f1', borderRadius: '6px', background: '#fff', fontSize: '11px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="field">
                <span style={{ color: '#4a5e7a', fontSize: '10px', fontWeight: '700' }}>Age (Yrs)</span>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  style={{ padding: '8px 6px', border: '1px solid #dde7f1', borderRadius: '6px', fontSize: '11px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}
                />
              </div>

              <div className="field">
                <span style={{ color: '#4a5e7a', fontSize: '10px', fontWeight: '700' }}>Date of Birth</span>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  style={{ padding: '8px 6px', border: '1px solid #dde7f1', borderRadius: '6px', background: '#fff', fontSize: '10px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Row 4: Address */}
            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '10px', fontWeight: '700' }}>Residential Address</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House/Plot No, Street, City"
                style={{ padding: '8px 10px', border: '1px solid #dde7f1', borderRadius: '6px', fontSize: '11px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </section>

        {/* Panel 2: Clinical Vitals (Middle Box / Column) */}
        <section className="panel" style={{ display: 'grid', gap: '12px', padding: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '13px', color: '#1a3354', fontWeight: '800', borderBottom: '1px solid #edf2f8', paddingBottom: '8px' }}>
            2. Recorded Clinical Vitals
          </h3>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
            <div className="field">
              <span style={{ fontSize: '10px', color: '#4a5e7a', fontWeight: '700' }}>Temperature (°F)</span>
              <input value={temp} onChange={(e) => setTemp(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #dde7f1', borderRadius: '6px', fontSize: '12px' }} />
            </div>

            <div className="field">
              <span style={{ fontSize: '10px', color: '#4a5e7a', fontWeight: '700' }}>Weight (kg)</span>
              <input value={weight} onChange={(e) => setWeight(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #dde7f1', borderRadius: '6px', fontSize: '12px' }} />
            </div>

            <div className="field">
              <span style={{ fontSize: '10px', color: '#4a5e7a', fontWeight: '700' }}>Height (cm)</span>
              <input value={height} onChange={(e) => setHeight(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #dde7f1', borderRadius: '6px', fontSize: '12px' }} />
            </div>

            <div className="field">
              <span style={{ fontSize: '10px', color: '#1769d7', fontWeight: '700' }}>Calculated BMI</span>
              <input value={calcBmi()} disabled style={{ padding: '8px 10px', border: '1px solid #b8d5f7', borderRadius: '6px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7', fontSize: '12px' }} />
            </div>

            <div className="field">
              <span style={{ fontSize: '10px', color: '#4a5e7a', fontWeight: '700' }}>Blood Group</span>
              <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} style={{ padding: '8px 6px', border: '1px solid #dde7f1', borderRadius: '6px', background: '#fff', fontSize: '11px' }}>
                <option>O+</option>
                <option>A+</option>
                <option>B+</option>
                <option>AB+</option>
                <option>O-</option>
                <option>A-</option>
                <option>B-</option>
                <option>AB-</option>
              </select>
            </div>

            <div className="field">
              <span style={{ fontSize: '10px', color: '#4a5e7a', fontWeight: '700' }}>Blood Pressure (BP)</span>
              <input value={bp} onChange={(e) => setBp(e.target.value)} placeholder="120/80" style={{ padding: '8px 10px', border: '1px solid #dde7f1', borderRadius: '6px', fontSize: '12px' }} />
            </div>
          </div>
        </section>

        {/* Panel 3: Department, Doctor & Billing Info (Right Box / Column) */}
        <section className="panel" style={{ display: 'grid', gap: '12px', padding: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '13px', color: '#1a3354', fontWeight: '800', borderBottom: '1px solid #edf2f8', paddingBottom: '8px' }}>
            3. Department, Doctor & Billing
          </h3>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '10px', fontWeight: '700' }}>Department *</span>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} style={{ padding: '8px 6px', border: '1px solid #dde7f1', borderRadius: '6px', background: '#fff', fontSize: '11px', width: '100%', boxSizing: 'border-box' }}>
                <option>General medicine</option>
                <option>Internal medicine</option>
                <option>Cardiology</option>
                <option>Pediatrics</option>
                <option>Orthopedics</option>
                <option>Dermatology</option>
              </select>
            </div>

            <div className="field">
              <span style={{ color: '#1769d7', fontSize: '10px', fontWeight: '700' }}>Assigned Doctor *</span>
              <select
                value={doctor}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  setDoctor(selectedName);
                  const docObj = availableDoctors.find((d) => d.name === selectedName);
                  if (docObj && docObj.department) {
                    setDepartment(docObj.department);
                  }
                }}
                style={{ padding: '8px 6px', border: '1px solid #b8d5f7', borderRadius: '6px', background: '#fff', fontWeight: '700', color: '#1769d7', fontSize: '11px', width: '100%', boxSizing: 'border-box' }}
              >
                {(() => {
                  const targetBranch = effectiveBranch === 'All' ? selectedBranch : effectiveBranch;
                  const normalizeStr = (str) => (str || '').toLowerCase().replace(/\s+/g, ' ').trim();
                  const tb = normalizeStr(targetBranch);

                  const strictBranchDocs = availableDoctors.filter((doc) => {
                    if (!tb || tb === 'all') return true;
                    const db = normalizeStr(doc.branch || doc.branchCode);
                    return db === tb || db.includes(tb) || tb.includes(db);
                  });

                  if (strictBranchDocs.length > 0) {
                    return strictBranchDocs.map((doc) => (
                      <option key={doc.id || doc._id || doc.name} value={doc.name}>
                        {doc.name} ({doc.department || 'Specialist'})
                      </option>
                    ));
                  }

                  return <option value="">No doctors registered for {targetBranch || 'this branch'}</option>;
                })()}
              </select>
            </div>

            {/* Fee (Gross ₹) Editable Input */}
            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '10px', fontWeight: '700' }}>Gross Fee (₹) *</span>
              <input
                type="number"
                step="any"
                value={charges}
                onChange={(e) => handleFeeChargesChange(e.target.value)}
                required
                style={{ padding: '8px 10px', border: '1px solid #dde7f1', borderRadius: '6px', fontWeight: '800', fontSize: '12px', color: '#1769d7', background: '#f4f8fe', width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Discount Amount (₹) Input (Default: 0.00) */}
            <div className="field">
              <span style={{ color: '#dc2626', fontSize: '10px', fontWeight: '700' }}>Discount Amount (₹)</span>
              <input
                type="number"
                step="any"
                min="0"
                value={discount}
                onChange={(e) => handleDiscountChange(e.target.value)}
                placeholder="0.00"
                style={{ padding: '8px 10px', border: '1px solid #fca5a5', borderRadius: '6px', fontWeight: '800', fontSize: '12px', color: '#dc2626', background: '#fef2f2', width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Net Amount Payable (Read-only Calculation) */}
            <div className="field">
              <span style={{ color: '#15803d', fontSize: '10px', fontWeight: '800' }}>Final Net Payable (₹)</span>
              <input
                type="number"
                disabled
                value={netPayableNum}
                style={{ padding: '8px 10px', border: '1px solid #86efac', borderRadius: '6px', fontWeight: '800', fontSize: '12px', color: '#15803d', background: '#f0fdf4', width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div className="field">
              <span style={{ color: '#1769d7', fontSize: '10px', fontWeight: '700' }}>Visit Validity (Days)</span>
              <input
                type="number"
                min="1"
                max="365"
                value={visitValidity}
                onChange={(e) => setVisitValidity(e.target.value)}
                style={{ padding: '8px 10px', border: '1px solid #b8d5f7', borderRadius: '6px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* MULTI-SELECT PAYMENT METHOD CHECKBOXES & SPLIT AMOUNTS */}
            <div className="field" style={{ gridColumn: '1 / -1', borderTop: '1px solid #edf2f7', paddingTop: '10px' }}>
              <span style={{ color: '#0f2d55', fontSize: '11px', fontWeight: '800', display: 'block', marginBottom: '8px' }}>
                Payment Method *
              </span>

              {/* CHECKBOXES ROW */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dde7f1', marginBottom: '12px' }}>
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
                    ⚡ Auto-Set Net Fee (₹ {netPayableNum})
                  </button>
                </div>
              )}
            </div>

            {/* CONDITIONAL UPI HANDLES DROPDOWN */}
            {selectedMethods.UPI && (
              <>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
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

                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#4a5e7a', fontSize: '10px', fontWeight: '700' }}>UPI Transaction Ref ID (Optional)</span>
                  <input
                    value={upiTxnId}
                    onChange={(e) => setUpiTxnId(e.target.value)}
                    placeholder="e.g. 402918239102"
                    style={{ padding: '8px 10px', border: '1px solid #dde7f1', borderRadius: '6px', fontSize: '11px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            {/* CONDITIONAL PAY LATER WARNING BANNER */}
            {selectedMethods['Pay Later'] && (
              <div style={{ gridColumn: '1 / -1', background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 12px', borderRadius: '8px', fontSize: '11px', color: '#b45309', fontWeight: '700' }}>
                ⚠️ Pay Later Selected: Patient registered without upfront payment collection. Complete fee (₹{charges}) will be billed for post-consultation settlement.
              </div>
            )}

            {/* OPTIONAL RECEIPT / PROOF PHOTO UPLOAD FOR IMMEDIATE PAYMENT MODES */}
            {!selectedMethods['Pay Later'] && (
              <div className="field" style={{ gridColumn: '1 / -1', borderTop: '1px solid #edf2f7', paddingTop: '10px', marginTop: '4px' }}>
                <span style={{ color: '#4a5e7a', fontSize: '10px', fontWeight: '700' }}>Payment Receipt / Voucher Image (Optional)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <label className="secondary-button" style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', gap: '6px' }}>
                    <Upload size={14} /> Upload Receipt Picture (Optional)
                    <input type="file" accept="image/*" onChange={handleReceiptImageUpload} style={{ display: 'none' }} />
                  </label>
                  {receiptImage ? (
                    <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> {receiptImageName || 'Receipt Picture Attached'}
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', color: '#64748b' }}>No receipt picture selected (Optional)</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" className="secondary-button" onClick={onCancel} style={{ padding: '8px 14px', fontSize: '12px' }}>
              Cancel
            </button>
            <button type="submit" className="primary-button" style={{ gap: '6px', padding: '8px 16px', fontSize: '12px' }}>
              <Plus size={15} /> Save OP Record
            </button>
          </div>
        </section>
      </form>
    </>
  );
}

export default CreateOPRecordForm;
