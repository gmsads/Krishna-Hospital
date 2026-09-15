import React, { useState } from 'react';
import { FlaskConical, Plus, Trash2, Edit3, CheckCircle2, X } from 'lucide-react';
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
  const [description, setDescription] = useState('');
  const [rate, setRate] = useState('');

  // Sync serviceList with masterServices prop
  React.useEffect(() => {
    setServiceList(masterServices);
  }, [masterServices]);

  // EDIT LAB SERVICE MODAL STATE
  const [editingService, setEditingService] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRate, setEditRate] = useState('');

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

    const newService = {
      name: testName.trim(),
      description: description.trim() || 'Pathology laboratory diagnostic test',
      rate: parseFloat(rate).toFixed(2),
      branch: defaultBranchName,
      branchCode: assignedCode,
    };

    const token = localStorage.getItem('kh_auth_token');
    let savedObj = newService;

    try {
      const res = await fetch('http://localhost:5000/api/v1/lab-services', {
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
    setDescription('');
    setRate('');
  };

  const handleStartEdit = (srv) => {
    setEditingService(srv);
    setEditName(srv.name || '');
    setEditDescription(srv.description || '');
    setEditRate(srv.rate ? srv.rate.toString() : '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editRate.trim()) {
      notify && notify('Please enter test name and rate charge.');
      return;
    }

    const updated = {
      ...editingService,
      name: editName.trim(),
      description: editDescription.trim() || 'Pathology laboratory diagnostic test',
      rate: parseFloat(editRate).toFixed(2),
    };

    const token = localStorage.getItem('kh_auth_token');
    const srvId = editingService._id || editingService.id;

    if (srvId && String(srvId).length > 10) {
      try {
        await fetch(`http://localhost:5000/api/v1/lab-services/${srvId}`, {
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

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Admin Master Catalogue</div>
          <h1>Lab Service Categories</h1>
          <p>Define hospital lab test categories, descriptions, and charges. Added tests automatically pre-fill for the Lab Assistant.</p>
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
            {/* Test Name */}
            <div className="field">
              <span style={{ color: '#1769d7', fontSize: '12px', fontWeight: '700' }}>Lab Test Name *</span>
              <input
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="e.g. HbA1c Diabetes Profile"
                required
                style={{ padding: '12px 14px', border: '1px solid #b8d5f7', borderRadius: '9px', fontSize: '13px', background: '#fff' }}
              />
            </div>

            {/* Description */}
            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Test Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter pathology test scope, parameters measured, or preparation notes..."
                rows={3}
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
                placeholder="e.g. 450.00"
                required
                style={{ padding: '12px 14px', border: '1px solid #b8d5f7', borderRadius: '9px', fontSize: '14px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7' }}
              />
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
            {masterServices.map((srv) => (
              <div key={srv.id || srv.name} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: '#162d4a', display: 'block' }}>{srv.name}</strong>
                  <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#64748b' }}>{srv.description}</p>
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
                          await fetch(`http://localhost:5000/api/v1/lab-services/${srvId}`, {
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
            ))}
          </div>
        </section>
      </div>

      {/* EDIT LAB SERVICE MODAL */}
      {editingService && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(15, 45, 85, 0.45)', display: 'grid', placeItems: 'center', padding: '16px' }}>
          <div className="modal" style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 40px rgba(16, 45, 85, 0.2)', border: '1px solid #dbe6f5' }}>
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
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Test Description</span>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
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
