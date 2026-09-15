import React, { useState } from 'react';
import { Plus, UserPlus, Eye, EyeOff } from 'lucide-react';

export function AddStaffForm({ onSave, onCancel, notify, effectiveBranch = 'Central Campus', branchesList = [] }) {
  const generateEmpId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `EMP-${randomNum}`;
  };

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const defaultBranchName = effectiveBranch === 'All' 
    ? (branchesList[0]?.name || '') 
    : effectiveBranch;

  // Comprehensive Form State for All Roles
  const [empId, setEmpId] = useState('EMP-0001');
  const [name, setName] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(defaultBranchName);
  const [role, setRole] = useState('Front Desk Officer');
  const [department, setDepartment] = useState('Front Desk Operations');
  const [salary, setSalary] = useState('₹ 28,000');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [shift, setShift] = useState('Day Shift (08:00 AM - 04:00 PM)');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('3 Years');
  const [status, setStatus] = useState('Active');
  const [dateJoined, setDateJoined] = useState(dateStr);

  // Auto-fetch sequential Employee ID starting from EMP-0001 from backend
  React.useEffect(() => {
    fetch('http://localhost:5000/api/v1/staff/next-empid')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.nextEmpId) {
          setEmpId(data.data.nextEmpId);
        }
      })
      .catch((err) => console.warn('Could not fetch next empId from backend:', err.message));
  }, []);
  const [password, setPassword] = useState('Staff@123');
  const [showPassword, setShowPassword] = useState(false);

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole.includes('Doctor')) setDepartment('General medicine');
    else if (selectedRole.includes('Lab')) setDepartment('Laboratory');
    else if (selectedRole.includes('Pharm')) setDepartment('Pharmacy');
    else if (selectedRole.includes('Front Desk')) setDepartment('Front Desk Operations');
    else if (selectedRole.includes('Admin')) setDepartment('Administration');
    else if (selectedRole.includes('Nurse')) setDepartment('Nursing & Inpatient');
    else if (selectedRole.includes('Security')) setDepartment('Security & Premises');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !qualification.trim() || !password.trim()) {
      notify && notify('Please fill in staff full name, phone number, qualifications, and password.');
      return;
    }

    const assignedBranch = effectiveBranch === 'All' ? selectedBranch : effectiveBranch;
    const matchingBranchObj = branchesList.find((b) => b.name === assignedBranch);
    const assignedCode = matchingBranchObj?.code || 'HQ-CENTRAL';

    const newStaffMember = {
      id: empId,
      empId,
      name: name.trim(),
      role: role.trim() || 'Front Desk Officer',
      department,
      salary: salary.trim().startsWith('₹') ? salary.trim() : `₹ ${salary.trim()}`,
      phone: phone.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@krishnahospital.org`,
      shift,
      qualification: qualification.trim(),
      experience: experience.trim() || '3 Years',
      status,
      dateJoined,
      password: password.trim(),
      branch: assignedBranch,
      branchCode: assignedCode,
    };

    const token = localStorage.getItem('kh_auth_token');

    let savedObj = newStaffMember;

    try {
      const res = await fetch('http://localhost:5000/api/v1/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newStaffMember),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        savedObj = data.data;
        notify && notify(`Staff member ${newStaffMember.name} registered in MongoDB! Login: ${newStaffMember.email}`);
      } else {
        console.warn('Backend staff creation note:', data.message);
      }
    } catch (err) {
      console.warn('Backend staff API offline fallback:', err.message);
    }

    onSave(savedObj);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Hospital Team Registration</div>
          <h1>Add Staff Member</h1>
          <p>Register a new hospital employee with complete qualifications, experience, work shift, and role-based permissions.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Back to Staff Directory
          </button>
        </div>
      </div>

      <section className="panel full-panel" style={{ maxWidth: '840px', width: '100%' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          {/* Row 1: Employee ID & Full Name */}
          <div className="responsive-grid-2">
            <div className="field">
              <span style={{ color: '#1769d7', fontSize: '12px', fontWeight: '700' }}>Employee ID *</span>
              <input
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                required
                style={{ padding: '12px 14px', border: '1px solid #b8d5f7', borderRadius: '9px', fontSize: '13px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7' }}
              />
            </div>

            <div className="field">
              <span style={{ color: '#1769d7', fontSize: '12px', fontWeight: '700' }}>Hospital Branch Campus *</span>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={effectiveBranch !== 'All'}
                style={{ padding: '12px 14px', border: '1px solid #b8d5f7', borderRadius: '9px', fontSize: '13px', background: effectiveBranch !== 'All' ? '#f4f8fe' : '#fff', fontWeight: '700', color: '#1769d7' }}
              >
                {branchesList.length > 0 ? (
                  branchesList.map((b) => (
                    <option key={b.id || b.name} value={b.name}>
                      {b.name} ({b.code || 'BRANCH'})
                    </option>
                  ))
                ) : (
                  <option value={effectiveBranch}>{effectiveBranch}</option>
                )}
              </select>
            </div>

            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Full Name *</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Rajesh V"
                required
                autoFocus
                style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', background: '#fff' }}
              />
            </div>
          </div>

          {/* Row 2: Role & Department */}
          <div className="responsive-grid-2">
            <div className="field">
              <span style={{ color: '#1769d7', fontSize: '12px', fontWeight: '700' }}>Staff Role (Type any custom role e.g. Security Guard) *</span>
              <input
                list="role-suggestions"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Type or select staff role e.g. Security, Pharmacist, Front Desk..."
                required
                style={{ padding: '12px 14px', border: '1px solid #b8d5f7', borderRadius: '9px', fontSize: '13px', background: '#fff', fontWeight: '700', color: '#1769d7' }}
              />
              <datalist id="role-suggestions">
                <option value="Security Guard" />
                <option value="Pharmacist" />
                <option value="Front Desk Officer" />
                <option value="Lab Assistant / Technician" />
                <option value="Nurse / Staff Nurse" />
                <option value="Maintenance Supervisor" />
                <option value="Accountant" />
                <option value="Administrator" />
              </datalist>
            </div>

            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Department *</span>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', background: '#fff' }}
              >
                <option value="General medicine">General medicine</option>
                <option value="Internal medicine">Internal medicine</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Laboratory">Laboratory</option>
                <option value="Pharmacy">Pharmacy & Medical Store</option>
                <option value="Front Desk Operations">Front Desk Operations</option>
                <option value="Administration">Administration</option>
              </select>
            </div>
          </div>

          {/* Row 3: Qualifications, Experience & Monthly Salary */}
          <div className="responsive-grid-3">
            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Qualifications *</span>
              <input
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. B.Com, B.Sc MLT, Higher Secondary"
                required
                style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', background: '#fff' }}
              />
            </div>

            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Experience *</span>
              <input
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 3 Years Experience"
                required
                style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', background: '#fff' }}
              />
            </div>

            <div className="field">
              <span style={{ color: '#1769d7', fontSize: '12px', fontWeight: '700' }}>Monthly Salary (₹) *</span>
              <input
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. ₹ 28,000"
                required
                style={{ padding: '12px 14px', border: '1px solid #b8d5f7', borderRadius: '9px', fontSize: '13px', background: '#f4f8fe', fontWeight: '700', color: '#1769d7' }}
              />
            </div>
          </div>

          {/* Row 4: Phone Number & Email Address */}
          <div className="responsive-grid-2">
            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Phone Number *</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98470 00000"
                required
                style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', background: '#fff' }}
              />
            </div>

            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Email Address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@krishnahospital.org"
                style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', background: '#fff' }}
              />
            </div>
          </div>

          {/* Row 5: Work Shift Timings, Employment Status & Date Joined */}
          <div className="responsive-grid-3">
            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Work Shift Timings *</span>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                required
                style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', background: '#fff' }}
              >
                <option value="Day Shift (08:00 AM - 04:00 PM)">Day Shift (08:00 AM - 04:00 PM)</option>
                <option value="Evening Shift (02:00 PM - 10:00 PM)">Evening Shift (02:00 PM - 10:00 PM)</option>
                <option value="Night Shift (10:00 PM - 06:00 AM)">Night Shift (10:00 PM - 06:00 AM)</option>
                <option value="Rotational Shift">Rotational Shift</option>
              </select>
            </div>

            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Employment Status *</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
                style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', background: '#fff' }}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Date Joined *</span>
              <input
                type="date"
                value={dateJoined}
                onChange={(e) => setDateJoined(e.target.value)}
                required
                style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', background: '#fff' }}
              />
            </div>
          </div>

          {/* Row 6: Account Login Password */}
          <div className="field">
            <span style={{ color: '#dc2626', fontSize: '12px', fontWeight: '700' }}>Staff Login Password *</span>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter login password (e.g. Staff@123)"
                required
                style={{ padding: '12px 42px 12px 14px', border: '1px solid #fecaca', borderRadius: '9px', fontSize: '13px', background: '#fff', width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button type="submit" className="primary-button" style={{ padding: '12px 28px', flex: '1 1 auto', justifyContent: 'center' }}>
              <UserPlus size={17} /> Register Staff Member
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

export default AddStaffForm;
