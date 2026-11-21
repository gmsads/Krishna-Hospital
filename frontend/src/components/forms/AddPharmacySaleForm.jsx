import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, DollarSign } from 'lucide-react';

export function AddPharmacySaleForm({ onSave, notify, effectiveBranch = 'All', branchesList = [] }) {
  const [saleNo, setSaleNo] = useState('PHARM-0001');
  const [availableBranches, setAvailableBranches] = useState(branchesList);
  
  const initialBranchName = effectiveBranch === 'All'
    ? (branchesList[0]?.name || '')
    : effectiveBranch;
  const [selectedBranch, setSelectedBranch] = useState(initialBranchName);

  // Form Fields
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [collectingAmount, setCollectingAmount] = useState('');
  const [totalPurchase, setTotalPurchase] = useState('');
  const [totalExpense, setTotalExpense] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [partyAddress, setPartyAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Phone number auto-lookup for existing customer/party name & address
  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setPartyPhone(val);

    const cleanNum = val.replace(/\D/g, '');
    if (cleanNum.length >= 6) {
      const token = localStorage.getItem('kh_auth_token');

      // 1. Check local/API pharmacy sales
      fetch(`/api/v1/pharmacy?search=${encodeURIComponent(val)}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            const match = data.data.find(
              (s) =>
                (s.partyPhone && s.partyPhone.includes(cleanNum)) ||
                (s.phone && s.phone.includes(cleanNum))
            );
            if (match) {
              if (match.partyName || match.patientName) setPartyName(match.partyName || match.patientName);
              if (match.partyAddress || match.address) setPartyAddress(match.partyAddress || match.address);
            }
          }
        })
        .catch(() => {});

      // 2. Check patients database
      fetch(`/api/v1/patients?search=${encodeURIComponent(val)}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            const pMatch = data.data.find(
              (p) => p.phone && p.phone.replace(/\D/g, '').includes(cleanNum)
            );
            if (pMatch) {
              if (pMatch.full_name || pMatch.name) setPartyName(pMatch.full_name || pMatch.name);
              if (pMatch.address) setPartyAddress(pMatch.address);
            }
          }
        })
        .catch(() => {});
    }
  };

  // Fetch next branch-scoped PHARM-0001 format Sale No on mount / branch change
  useEffect(() => {
    const targetBranch = effectiveBranch === 'All' ? selectedBranch : effectiveBranch;
    const branchQuery = targetBranch ? `?branch=${encodeURIComponent(targetBranch)}` : '';

    fetch(`/api/v1/pharmacy/next-saleno${branchQuery}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.nextSaleNo) {
          setSaleNo(data.data.nextSaleNo);
        }
      })
      .catch((err) => console.warn('Could not fetch next saleNo:', err.message));

    fetch('/api/v1/branches')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setAvailableBranches(data.data);
          if (!selectedBranch) setSelectedBranch(data.data[0].name);
        }
      })
      .catch((err) => console.warn('Could not fetch branches:', err.message));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const collectingNum = parseFloat(collectingAmount);
    if (!collectingAmount || isNaN(collectingNum) || collectingNum <= 0) {
      notify && notify('Please enter a valid Collection Amount (Mandatory).');
      return;
    }

    setSubmitting(true);
    const assignedBranch = effectiveBranch === 'All' ? selectedBranch : effectiveBranch;
    const matchingBranchObj = availableBranches.find((b) => b.name === assignedBranch);
    const assignedCode = matchingBranchObj?.code || '';

    const newSale = {
      saleNo,
      date: recordDate || new Date().toISOString().split('T')[0],
      patientName: partyName.trim() || 'Walk-In Customer',
      partyName: partyName.trim() || 'Walk-In Customer',
      partyPhone: partyPhone.trim() || '',
      phone: partyPhone.trim() || '',
      partyAddress: partyAddress.trim() || '',
      address: partyAddress.trim() || '',
      collectingAmount: collectingNum,
      totalCollection: collectingNum,
      totalExpense: totalExpense ? parseFloat(totalExpense) : 0,
      totalPurchase: totalPurchase ? parseFloat(totalPurchase) : 0,
      paymentMethod: 'Cash',
      creditType: 'None',
      creditAmount: 0,
      notes: 'Pharmacy Record',
      branch: assignedBranch,
      branchCode: assignedCode,
      status: 'Completed',
    };

    const token = localStorage.getItem('kh_auth_token');
    let savedObj = newSale;

    try {
      const res = await fetch('/api/v1/pharmacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newSale),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        savedObj = {
          ...data.data,
          id: data.data.saleNo || data.data._id || saleNo,
        };
        notify && notify(`Pharmacy record ${savedObj.saleNo} registered in database!`);
      }
    } catch (err) {
      console.warn('Offline fallback for pharmacy sale:', err.message);
    } finally {
      setSubmitting(false);
    }

    setCollectingAmount('');
    setTotalPurchase('');
    setTotalExpense('');
    setPartyName('');
    setPartyPhone('');
    setPartyAddress('');

    // Fetch next sequential PHARM-0001 ID
    fetch('/api/v1/pharmacy/next-saleno')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.nextSaleNo) {
          setSaleNo(data.data.nextSaleNo);
        }
      })
      .catch((err) => console.warn('Could not fetch next saleNo:', err.message));

    onSave && onSave(savedObj);
  };

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      <form onSubmit={handleSubmit} style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #dce7f5', boxShadow: '0 4px 16px rgba(15,45,85,0.05)', display: 'grid', gap: '16px' }}>
        
        {/* Header */}
        <div style={{ borderBottom: '1px solid #edf2f8', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: '#f0fdf4', borderRadius: '8px', display: 'grid', placeItems: 'center', border: '1px solid #bbf7d0' }}>
            <Plus size={18} color="#15803d" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#0f2d55', fontWeight: '800' }}>
              Add Pharmacy Record
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Auto receipt generation: {saleNo}
            </span>
          </div>
        </div>

        {/* Fields Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', width: '100%' }}>
          
          {/* 1. Receipt / Sale No (Auto Generation) */}
          <div className="field" style={{ width: '100%' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>Receipt / Sale No (Auto)</span>
            <input
              value={saleNo}
              readOnly
              style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', background: '#f8fafc', fontWeight: '800', color: '#0f2d55', fontSize: '14px', width: '100%', minHeight: '42px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Date (Defaults to Today) */}
          <div className="field" style={{ width: '100%' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>Date (Default Today)</span>
            <input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '13px', background: '#ffffff', width: '100%', minHeight: '42px', boxSizing: 'border-box' }}
            />
          </div>

          {/* 2. Collection Amount (MANDATORY) */}
          <div className="field" style={{ width: '100%' }}>
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#15803d' }}>Collection Amount (₹) * MANDATORY</span>
            <input
              type="number"
              value={collectingAmount}
              onChange={(e) => setCollectingAmount(e.target.value)}
              placeholder="e.g. 1500"
              required
              style={{ padding: '10px 12px', border: '2px solid #86efac', borderRadius: '7px', fontSize: '15px', fontWeight: '900', color: '#15803d', background: '#f0fdf4', width: '100%', minHeight: '42px', boxSizing: 'border-box' }}
            />
          </div>

          {/* 3. Purchase Amount */}
          <div className="field" style={{ width: '100%' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#d97706' }}>Purchase Amount (₹) (Optional)</span>
            <input
              type="number"
              value={totalPurchase}
              onChange={(e) => setTotalPurchase(e.target.value)}
              placeholder="e.g. 500"
              style={{ padding: '10px 12px', border: '1px solid #fde68a', borderRadius: '7px', fontSize: '14px', background: '#fffbeb', width: '100%', minHeight: '42px', boxSizing: 'border-box' }}
            />
          </div>

          {/* 4. Expenses */}
          <div className="field" style={{ width: '100%' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#b91c1c' }}>Expenses (₹) (Optional)</span>
            <input
              type="number"
              value={totalExpense}
              onChange={(e) => setTotalExpense(e.target.value)}
              placeholder="e.g. 200"
              style={{ padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '7px', fontSize: '14px', background: '#fef2f2', width: '100%', minHeight: '42px', boxSizing: 'border-box' }}
            />
          </div>

        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '6px' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={() => { setCollectingAmount(''); setTotalPurchase(''); setTotalExpense(''); setPartyName(''); setPartyPhone(''); }}
            disabled={submitting}
            style={{ minHeight: '40px', padding: '8px 16px', fontSize: '13px' }}
          >
            Clear
          </button>
          <button
            type="submit"
            className="primary-button"
            style={{ background: '#15803d', borderColor: '#15803d', gap: '6px', minHeight: '40px', padding: '8px 20px', fontSize: '13px' }}
            disabled={submitting}
          >
            <CheckCircle2 size={16} /> {submitting ? 'Saving...' : 'Save Record'}
          </button>
        </div>

      </form>
    </div>
  );
}
