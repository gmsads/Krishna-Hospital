import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Phone,
  Mail,
  MapPin,
  UsersRound,
  UserRound,
  Stethoscope,
  ClipboardList,
  FlaskConical,
  X,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Search,
  Eye,
  EyeOff,
  Key,
  Lock,
} from 'lucide-react';

export function BranchesPage({
  branches = [],
  onAddBranch,
  onUpdateBranch,
  staffList = [],
  doctorsList = [],
  patientsList = [],
  opRecordsList = [],
  onNotify,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  // Form State for Add Branch
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [status, setStatus] = useState('Active');

  const filteredBranches = branches.filter((b) =>
    `${b.name} ${b.code} ${b.location} ${b.adminName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleSaveNewBranch = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !location.trim()) {
      onNotify && onNotify('Please fill in branch name, branch code, and location.');
      return;
    }

    const branchEmail = email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@krishnahospital.org`;
    const branchPassword = adminPassword.trim() || 'admin123';

    const newBranchObj = {
      id: `BR-${104 + Math.floor(Math.random() * 900)}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      location: location.trim(),
      phone: phone.trim() || '+91 98000 00000',
      email: branchEmail,
      adminEmail: branchEmail,
      adminName: adminName.trim() || `${name.trim()} Admin`,
      adminPassword: branchPassword,
      status,
    };

    const token = localStorage.getItem('kh_auth_token');

    // Try posting to Express Backend
    try {
      const res = await fetch('/api/v1/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newBranchObj),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onNotify && onNotify(`Hospital branch "${newBranchObj.name}" (${newBranchObj.code}) created in MongoDB! Admin login: ${branchEmail}`);
      } else {
        console.warn('Backend branch creation note:', data.message);
      }
    } catch (err) {
      console.warn('Backend branch creation offline fallback:', err.message);
    }

    onAddBranch(newBranchObj);
    setIsAddModalOpen(false);
    setName('');
    setCode('');
    setLocation('');
    setPhone('');
    setEmail('');
    setAdminName('');
    setAdminPassword('admin123');
    setStatus('Active');
    onNotify && onNotify(`Hospital branch "${newBranchObj.name}" created! Admin login: ${branchEmail}`);
  };

  const handleSaveEditBranch = (e) => {
    e.preventDefault();
    if (!editingBranch.name.trim() || !editingBranch.code.trim()) {
      onNotify && onNotify('Branch name and branch code are required.');
      return;
    }

    // Update credential store
    try {
      const existing = JSON.parse(localStorage.getItem('kh_branch_credentials') || '[]');
      const filtered = existing.filter((c) => c.id !== editingBranch.id && c.email !== editingBranch.email);
      localStorage.setItem('kh_branch_credentials', JSON.stringify([editingBranch, ...filtered]));
    } catch (err) {
      console.warn('Error updating branch credentials:', err);
    }

    onUpdateBranch(editingBranch);
    setEditingBranch(null);
    onNotify && onNotify(`Branch details & admin login updated for ${editingBranch.name}`);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Super Admin Workspace</div>
          <h1>Hospital Branches Management</h1>
          <p>Create and manage hospital branches, oversee branch admins, location details, and branch-isolated operations.</p>
        </div>
        <button className="primary-button" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={17} /> Add New Branch
        </button>
      </div>

      {/* Filter & Search Bar */}
      <section className="panel full-panel" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <input
              placeholder="Search branch name, code, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '9px 12px 9px 36px', border: '1px solid #dde7f1', borderRadius: '8px', fontSize: '13px', width: '100%' }}
            />
            <Search size={16} color="#8898ab" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          </div>

          <span style={{ fontSize: '13px', fontWeight: '700', color: '#1769d7' }}>
            {filteredBranches.length} Hospital Branches Active
          </span>
        </div>
      </section>

      {/* BRANCHES CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredBranches.map((branch) => {
          // Compute branch specific metrics
          const bStaffCount = staffList.filter((s) => s.branch === branch.name || (!s.branch && branch.name === 'Central Campus')).length;
          const bDoctorCount = doctorsList.filter((d) => d.branch === branch.name || (!d.branch && branch.name === 'Central Campus')).length;
          const bPatientCount = patientsList.filter((p) => p.branch === branch.name || (!p.branch && branch.name === 'Central Campus')).length;
          const bOpCount = opRecordsList.filter((r) => r.branch === branch.name || (!r.branch && branch.name === 'Central Campus')).length;

          return (
            <div
              key={branch.id || branch.name}
              className="panel"
              style={{
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #dce7f5',
                background: '#ffffff',
                boxShadow: '0 4px 12px rgba(15, 45, 85, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'grid', placeItems: 'center' }}>
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#162d4a' }}>{branch.name}</h3>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', background: '#f0f9ff', padding: '2px 6px', borderRadius: '4px' }}>
                        Code: {branch.code}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: branch.status === 'Active' ? '#f0fdf4' : '#fef2f2',
                      color: branch.status === 'Active' ? '#15803d' : '#dc2626',
                      border: `1px solid ${branch.status === 'Active' ? '#bbf7d0' : '#fecaca'}`,
                    }}>
                      ● {branch.status}
                    </span>

                    <button
                      className="icon-button"
                      onClick={() => setEditingBranch({ ...branch })}
                      title="Edit Branch"
                      style={{ padding: '4px', color: '#1769d7' }}
                    >
                      <Edit2 size={15} />
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px', display: 'grid', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#64748b" /> <span>{branch.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} color="#1769d7" /> <span>Branch Admin: <strong>{branch.adminName}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {branch.phone}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {branch.email}</span>
                  </div>

                  {/* BRANCH ADMIN LOGIN CREDENTIALS BADGE */}
                  <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', color: '#0369a1', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>🔑 <strong>Admin Login:</strong> {branch.email || branch.adminEmail}</span>
                    <span style={{ fontWeight: '800', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', color: '#0284c7' }}>
                      Pass: {branch.adminPassword || branch.password || 'admin123'}
                    </span>
                  </div>
                </div>

                {/* Branch Operations Quick Summary Metrics */}
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #edf2f7', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Stethoscope size={16} color="#1769d7" />
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>Doctors</span>
                      <strong>{bDoctorCount} Specialists</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserRound size={16} color="#0d9488" />
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>Staff</span>
                      <strong>{bStaffCount} Members</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UsersRound size={16} color="#6366f1" />
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>Patients</span>
                      <strong>{bPatientCount} Registered</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ClipboardList size={16} color="#d97706" />
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>OP Records</span>
                      <strong>{bOpCount} Consultations</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD BRANCH MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 45, 85, 0.45)', display: 'grid', placeItems: 'center', padding: '16px' }}>
          <div className="modal" style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '540px', width: '100%', boxShadow: '0 20px 40px rgba(16, 45, 85, 0.2)', border: '1px solid #dbe6f5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f8', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} color="#1769d7" />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#162d4a' }}>Create New Hospital Branch</h3>
              </div>
              <button className="icon-button" onClick={() => setIsAddModalOpen(false)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewBranch} style={{ display: 'grid', gap: '14px' }}>
              <div className="responsive-grid-2">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Branch Name *</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. South Extension Hospital"
                    required
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#1769d7' }}>Branch Code / ID *</span>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. SOUTH-HQ"
                    required
                    style={{ padding: '10px 12px', border: '1px solid #b8d5f7', borderRadius: '7px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7' }}
                  />
                </div>
              </div>

              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Full Address / Location *</span>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Plot 45, Ring Road, South City"
                  required
                  style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                />
              </div>

              <div className="responsive-grid-2">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Branch Admin Name</span>
                  <input
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Suresh Kumar"
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', background: '#fff', fontWeight: '700' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* ADMIN LOGIN CREDENTIALS SECTION */}
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '12px', borderRadius: '8px', display: 'grid', gap: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={14} /> Branch Admin Login Credentials (Used to Log Into Branch)
                </div>

                <div className="responsive-grid-2">
                  <div className="field">
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7' }}>Branch Admin Email / Login ID *</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin.south@krishnahospital.org"
                      required
                      style={{ padding: '10px 12px', border: '1px solid #93c5fd', borderRadius: '7px', background: '#fff', fontSize: '12px' }}
                    />
                  </div>

                  <div className="field">
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7' }}>Branch Admin Password *</span>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showAddPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Set admin password"
                        required
                        style={{ padding: '10px 36px 10px 12px', border: '1px solid #93c5fd', borderRadius: '7px', background: '#fff', fontSize: '12px', fontWeight: '700', width: '100%' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAddPassword(!showAddPassword)}
                        style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7' }}
                        aria-label="Toggle password visibility"
                      >
                        {showAddPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="responsive-grid-2">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Branch Phone</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98470 00000"
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', background: '#fff', fontWeight: '700' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="secondary-button" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save Branch & Admin Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BRANCH MODAL */}
      {editingBranch && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 45, 85, 0.45)', display: 'grid', placeItems: 'center', padding: '16px' }}>
          <div className="modal" style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '540px', width: '100%', boxShadow: '0 20px 40px rgba(16, 45, 85, 0.2)', border: '1px solid #dbe6f5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f8', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={20} color="#1769d7" />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#162d4a' }}>Edit Branch - {editingBranch.name}</h3>
              </div>
              <button className="icon-button" onClick={() => setEditingBranch(null)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditBranch} style={{ display: 'grid', gap: '14px' }}>
              <div className="responsive-grid-2">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Branch Name *</span>
                  <input
                    value={editingBranch.name}
                    onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                    required
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#1769d7' }}>Branch Code / ID *</span>
                  <input
                    value={editingBranch.code}
                    onChange={(e) => setEditingBranch({ ...editingBranch, code: e.target.value })}
                    required
                    style={{ padding: '10px 12px', border: '1px solid #b8d5f7', borderRadius: '7px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7' }}
                  />
                </div>
              </div>

              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Location Address</span>
                <input
                  value={editingBranch.location}
                  onChange={(e) => setEditingBranch({ ...editingBranch, location: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                />
              </div>

              <div className="responsive-grid-2">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Branch Admin Name</span>
                  <input
                    value={editingBranch.adminName || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, adminName: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Status</span>
                  <select
                    value={editingBranch.status}
                    onChange={(e) => setEditingBranch({ ...editingBranch, status: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', background: '#fff', fontWeight: '700' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* ADMIN EDIT CREDENTIALS */}
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '12px', borderRadius: '8px', display: 'grid', gap: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={14} /> Branch Admin Login Credentials
                </div>

                <div className="responsive-grid-2">
                  <div className="field">
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7' }}>Branch Admin Email</span>
                    <input
                      type="email"
                      value={editingBranch.email || editingBranch.adminEmail || ''}
                      onChange={(e) => setEditingBranch({ ...editingBranch, email: e.target.value, adminEmail: e.target.value })}
                      required
                      style={{ padding: '10px 12px', border: '1px solid #93c5fd', borderRadius: '7px', background: '#fff', fontSize: '12px' }}
                    />
                  </div>

                  <div className="field">
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7' }}>Branch Admin Password</span>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        value={editingBranch.adminPassword || editingBranch.password || 'admin123'}
                        onChange={(e) => setEditingBranch({ ...editingBranch, adminPassword: e.target.value, password: e.target.value })}
                        required
                        style={{ padding: '10px 36px 10px 12px', border: '1px solid #93c5fd', borderRadius: '7px', background: '#fff', fontSize: '12px', fontWeight: '700', width: '100%' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7' }}
                        aria-label="Toggle password visibility"
                      >
                        {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="responsive-grid-2">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Phone</span>
                  <input
                    value={editingBranch.phone}
                    onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Email</span>
                  <input
                    value={editingBranch.email}
                    onChange={(e) => setEditingBranch({ ...editingBranch, email: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="secondary-button" onClick={() => setEditingBranch(null)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default BranchesPage;
