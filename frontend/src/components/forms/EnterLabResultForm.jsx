import React, { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { initialLabTests, initialOPRecords, initialMasterLabServices } from '../data/initialData';

// Preset generator helper for sub-parameter rows (Leaves results blank for real entry)
const getInitialRowsForTest = (testName) => {
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
    { id: 1, name: testName || 'Diagnostic Finding', result: '', normalRange: 'Standard Reference' },
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
  const [doctor, setDoctor] = useState(initialSelectedTest?.doctor || initialSelectedTest?.orderingDoctor || 'Dr. Unassigned');
  const [status, setStatus] = useState(initialSelectedTest?.status || 'Sample collected');
  const [autoFetchSuccess, setAutoFetchSuccess] = useState(false);

  // Auto-fetch branch-scoped next Lab Record Number starting from LAB-0001 from backend
  React.useEffect(() => {
    if (!initialSelectedTest) {
      const targetBranch = effectiveBranch === 'All' ? (branchesList[0]?.name || 'Central Campus') : effectiveBranch;
      const branchQuery = targetBranch ? `?branch=${encodeURIComponent(targetBranch)}` : '';

      fetch(`http://localhost:5000/api/v1/laboratory/next-labno${branchQuery}`)
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

    fetch(`http://localhost:5000/api/v1/doctors${branchQuery}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setAvailableDoctors(data.data);
          if (!initialSelectedTest?.doctor && (doctor === 'Dr. Meera Nair' || doctor === 'Dr. Unassigned')) {
            setDoctor(data.data[0].name);
          }
        }
      })
      .catch((err) => console.warn('Could not fetch doctors in EnterLabResultForm:', err.message));
  }, [effectiveBranch, branchesList, initialSelectedTest]);

  // Main Test Name (Selected from Admin Catalogue)
  const initialMainTest = initialSelectedTest?.test || (masterServices[0]?.name || 'Complete blood count');
  const [testName, setTestName] = useState(initialMainTest);

  // Dynamic Multi-Row Sub-Parameter State (e.g. T1, T2, T3, T4, TSH)
  const [testRows, setTestRows] = useState(
    initialSelectedTest?.testRows && initialSelectedTest.testRows.length > 0
      ? initialSelectedTest.testRows
      : getInitialRowsForTest(initialMainTest)
  );

  const [notes, setNotes] = useState(initialSelectedTest?.notes || '');

  // Lab Fee & Upfront Payment State
  const initialFee = initialSelectedTest?.amount || (parseFloat(masterServices.find(s => s.name === initialMainTest)?.rate) || 1200);
  const [testFee, setTestFee] = useState(initialFee.toString());
  const [amountPaidNow, setAmountPaidNow] = useState(initialSelectedTest?.paidAmount ? initialSelectedTest.paidAmount.toString() : initialFee.toString());
  const [paymentMethod, setPaymentMethod] = useState(initialSelectedTest?.paymentMethod || 'Cash');

  // Handle Main Test Selection -> Auto-populate presets & rates
  const handleMainTestChange = (selectedName) => {
    setTestName(selectedName);
    setTestRows(getInitialRowsForTest(selectedName));
    const foundSrv = masterServices.find(s => s.name === selectedName);
    if (foundSrv && foundSrv.rate) {
      const rateStr = parseFloat(foundSrv.rate).toString();
      setTestFee(rateStr);
      setAmountPaidNow(rateStr);
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

    const feeNum = parseFloat(testFee) || 1200;
    const paidNum = parseFloat(amountPaidNow) || 0;
    const dueNum = Math.max(0, feeNum - paidNum);
    const payStatus = dueNum <= 0 ? 'Paid' : paidNum > 0 ? 'Partial' : 'Pay Later (Pending)';

    // Format main result summary string for cards
    const summaryResult = testRows
      .map((r) => `${r.name}: ${r.result}`)
      .filter(Boolean)
      .join(', ');

    const targetBranch = effectiveBranch === 'All' ? (branchesList[0]?.name || 'Central Campus') : effectiveBranch;
    const isSelfCreated = !initialSelectedTest?.opNumber || opNumber.startsWith('LAB-');

    const payload = {
      id: initialSelectedTest?.id || initialSelectedTest?._id || opNumber.trim(),
      labOrderNo: opNumber.trim(),
      opNumber: opNumber.trim(),
      patient: patientName.trim(),
      patientName: patientName.trim(),
      phone: phone.trim(),
      doctor: 'Self Created / Walk-In',
      orderingDoctor: 'Self Created / Walk-In',
      test: testName.trim(),
      testName: testName.trim(),
      amount: feeNum,
      testFee: feeNum.toString(),
      paidAmount: paidNum,
      amountPaid: paidNum.toString(),
      dueBalance: dueNum,
      paymentStatus: payStatus,
      paymentMethod,
      result: summaryResult || 'Pathology Report Available',
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
      const res = await fetch('http://localhost:5000/api/v1/laboratory', {
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
              {masterServices.map((srv) => (
                <option key={srv.id || srv.name} value={srv.name}>
                  {srv.name} (Master Rate: ₹ {srv.rate})
                </option>
              ))}
            </select>
          </div>

          {/* Test Fee & Upfront Payment Section */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '9px', border: '1px solid #e2e8f0', display: 'grid', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
              <div className="field">
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#dc2626' }}>Test Fee Total Amount (₹) *</span>
                <input
                  type="number"
                  value={testFee}
                  onChange={(e) => {
                    setTestFee(e.target.value);
                    setAmountPaidNow(e.target.value);
                  }}
                  required
                  placeholder="Test fee..."
                  style={{ padding: '10px 12px', border: '1px solid #fca5a5', borderRadius: '7px', fontSize: '14px', fontWeight: '800', color: '#dc2626', background: '#fef2f2', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#15803d' }}>Amount Collecting Now (₹)</span>
                  <button
                    type="button"
                    onClick={() => setAmountPaidNow(testFee)}
                    style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: '800' }}
                  >
                    ⚡ Pay Full Amount (₹ {testFee})
                  </button>
                </div>
                <input
                  type="number"
                  value={amountPaidNow}
                  onChange={(e) => setAmountPaidNow(e.target.value)}
                  placeholder="Amount collecting..."
                  style={{ padding: '10px 12px', border: '1px solid #86efac', borderRadius: '7px', fontSize: '14px', fontWeight: '800', color: '#15803d', background: '#f0fdf4', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div className="field">
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Payment Mode *</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
              >
                <option value="Cash">Cash</option>
                <option value="UPI / Online">UPI / QR Payment</option>
                <option value="Credit / Debit Card">Credit / Debit Card</option>
                <option value="Pay Later (Pending)">Pay Later (Post-Pay)</option>
              </select>
            </div>
          </div>

          {/* DYNAMIC MULTI-ROW SUB-PARAMETER BUILDER (T1, T2, T3, T4, TSH, Hb, etc.) */}
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
