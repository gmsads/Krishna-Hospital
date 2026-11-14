import React, { useState } from 'react';
import { Save, Plus, Trash2, X, FlaskConical, Eye, CheckCircle2 } from 'lucide-react';
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

// Comprehensive helper to reliably restore and prefill sub-parameter rows for ALL tests in an order
const resolveAllTestRows = (testObj, primaryTestName, extraTestsList = [], services = []) => {
  const allTestNames = [];
  if (primaryTestName && primaryTestName.trim()) {
    allTestNames.push(primaryTestName.trim());
  }
  extraTestsList.forEach((et) => {
    const tName = typeof et === 'string' ? et.trim() : (et?.name || et?.test || '').trim();
    if (tName && !allTestNames.includes(tName)) {
      allTestNames.push(tName);
    }
  });

  if (testObj?.test && testObj.test.includes(' + ')) {
    testObj.test.split(' + ').map((s) => s.trim()).filter(Boolean).forEach((tName) => {
      if (!allTestNames.includes(tName)) allTestNames.push(tName);
    });
  } else if (Array.isArray(testObj?.testsList) && testObj.testsList.length > 0) {
    testObj.testsList.forEach((t) => {
      const tName = typeof t === 'string' ? t.trim() : (t?.name || t?.test || '').trim();
      if (tName && !allTestNames.includes(tName)) allTestNames.push(tName);
    });
  }

  if (allTestNames.length === 0) {
    if (services.length > 0 && services[0]?.name) {
      allTestNames.push(services[0].name);
    } else {
      allTestNames.push('Standard Lab Investigation');
    }
  }

  const existingRows = (Array.isArray(testObj?.testRows) && testObj.testRows.length > 0)
    ? testObj.testRows
    : (Array.isArray(testObj?.results?.testRows) && testObj.results.testRows.length > 0)
    ? testObj.results.testRows
    : [];

  const resultStr = testObj?.result || testObj?.results?.summaryResult || testObj?.results?.result || '';
  let parsedMap = {};
  if (resultStr && typeof resultStr === 'string' && resultStr !== 'Pathology Report Available') {
    const pairs = resultStr.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
    pairs.forEach((p) => {
      const parts = p.split(':');
      if (parts.length >= 2) {
        const k = parts[0].replace(/^\[.*?\/\s*/, '').trim().toLowerCase();
        const v = parts.slice(1).join(':').trim();
        parsedMap[k] = v;
      }
    });
  }

  let finalRows = [];
  allTestNames.forEach((tName, tIdx) => {
    const matched = existingRows.filter((r) => 
      (r.testSource && r.testSource.toLowerCase() === tName.toLowerCase()) ||
      (!r.testSource && allTestNames.length === 1) ||
      (!r.testSource && tIdx === 0)
    );

    if (matched.length > 0) {
      matched.forEach((r) => {
        finalRows.push({
          ...r,
          testSource: tName,
          result: r.result || parsedMap[(r.name || '').trim().toLowerCase()] || '',
        });
      });
    } else {
      const defRows = getInitialRowsForTest(tName, services);
      defRows.forEach((r, idx) => {
        const rowKey = (r.name || '').trim().toLowerCase();
        const matchedVal = parsedMap[rowKey] || Object.entries(parsedMap).find(([k]) => rowKey.includes(k) || k.includes(rowKey))?.[1];
        finalRows.push({
          ...r,
          id: Date.now() + tIdx * 100 + idx + Math.random(),
          result: matchedVal || r.result || '',
          testSource: tName,
        });
      });
    }
  });

  return finalRows.length > 0 ? finalRows : getInitialRowsForTest(allTestNames[0], services);
};

const resolveExistingRows = resolveAllTestRows;

export function EnterLabResultForm({
  tests = [],
  opRecords = [],
  patients = [],
  masterServices = [],
  initialSelectedTest = null,
  effectiveBranch = 'All',
  branchesList = [],
  userRole = '',
  userName = '',
  onSave,
  onCancel,
  notify,
}) {
  const [selectedTestId, setSelectedTestId] = useState(initialSelectedTest?.id || '');

  // Patient & Doctor Form State (No hardcoded mock data)
  const initialLabNo = initialSelectedTest?.labOrderNo || (initialSelectedTest?.id?.startsWith('LAB-') ? initialSelectedTest.id : '');
  const [opNumber, setOpNumber] = useState(initialLabNo || initialSelectedTest?.opNumber || 'LAB-0001');
  const [patientOpNumber, setPatientOpNumber] = useState(initialSelectedTest?.opNumber || '');
  const [patientName, setPatientName] = useState(initialSelectedTest?.patientName || initialSelectedTest?.patient || '');
  const [phone, setPhone] = useState(initialSelectedTest?.phone || '');
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [doctor, setDoctor] = useState(
    (initialSelectedTest?.doctor && initialSelectedTest.doctor !== 'Self Created / Walk-In')
      ? initialSelectedTest.doctor
      : (initialSelectedTest?.orderingDoctor && initialSelectedTest.orderingDoctor !== 'Self Created / Walk-In')
      ? initialSelectedTest.orderingDoctor
      : ''
  );
  const [status, setStatus] = useState(initialSelectedTest?.status || 'Sample collected');
  const [autoFetchSuccess, setAutoFetchSuccess] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

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
  const initialMainTest = (() => {
    if (initialSelectedTest?.test) {
      const parts = initialSelectedTest.test.split(' + ');
      return parts[0].trim();
    }
    return masterServices[0]?.name || '';
  })();
  const [testName, setTestName] = useState(initialMainTest);

  // Additional ordered tests in this lab order (e.g. CBC + Blood Sugar + Lipid Profile)
  const [additionalTests, setAdditionalTests] = useState(() => {
    if (Array.isArray(initialSelectedTest?.testsList) && initialSelectedTest.testsList.length > 1) {
      return initialSelectedTest.testsList.slice(1);
    }
    if (initialSelectedTest?.test && initialSelectedTest.test.includes(' + ')) {
      const parts = initialSelectedTest.test.split(' + ').map((s) => s.trim());
      return parts.slice(1).map((name) => {
        const srv = masterServices.find((s) => s.name === name);
        return { name, fee: parseFloat(srv?.rate) || 0 };
      });
    }
    return [];
  });
  const [selectedExtraTest, setSelectedExtraTest] = useState('');

  // Dynamic Multi-Row Sub-Parameter State (e.g. T1, T2, T3, T4, TSH)
  const [testRows, setTestRows] = useState(() =>
    resolveAllTestRows(initialSelectedTest, initialMainTest, initialSelectedTest?.testsList || [], masterServices)
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

  // Lab Fee, Discount & Upfront Payment State
  const initialFee = initialSelectedTest?.grossFee || initialSelectedTest?.amount || (parseFloat(masterServices.find(s => s.name === initialMainTest)?.rate) || 0);
  const [testFee, setTestFee] = useState(initialFee.toString());
  const [discount, setDiscount] = useState(
    initialSelectedTest?.discount != null ? initialSelectedTest.discount.toString() : '0.00'
  );

  const grossFeeNum = parseFloat(String(testFee || '0').replace(/[^0-9.]/g, '')) || 0;
  const discountNum = parseFloat(String(discount || '0').replace(/[^0-9.]/g, '')) || 0;
  const netPayableNum = Math.max(0, grossFeeNum - discountNum);

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

  // EDITABLE FEE & DISCOUNT HANDLERS
  const handleFeeChargesChange = (val) => {
    setTestFee(val);
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
    const currentGross = parseFloat(String(testFee || '0').replace(/[^0-9.]/g, '')) || 0;
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

  // MULTI-SELECT PAYMENT TOGGLE (Exact Match to OP Record)
  const togglePaymentMethod = (modeKey) => {
    setSelectedMethods((prev) => {
      if (modeKey === 'Free') {
        const isCurrentlySelected = prev['Free'];
        if (!isCurrentlySelected) {
          setSplitAmounts((prevSplits) => ({
            ...prevSplits,
            Free: netPayableNum.toString(),
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
            [modeKey]: modeKey === 'Cash' && !prev[modeKey] ? netPayableNum.toString() : '0',
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
    : selectedMethods['Free']
    ? netPayableNum
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
      const resolvedLabNo = initialSelectedTest.labOrderNo || (initialSelectedTest.id?.startsWith('LAB-') ? initialSelectedTest.id : '');
      if (resolvedLabNo || initialSelectedTest.opNumber) {
        setOpNumber(resolvedLabNo || initialSelectedTest.opNumber);
      }
      if (initialSelectedTest.opNumber) {
        setPatientOpNumber(initialSelectedTest.opNumber);
      }
      if (initialSelectedTest.patientName || initialSelectedTest.patient) {
        setPatientName(initialSelectedTest.patientName || initialSelectedTest.patient);
      }
      
      let ph = initialSelectedTest.phone || '';
      if (!ph) {
        const query = (initialSelectedTest.opNumber || initialSelectedTest.labOrderNo || initialSelectedTest.regNo || initialSelectedTest.id || '').toLowerCase();
        const nameQuery = (initialSelectedTest.patientName || initialSelectedTest.patient || '').toLowerCase();
        const found = opRecords.find(
          (r) => (r.id && r.id.toLowerCase() === query) || (r.regNo && r.regNo.toLowerCase() === query) || (nameQuery && r.patient && r.patient.toLowerCase() === nameQuery)
        ) || patients.find(
          (p) => (p.id && p.id.toLowerCase() === query) || (nameQuery && p.name && p.name.toLowerCase() === nameQuery)
        );
        if (found && (found.phone || found.mobile || found.contact)) {
          ph = found.phone || found.mobile || found.contact;
        }
      }
      if (ph) setPhone(ph);

      if (initialSelectedTest.doctor || initialSelectedTest.orderingDoctor) {
        const d = initialSelectedTest.doctor || initialSelectedTest.orderingDoctor;
        setDoctor(d === 'Self Created / Walk-In' ? '' : d);
      }
      if (initialSelectedTest.status) {
        setStatus(initialSelectedTest.status);
      }
      if (initialSelectedTest.test || initialSelectedTest.testName) {
        const rawTName = initialSelectedTest.test || initialSelectedTest.testName;
        if (rawTName.includes(' + ')) {
          const parts = rawTName.split(' + ').map((s) => s.trim());
          setTestName(parts[0]);
          const extras = parts.slice(1).map((name) => {
            const srv = masterServices.find((s) => s.name === name);
            return { name, fee: parseFloat(srv?.rate) || 0 };
          });
          setAdditionalTests(extras);
          setTestRows(resolveAllTestRows(initialSelectedTest, parts[0], extras, masterServices));
        } else if (Array.isArray(initialSelectedTest.testsList) && initialSelectedTest.testsList.length > 1) {
          const primary = initialSelectedTest.testsList[0].name || rawTName;
          const extras = initialSelectedTest.testsList.slice(1);
          setTestName(primary);
          setAdditionalTests(extras);
          setTestRows(resolveAllTestRows(initialSelectedTest, primary, extras, masterServices));
        } else {
          setTestName(rawTName);
          setAdditionalTests([]);
          setTestRows(resolveAllTestRows(initialSelectedTest, rawTName, [], masterServices));
        }
      }
      if (initialSelectedTest.notes || initialSelectedTest.clinicalNotes) {
        setNotes(initialSelectedTest.notes || initialSelectedTest.clinicalNotes);
      }
      if (initialSelectedTest.discount != null) {
        setDiscount(initialSelectedTest.discount.toString());
      }
      if (initialSelectedTest.grossFee || initialSelectedTest.amount || initialSelectedTest.testFee) {
        const fee = initialSelectedTest.grossFee || initialSelectedTest.amount || parseFloat(initialSelectedTest.testFee) || 1200;
        setTestFee(fee.toString());
        const disc = parseFloat(initialSelectedTest.discount || 0) || 0;
        const net = Math.max(0, fee - disc);
        const paid = typeof initialSelectedTest.paidAmount === 'number' ? initialSelectedTest.paidAmount : (parseFloat(initialSelectedTest.amountPaid) || net);
        
        const method = initialSelectedTest.paymentMethod || 'Cash';
        if (method.includes('Free')) {
          setSelectedMethods({ Cash: false, UPI: false, Card: false, Cheque: false, 'Bank Transfer': false, Free: true, Others: false, 'Pay Later': false });
          setSplitAmounts((prev) => ({ ...prev, Free: net.toString() }));
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
    const mainRows = getInitialRowsForTest(selectedName, masterServices).map(r => ({ ...r, testSource: selectedName }));
    const extraRows = testRows.filter((r) => r.testSource && r.testSource !== testName);
    setTestRows([...mainRows, ...extraRows]);

    const foundSrv = masterServices.find(s => s.name === selectedName);
    const baseRate = foundSrv && foundSrv.rate ? (parseFloat(foundSrv.rate) || 0) : 0;
    const extraTotalFee = additionalTests.reduce((sum, t) => sum + (parseFloat(t.fee) || 0), 0);
    const totalGross = baseRate + extraTotalFee;
    setTestFee(totalGross.toString());

    const currentDisc = parseFloat(String(discount || '0').replace(/[^0-9.]/g, '')) || 0;
    const newNet = Math.max(0, totalGross - currentDisc);
    const activeKeys = Object.keys(selectedMethods).filter((k) => selectedMethods[k] && k !== 'Pay Later');
    if (activeKeys.length === 1) {
      setSplitAmounts((prev) => ({
        ...prev,
        [activeKeys[0]]: newNet.toString(),
      }));
    }
  };

  // Add Another Test / Service to the Order (e.g. CBC + Sugar + Lipid)
  const handleAddExtraTest = () => {
    if (!selectedExtraTest) return;
    if (selectedExtraTest === testName || additionalTests.some((t) => t.name === selectedExtraTest)) {
      notify && notify(`${selectedExtraTest} is already added to this lab order.`);
      return;
    }

    const srv = masterServices.find((s) => s.name === selectedExtraTest);
    const addedFee = parseFloat(srv?.rate) || 0;
    const newTestObj = {
      name: selectedExtraTest,
      fee: addedFee,
    };

    setAdditionalTests((prev) => [...prev, newTestObj]);

    // Append new sub-parameter rows for this additional test
    const newRows = getInitialRowsForTest(selectedExtraTest, masterServices).map((row, idx) => ({
      ...row,
      id: Date.now() + idx + Math.random(),
      testSource: selectedExtraTest,
    }));

    setTestRows((prev) => [...prev, ...newRows]);

    // Update test fee by adding the new test rate
    const currentGross = parseFloat(String(testFee || '0').replace(/[^0-9.]/g, '')) || 0;
    const newGross = currentGross + addedFee;
    setTestFee(newGross.toString());

    // Update split amount if single payment mode
    const currentDisc = parseFloat(String(discount || '0').replace(/[^0-9.]/g, '')) || 0;
    const newNet = Math.max(0, newGross - currentDisc);
    const activeKeys = Object.keys(selectedMethods).filter((k) => selectedMethods[k] && k !== 'Pay Later');
    if (activeKeys.length === 1) {
      setSplitAmounts((prev) => ({
        ...prev,
        [activeKeys[0]]: newNet.toString(),
      }));
    }

    setSelectedExtraTest('');
    notify && notify(`✓ Added ${selectedExtraTest} (₹${addedFee}) to this lab record!`);
  };

  // Remove an added Extra Test from the Order
  const handleRemoveExtraTest = (testNameToRemove) => {
    const target = additionalTests.find((t) => t.name === testNameToRemove);
    const feeToDeduct = target?.fee || 0;

    setAdditionalTests((prev) => prev.filter((t) => t.name !== testNameToRemove));
    setTestRows((prev) => prev.filter((r) => r.testSource !== testNameToRemove));

    const currentGross = parseFloat(String(testFee || '0').replace(/[^0-9.]/g, '')) || 0;
    const newGross = Math.max(0, currentGross - feeToDeduct);
    setTestFee(newGross.toString());

    const currentDisc = parseFloat(String(discount || '0').replace(/[^0-9.]/g, '')) || 0;
    const newNet = Math.max(0, newGross - currentDisc);
    const activeKeys = Object.keys(selectedMethods).filter((k) => selectedMethods[k] && k !== 'Pay Later');
    if (activeKeys.length === 1) {
      setSplitAmounts((prev) => ({
        ...prev,
        [activeKeys[0]]: newNet.toString(),
      }));
    }

    notify && notify(`Removed ${testNameToRemove} from order.`);
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

  // Auto-fill patient info if Lab Record Number / OP Number changes
  const handleOpNumberChange = (val) => {
    setOpNumber(val);
    const query = val.trim().toLowerCase();
    if (!query) {
      setAutoFetchSuccess(false);
      return;
    }

    const foundOp = opRecords.find((r) => 
      (r.id && r.id.toLowerCase() === query) || 
      (r.regNo && r.regNo.toLowerCase() === query) || 
      (r.opNumber && r.opNumber.toLowerCase() === query) || 
      (r.patient && r.patient.toLowerCase().includes(query))
    );
    const foundPat = patients.find((p) => 
      (p.id && p.id.toLowerCase() === query) || 
      (p.name && p.name.toLowerCase().includes(query))
    );
    const found = foundOp || foundPat;
    if (found) {
      if (found.patient || found.name) setPatientName(found.patient || found.name);
      if (found.doctor && found.doctor !== 'Unassigned') setDoctor(found.doctor);
      const ph = found.phone || found.mobile || found.contact || '';
      if (ph) setPhone(ph);
      if (found.regNo || found.id || found.opNumber) setPatientOpNumber(found.regNo || found.id || found.opNumber);
      setAutoFetchSuccess(true);
    } else {
      const matchedTest = tests.find((t) => 
        (t.labOrderNo && t.labOrderNo.toLowerCase() === query) || 
        (t.id && t.id.toLowerCase() === query) || 
        (t.opNumber && t.opNumber.toLowerCase() === query)
      );
      if (matchedTest) {
        if (matchedTest.patientName || matchedTest.patient) setPatientName(matchedTest.patientName || matchedTest.patient);
        if (matchedTest.phone) setPhone(matchedTest.phone);
        if (matchedTest.doctor && matchedTest.doctor !== 'Self Created / Walk-In') setDoctor(matchedTest.doctor);
        if (matchedTest.opNumber) setPatientOpNumber(matchedTest.opNumber);
        setAutoFetchSuccess(true);
      } else {
        setAutoFetchSuccess(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!opNumber.trim() || !patientName.trim() || !testName.trim()) {
      notify && notify('Please fill in Lab record number, patient name, and main test name.');
      return;
    }

    const feeNum = netPayableNum;
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

    // All tests in this order
    const primaryRate = parseFloat(masterServices.find(s => s.name === testName.trim())?.rate) || grossFeeNum;
    const allTestsList = [
      { name: testName.trim(), fee: primaryRate },
      ...additionalTests,
    ];
    const combinedTestName = allTestsList.map((t) => t.name).join(' + ');

    // Format main result summary string for cards with all tests clearly distinguished
    const summaryResult = allTestsList.map((t) => {
      const tRows = testRows.filter((r) => 
        (r.testSource && r.testSource.toLowerCase() === t.name.toLowerCase()) ||
        (!r.testSource && allTestsList.length === 1)
      );
      const findings = tRows
        .filter((r) => r.name && r.result && String(r.result).trim().length > 0)
        .map((r) => `${r.name}: ${r.result}`)
        .join(', ');
      return findings ? `[${t.name}] ${findings}` : null;
    }).filter(Boolean).join(' | ');

    const allFilledRows = testRows
      .filter((r) => r.name && r.result && String(r.result).trim().length > 0)
      .map((r) => `${r.name}: ${r.result}`)
      .join(', ');

    const existingResult = initialSelectedTest?.result || initialSelectedTest?.results?.summaryResult || '';
    const isSampleStage = status === 'Sample collected' || status === 'Processing' || status === 'Awaiting sample';
    const fallbackStatusLabel = isSampleStage ? (status || 'Sample collected') : 'Pathology Report Available';
    const resolvedResultValue = summaryResult || allFilledRows || existingResult || fallbackStatusLabel;

    const targetBranch = effectiveBranch === 'All' ? (branchesList[0]?.name || 'Central Campus') : effectiveBranch;
    const resolvedLabNo = initialSelectedTest?.labOrderNo || (opNumber.trim().startsWith('LAB-') ? opNumber.trim() : (initialSelectedTest?.id?.startsWith('LAB-') ? initialSelectedTest.id : opNumber.trim()));
    const resolvedOpNo = patientOpNumber || initialSelectedTest?.opNumber || (!opNumber.trim().startsWith('LAB-') ? opNumber.trim() : '');

    const existingTest = initialSelectedTest || tests.find((t) =>
      (t._id && (t._id === opNumber.trim() || t._id === initialSelectedTest?._id)) ||
      (t.labOrderNo && (t.labOrderNo.toLowerCase() === opNumber.trim().toLowerCase() || (resolvedLabNo && t.labOrderNo.toLowerCase() === resolvedLabNo.toLowerCase()))) ||
      (t.id && (t.id.toLowerCase() === opNumber.trim().toLowerCase() || (resolvedLabNo && t.id.toLowerCase() === resolvedLabNo.toLowerCase())))
    );

    const existingCreator = existingTest?.createdBy || initialSelectedTest?.createdBy;
    const existingFrom = existingTest?.assignedFrom || initialSelectedTest?.assignedFrom;
    const isHospitalCreator = ['Admin', 'Super Admin', 'Front Desk', 'Hospital'].some((r) => (existingCreator || userRole || '').toLowerCase().includes(r.toLowerCase()));

    const finalCreatedBy = existingCreator || (isHospitalCreator ? (userRole || 'Admin') : (doctor.trim() ? 'Doctor' : 'Lab Assistant'));
    const finalAssignedFrom = existingFrom || (isHospitalCreator ? 'Hospital' : (doctor.trim() ? 'Doctor' : 'Lab'));
    const isSelfCreated = !isHospitalCreator && (!doctor.trim() || doctor.trim() === 'Self Created / Walk-In');

    let assignedDoctor = doctor.trim();
    if (!assignedDoctor) {
      assignedDoctor = isHospitalCreator ? 'Hospital Staff' : 'Self Created / Walk-In';
    }

    const payload = {
      id: existingTest?._id || existingTest?.id || resolvedLabNo || opNumber.trim(),
      _id: existingTest?._id,
      labOrderNo: resolvedLabNo || opNumber.trim(),
      opNumber: resolvedOpNo || resolvedLabNo || opNumber.trim(),
      patient: patientName.trim(),
      patientName: patientName.trim(),
      phone: phone.trim(),
      doctor: assignedDoctor,
      orderingDoctor: assignedDoctor,
      test: combinedTestName,
      testName: combinedTestName,
      testsList: allTestsList,
      grossFee: grossFeeNum,
      discount: discountNum,
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
      result: resolvedResultValue,
      testRows,
      results: {
        testRows,
        summaryResult: resolvedResultValue,
      },
      status: status || 'Sample collected',
      clinicalNotes: notes.trim(),
      notes: notes.trim(),
      requested: existingTest?.requested || initialSelectedTest?.requested || 'Today, just now',
      branch: existingTest?.branch || targetBranch,
      createdBy: finalCreatedBy,
      assignedFrom: finalAssignedFrom,
      isSelfCreated,
    };

    const token = localStorage.getItem('kh_auth_token');
    const isExisting = Boolean(existingTest);
    const targetUrl = isExisting 
      ? `/api/v1/laboratory/${encodeURIComponent(existingTest._id || existingTest.labOrderNo || existingTest.id || resolvedLabNo)}` 
      : '/api/v1/laboratory';
    const method = isExisting ? 'PUT' : 'POST';

    try {
      const res = await fetch(targetUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        const savedRecord = {
          ...payload,
          ...data.data,
          id: data.data.labOrderNo || data.data._id || payload.id,
          labOrderNo: data.data.labOrderNo || payload.labOrderNo,
          _id: data.data._id || payload._id,
          patient: data.data.patientName || payload.patient,
          test: data.data.testName || payload.test,
          result: payload.result,
          testRows: payload.testRows,
          results: payload.results,
          status: payload.status,
          notes: payload.notes,
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

  const primaryRateForRender = parseFloat(masterServices.find(s => s.name === (testName || '').trim())?.rate) || grossFeeNum;
  const currentTestsList = [
    { name: (testName || '').trim() || 'Primary Diagnostic Test', fee: primaryRateForRender },
    ...additionalTests,
  ];

  const handleOpenVerification = (e) => {
    e && e.preventDefault();
    if (!opNumber.trim() || !patientName.trim() || !testName.trim()) {
      notify && notify('Please fill in Lab record number, patient name, and main test name before previewing.');
      return;
    }
    setIsVerificationModalOpen(true);
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

          {/* Phone Number, Doctor Name (Optional) & Test Status */}
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
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
              <span style={{ color: '#4a5e7a', fontSize: '11px', fontWeight: '700' }}>Doctor Name (Optional)</span>
              <input
                type="text"
                list="lab-enter-doctors-list"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                placeholder="Enter doctor name (Optional)"
                style={{ padding: '9px 10px', border: '1px solid #dde7f1', borderRadius: '7px', background: '#fff', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
              />
              <datalist id="lab-enter-doctors-list">
                {availableDoctors.map((doc) => (
                  <option key={doc.id || doc._id || doc.name} value={doc.name}>
                    {doc.department ? `${doc.name} (${doc.department})` : doc.name}
                  </option>
                ))}
              </datalist>
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
                <option value="Completed">Completed</option>
                <option value="Processing">Processing</option>
                <option value="Sample collected">Sample collected</option>
                <option value="Awaiting sample">Awaiting sample</option>
              </select>
            </div>
          </div>

          {/* Main Lab Test Selection (From Admin Master Catalogue) */}
          <div className="field">
            <span style={{ color: '#1769d7', fontSize: '12px', fontWeight: '700' }}>Primary Lab Test Name (Admin Master Catalogue) *</span>
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

          {/* Active Ordered Tests & Add Extra Test Section */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', display: 'grid', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FlaskConical size={14} color="#2563eb" /> Ordered Tests ({1 + additionalTests.length})
              </span>
            </div>

            {/* Test Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1d4ed8',
                  padding: '3px 9px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                }}
              >
                🔬 {testName}
              </span>

              {additionalTests.map((ext) => (
                <span
                  key={ext.name}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    padding: '3px 9px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '700',
                  }}
                >
                  + {ext.name} (₹{ext.fee})
                  <button
                    type="button"
                    onClick={() => handleRemoveExtraTest(ext.name)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      color: '#dc2626',
                    }}
                    title={`Remove ${ext.name}`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>

            {/* Add Extra Test Dropdown & Small Button */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={selectedExtraTest}
                onChange={(e) => setSelectedExtraTest(e.target.value)}
                style={{
                  flex: '1 1 200px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontWeight: '600',
                  color: '#334155',
                }}
              >
                <option value="">Select test to add...</option>
                {masterServices
                  .filter((s) => s.name !== testName && !additionalTests.some((t) => t.name === s.name))
                  .map((s) => (
                    <option key={s.id || s.name} value={s.name}>
                      + {s.name} (₹{s.rate})
                    </option>
                  ))}
              </select>
              <button
                type="button"
                className="secondary-button"
                onClick={handleAddExtraTest}
                disabled={!selectedExtraTest}
                style={{
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  gap: '4px',
                  background: selectedExtraTest ? '#2563eb' : '#f1f5f9',
                  borderColor: selectedExtraTest ? '#1d4ed8' : '#cbd5e1',
                  color: selectedExtraTest ? '#ffffff' : '#94a3b8',
                  borderRadius: '6px',
                  cursor: selectedExtraTest ? 'pointer' : 'not-allowed',
                }}
              >
                <Plus size={13} /> Add
              </button>
            </div>
          </div>

          {/* Test Fee, Discount & Upfront Multi-Select Payment Section (Exact match to OP Record) */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '9px', border: '1px solid #dde7f1', display: 'grid', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
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
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#dc2626' }}>Discount Amount (₹)</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={discount}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  placeholder="0.00"
                  style={{ padding: '9px 12px', border: '1px solid #fca5a5', borderRadius: '7px', fontSize: '13px', fontWeight: '800', color: '#dc2626', background: '#fef2f2', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#15803d' }}>Final Net Payable (₹)</span>
                <input
                  type="number"
                  disabled
                  value={netPayableNum}
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
                    ⚡ Auto-Set Full Fee (₹ {netPayableNum})
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
                  ⚠️ Pay Later Selected: Lab investigation registered without upfront payment collection. Complete fee (₹{netPayableNum}) will be billed for post-investigation settlement.
                </div>
              )}
            </div>
          </div>

          {/* DYNAMIC MULTI-ROW SUB-PARAMETER BUILDER (T1, T2, T3, T4, TSH, Hb, etc.) - ALWAYS VISIBLE SO FINDINGS ARE NEVER HIDDEN */}
          <div style={{ background: '#f4f8fe', padding: '18px', borderRadius: '10px', border: '1px solid #d4e4f7', display: 'grid', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #d3e2f5', paddingBottom: '8px' }}>
              <strong style={{ fontSize: '12px', color: '#1769d7' }}>
                Sub-Test Parameters ({testRows.length})
              </strong>
              <button
                type="button"
                className="secondary-button"
                style={{ background: '#fff', border: '1px solid #1769d7', color: '#1769d7', fontWeight: '700', padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
                onClick={handleAddRow}
              >
                <Plus size={13} /> Add Row
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#576c85' }}>Sub-Parameter Name *</span>
                      {row.testSource && (
                        <span style={{ fontSize: '9px', fontWeight: '800', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '1px 5px', borderRadius: '4px' }}>
                          {row.testSource}
                        </span>
                      )}
                    </div>
                    <input
                      value={row.name || ''}
                      onChange={(e) => handleRowChange(index, 'name', e.target.value)}
                      placeholder="e.g. T3, T4, TSH, Hb"
                      required
                      style={{ padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #dde7f1' }}
                    />
                  </div>

                  {/* 2. Measured Result */}
                  <div className="field">
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#1769d7' }}>
                      Result {status === 'Result ready' || status === 'Completed' ? '*' : '(Optional)'}
                    </span>
                    <input
                      value={row.result || ''}
                      onChange={(e) => handleRowChange(index, 'result', e.target.value)}
                      placeholder={status === 'Result ready' || status === 'Completed' ? 'e.g. 1.2' : 'Optional'}
                      required={status === 'Result ready' || status === 'Completed'}
                      style={{ padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #b8d5f7', fontWeight: '700', color: '#1769d7' }}
                    />
                  </div>

                  {/* 3. Normal Range */}
                  <div className="field">
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#576c85' }}>Reference Range</span>
                    <input
                      value={row.normalRange || ''}
                      onChange={(e) => handleRowChange(index, 'normalRange', e.target.value)}
                      placeholder="e.g. 0.8 - 2.0"
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
            <button
              type="button"
              className="secondary-button"
              onClick={handleOpenVerification}
              style={{
                padding: '12px 22px',
                flex: '1 1 auto',
                justifyContent: 'center',
                background: '#f0fdf4',
                borderColor: '#86efac',
                color: '#15803d',
                fontWeight: '800',
                gap: '8px',
                fontSize: '13px'
              }}
              title="Preview and verify all entered test findings and billing details before saving"
            >
              <Eye size={17} /> Preview &amp; Verify Results ({currentTestsList.length} Tests)
            </button>
            <button type="submit" className="primary-button" style={{ padding: '12px 28px', flex: '1 1 auto', justifyContent: 'center' }}>
              <Save size={17} /> Save Lab Result
            </button>
            <button type="button" className="secondary-button" onClick={onCancel} style={{ padding: '12px 20px', flex: '1 1 auto', justifyContent: 'center' }}>
              Cancel
            </button>
          </div>
        </form>
      </section>

      {/* PREVIEW & VERIFICATION MODAL BEFORE FINAL SAVE */}
      {isVerificationModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(15, 45, 85, 0.65)', display: 'grid', placeItems: 'center', padding: '16px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '740px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1px solid #cbd5e1' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FlaskConical size={22} color="#15803d" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#162d4a', fontWeight: '800' }}>
                    Preview &amp; Verify Lab Results Before Saving
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Check all {currentTestsList.length} test findings, biological reference values, and billing accuracy</span>
                </div>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setIsVerificationModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Verification Notice */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '11px', color: '#166534', fontWeight: '600' }}>
              ✓ Verification Mode Active: Confirm that each test result has been entered correctly before persisting to the database and issuing reports.
            </div>

            {/* Patient & Order Details Card */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#f8fafc', marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12px' }}>
              <div>
                <div>Patient Name: <strong style={{ color: '#0f2d55' }}>{patientName}</strong></div>
                <div>Lab Order No: <strong>{opNumber}</strong></div>
                <div>OP / Reg Number: <strong>{patientOpNumber || 'Walk-In'}</strong></div>
                <div>Contact Phone: <strong>{phone || 'N/A'}</strong></div>
              </div>
              <div>
                <div>Prescribing Doctor: <strong>{doctor || 'Self / Hospital'}</strong></div>
                <div>Status Flag: <strong style={{ color: '#15803d' }}>{status}</strong></div>
                <div>Branch: <strong>{effectiveBranch === 'All' ? (branchesList[0]?.name || 'Central Campus') : effectiveBranch}</strong></div>
                <div>Report Date: <strong>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
              </div>
            </div>

            {/* Grouped Tests & Parameters Verification Table */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', color: '#0f2d55', fontWeight: '800' }}>
                  Entered Diagnostic Tests &amp; Observations ({currentTestsList.length} Tests)
                </h4>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#15803d' }}>
                  Total {testRows.length} Sub-Parameters
                </span>
              </div>

              {currentTestsList.map((tItem, tIdx) => {
                const rowsForThisTest = testRows.filter(
                  (r) => (r.testSource && r.testSource.toLowerCase() === tItem.name.toLowerCase()) ||
                         (!r.testSource && currentTestsList.length === 1) ||
                         (!r.testSource && tIdx === 0)
                );
                return (
                  <div key={tIdx} style={{ marginBottom: '14px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#f1f5f9', padding: '8px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '800', color: '#1e3a8a', fontSize: '12px' }}>
                        🧪 Test {tIdx + 1}: {tItem.name}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>
                        Test Fee: ₹{tItem.fee}
                      </span>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '6px 10px', color: '#475569', fontSize: '11px' }}>Parameter</th>
                          <th style={{ padding: '6px 10px', color: '#475569', fontSize: '11px' }}>Observed Result</th>
                          <th style={{ padding: '6px 10px', color: '#475569', fontSize: '11px' }}>Reference Range</th>
                          <th style={{ padding: '6px 10px', color: '#475569', fontSize: '11px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rowsForThisTest.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ padding: '8px 10px', textAlign: 'center', color: '#94a3b8' }}>
                              No sub-parameters listed for this test.
                            </td>
                          </tr>
                        ) : (
                          rowsForThisTest.map((r, rIdx) => (
                            <tr key={r.id || rIdx} style={{ borderBottom: '1px solid #f1f5f9', background: rIdx % 2 === 0 ? '#fff' : '#fafafa' }}>
                              <td style={{ padding: '6px 10px', fontWeight: '600' }}>{r.name || 'Parameter'}</td>
                              <td style={{ padding: '6px 10px', fontWeight: '800', color: r.result ? '#15803d' : '#94a3b8' }}>
                                {r.result || 'Pending / Blank'}
                              </td>
                              <td style={{ padding: '6px 10px', color: '#64748b', fontSize: '11px' }}>{r.normalRange || 'Standard'}</td>
                              <td style={{ padding: '6px 10px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '800', padding: '1px 6px', borderRadius: '4px', background: r.result ? '#dcfce7' : '#f1f5f9', color: r.result ? '#15803d' : '#64748b' }}>
                                  {r.result ? 'Entered' : 'Empty'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>

            {/* Billing Verification Summary */}
            <div style={{ border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', background: '#f0fdf4', marginBottom: '16px', fontSize: '11px' }}>
              <div style={{ fontWeight: '800', color: '#166534', marginBottom: '6px', fontSize: '12px' }}>
                💳 Billing &amp; Settlement Verification
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div>Total Fee: <strong>₹{netPayableNum}</strong></div>
                <div>Amount Paid: <strong style={{ color: '#15803d' }}>₹{calculatedTotalCollected}</strong></div>
                <div>Balance Due: <strong style={{ color: (netPayableNum - calculatedTotalCollected) > 0 ? '#dc2626' : '#15803d' }}>₹{Math.max(0, netPayableNum - calculatedTotalCollected)}</strong></div>
                <div>Payment Mode: <strong>{paymentSummaryStr || 'Cash'}</strong></div>
              </div>
            </div>

            {/* Remarks / Clinical Notes */}
            {notes && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '6px', fontSize: '11px', marginBottom: '16px' }}>
                <strong>Technician Remarks:</strong> {notes}
              </div>
            )}

            {/* Modal Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsVerificationModalOpen(false)}
                style={{ padding: '8px 16px' }}
              >
                ✏️ Back to Edit
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={(e) => {
                  setIsVerificationModalOpen(false);
                  handleSubmit(e);
                }}
                style={{ padding: '8px 22px', background: '#15803d', borderColor: '#15803d', fontWeight: '800' }}
              >
                <Save size={15} /> Confirm &amp; Save All Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EnterLabResultForm;
