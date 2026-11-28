import React, { useState } from 'react';
import { FlaskConical, Plus, Trash2, Edit3, CheckCircle2, X, Layers, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { initialMasterLabServices } from '../data/initialData';

export function LabServicesPage({
  masterServices = [],
  onSaveService,
  onUpdateService,
  onDeleteService,
  notify,
  effectiveBranch = 'All',
  branchesList = [],
}) {
  const [serviceList, setServiceList] = useState(masterServices);
  const [testName, setTestName] = useState('');
  const [method, setMethod] = useState('');
  const [description, setDescription] = useState('');
  const [rate, setRate] = useState('');
  const [subCategories, setSubCategories] = useState([]); // Array of { name: '', normalRange: '' }
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const excelInputRef = React.useRef(null);

  // Sync serviceList with masterServices prop
  React.useEffect(() => {
    setServiceList(masterServices);
  }, [masterServices]);

  // EDIT LAB SERVICE MODAL STATE
  const [editingService, setEditingService] = useState(null);
  const [editName, setEditName] = useState('');
  const [editMethod, setEditMethod] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editSubCategories, setEditSubCategories] = useState([]);

  const handleAddSubCategoryRow = () => {
    setSubCategories((prev) => [...prev, { name: '', normalRange: '' }]);
  };

  const handleRemoveSubCategoryRow = (index) => {
    setSubCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubCategoryChange = (index, field, value) => {
    setSubCategories((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!testName.trim() || !rate.trim()) {
      notify && notify('Please fill in lab test name and rate charge.');
      return;
    }

    const defaultBranchName = effectiveBranch === 'All' 
      ? (branchesList[0]?.name || 'Central Campus') 
      : effectiveBranch;
    const matchingBranchObj = branchesList.find((b) => b.name === defaultBranchName);
    const assignedCode = matchingBranchObj?.code || 'HQ-CENTRAL';

    const validSubCats = subCategories.filter((sc) => sc.name && sc.name.trim());

    const newService = {
      name: testName.trim(),
      method: method.trim(),
      description: description.trim() || 'Pathology laboratory diagnostic test',
      rate: parseFloat(rate).toFixed(2),
      branch: defaultBranchName,
      branchCode: assignedCode,
      subCategories: validSubCats,
    };

    const token = localStorage.getItem('kh_auth_token');
    let savedObj = newService;

    try {
      const res = await fetch('/api/v1/lab-services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newService),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        savedObj = { ...data.data, id: data.data.serviceId || data.data.id || data.data._id };
        notify && notify(`New Lab Service "${savedObj.name}" saved to MongoDB!`);
      }
    } catch (err) {
      console.warn('Backend Lab Service creation offline fallback:', err.message);
    }

    if (onSaveService) {
      onSaveService(savedObj);
    }

    setTestName('');
    setMethod('');
    setDescription('');
    setRate('');
    setSubCategories([]);
  };

  const handleStartEdit = (srv) => {
    setEditingService(srv);
    setEditName(srv.name || '');
    setEditMethod(srv.method || '');
    setEditDescription(srv.description || '');
    setEditRate(srv.rate ? srv.rate.toString() : '');
    setEditSubCategories(
      Array.isArray(srv.subCategories) && srv.subCategories.length > 0
        ? srv.subCategories
        : []
    );
  };

  const handleAddEditSubCategoryRow = () => {
    setEditSubCategories((prev) => [...prev, { name: '', normalRange: '' }]);
  };

  const handleRemoveEditSubCategoryRow = (index) => {
    setEditSubCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditSubCategoryChange = (index, field, value) => {
    setEditSubCategories((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editRate.trim()) {
      notify && notify('Please enter test name and rate charge.');
      return;
    }

    const validSubCats = editSubCategories.filter((sc) => sc.name && sc.name.trim());

    const updated = {
      ...editingService,
      name: editName.trim(),
      method: editMethod.trim(),
      description: editDescription.trim() || 'Pathology laboratory diagnostic test',
      rate: parseFloat(editRate).toFixed(2),
      subCategories: validSubCats,
    };

    const token = localStorage.getItem('kh_auth_token');
    const srvId = editingService._id || editingService.id;

    if (srvId && String(srvId).length > 10) {
      try {
        await fetch(`/api/v1/lab-services/${srvId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(updated),
        });
      } catch (err) {
        console.warn('Could not update lab service in backend:', err.message);
      }
    }

    if (onUpdateService) {
      onUpdateService(updated);
    }

    setEditingService(null);
    notify && notify(`✓ Lab Service "${updated.name}" updated successfully!`);
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploadingExcel(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        notify && notify('Excel file has no sheets.');
        return;
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      let headerRowIdx = -1;
      let nameIdx = 1;
      let codeIdx = 2;
      let rateIdx = 3;
      let methodIdx = -1;

      for (let i = 0; i < Math.min(rows.length, 25); i++) {
        const row = rows[i] || [];
        const normalized = row.map((c) => String(c ?? '').trim().toLowerCase());
        const foundName = normalized.findIndex((c) =>
          c.includes('investigation name') || c.includes('test name') || c === 'name' || c === 'investigation'
        );
        if (foundName !== -1) {
          headerRowIdx = i;
          nameIdx = foundName;
          const foundCode = normalized.findIndex((c) => c === 'code' || c.includes('test code'));
          const foundRate = normalized.findIndex((c) =>
            c.includes('charge') || c.includes('amt') || c.includes('amount') || c.includes('rate') || c.includes('price') || c.includes('fee')
          );
          const foundMethod = normalized.findIndex((c) => c.includes('method'));
          codeIdx = foundCode !== -1 ? foundCode : (foundName + 1);
          rateIdx = foundRate !== -1 ? foundRate : (foundName + 2);
          methodIdx = foundMethod;
          break;
        }
      }

      const startIdx = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
      const parsedItems = [];

      for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i] || [];
        const rowJoined = row.map((c) => String(c ?? '').trim()).join(' ');
        if (!rowJoined || /page\s+\d+\s+of\s+\d+/i.test(rowJoined)) continue;

        const rawName = String(row[nameIdx] ?? '').trim();
        if (!rawName) continue;
        if (/^(investigation\s*name|test\s*name|sl\.?\s*no|name)$/i.test(rawName)) continue;

        const rawCode = codeIdx >= 0 ? String(row[codeIdx] ?? '').trim() : '';
        const rawRate = rateIdx >= 0 ? String(row[rateIdx] ?? '0').trim() : '0';
        const rawMethod = methodIdx >= 0 ? String(row[methodIdx] ?? '').trim() : '';
        const numRate = parseFloat(rawRate.replace(/[^0-9.]/g, ''));
        const rateStr = isNaN(numRate) ? '0.00' : numRate.toFixed(2);

        parsedItems.push({
          name: rawName,
          code: rawCode,
          method: rawMethod,
          rate: rateStr,
          description: rawCode ? `Code: ${rawCode}` : 'Pathology laboratory diagnostic test',
        });
      }

      if (parsedItems.length === 0) {
        notify && notify('No valid lab test rows found in the uploaded file.');
        return;
      }

      const defaultBranchName = effectiveBranch === 'All'
        ? (branchesList[0]?.name || 'Central Campus')
        : effectiveBranch;
      const matchingBranchObj = branchesList.find((b) => b.name === defaultBranchName);
      const assignedCode = matchingBranchObj?.code || 'HQ-CENTRAL';

      const token = localStorage.getItem('kh_auth_token');
      const res = await fetch('/api/v1/lab-services/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: parsedItems,
          branch: defaultBranchName,
          branchCode: assignedCode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        const insertedList = Array.isArray(data.data.inserted) ? data.data.inserted : [];
        const skipped = data.data.skippedCount || 0;
        if (onSaveService) {
          insertedList.forEach((srv) => {
            onSaveService({ ...srv, id: srv.serviceId || srv.id || srv._id });
          });
        }
        notify && notify(`✓ Uploaded ${insertedList.length} lab test(s) from Excel${skipped > 0 ? ` (${skipped} duplicates skipped)` : ''}!`);
      } else {
        notify && notify(data.message || 'Failed to upload lab tests from Excel.');
      }
    } catch (err) {
      console.error('Excel upload error:', err);
      notify && notify('Could not read Excel/CSV file. Please upload a valid .xlsx, .xls, or .csv file.');
    } finally {
      setUploadingExcel(false);
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Admin Master Catalogue</div>
          <h1>Lab Service Categories</h1>
          <p>Define hospital lab test categories, descriptions, charges, and optional sub-categories (e.g. Thyroid T1, T2, T3, T4, TSH).</p>
        </div>
        <div className="heading-actions">
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleExcelUpload}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="primary-button"
            disabled={uploadingExcel}
            onClick={() => excelInputRef.current && excelInputRef.current.click()}
            style={{ gap: '6px', background: '#15803d', borderColor: '#15803d', opacity: uploadingExcel ? 0.7 : 1 }}
            title="Upload Lab Test Names & Charges from Excel (.xlsx, .xls) or CSV (.csv)"
          >
            <Upload size={16} /> {uploadingExcel ? 'Uploading Excel...' : 'Upload Excel / CSV'}
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Form to Add New Lab Service */}
        <section className="panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #edf2f8', paddingBottom: '12px', marginBottom: '16px' }}>
            <FlaskConical size={20} color="#1769d7" />
            <h3 style={{ margin: 0, fontSize: '15px', color: '#1a3354' }}>Add New Lab Test Category</h3>
          </div>

          <form onSubmit={handleAddCategory} style={{ display: 'grid', gap: '16px' }}>
            {/* Test Name & Method */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
              <div className="field">
                <span style={{ color: '#1769d7', fontSize: '12px', fontWeight: '700' }}>Lab Test Name *</span>
                <input
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g. Thyroid Function Profile / HbA1c"
                  required
                  style={{ padding: '12px 14px', border: '1px solid #b8d5f7', borderRadius: '9px', fontSize: '13px', background: '#fff' }}
                />
              </div>

              <div className="field">
                <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Method (Optional)</span>
                <input
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  placeholder="e.g. CLIA, ELISA, Photometry"
                  style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', background: '#fff' }}
                />
              </div>
            </div>

            {/* Description */}
            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Test Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter pathology test scope, parameters measured, or preparation notes..."
                rows={2}
                style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', fontFamily: 'inherit', background: '#fff' }}
              />
            </div>

            {/* Rate / Charge */}
            <div className="field">
              <span style={{ color: '#1769d7', fontSize: '12px', fontWeight: '700' }}>Test Rate / Consultancy Charge (₹) *</span>
              <input
                type="number"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g. 1200.00"
                required
                style={{ padding: '12px 14px', border: '1px solid #b8d5f7', borderRadius: '9px', fontSize: '14px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7' }}
              />
            </div>

            {/* OPTIONAL SUB-CATEGORIES SECTION (e.g. T1, T2, T3, T4, TSH) */}
            <div style={{ background: '#f4f8fe', padding: '14px', borderRadius: '9px', border: '1px solid #d4e4f7', display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#1769d7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} /> Optional Sub-Categories / Sub-Tests (e.g. T1, T2, T3, T4, TSH)
                  </span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Define individual test sub-components and reference ranges.</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddSubCategoryRow}
                  style={{ background: '#fff', border: '1px solid #1769d7', color: '#1769d7', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={13} /> Add Sub-Test
                </button>
              </div>

              {subCategories.map((sub, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                  <input
                    value={sub.name}
                    onChange={(e) => handleSubCategoryChange(idx, 'name', e.target.value)}
                    placeholder="Sub-test name (e.g. Thyroid T1)"
                    style={{ padding: '7px 10px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                  <input
                    value={sub.normalRange}
                    onChange={(e) => handleSubCategoryChange(idx, 'normalRange', e.target.value)}
                    placeholder="Normal range (e.g. 0.8 - 2.0 ng/mL)"
                    style={{ padding: '7px 10px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSubCategoryRow(idx)}
                    style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button type="submit" className="primary-button" style={{ padding: '12px', justifyContent: 'center' }}>
              <Plus size={18} /> Add Lab Service Category
            </button>
          </form>
        </section>

        {/* Master Services Catalogue List */}
        <section className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f8', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#1a3354' }}>Active Lab Test Catalogue ({masterServices.length})</h3>
            <span style={{ fontSize: '11px', color: '#1769d7', fontWeight: '700' }}>Auto-synced to Lab Assistant</span>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {masterServices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b', fontSize: '13px', background: '#f8fafc', borderRadius: '9px', border: '1px dashed #cbd5e1' }}>
                <FlaskConical size={32} color="#94a3b8" style={{ margin: '0 auto 8px', display: 'block' }} />
                <p style={{ margin: '0 0 4px', fontWeight: '700', color: '#475569' }}>No lab service categories saved yet.</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Create your first lab test category using the form on the left.</p>
              </div>
            ) : (
              masterServices.map((srv) => (
                <div key={srv.id || srv.name} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: '#162d4a', display: 'block' }}>{srv.name}</strong>
                  <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#64748b' }}>{srv.description}</p>
                  
                  {Array.isArray(srv.subCategories) && srv.subCategories.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {srv.subCategories.map((sub, sIdx) => (
                        <span key={sIdx} style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                          Sub: {sub.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <strong style={{ fontSize: '16px', color: '#1769d7', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>₹ {srv.rate}</strong>
                  <button
                    className="icon-button"
                    style={{ width: '32px', height: '32px', background: '#f4f8fe', border: '1px solid #b8d5f7' }}
                    onClick={() => handleStartEdit(srv)}
                    title="Edit Lab Test Category"
                  >
                    <Edit3 size={15} color="#1769d7" />
                  </button>
                  <button
                    className="icon-button"
                    style={{ width: '32px', height: '32px' }}
                    onClick={async () => {
                      const token = localStorage.getItem('kh_auth_token');
                      const srvId = srv._id || srv.id;
                      if (srvId && String(srvId).length > 10) {
                        try {
                          await fetch(`/api/v1/lab-services/${srvId}`, {
                            method: 'DELETE',
                            headers: {
                              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                            },
                          });
                        } catch (err) {
                          console.warn('Could not delete lab service in backend:', err.message);
                        }
                      }
                      if (onDeleteService) onDeleteService(srv.id || srv._id || srv.name);
                      notify && notify(`Removed "${srv.name}" from catalogue`);
                    }}
                    title="Delete Test Category"
                  >
                    <Trash2 size={15} color="#dc2626" />
                  </button>
                </div>
              </div>
            )))}
          </div>
        </section>
      </div>

      {/* EDIT LAB SERVICE MODAL */}
      {editingService && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(15, 45, 85, 0.45)', display: 'grid', placeItems: 'center', padding: '16px' }}>
          <div className="modal" style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 40px rgba(16, 45, 85, 0.2)', border: '1px solid #dbe6f5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f8', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="#1769d7" />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#162d4a', fontWeight: '800' }}>Edit Lab Test Category</h3>
              </div>
              <button className="icon-button" onClick={() => setEditingService(null)} aria-label="Close edit modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#1769d7' }}>Lab Test Name *</span>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    style={{ padding: '10px 12px', border: '1px solid #b8d5f7', borderRadius: '7px', fontSize: '13px', background: '#fff' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Method (Optional)</span>
                  <input
                    value={editMethod}
                    onChange={(e) => setEditMethod(e.target.value)}
                    placeholder="e.g. CLIA, ELISA"
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', fontSize: '13px', background: '#fff' }}
                  />
                </div>
              </div>

              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Test Description</span>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit' }}
                />
              </div>

              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#1769d7' }}>Test Rate / Consultancy Charge (₹) *</span>
                <input
                  type="number"
                  step="0.01"
                  value={editRate}
                  onChange={(e) => setEditRate(e.target.value)}
                  required
                  style={{ padding: '10px 12px', border: '1px solid #b8d5f7', borderRadius: '7px', fontSize: '14px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7' }}
                />
              </div>

              {/* EDIT SUB-CATEGORIES SECTION */}
              <div style={{ background: '#f4f8fe', padding: '12px', borderRadius: '8px', border: '1px solid #d4e4f7', display: 'grid', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#1769d7' }}>Sub-Categories / Sub-Tests</span>
                  <button
                    type="button"
                    onClick={handleAddEditSubCategoryRow}
                    style={{ background: '#fff', border: '1px solid #1769d7', color: '#1769d7', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    + Add Sub-Test
                  </button>
                </div>

                {editSubCategories.map((sub, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '6px', alignItems: 'center' }}>
                    <input
                      value={sub.name}
                      onChange={(e) => handleEditSubCategoryChange(idx, 'name', e.target.value)}
                      placeholder="Sub-test name (e.g. T1)"
                      style={{ padding: '6px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '5px' }}
                    />
                    <input
                      value={sub.normalRange}
                      onChange={(e) => handleEditSubCategoryChange(idx, 'normalRange', e.target.value)}
                      placeholder="Normal range"
                      style={{ padding: '6px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '5px' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveEditSubCategoryRow(idx)}
                      style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="secondary-button" onClick={() => setEditingService(null)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" style={{ gap: '6px' }}>
                  <CheckCircle2 size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default LabServicesPage;
