import React, { useState } from 'react';
import {
  Stethoscope,
  Plus,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  X,
  Award,
  FileText,
  Upload,
  Image,
  Edit2,
  Trash2,
  AlertTriangle,
  MessageSquare,
  IndianRupee,
  Eye,
  EyeOff,
} from 'lucide-react';
import { initialStaff } from '../data/initialData';

export const initialDoctors = [];

export function DoctorsPage({ doctors = [], onNotify, effectiveBranch = 'All', branchesList = [] }) {
  const [doctorList, setDoctorList] = useState(doctors);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Sync doctorList state whenever doctors prop updates from API fetch
  React.useEffect(() => {
    setDoctorList(doctors);
  }, [doctors]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [deletingDoctorId, setDeletingDoctorId] = useState(null);
  const [selectedDoctorForDetails, setSelectedDoctorForDetails] = useState(null);
  
  // Interactive Toggle Status Reason Modal
  const [statusReasonModal, setStatusReasonModal] = useState(null);

  // Add Form State
  const defaultBranchName = effectiveBranch === 'All' 
    ? (branchesList[0]?.name || 'Central Campus') 
    : effectiveBranch;

  const [newDocId, setNewDocId] = useState('DOC-0001');
  const [newDocName, setNewDocName] = useState('');
  const [newDocBranch, setNewDocBranch] = useState(defaultBranchName);
  const [newDocDept, setNewDocDept] = useState('General Medicine');
  const [newDocLicense, setNewDocLicense] = useState('');
  const [newDocQual, setNewDocQual] = useState('');
  const [newDocExp, setNewDocExp] = useState('');
  const [newDocPhone, setNewDocPhone] = useState('');
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocShift, setNewDocShift] = useState('Morning OPD (08:00 AM - 02:00 PM)');
  const [newDocStatus, setNewDocStatus] = useState('Active');
  const [newDocLeaveReason, setNewDocLeaveReason] = useState('');
  const [newDocSalary, setNewDocSalary] = useState('₹ 85,000');
  const [newDocPassword, setNewDocPassword] = useState('Doc@123');
  const [showAddDocPassword, setShowAddDocPassword] = useState(false);
  const [showEditDocPassword, setShowEditDocPassword] = useState(false);
  const [newDocImage, setNewDocImage] = useState('');

  // Fetch next DOC-0001 ID on modal open
  React.useEffect(() => {
    if (isAddModalOpen) {
      fetch('/api/v1/doctors/next-docid')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.nextDocId) {
            setNewDocId(data.data.nextDocId);
          }
        })
        .catch((err) => console.warn('Could not fetch next docId from backend:', err.message));
    }
  }, [isAddModalOpen]);

  const handleImageFileChange = (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditingDoctor((prev) => ({ ...prev, image: reader.result }));
        } else {
          setNewDocImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredDoctors = doctorList.filter((doc) => {
    const matchesQuery = `${doc.name} ${doc.department} ${doc.licenseNo} ${doc.qualification}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'All' || doc.department === selectedDept;
    const matchesStatus = selectedStatus === 'All' || doc.status === selectedStatus;
    return matchesQuery && matchesDept && matchesStatus;
  });

  const handleSaveNewDoctor = async (e) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocLicense.trim() || !newDocPassword.trim()) {
      onNotify && onNotify('Please fill in doctor name, medical license number, and password.');
      return;
    }

    const assignedBranch = effectiveBranch === 'All' ? newDocBranch : effectiveBranch;
    const matchingBranchObj = branchesList.find((b) => b.name === assignedBranch);
    const assignedCode = matchingBranchObj?.code || 'HQ-CENTRAL';

    const doctorObj = {
      id: newDocId,
      docId: newDocId,
      name: newDocName.startsWith('Dr.') ? newDocName.trim() : `Dr. ${newDocName.trim()}`,
      department: newDocDept,
      licenseNo: newDocLicense.trim(),
      qualification: newDocQual.trim() || 'MBBS, MD',
      experience: newDocExp.trim() ? `${newDocExp.trim()} Years Practice` : '5 Years Practice',
      phone: newDocPhone.trim() || '+91 98470 00000',
      email: newDocEmail.trim() || `${newDocName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@krishnahospital.org`,
      shift: newDocShift,
      status: newDocStatus,
      leaveReason: newDocStatus !== 'Active' ? newDocLeaveReason.trim() : '',
      salary: newDocSalary.trim().startsWith('₹') ? newDocSalary.trim() : `₹ ${newDocSalary.trim()}`,
      password: newDocPassword.trim(),
      image: newDocImage || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      branch: assignedBranch,
      branchCode: assignedCode,
    };

    const token = localStorage.getItem('kh_auth_token');
    let savedObj = doctorObj;

    try {
      const res = await fetch('/api/v1/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(doctorObj),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        savedObj = data.data;
        onNotify && onNotify(`${savedObj.name} registered in MongoDB! Login: ${savedObj.email}`);
      }
    } catch (err) {
      console.warn('Backend doctor registration offline fallback:', err.message);
    }

    setDoctorList((prev) => [savedObj, ...prev]);
    setIsAddModalOpen(false);
    setNewDocName('');
    setNewDocLicense('');
    setNewDocQual('');
    setNewDocExp('');
    setNewDocPhone('');
    setNewDocEmail('');
    setNewDocStatus('Active');
    setNewDocLeaveReason('');
    setNewDocSalary('₹ 85,000');
    setNewDocPassword('Doc@123');
    setNewDocImage('');
    onNotify && onNotify(`${savedObj.name} registered successfully!`);
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    if (!editingDoctor.name.trim() || !editingDoctor.licenseNo.trim()) {
      onNotify && onNotify('Doctor name and medical license number are required.');
      return;
    }

    const token = localStorage.getItem('kh_auth_token');
    const docId = editingDoctor._id || editingDoctor.id;

    if (docId && String(docId).length > 10) {
      try {
        await fetch(`/api/v1/doctors/${docId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(editingDoctor),
        });
      } catch (err) {
        console.warn('Could not update doctor in backend:', err.message);
      }
    }

    setDoctorList((prev) =>
      prev.map((d) => (d.id === editingDoctor.id || d._id === editingDoctor._id ? { ...editingDoctor } : d))
    );
    onNotify && onNotify(`${editingDoctor.name} profile updated successfully!`);
    setEditingDoctor(null);
  };

  // Trigger reason prompt modal upon dropdown toggle
  const handleQuickStatusChange = (doc, newStatus) => {
    if (newStatus === 'Active') {
      setDoctorList((prev) =>
        prev.map((d) => (d.id === doc.id || d._id === doc._id ? { ...d, status: 'Active', leaveReason: '' } : d))
      );
      onNotify && onNotify(`${doc.name} status updated to Active`);
    } else {
      setStatusReasonModal({
        id: doc._id || doc.id,
        doctorName: doc.name,
        newStatus,
        reason: doc.leaveReason || '',
      });
    }
  };

  const handleSaveStatusReason = (e) => {
    e.preventDefault();
    if (!statusReasonModal.reason.trim()) {
      onNotify && onNotify('Please enter a reason for status change.');
      return;
    }

    setDoctorList((prev) =>
      prev.map((doc) => {
        if (doc.id === statusReasonModal.id || doc._id === statusReasonModal.id) {
          return {
            ...doc,
            status: statusReasonModal.newStatus,
            leaveReason: statusReasonModal.reason.trim(),
          };
        }
        return doc;
      })
    );

    onNotify && onNotify(`${statusReasonModal.doctorName} set to ${statusReasonModal.newStatus} (${statusReasonModal.reason.trim()})`);
    setStatusReasonModal(null);
  };

  const handleDeleteDoctor = async (id, name, dbId) => {
    const token = localStorage.getItem('kh_auth_token');
    const targetId = dbId || id;
    const docToDelete = doctorList.find((d) => d.id === id || d._id === targetId);

    if (targetId && String(targetId).length > 10) {
      try {
        await fetch(`/api/v1/doctors/${targetId}`, {
          method: 'DELETE',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });
      } catch (err) {
        console.warn('Could not delete doctor in backend:', err.message);
      }
    }

    setDoctorList((prev) => prev.filter((d) => d.id !== id && d._id !== targetId));
    setDeletingDoctorId(null);
    onNotify && onNotify(`${docToDelete?.name || name || 'Doctor'} removed from directory.`);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Medical Staff Directory</div>
          <h1>Doctors Directory</h1>
          <p>Manage hospital medical specialists, qualifications, medical registration licenses, leave/inactive reasons, salary, and status.</p>
        </div>
        <button className="primary-button" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={17} /> Add Doctor
        </button>
      </div>

      {/* Filter & Search Bar */}
      <section className="panel full-panel" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: '1 1 300px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
              <input
                placeholder="Search doctors, department, license no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '9px 12px 9px 36px', border: '1px solid #dde7f1', borderRadius: '8px', fontSize: '13px', width: '100%' }}
              />
              <Search size={16} color="#8898ab" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ padding: '9px 12px', border: '1px solid #dde7f1', borderRadius: '8px', fontSize: '13px', background: '#fff', fontWeight: '600' }}
            >
              <option value="All">All Departments</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Internal Medicine">Internal Medicine</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Pediatrics">Pediatrics</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ padding: '9px 12px', border: '1px solid #dde7f1', borderRadius: '8px', fontSize: '13px', background: '#fff', fontWeight: '600' }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <span style={{ fontSize: '13px', fontWeight: '700', color: '#1769d7' }}>
            {filteredDoctors.length} Medical Specialists Listed
          </span>
        </div>
      </section>

      {/* DOCTORS CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredDoctors.map((doc) => (
          <div
            key={doc._id || doc.id || doc.docId || doc.email || doc.name}
            className="panel"
            style={{
              padding: '20px',
              borderRadius: '12px',
              border: doc.status === 'Active' ? '1px solid #dce7f5' : doc.status === 'On Leave' ? '1px solid #fde68a' : '1px solid #fecaca',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              boxShadow: '0 4px 12px rgba(15, 45, 85, 0.05)',
            }}
          >
            <div>
              {/* Doctor Card Header */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
                <img
                  src={doc.image}
                  alt={doc.name}
                  onClick={() => setSelectedDoctorForDetails(doc)}
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #1769d7', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', cursor: 'pointer' }}
                  title="Click to view doctor details"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3
                      onClick={() => setSelectedDoctorForDetails(doc)}
                      style={{ margin: 0, fontSize: '16px', color: '#1769d7', cursor: 'pointer', textDecoration: 'none' }}
                      title="Click to view doctor details"
                    >
                      {doc.name}
                    </h3>

                    {/* Action Buttons: View Details, Edit & Delete */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="icon-button"
                        onClick={() => setSelectedDoctorForDetails(doc)}
                        title="View Doctor Details"
                        aria-label="View Doctor Details"
                        style={{ padding: '4px', color: '#1769d7' }}
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        className="icon-button"
                        onClick={() => setEditingDoctor({ ...doc })}
                        title="Edit Doctor Profile"
                        aria-label="Edit Doctor Profile"
                        style={{ padding: '4px', color: '#1769d7' }}
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        className="icon-button"
                        onClick={() => setDeletingDoctorId(doc.id)}
                        title="Delete Doctor Profile"
                        aria-label="Delete Doctor Profile"
                        style={{ padding: '4px', color: '#dc2626' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#1769d7', background: '#f4f8fe', padding: '2px 8px', borderRadius: '6px' }}>
                      {doc.department}
                    </span>

                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                      🏥 {doc.branch || 'Central Campus'} ({doc.branchCode || (doc.branch === 'City Extension' ? 'EXT-CITY' : doc.branch === 'North Hospital' ? 'NORTH-MED' : 'HQ-CENTRAL')})
                    </span>

                    {/* Status Dropdown Selector */}
                    <select
                      value={doc.status}
                      onChange={(e) => handleQuickStatusChange(doc, e.target.value)}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: '800',
                        background: doc.status === 'Active' ? '#f0fdf4' : doc.status === 'On Leave' ? '#fffbeb' : '#fef2f2',
                        color: doc.status === 'Active' ? '#15803d' : doc.status === 'On Leave' ? '#b45309' : '#b91c1c',
                        border: '1px solid',
                        borderColor: doc.status === 'Active' ? '#bbf7d0' : doc.status === 'On Leave' ? '#fde68a' : '#fecaca',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Leave or Inactive Reason Alert Box */}
              {doc.status !== 'Active' && doc.leaveReason && (
                <div
                  style={{
                    background: doc.status === 'On Leave' ? '#fefce8' : '#fef2f2',
                    border: doc.status === 'On Leave' ? '1px solid #fef08a' : '1px solid #fecaca',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: doc.status === 'On Leave' ? '#a16207' : '#b91c1c',
                    marginBottom: '12px',
                  }}
                >
                  <strong>{doc.status === 'On Leave' ? 'Leave Reason:' : 'Inactive Reason:'}</strong> {doc.leaveReason}
                </div>
              )}

              {/* Doctor Details Card Panel */}
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #edf2f7', display: 'grid', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b' }}>
                  <FileText size={14} color="#1769d7" />
                  <span>License No: <strong style={{ color: '#1769d7' }}>{doc.licenseNo}</strong></span>
                </div>

                {/* Monthly Salary Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: '700' }}>
                  <IndianRupee size={14} color="#15803d" />
                  <span>Monthly Salary: <strong style={{ color: '#15803d' }}>{doc.salary || '₹ 85,000'} / mo</strong></span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                  <Award size={14} color="#208e74" />
                  <span>{doc.qualification}</span>
                </div>

                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Experience: <strong>{doc.experience}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '11px' }}>
                  <Clock size={14} color="#6366f1" />
                  <span>{doc.shift}</span>
                </div>
              </div>

              {/* Contact Details */}
              <div style={{ marginTop: '12px', display: 'grid', gap: '4px', fontSize: '11px', color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={13} /> {doc.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={13} /> {doc.email}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* INTERACTIVE TOGGLE STATUS REASON MODAL */}
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
                Changing status of <strong>{statusReasonModal.doctorName}</strong> to{' '}
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
                  placeholder={statusReasonModal.newStatus === 'On Leave' ? 'e.g. Medical Leave, Annual Conference, Personal Emergency' : 'e.g. Resigned, Retired, Relocated, Contract Expired'}
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

      {/* DOCTOR PROFILE DETAILS MODAL */}
      {selectedDoctorForDetails && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 45, 85, 0.45)', display: 'grid', placeItems: 'center', padding: '16px' }}>
          <div className="modal" style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '580px', width: '100%', boxShadow: '0 20px 40px rgba(16, 45, 85, 0.2)', border: '1px solid #dbe6f5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f8', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={selectedDoctorForDetails.image}
                  alt={selectedDoctorForDetails.name}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #1769d7' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#162d4a' }}>{selectedDoctorForDetails.name}</h3>
                  <span style={{ fontSize: '12px', color: '#687c96' }}>{selectedDoctorForDetails.department} Specialist</span>
                </div>
              </div>
              <button className="icon-button" onClick={() => setSelectedDoctorForDetails(null)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px', fontSize: '13px' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #edf2f7', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><strong>Doctor ID / Ref:</strong> {selectedDoctorForDetails.id || 'DOC-101'}</div>
                <div><strong>Medical License No:</strong> <strong style={{ color: '#1769d7' }}>{selectedDoctorForDetails.licenseNo}</strong></div>
                <div><strong>Department:</strong> {selectedDoctorForDetails.department}</div>
                <div><strong>Monthly Salary:</strong> <strong style={{ color: '#15803d' }}>{selectedDoctorForDetails.salary || '₹ 85,000'}</strong></div>
                <div><strong>Qualifications:</strong> {selectedDoctorForDetails.qualification || 'MBBS, MD'}</div>
                <div><strong>Experience:</strong> {selectedDoctorForDetails.experience || '5 Years'}</div>
                <div><strong>Phone Number:</strong> {selectedDoctorForDetails.phone || '+91 98470 00000'}</div>
                <div><strong>Email Address:</strong> {selectedDoctorForDetails.email || 'doctor@krishnahospital.org'}</div>
                <div><strong>OPD Shift Timings:</strong> {selectedDoctorForDetails.shift || 'Morning OPD'}</div>
                <div><strong>Status:</strong> <span style={{ color: selectedDoctorForDetails.status === 'Active' ? '#15803d' : '#b45309', fontWeight: '700' }}>{selectedDoctorForDetails.status || 'Active'}</span></div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Doctor Login Password:</strong> <code style={{ background: '#fef2f2', color: '#dc2626', padding: '3px 8px', borderRadius: '4px', fontWeight: '700', marginLeft: '6px', fontSize: '13px', border: '1px solid #fecaca' }}>{selectedDoctorForDetails.password || 'Doc@123'}</code>
                </div>
              </div>

              {selectedDoctorForDetails.leaveReason && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', color: '#b45309', fontSize: '12px' }}>
                  <strong>Status Change Reason:</strong> {selectedDoctorForDetails.leaveReason}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button className="primary-button" onClick={() => setSelectedDoctorForDetails(null)}>
                  Close Profile Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD DOCTOR MODAL (WITH SALARY FIELD) */}
      {isAddModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 45, 85, 0.45)', display: 'grid', placeItems: 'center', padding: '16px', overflowY: 'auto' }}>
          <div className="modal" style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '540px', width: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(16, 45, 85, 0.2)', border: '1px solid #dbe6f5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f8', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Stethoscope size={20} color="#1769d7" />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#162d4a' }}>Add New Doctor</h3>
              </div>
              <button className="icon-button" onClick={() => setIsAddModalOpen(false)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewDoctor} style={{ display: 'grid', gap: '14px' }}>
              {/* Doctor Profile Photo Upload */}
              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#1769d7' }}>Doctor Profile Photo / Image Upload</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#f4f8fe', padding: '12px', borderRadius: '8px', border: '1px dashed #b8d5f7' }}>
                  <div style={{ position: 'relative', width: '54px', height: '54px', borderRadius: '50%', background: '#e0ecfc', overflow: 'hidden', flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                    {newDocImage ? (
                      <img src={newDocImage} alt="Doctor Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Upload size={22} color="#1769d7" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, false)} style={{ fontSize: '12px' }} />
                    <span style={{ display: 'block', fontSize: '10px', color: '#687c96', marginTop: '4px' }}>Select JPG, PNG or WEBP profile image</span>
                  </div>
                </div>
              </div>

              {/* Doctor Full Name */}
              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Doctor Full Name *</span>
                <input
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. Dr. Meera Nair"
                  required
                  style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                />
              </div>

              {/* Department & Medical License Number */}
              <div className="responsive-grid-2">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Department *</span>
                  <select
                    value={newDocDept}
                    onChange={(e) => setNewDocDept(e.target.value)}
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', background: '#fff' }}
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Internal Medicine">Internal Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Dermatology">Dermatology</option>
                  </select>
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#1769d7' }}>Medical License / Registration No. *</span>
                  <input
                    value={newDocLicense}
                    onChange={(e) => setNewDocLicense(e.target.value)}
                    placeholder="e.g. KMC-48201"
                    required
                    style={{ padding: '10px 12px', border: '1px solid #b8d5f7', borderRadius: '7px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7' }}
                  />
                </div>
              </div>

              {/* Monthly Salary & Status */}
              <div className="responsive-grid-2">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#15803d' }}>Monthly Salary (₹) *</span>
                  <input
                    value={newDocSalary}
                    onChange={(e) => setNewDocSalary(e.target.value)}
                    placeholder="e.g. ₹ 85,000"
                    required
                    style={{ padding: '10px 12px', border: '1px solid #bbf7d0', borderRadius: '7px', background: '#f0fdf4', fontWeight: '700', color: '#15803d' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Employment Status *</span>
                  <select
                    value={newDocStatus}
                    onChange={(e) => setNewDocStatus(e.target.value)}
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', background: '#fff', fontWeight: '700' }}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {newDocStatus !== 'Active' && (
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: newDocStatus === 'On Leave' ? '#b45309' : '#b91c1c' }}>
                    {newDocStatus === 'On Leave' ? 'Leave Reason *' : 'Inactive Reason *'}
                  </span>
                  <input
                    value={newDocLeaveReason}
                    onChange={(e) => setNewDocLeaveReason(e.target.value)}
                    placeholder={newDocStatus === 'On Leave' ? 'e.g. Medical Leave, Annual Conference' : 'e.g. Resigned, Retired, Relocated'}
                    required
                    style={{
                      padding: '10px 12px',
                      border: newDocStatus === 'On Leave' ? '1px solid #fde68a' : '1px solid #fecaca',
                      borderRadius: '7px',
                      background: newDocStatus === 'On Leave' ? '#fffbeb' : '#fef2f2',
                      color: newDocStatus === 'On Leave' ? '#b45309' : '#b91c1c',
                    }}
                  />
                </div>
              )}

              {/* Qualifications & Experience */}
              <div className="responsive-grid-2">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Qualifications</span>
                  <input
                    value={newDocQual}
                    onChange={(e) => setNewDocQual(e.target.value)}
                    placeholder="e.g. MBBS, MD (General Medicine)"
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Experience (Years)</span>
                  <input
                    type="number"
                    value={newDocExp}
                    onChange={(e) => setNewDocExp(e.target.value)}
                    placeholder="e.g. 10"
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="responsive-grid-2">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Phone Number</span>
                  <input
                    value={newDocPhone}
                    onChange={(e) => setNewDocPhone(e.target.value)}
                    placeholder="+91 98470 00000"
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Email Address</span>
                  <input
                    value={newDocEmail}
                    onChange={(e) => setNewDocEmail(e.target.value)}
                    placeholder="doctor@krishnahospital.org"
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>
              </div>

              {/* OPD Shift Timings */}
              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>OPD Shift Timings</span>
                <select
                  value={newDocShift}
                  onChange={(e) => setNewDocShift(e.target.value)}
                  style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', background: '#fff' }}
                >
                  <option value="Morning OPD (08:00 AM - 02:00 PM)">Morning OPD (08:00 AM - 02:00 PM)</option>
                  <option value="Evening OPD (02:00 PM - 08:00 PM)">Evening OPD (02:00 PM - 08:00 PM)</option>
                  <option value="Full Day OPD (09:00 AM - 05:00 PM)">Full Day OPD (09:00 AM - 05:00 PM)</option>
                </select>
              </div>

              {/* Account Password */}
              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626' }}>Doctor Login Password *</span>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showAddDocPassword ? 'text' : 'password'}
                    value={newDocPassword}
                    onChange={(e) => setNewDocPassword(e.target.value)}
                    placeholder="Enter password (e.g. Doc@123)"
                    required
                    style={{ padding: '10px 40px 10px 12px', border: '1px solid #fecaca', borderRadius: '7px', width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddDocPassword(!showAddDocPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                    title={showAddDocPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showAddDocPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="secondary-button" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save Doctor Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DOCTOR MODAL (WITH SALARY EDITING) */}
      {editingDoctor && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 45, 85, 0.45)', display: 'grid', placeItems: 'center', padding: '16px', overflowY: 'auto' }}>
          <div className="modal" style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '560px', width: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(16, 45, 85, 0.2)', border: '1px solid #dbe6f5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f8', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={20} color="#1769d7" />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#162d4a' }}>Edit Doctor Profile - {editingDoctor.name}</h3>
              </div>
              <button className="icon-button" onClick={() => setEditingDoctor(null)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateDoctor} style={{ display: 'grid', gap: '14px' }}>
              {/* Doctor Profile Photo Upload */}
              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#1769d7' }}>Doctor Profile Photo / Image Upload</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#f4f8fe', padding: '12px', borderRadius: '8px', border: '1px dashed #b8d5f7', flexWrap: 'wrap' }}>
                  <img src={editingDoctor.image} alt={editingDoctor.name} style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #1769d7' }} />
                  <div style={{ flex: '1 1 200px' }}>
                    <input type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, true)} style={{ fontSize: '12px', width: '100%' }} />
                    <span style={{ display: 'block', fontSize: '10px', color: '#687c96', marginTop: '4px' }}>Upload new profile photo to replace existing image</span>
                  </div>
                </div>
              </div>

              {/* Name & Medical License No */}
              <div className="responsive-grid-2">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Doctor Name *</span>
                  <input
                    value={editingDoctor.name}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                    required
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#1769d7' }}>Medical License No. *</span>
                  <input
                    value={editingDoctor.licenseNo}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, licenseNo: e.target.value })}
                    required
                    style={{ padding: '10px 12px', border: '1px solid #b8d5f7', borderRadius: '7px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7' }}
                  />
                </div>
              </div>

              {/* Monthly Salary & Status */}
              <div className="responsive-grid-2">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#15803d' }}>Monthly Salary (₹) *</span>
                  <input
                    value={editingDoctor.salary || ''}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, salary: e.target.value })}
                    placeholder="e.g. ₹ 85,000"
                    style={{ padding: '10px 12px', border: '1px solid #bbf7d0', borderRadius: '7px', background: '#f0fdf4', fontWeight: '700', color: '#15803d' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Status (Active / On Leave / Inactive) *</span>
                  <select
                    value={editingDoctor.status}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, status: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', background: '#fff', fontWeight: '700' }}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {editingDoctor.status !== 'Active' && (
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: editingDoctor.status === 'On Leave' ? '#b45309' : '#b91c1c' }}>
                    {editingDoctor.status === 'On Leave' ? 'Leave Reason' : 'Inactive Reason'}
                  </span>
                  <input
                    value={editingDoctor.leaveReason || ''}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, leaveReason: e.target.value })}
                    placeholder={editingDoctor.status === 'On Leave' ? 'e.g. Annual Medical Leave' : 'e.g. Resigned, Retired, Relocated'}
                    style={{
                      padding: '10px 12px',
                      border: editingDoctor.status === 'On Leave' ? '1px solid #fde68a' : '1px solid #fecaca',
                      borderRadius: '7px',
                      background: editingDoctor.status === 'On Leave' ? '#fffbeb' : '#fef2f2',
                      color: editingDoctor.status === 'On Leave' ? '#b45309' : '#b91c1c',
                    }}
                  />
                </div>
              )}

              {/* Department & OPD Shift */}
              <div className="responsive-grid-2">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Department</span>
                  <select
                    value={editingDoctor.department}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, department: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', background: '#fff' }}
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Internal Medicine">Internal Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Dermatology">Dermatology</option>
                  </select>
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>OPD Shift Timings</span>
                  <select
                    value={editingDoctor.shift}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, shift: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', background: '#fff' }}
                  >
                    <option value="Morning OPD (08:00 AM - 02:00 PM)">Morning OPD (08:00 AM - 02:00 PM)</option>
                    <option value="Evening OPD (02:00 PM - 08:00 PM)">Evening OPD (02:00 PM - 08:00 PM)</option>
                    <option value="Full Day OPD (09:00 AM - 05:00 PM)">Full Day OPD (09:00 AM - 05:00 PM)</option>
                  </select>
                </div>
              </div>

              {/* Qualifications & Experience */}
              <div className="responsive-grid-2">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Qualifications</span>
                  <input
                    value={editingDoctor.qualification}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, qualification: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Experience</span>
                  <input
                    value={editingDoctor.experience}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, experience: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="responsive-grid-2">
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Phone Number</span>
                  <input
                    value={editingDoctor.phone || ''}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, phone: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>

                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Email Address</span>
                  <input
                    value={editingDoctor.email || ''}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, email: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px' }}
                  />
                </div>
              </div>

              {/* Account Password */}
              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626' }}>Doctor Login Password *</span>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showEditDocPassword ? 'text' : 'password'}
                    value={editingDoctor.password || 'Doc@123'}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, password: e.target.value })}
                    placeholder="Enter password"
                    required
                    style={{ padding: '10px 40px 10px 12px', border: '1px solid #fecaca', borderRadius: '7px', width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditDocPassword(!showEditDocPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                    title={showEditDocPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showEditDocPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button type="button" className="secondary-button" onClick={() => setEditingDoctor(null)}>
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

      {/* DELETE DOCTOR CONFIRMATION POPUP */}
      {deletingDoctorId && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(15, 45, 85, 0.45)', display: 'grid', placeItems: 'center', padding: '16px' }}>
          <div className="modal" style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '17px', color: '#162d4a' }}>Delete Doctor Profile?</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#687c96', lineHeight: 1.5 }}>
              Are you sure you want to remove this doctor from the hospital directory? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
              <button className="secondary-button" onClick={() => setDeletingDoctorId(null)}>
                Cancel
              </button>
              <button
                className="primary-button"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                onClick={() => handleDeleteDoctor(deletingDoctorId)}
              >
                Delete Doctor
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DoctorsPage;
