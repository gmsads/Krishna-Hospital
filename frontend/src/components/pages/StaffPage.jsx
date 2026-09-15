import React, { useState } from 'react';
import { ChevronDown, Edit3, Eye, EyeOff, Plus, Trash2, UserCheck, UserX, X, ShieldCheck, Clock, MessageSquare } from 'lucide-react';
import { initialStaff } from '../data/initialData';

export function StaffPage({ staff = initialStaff, onAddStaff, onNotify, effectiveBranch = 'All', branchesList = [] }) {
  const [staffList, setStaffList] = useState(staff);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffForDetails, setSelectedStaffForDetails] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Sync staffList state whenever staff prop updates from API fetch
  React.useEffect(() => {
    setStaffList(staff);
  }, [staff]);

  const filteredStaff = staffList.filter((member) => {
    const matchesSearch = `${member.name} ${member.role} ${member.department} ${member.phone}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    if (selectedRoleFilter === 'All') return matchesSearch;
    return matchesSearch && (member.role || '').toLowerCase().includes(selectedRoleFilter.toLowerCase());
  });

  // Interactive Toggle Status Reason Modal
  const [statusReasonModal, setStatusReasonModal] = useState(null);

  // Update Active / On Leave / Inactive Status (Triggers Interactive Reason Modal)
  const handleStatusChange = (member, nextStatus) => {
    if (nextStatus === 'Active') {
      setStaffList((prev) =>
        prev.map((s) => {
          if (s.id === member.id || s.name === member.name) {
            return { ...s, status: 'Active', leaveReason: '' };
          }
          return s;
        })
      );
      onNotify && onNotify(`${member.name} status updated to Active`);
    } else {
      setStatusReasonModal({
        id: member.id || member.name,
        name: member.name,
        newStatus: nextStatus,
        reason: member.leaveReason || '',
      });
    }
  };

  const handleSaveStatusReason = (e) => {
    e.preventDefault();
    if (!statusReasonModal.reason.trim()) {
      onNotify && onNotify('Please enter a reason for status change.');
      return;
    }

    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id === statusReasonModal.id || s.name === statusReasonModal.name) {
          return {
            ...s,
            status: statusReasonModal.newStatus,
            leaveReason: statusReasonModal.reason.trim(),
          };
        }
        return s;
      })
    );

    onNotify && onNotify(`${statusReasonModal.name} status updated to ${statusReasonModal.newStatus} (${statusReasonModal.reason.trim()})`);
    setStatusReasonModal(null);
  };

  // Delete Staff Member
  const handleDeleteStaff = async (id, name, dbId) => {
    if (window.confirm(`Are you sure you want to remove ${name} from staff records?`)) {
      const token = localStorage.getItem('kh_auth_token');
      const targetId = dbId || id;

      if (targetId && String(targetId).length > 10) {
        try {
          await fetch(`http://localhost:5000/api/v1/staff/${targetId}`, {
            method: 'DELETE',
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
          });
        } catch (err) {
          console.warn('Could not delete staff member in backend:', err.message);
        }
      }

      setStaffList((prev) => prev.filter((s) => s.id !== id && s._id !== targetId && s.name !== name));
      onNotify && onNotify(`${name} removed from staff directory`);
    }
  };

  // Save Edit Staff
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('kh_auth_token');
    const staffId = editingStaff._id || editingStaff.id;

    if (staffId && String(staffId).length > 10) {
      try {
        await fetch(`http://localhost:5000/api/v1/staff/${staffId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(editingStaff),
        });
      } catch (err) {
        console.warn('Could not update staff member in backend:', err.message);
      }
    }

    setStaffList((prev) =>
      prev.map((s) => (s.id === editingStaff.id || s._id === editingStaff._id || s.name === editingStaff.name ? editingStaff : s))
    );
    setEditingStaff(null);
    onNotify && onNotify(`Staff details updated for ${editingStaff.name}`);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">People & permissions</div>
          <h1>Staff management</h1>
          <p>Manage hospital team members, set Active / On Leave / Inactive statuses, specify leave/inactive reasons, and view staff profiles.</p>
        </div>
        <button className="primary-button" onClick={onAddStaff}>
          <Plus size={17} /> Add staff member
        </button>
      </div>
      
      <section className="panel full-panel">
        <div className="list-toolbar" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0 }}>Hospital staff ({filteredStaff.length})</h2>
              {effectiveBranch && effectiveBranch !== 'All' && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  background: '#e0f2fe',
                  color: '#0284c7',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  border: '1px solid #bae6fd',
                }}>
                  🏥 {effectiveBranch}
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#687c96' }}>
              {effectiveBranch && effectiveBranch !== 'All'
                ? `Showing ${filteredStaff.length} staff member${filteredStaff.length === 1 ? '' : 's'} assigned to ${effectiveBranch}`
                : `Showing ${filteredStaff.length} staff member${filteredStaff.length === 1 ? '' : 's'} across all hospital branches`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              placeholder="Search staff by name, role, dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #dde7f1',
                borderRadius: '8px',
                fontSize: '12px',
                width: '200px',
              }}
            />

            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #dde7f1',
                borderRadius: '8px',
                fontSize: '12px',
                background: '#fff',
                fontWeight: '600',
                color: '#1e293b',
              }}
            >
              <option value="All">All roles</option>
              <option value="Doctor">Doctors</option>
              <option value="Front Desk">Front Desk</option>
              <option value="Lab">Lab Assistants</option>
              <option value="Nurse">Nurses</option>
              <option value="Admin">Administrators</option>
              <option value="Security">Security</option>
            </select>
          </div>
        </div>
        <div className="staff-list">
          {filteredStaff.map((member) => (
            <div className="staff-row-responsive" key={member.id || member.name}>
              <div
                className="avatar avatar-soft"
                onClick={() => setSelectedStaffForDetails(member)}
                style={{ cursor: 'pointer' }}
                title="Click to view staff profile details"
              >
                {member.name.split(' ').map((word) => word[0]).join('')}
              </div>
              
              <div
                className="staff-name"
                onClick={() => setSelectedStaffForDetails(member)}
                style={{ cursor: 'pointer' }}
                title="Click to view staff profile details"
              >
                <strong style={{ color: '#1769d7', textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'text-decoration-color 0.2s' }}>
                  {member.name}
                </strong>
                <span>{member.department} {member.phone ? `· ${member.phone}` : ''} <strong style={{ color: '#1769d7' }}>· {member.salary || '₹ 28,000'}</strong></span>

                {/* Reason Alert Callout Badge */}
                {member.status && member.status !== 'Active' && member.leaveReason && (
                  <div style={{
                    fontSize: '11px',
                    background: member.status === 'On Leave' || member.status === 'On leave' ? '#fffbeb' : '#fef2f2',
                    border: member.status === 'On Leave' || member.status === 'On leave' ? '1px solid #fde68a' : '1px solid #fecaca',
                    color: member.status === 'On Leave' || member.status === 'On leave' ? '#b45309' : '#b91c1c',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    marginTop: '4px',
                    fontWeight: '600',
                  }}>
                    <strong>{member.status === 'On Leave' || member.status === 'On leave' ? 'Leave Reason:' : 'Inactive Reason:'}</strong> {member.leaveReason}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="role-pill">{member.role}</span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '12px' }}>
                  🏥 {member.branch || 'Central Campus'}
                </span>
              </div>
              
              {/* Active / On Leave / Inactive Status Dropdown per Row (Triggers Reason Modal) */}
              <div>
                <select
                  value={member.status || 'Active'}
                  onChange={(e) => handleStatusChange(member, e.target.value)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    outline: 'none',
                    border: '1px solid',
                    borderColor:
                      member.status === 'Active'
                        ? '#bbf7d0'
                        : member.status === 'On Leave' || member.status === 'On leave'
                        ? '#fde68a'
                        : '#fecaca',
                    background:
                      member.status === 'Active'
                        ? '#f0fdf4'
                        : member.status === 'On Leave' || member.status === 'On leave'
                        ? '#fffbeb'
                        : '#fef2f2',
                    color:
                      member.status === 'Active'
                        ? '#15803d'
                        : member.status === 'On Leave' || member.status === 'On leave'
                        ? '#b45309'
                        : '#b91c1c',
                  }}
                >
                  <option value="Active">● Active</option>
                  <option value="On Leave">● On Leave</option>
                  <option value="Inactive">● Inactive</option>
                </select>
              </div>

              {/* Row Action Controls: Edit, Delete, Details */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  className="icon-button"
                  style={{ width: '32px', height: '32px', padding: 0 }}
                  onClick={() => setEditingStaff(member)}
                  title="Edit Staff Member"
                >
                  <Edit3 size={15} color="#1769d7" />
                </button>

                <button
                  className="icon-button"
                  style={{ width: '32px', height: '32px', padding: 0 }}
                  onClick={() => handleDeleteStaff(member.id || member.name, member.name)}
                  title="Delete Staff Member"
                >
                  <Trash2 size={15} color="#dc2626" />
                </button>

                {/* Eye Icon Button for Complete Staff Profile Details */}
                <button
                  className="table-more"
                  style={{ width: '32px', height: '32px' }}
                  onClick={() => setSelectedStaffForDetails(member)}
                  title="View Complete Staff Profile Details"
                >
                  <Eye size={16} color="#1769d7" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INTERACTIVE TOGGLE STATUS REASON MODAL FOR STAFF */}
      {statusReasonModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(15, 45, 85, 0.45)', display: 'grid', placeItems: 'center', padding: '16px' }}>
          <div className="modal" style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 40px rgba(16, 45, 85, 0.2)', border: '1px solid #dbe6f5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f8', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={20} color={statusReasonModal.newStatus === 'On Leave' ? '#d97706' : '#dc2626'} />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#162d4a' }}>
                  Enter {statusReasonModal.newStatus} Reason
                </h3>
              </div>
              <button className="icon-button" onClick={() => setStatusReasonModal(null)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStatusReason} style={{ display: 'grid', gap: '14px' }}>
              <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
                Changing status of <strong>{statusReasonModal.name}</strong> to{' '}
                <strong style={{ color: statusReasonModal.newStatus === 'On Leave' ? '#b45309' : '#dc2626' }}>
                  {statusReasonModal.newStatus}
                </strong>.
              </p>

              <div className="field">
                <span style={{ fontSize: '12px', fontWeight: '700', color: statusReasonModal.newStatus === 'On Leave' ? '#b45309' : '#dc2626' }}>
                  {statusReasonModal.newStatus === 'On Leave' ? 'Leave Reason *' : 'Inactive Reason *'}
                </span>
                <input
                  value={statusReasonModal.reason}
                  onChange={(e) => setStatusReasonModal({ ...statusReasonModal, reason: e.target.value })}
                  placeholder={statusReasonModal.newStatus === 'On Leave' ? 'e.g. Medical Leave, Casual Vacation, Personal Emergency' : 'e.g. Resigned, Retired, Contract Terminated'}
                  required
                  autoFocus
                  style={{
                    padding: '10px 12px',
                    border: statusReasonModal.newStatus === 'On Leave' ? '1px solid #fde68a' : '1px solid #fecaca',
                    borderRadius: '7px',
                    background: statusReasonModal.newStatus === 'On Leave' ? '#fffbeb' : '#fef2f2',
                    color: statusReasonModal.newStatus === 'On Leave' ? '#b45309' : '#dc2626',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="secondary-button" onClick={() => setStatusReasonModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" style={{ background: statusReasonModal.newStatus === 'On Leave' ? '#1769d7' : '#dc2626', borderColor: statusReasonModal.newStatus === 'On Leave' ? '#1769d7' : '#dc2626' }}>
                  Save Status & Reason
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Profile Details Modal */}
      {selectedStaffForDetails && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 45, 85, 0.45)', display: 'grid', placeItems: 'center', padding: '16px' }}>
          <div className="modal" style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '560px', width: '100%', boxShadow: '0 20px 40px rgba(16, 45, 85, 0.2)', border: '1px solid #dbe6f5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f8', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="avatar avatar-blue" style={{ width: '40px', height: '40px', fontSize: '15px' }}>
                  {selectedStaffForDetails.name.split(' ').map((w) => w[0]).join('')}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#162d4a' }}>{selectedStaffForDetails.name}</h3>
                  <span style={{ fontSize: '12px', color: '#687c96' }}>{selectedStaffForDetails.role} · {selectedStaffForDetails.department}</span>
                </div>
              </div>
              <button className="icon-button" onClick={() => setSelectedStaffForDetails(null)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px', fontSize: '13px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #edf2f7', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><strong>Employee ID:</strong> {selectedStaffForDetails.id || 'EMP-1002'}</div>
                <div><strong>Role / Title:</strong> {selectedStaffForDetails.role}</div>
                <div><strong>Department:</strong> {selectedStaffForDetails.department}</div>
                <div><strong>Monthly Salary:</strong> <strong style={{ color: '#1769d7' }}>{selectedStaffForDetails.salary || '₹ 28,000'}</strong></div>
                <div><strong>Qualifications:</strong> {selectedStaffForDetails.qualification || 'Higher Secondary'}</div>
                <div><strong>Experience:</strong> {selectedStaffForDetails.experience || '3 Years'}</div>
                <div><strong>Phone:</strong> {selectedStaffForDetails.phone || '+91 98470 12345'}</div>
                <div><strong>Email:</strong> {selectedStaffForDetails.email || 'staff@krishnahospital.org'}</div>
                <div><strong>Shift:</strong> {selectedStaffForDetails.shift || 'Day Shift (08:00 AM - 04:00 PM)'}</div>
                <div><strong>Status:</strong> <span style={{ color: selectedStaffForDetails.status === 'Active' ? '#15803d' : '#b45309', fontWeight: '700' }}>{selectedStaffForDetails.status || 'Active'}</span></div>
                <div><strong>Date Joined:</strong> {selectedStaffForDetails.dateJoined || '2024-01-15'}</div>
                <div><strong>Password:</strong> <code style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>{selectedStaffForDetails.password || 'Staff@123'}</code></div>
              </div>

              {selectedStaffForDetails.leaveReason && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', color: '#b45309', fontSize: '12px' }}>
                  <strong>Status Change Reason:</strong> {selectedStaffForDetails.leaveReason}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button className="primary-button" onClick={() => setSelectedStaffForDetails(null)}>
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL */}
      {editingStaff && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 45, 85, 0.45)', display: 'grid', placeItems: 'center', padding: '16px', overflowY: 'auto' }}>
          <div className="modal" style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '640px', width: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(16, 45, 85, 0.2)', border: '1px solid #dbe6f5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f8', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#162d4a' }}>Edit Staff Member Details</h3>
              <button className="icon-button" onClick={() => setEditingStaff(null)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'grid', gap: '14px' }}>
              {/* Row 1: Employee ID & Full Name */}
              <div className="responsive-grid-2">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#1769d7' }}>Employee ID *</span>
                  <input
                    value={editingStaff.id || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, id: e.target.value })}
                    required
                    style={{ padding: '10px 12px', border: '1px solid #b8d5f7', borderRadius: '7px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#1769d7' }}>Hospital Branch Campus *</span>
                  <select
                    value={editingStaff.branch || 'Central Campus'}
                    onChange={(e) => {
                      const selectedB = e.target.value;
                      const matchingB = branchesList.find((b) => b.name === selectedB);
                      setEditingStaff({
                        ...editingStaff,
                        branch: selectedB,
                        branchCode: matchingB?.code || 'HQ-CENTRAL',
                      });
                    }}
                    style={{ padding: '10px 12px', border: '1px solid #b8d5f7', borderRadius: '7px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7' }}
                  >
                    {branchesList.length > 0 ? (
                      branchesList.map((b) => (
                        <option key={b.id || b.name} value={b.name}>
                          {b.name} ({b.code || 'BRANCH'})
                        </option>
                      ))
                    ) : (
                      <option value="Central Campus">Central Campus</option>
                    )}
                  </select>
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Staff Full Name *</span>
                  <input
                    value={editingStaff.name || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                    required
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>
              </div>

              {/* Row 2: Role & Department */}
              <div className="responsive-grid-2">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Staff Role *</span>
                  <input
                    list="edit-role-suggestions"
                    value={editingStaff.role || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                    required
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', background: '#fff' }}
                  />
                  <datalist id="edit-role-suggestions">
                    <option value="Security Guard" />
                    <option value="Pharmacist" />
                    <option value="Front Desk Officer" />
                    <option value="Lab Assistant" />
                    <option value="Nurse" />
                    <option value="Maintenance Supervisor" />
                    <option value="Admin" />
                  </datalist>
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Department *</span>
                  <select
                    value={editingStaff.department || 'Front Desk Operations'}
                    onChange={(e) => setEditingStaff({ ...editingStaff, department: e.target.value })}
                    required
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', background: '#fff' }}
                  >
                    <option value="General medicine">General medicine</option>
                    <option value="Internal medicine">Internal medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Front Desk Operations">Front Desk Operations</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Qualifications, Experience & Monthly Salary */}
              <div className="responsive-grid-3">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Qualifications *</span>
                  <input
                    value={editingStaff.qualification || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, qualification: e.target.value })}
                    placeholder="e.g. B.Com, B.Sc MLT"
                    required
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Experience *</span>
                  <input
                    value={editingStaff.experience || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, experience: e.target.value })}
                    placeholder="e.g. 3 Years"
                    required
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#1769d7' }}>Monthly Salary (₹) *</span>
                  <input
                    value={editingStaff.salary || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, salary: e.target.value })}
                    placeholder="e.g. ₹ 28,000"
                    required
                    style={{ padding: '10px 12px', border: '1px solid #b8d5f7', borderRadius: '7px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7' }}
                  />
                </div>
              </div>

              {/* Row 4: Phone & Email */}
              <div className="responsive-grid-2">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Phone Number *</span>
                  <input
                    value={editingStaff.phone || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    required
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Email Address</span>
                  <input
                    type="email"
                    value={editingStaff.email || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>
              </div>

              {/* Row 5: Work Shift Timings, Employment Status & Date Joined */}
              <div className="responsive-grid-3">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Work Shift Timings *</span>
                  <select
                    value={editingStaff.shift || 'Day Shift (08:00 AM - 04:00 PM)'}
                    onChange={(e) => setEditingStaff({ ...editingStaff, shift: e.target.value })}
                    required
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', background: '#fff' }}
                  >
                    <option value="Day Shift (08:00 AM - 04:00 PM)">Day Shift (08:00 AM - 04:00 PM)</option>
                    <option value="Evening Shift (02:00 PM - 10:00 PM)">Evening Shift (02:00 PM - 10:00 PM)</option>
                    <option value="Night Shift (10:00 PM - 06:00 AM)">Night Shift (10:00 PM - 06:00 AM)</option>
                    <option value="Rotational Shift">Rotational Shift</option>
                  </select>
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Employment Status *</span>
                  <select
                    value={editingStaff.status || 'Active'}
                    onChange={(e) => setEditingStaff({ ...editingStaff, status: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', background: '#fff', fontWeight: '700' }}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Date Joined *</span>
                  <input
                    type="date"
                    value={editingStaff.dateJoined || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, dateJoined: e.target.value })}
                    required
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>
              </div>

              {/* Row 6: Password */}
              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626' }}>Staff Login Password *</span>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editingStaff.password || 'Staff@123'}
                    onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })}
                    placeholder="Enter password"
                    required
                    style={{ padding: '10px 40px 10px 12px', border: '1px solid #fecaca', borderRadius: '7px', width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                    title={showEditPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {editingStaff.status !== 'Active' && (
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: editingStaff.status === 'On Leave' ? '#b45309' : '#b91c1c' }}>
                    {editingStaff.status === 'On Leave' ? 'Leave Reason' : 'Inactive Reason'}
                  </span>
                  <input
                    value={editingStaff.leaveReason || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, leaveReason: e.target.value })}
                    placeholder={editingStaff.status === 'On Leave' ? 'e.g. Medical Leave, Vacation' : 'e.g. Resigned, Retired'}
                    style={{
                      padding: '10px 12px',
                      border: editingStaff.status === 'On Leave' ? '1px solid #fde68a' : '1px solid #fecaca',
                      borderRadius: '7px',
                      background: editingStaff.status === 'On Leave' ? '#fffbeb' : '#fef2f2',
                      color: editingStaff.status === 'On Leave' ? '#b45309' : '#b91c1c',
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="secondary-button" onClick={() => setEditingStaff(null)}>
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

export default StaffPage;
