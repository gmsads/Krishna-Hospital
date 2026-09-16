import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Activity,
  Bell,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Search,
  Settings,
  UsersRound,
  UserRound,
  WalletCards,
  X,
  LogOut,
  Plus,
  History,
  ArrowRight,
  MessageSquareShare,
  Layers,
  Stethoscope,
  Building2,
  Crown,
  Receipt,
  Pill,
  Workflow,
  FileText,
} from 'lucide-react';
import { useAuth } from '../lib/auth';

// Data & Hooks
import { initialPatients, initialOPRecords, initialLabTests, initialStaff, initialPatientHistory, initialMasterLabServices, initialDoctors, initialBranches, initialExpenses } from './data/initialData';
import { useToast } from './common/useToast';

// Dashboards
import { Dashboard } from './dashboards/Dashboard';
import { PharmacyDashboard } from './dashboards/PharmacyDashboard';

// Forms
import { CreateOPRecordForm } from './forms/CreateOPRecordForm';
import { EnterLabResultForm } from './forms/EnterLabResultForm';
import { AddStaffForm } from './forms/AddStaffForm';
import { RegisterPatientForm } from './forms/RegisterPatientForm';
import { AddPharmacySaleForm } from './forms/AddPharmacySaleForm';

// Modals
import { RequestLabTestModal } from './modals/RequestLabTestModal';

// Pages
import { PatientsPage } from './pages/PatientsPage';
import { PatientHistoryPage } from './pages/PatientHistoryPage';
import { OPRecordsPage } from './pages/OPRecordsPage';
import { LaboratoryPage } from './pages/LaboratoryPage';
import { FinancePage } from './pages/FinancePage';
import { StaffPage } from './pages/StaffPage';
import { MarketingPage } from './pages/MarketingPage';
import { WhatsAppInboxPage } from './pages/WhatsAppInboxPage';
import { WhatsAppFlowBuilderPage } from './pages/WhatsAppFlowBuilderPage';
import { WhatsAppTemplatesPage } from './pages/WhatsAppTemplatesPage';
import { LabServicesPage } from './pages/LabServicesPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { BranchesPage } from './pages/BranchesPage';
import { ExpensesPage } from './pages/ExpensesPage';

// Navigation configuration for different roles
const roleNav = {
  'Super Admin': [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Branches', path: '/branches', icon: Building2 },
    { label: 'All Records', path: '/op-records', icon: ClipboardList },
    { label: 'Laboratory', path: '/laboratory', icon: FlaskConical },
    { label: 'Pharmacy', path: '/pharmacy', icon: Pill },
    { label: 'Lab Services', path: '/admin/services', icon: Layers },
    { label: 'Expenses', path: '/expenses', icon: Receipt },
    { label: 'Marketing', path: '/marketing', icon: MessageSquareShare },
    { label: 'Flow Builder', path: '/flow-builder', icon: Workflow },
    { label: 'Meta Templates', path: '/templates', icon: FileText },
    { label: 'WhatsApp Inbox', path: '/inbox', icon: MessageCircle },
    { label: 'Finance', path: '/finance', icon: WalletCards },
    { label: 'Doctors', path: '/doctors', icon: Stethoscope },
    { label: 'Staff', path: '/staff', icon: UserRound },
  ],
  Admin: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'All Records', path: '/op-records', icon: ClipboardList },
    { label: 'Laboratory', path: '/laboratory', icon: FlaskConical },
    { label: 'Pharmacy', path: '/pharmacy', icon: Pill },
    { label: 'Lab Services', path: '/admin/services', icon: Layers },
    { label: 'Expenses', path: '/expenses', icon: Receipt },
    { label: 'Marketing', path: '/marketing', icon: MessageSquareShare },
    { label: 'Flow Builder', path: '/flow-builder', icon: Workflow },
    { label: 'Meta Templates', path: '/templates', icon: FileText },
    { label: 'WhatsApp Inbox', path: '/inbox', icon: MessageCircle },
    { label: 'Finance', path: '/finance', icon: WalletCards },
    { label: 'Doctors', path: '/doctors', icon: Stethoscope },
    { label: 'Staff', path: '/staff', icon: UserRound },
  ],
  Doctor: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'All Records', path: '/op-records', icon: ClipboardList },
    { label: 'Laboratory', path: '/laboratory', icon: FlaskConical },
  ],
  'Front Desk': [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'All Records', path: '/op-records', icon: ClipboardList },
    { label: 'Flow Builder', path: '/flow-builder', icon: Workflow },
    { label: 'Meta Templates', path: '/templates', icon: FileText },
    { label: 'WhatsApp Inbox', path: '/inbox', icon: MessageCircle },
    { label: 'Expenses', path: '/expenses', icon: Receipt },
  ],
  'Lab Assistant': [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Laboratory', path: '/laboratory', icon: FlaskConical },
    { label: 'Expenses', path: '/expenses', icon: Receipt },
  ],
  Pharmacist: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ],
};

const roleLabel = {
  'Super Admin': 'Super Admin',
  Admin: 'Administrator',
  Doctor: 'Doctor',
  'Front Desk': 'Front Desk',
  'Lab Assistant': 'Lab Assistant',
  Pharmacist: 'Pharmacist',
};

export default function AppShell({ path = '/dashboard', navigate }) {
  const { profile, signOut } = useAuth();
  const [branchesList, setBranchesList] = useState(initialBranches);

  const [patients, setPatients] = useState(initialPatients);
  const [opRecords, setOpRecords] = useState(initialOPRecords);
  const [labTests, setLabTests] = useState(initialLabTests);
  const [staff, setStaff] = useState(initialStaff);
  const [doctorsList, setDoctorsList] = useState(initialDoctors);
  const [patientHistoryMap, setPatientHistoryMap] = useState(initialPatientHistory);
  const [masterServices, setMasterServices] = useState(initialMasterLabServices);
  const [pharmacySales, setPharmacySales] = useState([]);

  // Fetch branches and staff from backend API on mount
  useEffect(() => {
    const token = localStorage.getItem('kh_auth_token');

    fetch('/api/v1/branches')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setBranchesList(data.data);
        }
      })
      .catch((err) => console.warn('Could not fetch branches from backend API:', err.message));

    fetch('/api/v1/staff', {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setStaff(data.data);
        }
      })
      .catch((err) => console.warn('Could not fetch staff from backend API:', err.message));

    fetch('/api/v1/doctors', {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setDoctorsList(data.data);
        }
      })
      .catch((err) => console.warn('Could not fetch doctors from backend API:', err.message));

    fetch('/api/v1/op-records', {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const mapped = data.data.map(r => ({
            ...r,
            id: r.regNo || r.id || r._id,
            regNo: r.regNo || r.id,
            patient: r.patientName || r.patient,
            patientName: r.patientName || r.patient,
            doctor: r.doctor || 'Dr. Unassigned',
            branch: r.branch || '',
            amount: `₹ ${r.charges || '300'}`,
          }));
          setOpRecords(mapped);
        }
      })
      .catch((err) => console.warn('Could not fetch OP Records from backend API:', err.message));

    fetch('/api/v1/laboratory', {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const mapped = data.data.map(l => {
            const feeNum = typeof l.amount === 'number' ? l.amount : (parseFloat(String(l.testFee || l.amount || '1200').replace(/[^0-9.]/g, '')) || 1200);
            const paidNum = typeof l.paidAmount === 'number' ? l.paidAmount : (parseFloat(String(l.amountPaid || l.paidAmount || '0').replace(/[^0-9.]/g, '')) || 0);
            const dueNum = typeof l.dueBalance === 'number' ? l.dueBalance : Math.max(0, feeNum - paidNum);
            const payStatus = l.paymentStatus || (dueNum <= 0 ? 'Paid' : paidNum > 0 ? 'Partial' : 'Pending');

            return {
              ...l,
              id: l.labOrderNo || l.id || l._id,
              labOrderNo: l.labOrderNo || l.id,
              test: l.testName || l.test,
              testName: l.testName || l.test,
              patient: l.patientName || l.patient,
              patientName: l.patientName || l.patient,
              doctor: l.doctor || l.orderingDoctor || 'Dr. Unassigned',
              notes: l.clinicalNotes || l.notes || '',
              requested: l.sampleCollectedAt || l.requested || 'Today, just now',
              amount: feeNum,
              testFee: feeNum.toString(),
              paidAmount: paidNum,
              amountPaid: paidNum.toString(),
              dueBalance: dueNum,
              paymentStatus: payStatus,
              isSelfCreated: l.isSelfCreated || (l.labOrderNo || '').startsWith('LAB-') || (l.opNumber || '').startsWith('LAB-') || l.createdBy === 'Lab Assistant',
            };
          });
          setLabTests(mapped);
        }
      })
      .catch((err) => console.warn('Could not fetch Lab Orders from backend API:', err.message));

    fetch('/api/v1/lab-services', {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const mapped = data.data.map(s => ({
            ...s,
            id: s.serviceId || s.id || s._id,
          }));
          setMasterServices(mapped);
        }
      })
      .catch((err) => console.warn('Could not fetch Lab Services Catalogue from backend API:', err.message));

    fetch('/api/v1/pharmacy', {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setPharmacySales(data.data);
        }
      })
      .catch((err) => console.warn('Could not fetch Pharmacy sales from backend API:', err.message));

    fetch('/api/v1/expenses', {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const mapped = data.data.map(e => ({
            ...e,
            id: e._id || e.expenseNo || e.id,
          }));
          setExpensesList(mapped);
        }
      })
      .catch((err) => console.warn('Could not fetch Expenses from backend API:', err.message));
  }, []);

  // Active branch selection context (Default: 'All' for Super Admin, or user's assigned branch)
  const isSuperAdmin = profile?.role === 'Super Admin';
  const userBranch = profile?.branch || (branchesList[0]?.name || 'Unassigned Branch');
  const [activeBranch, setActiveBranch] = useState(isSuperAdmin ? 'All' : userBranch);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const branchDropdownRef = useRef(null);

  // Sync activeBranch whenever profile finishes loading from auth
  useEffect(() => {
    if (profile) {
      if (profile.role === 'Super Admin') {
        setActiveBranch('All');
      } else if (profile.branch) {
        setActiveBranch(profile.branch);
      }
    }
  }, [profile]);

  // Dynamic Hospital Branding & Assets State (Per Branch / Global Scope)
  const defaultBranding = useMemo(() => ({
    logo: null,
    signature: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&q=80&w=300',
    watermark: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=300',
    hospitalName: 'KRISHNA HOSPITALS',
    tagline: 'Healthcare Excellence for Every Family',
    registrationNo: 'HOSP-KMC-984021',
    gstin: '32AAAAA0000A1Z5',
    phone: '+91 98470 00000',
    email: 'contact@krishnahospital.org',
    address: 'House 14, MG Road, Central Campus, Central City',
    footerNote: 'Emergency Contact: 108 / +91 98470 00000 | Prescription valid for 7 days from issue.',
  }), []);

  const [brandingMap, setBrandingMap] = useState({
    All: defaultBranding,
    'Central Campus': defaultBranding,
    'City Extension': { ...defaultBranding, tagline: 'City Extension Branch' },
    'North Hospital': { ...defaultBranding, tagline: 'North Medical Campus' },
  });

  const addMasterService = (newService) => {
    setMasterServices((prev) => [newService, ...prev]);
  };

  const updateMasterService = (updatedService) => {
    setMasterServices((prev) =>
      prev.map((s) => (s.id === updatedService.id || s.name === updatedService.name ? updatedService : s))
    );
  };

  const deleteMasterService = (serviceIdOrName) => {
    setMasterServices((prev) =>
      prev.filter((s) => s.id !== serviceIdOrName && s.name !== serviceIdOrName)
    );
  };

  const [query, setQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  const [showMobileNav, setShowMobileNav] = useState(false);
  const [selectedTestForResult, setSelectedTestForResult] = useState(null);
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(initialPatients[0]);
  const [isRequestLabModalOpen, setIsRequestLabModalOpen] = useState(false);
  const [patientForLabOrder, setPatientForLabOrder] = useState(null);
  const [selectedRecordTypeFilter, setSelectedRecordTypeFilter] = useState('all');

  const [signingOut, setSigningOut] = useState(false);
  const { toast, notify } = useToast();

  // Branch Data Scoping Computations
  const effectiveBranch = isSuperAdmin ? activeBranch : (profile?.branch || 'Central Campus');
  const currentBranding = brandingMap[effectiveBranch] || brandingMap['All'] || defaultBranding;

  const handleSaveBranding = (updatedBranding) => {
    setBrandingMap((prev) => {
      if (isSuperAdmin && activeBranch === 'All') {
        const newMap = {};
        Object.keys(prev).forEach((bKey) => {
          newMap[bKey] = { ...prev[bKey], ...updatedBranding };
        });
        return newMap;
      }
      const targetBranch = effectiveBranch === 'All' ? 'Central Campus' : effectiveBranch;
      return {
        ...prev,
        [targetBranch]: { ...prev[targetBranch], ...updatedBranding },
      };
    });
  };

  const [expensesList, setExpensesList] = useState(initialExpenses);

  // Smart Flexible Branch Match Helper
  const isBranchMatch = (itemBranch, itemBranchCode, targetBranchName) => {
    if (!targetBranchName || targetBranchName === 'All') return true;
    if (!itemBranch && !itemBranchCode) return true; // Include untagged records in view

    const itemB = (itemBranch || '').toLowerCase().trim();
    const itemC = (itemBranchCode || '').toLowerCase().trim();
    const targetB = (targetBranchName || '').toLowerCase().trim();

    const matchingBranchObj = (branchesList || []).find(
      (b) => b.name?.toLowerCase().trim() === targetB || b.code?.toLowerCase().trim() === targetB
    );
    const targetC = (matchingBranchObj?.code || '').toLowerCase().trim();

    return (
      itemB === targetB ||
      (targetC && itemC === targetC) ||
      (targetC && itemB === targetC) ||
      (itemB && targetB && (itemB.includes(targetB) || targetB.includes(itemB)))
    );
  };

  const scopedPatients = useMemo(() => {
    if (isSuperAdmin && activeBranch === 'All') return patients;
    const targetBranch = isSuperAdmin ? activeBranch : (profile?.branch || 'Central Campus');
    return patients.filter((p) => isBranchMatch(p.branch, p.branchCode, targetBranch));
  }, [patients, isSuperAdmin, activeBranch, profile?.branch, branchesList]);

  const userRole = profile?.role;
  const userName = profile?.full_name;

  const normalizeDocName = (name) => (name || '').toLowerCase().replace(/^(dr\.?|doctor)\s+/i, '').replace(/\s+/g, ' ').trim();

  const scopedOpRecords = useMemo(() => {
    let list = opRecords;
    if (!isSuperAdmin || activeBranch !== 'All') {
      const targetBranch = isSuperAdmin ? activeBranch : (profile?.branch || 'Central Campus');
      list = list.filter((r) => isBranchMatch(r.branch, r.branchCode, targetBranch));
    }
    // Strict Scoping for Doctors (Only see records assigned to them)
    if (userRole === 'Doctor' && userName) {
      const userDocNorm = normalizeDocName(userName);
      list = list.filter((r) => {
        if (!r.doctor || r.doctor === 'Dr. Unassigned') return false;
        const recordDocNorm = normalizeDocName(r.doctor);
        return recordDocNorm === userDocNorm || recordDocNorm.includes(userDocNorm) || userDocNorm.includes(recordDocNorm);
      });
    }
    return list;
  }, [opRecords, isSuperAdmin, activeBranch, profile?.branch, profile?.role, profile?.full_name, branchesList]);

  const scopedLabTests = useMemo(() => {
    let list = labTests;
    if (!isSuperAdmin || activeBranch !== 'All') {
      const targetBranch = isSuperAdmin ? activeBranch : (profile?.branch || 'Central Campus');
      list = list.filter((t) => isBranchMatch(t.branch, t.branchCode, targetBranch));
    }
    // Strict Scoping for Doctors & Lab Assistants
    if (userRole === 'Doctor' && userName) {
      const userDocNorm = normalizeDocName(userName);
      list = list.filter((t) => {
        if (!t.doctor || t.doctor === 'Dr. Unassigned') return false;
        const recordDocNorm = normalizeDocName(t.doctor);
        return recordDocNorm === userDocNorm || recordDocNorm.includes(userDocNorm) || userDocNorm.includes(recordDocNorm);
      });
    } else if (userRole === 'Lab Assistant' && userName) {
      const staffFirstName = userName.split(' ')[0].toLowerCase();
      list = list.filter((t) => {
        if (!t.assignedLabAssistant && !t.assignedStaff) return true; // Show unassigned branch lab queue
        const assigned = (t.assignedLabAssistant || t.assignedStaff || '').toLowerCase();
        return assigned.includes(staffFirstName) || t.createdBy === userName;
      });
    }
    return list;
  }, [labTests, isSuperAdmin, activeBranch, profile?.branch, profile?.role, profile?.full_name, branchesList]);

  const scopedStaff = useMemo(() => {
    if (isSuperAdmin && activeBranch === 'All') return staff;
    const targetBranch = isSuperAdmin ? activeBranch : (profile?.branch || 'Central Campus');
    return staff.filter((s) => isBranchMatch(s.branch, s.branchCode, targetBranch));
  }, [staff, isSuperAdmin, activeBranch, profile?.branch, branchesList]);

  const scopedDoctors = useMemo(() => {
    if (isSuperAdmin && activeBranch === 'All') return doctorsList;
    const targetBranch = isSuperAdmin ? activeBranch : (profile?.branch || 'Central Campus');
    return doctorsList.filter((d) => isBranchMatch(d.branch, d.branchCode, targetBranch));
  }, [doctorsList, isSuperAdmin, activeBranch, profile?.branch, branchesList]);

  const scopedPharmacySales = useMemo(() => {
    if (isSuperAdmin && activeBranch === 'All') return pharmacySales;
    const targetBranch = isSuperAdmin ? activeBranch : (profile?.branch || 'Central Campus');
    return pharmacySales.filter((s) => isBranchMatch(s.branch, s.branchCode, targetBranch));
  }, [pharmacySales, isSuperAdmin, activeBranch, profile?.branch, branchesList]);

  const scopedExpenses = useMemo(() => {
    let list = expensesList;

    // 1. Branch Scoping (Super Admin global vs Branch scope)
    if (effectiveBranch !== 'All') {
      list = list.filter((e) => (e.branch || 'Central Campus') === effectiveBranch);
    }

    // 2. Creator Scoping for Front Desk & Lab Assistant (Only see what they created)
    if (userRole === 'Front Desk' || userRole === 'Lab Assistant') {
      list = list.filter((e) => {
        if (!e.createdBy) return true;
        const createdByLower = e.createdBy.toLowerCase();
        const nameLower = (userName || '').toLowerCase();
        const roleLower = (userRole || '').toLowerCase();
        // If created by current user or current role
        return (
          createdByLower.includes(nameLower) ||
          createdByLower.includes(roleLower) ||
          (userRole === 'Front Desk' && createdByLower.includes('front desk')) ||
          (userRole === 'Lab Assistant' && createdByLower.includes('lab assistant'))
        );
      });
    }

    return list;
  }, [expensesList, effectiveBranch, userRole, userName]);

  const addExpense = async (newExp) => {
    const token = localStorage.getItem('kh_auth_token');
    try {
      const res = await fetch('/api/v1/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newExp),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        const createdObj = { ...data.data, id: data.data._id || data.data.expenseNo };
        setExpensesList((prev) => [createdObj, ...prev]);
      } else {
        setExpensesList((prev) => [newExp, ...prev]);
      }
    } catch (err) {
      console.warn('Backend expense save fallback:', err.message);
      setExpensesList((prev) => [newExp, ...prev]);
    }
  };

  const deleteExpense = async (expId) => {
    const token = localStorage.getItem('kh_auth_token');
    setExpensesList((prev) => prev.filter((e) => e.id !== expId && e._id !== expId));
    notify('Expense record deleted successfully.');

    try {
      await fetch(`/api/v1/expenses/${expId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
    } catch (err) {
      console.warn('Could not delete expense from backend API:', err.message);
    }
  };

  const handleOpenRequestLab = (patient = null) => {
    setPatientForLabOrder(patient);
    setIsRequestLabModalOpen(true);
  };

  const handleSaveLabOrder = (newOrder) => {
    const targetBranch = effectiveBranch === 'All' ? 'Central Campus' : effectiveBranch;
    const taggedOrder = {
      ...newOrder,
      id: newOrder.labOrderNo || newOrder.id,
      patient: newOrder.patientName || newOrder.patient,
      test: newOrder.testName || newOrder.test,
      branch: newOrder.branch || targetBranch,
    };
    setLabTests((current) => [taggedOrder, ...current]);
    setIsRequestLabModalOpen(false);
    handleNavigate('/laboratory');
    notify(`Lab order ${taggedOrder.id} created successfully! Redirecting to Laboratory queue...`);
  };

  // Close search and branch dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target)) {
        setShowBranchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPatients = useMemo(
    () => patients.filter((patient) => 
      `${patient.name} ${patient.id} ${patient.phone}`
        .toLowerCase()
        .includes(query.toLowerCase())
    ),
    [patients, query],
  );

  // Role & Dashboard Scope-Specific Search Computation
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { opRecords: [], labTests: [], staff: [], doctors: [], masterServices: [], actions: [] };

    const userRole = profile?.role || 'Admin';
    const isLabView = userRole === 'Lab Assistant' || path.startsWith('/laboratory');
    const isAdminView = userRole === 'Admin' || path.startsWith('/admin') || path === '/doctors' || path === '/staff' || path === '/services';
    const isDoctorView = userRole === 'Doctor';
    const isFrontDeskView = userRole === 'Front Desk';
    const isPharmacistView = userRole === 'Pharmacist';

    // 1. OP Records (Scoped to Front Desk, Doctor, or general OPD pages)
    let matchingOps = [];
    if (!isLabView && !isAdminView && !isPharmacistView) {
      matchingOps = opRecords.filter((r) => {
        if (isDoctorView && profile?.full_name) {
          const docFirstName = profile.full_name.split(' ')[0].toLowerCase();
          const matchesDoc = r.doctor && (r.doctor === profile.full_name || r.doctor.toLowerCase().includes(docFirstName));
          if (!matchesDoc) return false;
        }
        return r.patient.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || (r.phone && r.phone.includes(q)) || (r.doctor && r.doctor.toLowerCase().includes(q));
      }).slice(0, 4);
    }

    // 2. Lab Tests (Scoped to Lab Assistant, Laboratory page, or Doctor view)
    let matchingLabs = [];
    if (isLabView || isDoctorView || path === '/laboratory') {
      matchingLabs = labTests.filter((t) => {
        if (isDoctorView && profile?.full_name) {
          const docFirstName = profile.full_name.split(' ')[0].toLowerCase();
          const matchesDoc = t.doctor && (t.doctor === profile.full_name || t.doctor.toLowerCase().includes(docFirstName));
          if (!matchesDoc) return false;
        }
        return t.test.toLowerCase().includes(q) || t.patient.toLowerCase().includes(q) || (t.doctor && t.doctor.toLowerCase().includes(q));
      }).slice(0, 4);
    }

    // 3. Staff Members (Scoped to Admin view)
    let matchingStaff = [];
    if (isAdminView) {
      matchingStaff = staff.filter(
        (s) => s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q) || (s.department && s.department.toLowerCase().includes(q))
      ).slice(0, 3);
    }

    // 4. Doctors (Scoped to Admin view)
    let matchingDoctors = [];
    if (isAdminView) {
      matchingDoctors = (doctorsList || []).filter(
        (d) => d.name.toLowerCase().includes(q) || d.department.toLowerCase().includes(q) || (d.licenseNo && d.licenseNo.toLowerCase().includes(q))
      ).slice(0, 3);
    }

    // 5. Master Services (Scoped to Admin view)
    let matchingServices = [];
    if (isAdminView) {
      matchingServices = (masterServices || []).filter(
        (srv) => srv.name.toLowerCase().includes(q) || (srv.category && srv.category.toLowerCase().includes(q))
      ).slice(0, 3);
    }

    // 6. Dashboard Scope-Specific Quick Actions
    let allActions = [];
    if (isLabView) {
      allActions = [
        { label: 'Add / Enter Lab Test Result', path: '/laboratory/enter-result', icon: Plus },
        { label: 'Laboratory Operations Queue', path: '/laboratory', icon: FlaskConical },
      ];
    } else if (isAdminView) {
      allActions = [
        { label: 'Doctors Directory', path: '/doctors', icon: Stethoscope },
        { label: 'Staff Management', path: '/staff', icon: UserRound },
        { label: 'Services Catalogue', path: '/services', icon: Layers },
        { label: 'Settings & Security', path: '/settings', icon: Settings },
      ];
    } else if (isDoctorView) {
      allActions = [
        { label: 'Create OP Consultation Record', path: '/op-records/new', icon: Plus },
        { label: 'Assigned OP Consultations', path: '/op-records', icon: ClipboardList },
        { label: 'Patient Lab Test Reports', path: '/laboratory', icon: FlaskConical },
      ];
    } else if (isFrontDeskView) {
      allActions = [
        { label: 'Register New Patient', path: '/patients/new', icon: Plus },
        { label: 'Create OP Registration', path: '/op-records/new', icon: Plus },
        { label: 'OP Consultation Records', path: '/op-records', icon: ClipboardList },
      ];
    }

    const matchingActions = allActions.filter((a) => a.label.toLowerCase().includes(q));

    return {
      opRecords: matchingOps,
      labTests: matchingLabs,
      staff: matchingStaff,
      doctors: matchingDoctors,
      masterServices: matchingServices,
      actions: matchingActions,
    };
  }, [query, profile, path, opRecords, labTests, staff, doctorsList, masterServices]);

  if (!profile) return null;

  const navItems = roleNav[profile.role] || [];
  const initials = profile.full_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleNavigate = (toPath) => {
    if (navigate) {
      navigate(toPath);
    } else {
      window.history.pushState({}, '', toPath);
    }
    setShowMobileNav(false);
    setShowSearchDropdown(false);
    setQuery('');
  };

  // Dynamic Branch Code Lookup Map
  const branchCodeMap = useMemo(() => {
    const map = {
      'Central Campus': 'HQ-CENTRAL',
      'City Extension': 'EXT-CITY',
      'North Hospital': 'NORTH-MED',
      'South Extension': 'SOUTH-EXT',
    };
    (branchesList || []).forEach((b) => {
      if (b.name && b.code) map[b.name] = b.code;
    });
    return map;
  }, [branchesList]);

  const addPatient = (patient) => {
    const targetBranch = effectiveBranch === 'All' ? 'Central Campus' : effectiveBranch;
    const targetCode = branchCodeMap[targetBranch] || 'HQ-CENTRAL';
    const taggedPatient = { 
      ...patient, 
      branch: patient.branch || targetBranch,
      branchCode: patient.branchCode || branchCodeMap[patient.branch] || targetCode,
    };
    setPatients((current) => [taggedPatient, ...current]);
    handleNavigate('/op-records');
    notify('Patient registered successfully');
  };

  const addOPRecord = (opRecord) => {
    const targetBranch = effectiveBranch === 'All' ? 'Central Campus' : effectiveBranch;
    const targetCode = branchCodeMap[targetBranch] || 'HQ-CENTRAL';
    const taggedOP = { 
      ...opRecord, 
      id: opRecord.regNo || opRecord.id,
      patient: opRecord.patientName || opRecord.patient,
      amount: `₹ ${opRecord.charges || '300'}`,
      branch: opRecord.branch || targetBranch,
      branchCode: opRecord.branchCode || branchCodeMap[opRecord.branch] || targetCode,
    };
    setOpRecords((current) => [taggedOP, ...current]);

    const patientName = opRecord.patient;
    setPatientHistoryMap((prev) => {
      const existingVisits = prev[patientName] || [];
      const newVisit = {
        visitNo: existingVisits.length + 1,
        date: opRecord.date || 'Today',
        time: opRecord.time || 'Just now',
        opNumber: opRecord.id,
        department: opRecord.department,
        doctor: opRecord.doctor,
        referralDoctor: opRecord.referralDoctor || 'None',
        charges: opRecord.amount,
        paymentMethod: opRecord.paymentMethod,
        status: opRecord.status || 'In consultation',
        vitals: opRecord.vitals || { temp: '98.6 °F', weight: '68 kg', height: '170 cm', bmi: '23.5', bloodGroup: 'O+', bp: '120/80 mmHg' },
        complaints: opRecord.symptoms || 'General consultation visit',
        labTests: []
      };
      return {
        ...prev,
        [patientName]: [newVisit, ...existingVisits]
      };
    });

    handleNavigate('/op-records');
    notify('OP record created successfully');
  };

  const updateOPRecord = (updatedRecord) => {
    setOpRecords((prev) =>
      prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
    );
  };

  const deleteOPRecord = (recordId) => {
    setOpRecords((prev) => prev.filter((r) => r.id !== recordId && r._id !== recordId));
  };

  const handleOpenEnterResult = (test = null) => {
    setSelectedTestForResult(test);
    handleNavigate('/laboratory/enter-result');
  };

  const saveLabResult = (resultData) => {
    const targetBranch = effectiveBranch === 'All' ? 'Central Campus' : effectiveBranch;
    setLabTests((current) => {
      const exists = current.some((t) => t.id === resultData.id);
      if (exists) {
        return current.map((t) => (t.id === resultData.id ? { ...t, ...resultData } : t));
      }
      return [{ ...resultData, branch: resultData.branch || targetBranch }, ...current];
    });
    setSelectedTestForResult(null);
    handleNavigate('/laboratory');
    notify('Lab result saved successfully');
  };

  const updateLabOrder = (updatedOrder) => {
    setLabTests((prev) =>
      prev.map((t) => (t.id === updatedOrder.id || t.labOrderNo === updatedOrder.labOrderNo || t._id === updatedOrder._id ? { ...t, ...updatedOrder } : t))
    );
  };

  const handleSavePharmacySale = (newSale) => {
    const targetBranch = effectiveBranch === 'All' ? 'Central Campus' : effectiveBranch;
    const taggedSale = { ...newSale, branch: newSale.branch || targetBranch };
    setPharmacySales((current) => [taggedSale, ...current]);
    handleNavigate('/pharmacy');
    notify(`Pharmacy collection receipt ${taggedSale.saleNo || taggedSale.id} saved successfully!`);
  };

  const addStaffMember = (newStaff) => {
    const targetBranch = effectiveBranch === 'All' ? 'Central Campus' : effectiveBranch;
    const taggedStaff = { ...newStaff, branch: newStaff.branch || targetBranch };
    setStaff((current) => [taggedStaff, ...current]);
    handleNavigate('/staff');
    notify('Staff member added successfully');
  };

  const handleViewPatientHistory = (patient) => {
    setSelectedPatientForHistory(patient);
    handleNavigate('/patients/history');
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const isNavActive = (itemPath) => {
    if (path === itemPath) return true;
    if (itemPath === '/op-records' && (path === '/op-records/new' || path === '/patients/history')) return true;
    if (itemPath === '/laboratory' && path === '/laboratory/enter-result') return true;
    if (itemPath === '/pharmacy' && path === '/pharmacy/new') return true;
    if (itemPath === '/staff' && path === '/staff/new') return true;
    return false;
  };

  const getBreadcrumb = () => {
    switch (path) {
      case '/dashboard': return 'Dashboard';
      case '/patients/new': return 'OP Records > Register New Patient';
      case '/patients/history': return 'OP Records > Patient Medical History';
      case '/op-records': return 'OP Records';
      case '/op-records/new': return 'OP Records > Create OP Record';
      case '/laboratory': return 'Laboratory';
      case '/laboratory/enter-result': return 'Laboratory > Enter Lab Result';
      case '/pharmacy': return 'Pharmacy Workspace';
      case '/pharmacy/new': return 'Pharmacy > Record Collection';
      case '/admin/services': return 'Admin > Lab Service Categories';
      case '/marketing': return 'Admin > Marketing Bulk WhatsApp';
      case '/finance': return 'Finance';
      case '/doctors': return 'Doctors Directory';
      case '/staff': return 'Staff';
      case '/staff/new': return 'Staff > Add Staff Member';
      case '/settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const hasSearchResults = 
    searchResults.opRecords.length > 0 ||
    searchResults.labTests.length > 0 ||
    searchResults.staff.length > 0 ||
    searchResults.doctors.length > 0 ||
    searchResults.masterServices.length > 0 ||
    searchResults.actions.length > 0;

  const searchPlaceholder = profile?.role === 'Lab Assistant' || path.startsWith('/laboratory')
    ? "Search Lab workspace (test name, patient, report ID)..."
    : profile?.role === 'Admin' || path.startsWith('/admin') || path === '/doctors' || path === '/staff' || path === '/services'
    ? "Search Admin workspace (doctors, staff, services)..."
    : profile?.role === 'Doctor'
    ? "Search Doctor workspace (OP patient, lab report)..."
    : profile?.role === 'Front Desk'
    ? "Search Front Desk workspace (patient name, OP number)..."
    : "Search workspace...";

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${showMobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark" style={{ overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
            {currentBranding.logo ? (
              <img src={currentBranding.logo} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            ) : (
              <Activity size={22} strokeWidth={2.5} />
            )}
          </div>
          <div>
            <strong>{currentBranding.hospitalName.split(' ')[0] || 'KRISHNA'}</strong>
            <span>{currentBranding.hospitalName.split(' ').slice(1).join(' ') || 'HOSPITALS'}</span>
          </div>
          <button 
            className="icon-button mobile-close" 
            onClick={() => setShowMobileNav(false)} 
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        
        {isSuperAdmin ? (
          <div className="hospital-switcher" ref={branchDropdownRef} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowBranchDropdown(!showBranchDropdown)}>
            <div className="hospital-avatar" style={{ background: '#0284c7', color: '#fff', overflow: 'hidden' }}>
              {currentBranding.logo ? (
                <img src={currentBranding.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : activeBranch === 'All' ? (
                '🌐'
              ) : (
                '🏥'
              )}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <strong style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '13px' }}>
                {activeBranch === 'All' ? 'All Hospital Branches' : activeBranch}
              </strong>
              <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '700' }}>
                {activeBranch === 'All' ? 'Global View' : 'Branch Scope'}
              </span>
            </div>
            <ChevronDown size={16} />

            {showBranchDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#ffffff',
                  borderRadius: '10px',
                  boxShadow: '0 10px 30px rgba(15,45,85,0.25)',
                  border: '1px solid #dce7f5',
                  zIndex: 300,
                  marginTop: '6px',
                  overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ padding: '8px 12px', fontSize: '10px', fontWeight: '800', color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #edf2f7' }}>
                  SELECT BRANCH SCOPE
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveBranch('All');
                    setShowBranchDropdown(false);
                    handleNavigate('/dashboard');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 14px',
                    border: 'none',
                    background: activeBranch === 'All' ? '#f0f9ff' : 'transparent',
                    color: activeBranch === 'All' ? '#0284c7' : '#1e293b',
                    fontWeight: activeBranch === 'All' ? '700' : '500',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  <span>🌐</span> All Branches (Global View)
                </button>
                {branchesList.map((br) => (
                  <button
                    key={br.id || br.name}
                    type="button"
                    onClick={() => {
                      setActiveBranch(br.name);
                      setShowBranchDropdown(false);
                      handleNavigate('/dashboard');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '10px 14px',
                      border: 'none',
                      background: activeBranch === br.name ? '#f0f9ff' : 'transparent',
                      color: activeBranch === br.name ? '#0284c7' : '#1e293b',
                      fontWeight: activeBranch === br.name ? '700' : '500',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    <span>🏥</span> {br.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setShowBranchDropdown(false); handleNavigate('/branches'); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 14px',
                    borderTop: '1px solid #edf2f7',
                    background: '#fafafa',
                    color: '#1769d7',
                    fontWeight: '700',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  <Plus size={14} /> Add New Branch...
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="hospital-switcher">
            <div className="hospital-avatar" style={{ overflow: 'hidden' }}>
              {currentBranding.logo ? (
                <img src={currentBranding.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                'K'
              )}
            </div>
            <div>
              <strong>{currentBranding.hospitalName}</strong>
              <span>{userBranch}</span>
            </div>
            <ChevronDown size={16} />
          </div>
        )}
        
        <div className="nav-label">WORKSPACE</div>
        
        <nav className="main-nav">
          {navItems.map(({ label, path: itemPath, icon: Icon }) => (
            <button 
              key={label} 
              className={`nav-item ${isNavActive(itemPath) ? 'active' : ''}`} 
              onClick={() => handleNavigate(itemPath)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === 'Laboratory' && <em>{scopedLabTests.filter(t => t.status !== 'Result ready').length}</em>}
            </button>
          ))}
        </nav>
        
        <div className="sidebar-bottom">
          <button 
            className={`nav-item ${path === '/settings' ? 'active' : ''}`}
            onClick={() => handleNavigate('/settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
          
          <button 
            className="user-mini" 
            onClick={handleSignOut} 
            disabled={signingOut} 
            aria-label="Sign out of Krishna Hospitals"
          >
            <div className="avatar avatar-blue">{initials}</div>
            <div className="user-mini-info">
              <strong>{profile.full_name}</strong>
              <span>{roleLabel[profile.role]}</span>
            </div>
            <span className="signout-text">
              {signingOut ? 'Signing out…' : 'Sign out'}
            </span>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      
      {showMobileNav && (
        <button 
          className="mobile-overlay" 
          onClick={() => setShowMobileNav(false)} 
          aria-label="Close navigation" 
        />
      )}

      {/* Main Content */}
      <main className="main-area">
        <header className="topbar">
          <button 
            className="icon-button mobile-menu" 
            onClick={() => setShowMobileNav(true)} 
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={15} />
            <strong>{getBreadcrumb()}</strong>
          </div>
          
          <div className="topbar-actions">
            {/* Search Input with Auto-Complete Dropdown Overlay */}
            <div className="top-search" ref={searchContainerRef} style={{ position: 'relative' }}>
              <Search size={17} />
              <input 
                placeholder={searchPlaceholder} 
                value={query} 
                onChange={(event) => {
                  setQuery(event.target.value);
                  setShowSearchDropdown(true);
                }} 
                onFocus={() => setShowSearchDropdown(true)}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setShowSearchDropdown(false); }}
                  style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: '2px 6px', color: '#8b9bb0' }}
                >
                  <X size={14} />
                </button>
              )}

              {/* Universal Search Auto-Complete Dropdown */}
              {showSearchDropdown && query.trim().length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    minWidth: '320px',
                    maxWidth: '460px',
                    background: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 16px 36px rgba(15, 45, 85, 0.22)',
                    border: '1px solid #dce7f5',
                    zIndex: 200,
                    maxHeight: '380px',
                    overflowY: 'auto',
                    padding: '8px 0',
                  }}
                >
                  {!hasSearchResults ? (
                    <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#687c96' }}>
                      No matching records found in this workspace for "<strong>{query}</strong>"
                    </div>
                  ) : (
                    <>
                      {/* Doctors Directory Section */}
                      {searchResults.doctors.length > 0 && (
                        <div style={{ borderBottom: '1px solid #f0f4f9', paddingBottom: '6px', marginBottom: '6px' }}>
                          <div style={{ padding: '6px 14px', fontSize: '10px', fontWeight: '800', color: '#1769d7', letterSpacing: '0.5px' }}>
                            DOCTORS DIRECTORY
                          </div>
                          {searchResults.doctors.map((d) => (
                            <button
                              key={d.id || d.name}
                              type="button"
                              onClick={() => handleNavigate('/doctors')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                padding: '8px 14px',
                                border: 'none',
                                background: 'transparent',
                                textAlign: 'left',
                                cursor: 'pointer',
                              }}
                              className="search-item-hover"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Stethoscope size={15} color="#1769d7" />
                                <div>
                                  <strong style={{ fontSize: '12px', color: '#162d4a', display: 'block' }}>{d.name}</strong>
                                  <span style={{ fontSize: '10px', color: '#687c96' }}>{d.department} · License: {d.licenseNo}</span>
                                </div>
                              </div>
                              <span style={{ fontSize: '10px', color: '#1769d7', fontWeight: '700' }}>View Doctor</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* OP Records Section */}
                      {searchResults.opRecords.length > 0 && (
                        <div style={{ borderBottom: '1px solid #f0f4f9', paddingBottom: '6px', marginBottom: '6px' }}>
                          <div style={{ padding: '6px 14px', fontSize: '10px', fontWeight: '800', color: '#1769d7', letterSpacing: '0.5px' }}>
                            OP RECORDS & PATIENTS
                          </div>
                          {searchResults.opRecords.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => {
                                handleViewPatientHistory({ name: r.patient, id: r.patientId || 'KH-1048' });
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                padding: '8px 14px',
                                border: 'none',
                                background: 'transparent',
                                textAlign: 'left',
                                cursor: 'pointer',
                              }}
                              className="search-item-hover"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ClipboardList size={15} color="#1769d7" />
                                <div>
                                  <strong style={{ fontSize: '12px', color: '#162d4a', display: 'block' }}>{r.patient}</strong>
                                  <span style={{ fontSize: '10px', color: '#687c96' }}>{r.id} · Doctor: {r.doctor}</span>
                                </div>
                              </div>
                              <span style={{ fontSize: '10px', color: '#1769d7', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '700' }}>
                                View History <ArrowRight size={11} />
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Lab Test Reports Section */}
                      {searchResults.labTests.length > 0 && (
                        <div style={{ borderBottom: '1px solid #f0f4f9', paddingBottom: '6px', marginBottom: '6px' }}>
                          <div style={{ padding: '6px 14px', fontSize: '10px', fontWeight: '800', color: '#0284c7', letterSpacing: '0.5px' }}>
                            LABORATORY REPORTS
                          </div>
                          {searchResults.labTests.map((t) => (
                            <button
                              key={t.id || t.test}
                              type="button"
                              onClick={() => handleNavigate('/laboratory')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                padding: '8px 14px',
                                border: 'none',
                                background: 'transparent',
                                textAlign: 'left',
                                cursor: 'pointer',
                              }}
                              className="search-item-hover"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FlaskConical size={15} color="#0284c7" />
                                <div>
                                  <strong style={{ fontSize: '12px', color: '#162d4a', display: 'block' }}>{t.test}</strong>
                                  <span style={{ fontSize: '10px', color: '#687c96' }}>{t.patient} · Status: {t.status}</span>
                                </div>
                              </div>
                              <span style={{ fontSize: '10px', color: '#0284c7', fontWeight: '700' }}>Open Lab</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Staff Directory Section */}
                      {searchResults.staff.length > 0 && (
                        <div style={{ borderBottom: '1px solid #f0f4f9', paddingBottom: '6px', marginBottom: '6px' }}>
                          <div style={{ padding: '6px 14px', fontSize: '10px', fontWeight: '800', color: '#0d9488', letterSpacing: '0.5px' }}>
                            HOSPITAL STAFF
                          </div>
                          {searchResults.staff.map((s) => (
                            <button
                              key={s.id || s.name}
                              type="button"
                              onClick={() => handleNavigate('/staff')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                padding: '8px 14px',
                                border: 'none',
                                background: 'transparent',
                                textAlign: 'left',
                                cursor: 'pointer',
                              }}
                              className="search-item-hover"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <UserRound size={15} color="#0d9488" />
                                <div>
                                  <strong style={{ fontSize: '12px', color: '#162d4a', display: 'block' }}>{s.name}</strong>
                                  <span style={{ fontSize: '10px', color: '#687c96' }}>{s.role} · {s.department}</span>
                                </div>
                              </div>
                              <span style={{ fontSize: '10px', color: '#0d9488', fontWeight: '700' }}>View Staff</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Actions & Navigation Section */}
                      {searchResults.actions.length > 0 && (
                        <div>
                          <div style={{ padding: '6px 14px', fontSize: '10px', fontWeight: '800', color: '#6366f1', letterSpacing: '0.5px' }}>
                            QUICK ACTIONS & NAVIGATION
                          </div>
                          {searchResults.actions.map((act) => (
                            <button
                              key={act.label}
                              type="button"
                              onClick={() => handleNavigate(act.path)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                width: '100%',
                                padding: '8px 14px',
                                border: 'none',
                                background: 'transparent',
                                textAlign: 'left',
                                cursor: 'pointer',
                              }}
                              className="search-item-hover"
                            >
                              <act.icon size={15} color="#6366f1" />
                              <span style={{ fontSize: '12px', color: '#162d4a', fontWeight: '600' }}>{act.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            
            <button 
              className="avatar avatar-blue top-avatar"
              onClick={() => handleNavigate('/settings')}
              title="Open Settings"
              aria-label="Open Settings"
              style={{ cursor: 'pointer' }}
            >
              {initials}
            </button>
            
            <button 
              className="signout-button" 
              onClick={handleSignOut} 
              disabled={signingOut} 
              aria-label="Sign out"
            >
              <LogOut size={16} />
              <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
            </button>
          </div>
        </header>

        <div className="content-wrap">
          {(path === '/dashboard' || path === '/') && (
            <Dashboard 
              profile={profile} 
              onNavigate={(pageName, filterType) => {
                if (filterType) {
                  setSelectedRecordTypeFilter(filterType);
                } else {
                  setSelectedRecordTypeFilter('all');
                }
                const map = {
                  'OP Records': '/op-records',
                  'Laboratory': '/laboratory',
                  'Finance': '/finance',
                  'Doctors': '/doctors',
                  'Staff': '/staff',
                  'Settings': '/settings',
                  'Branches': '/branches',
                };
                handleNavigate(map[pageName] || '/dashboard');
              }} 
              onAddPatient={() => handleNavigate('/patients/new')} 
              onAddOPRecord={() => handleNavigate('/op-records/new')} 
              onAddStaff={() => handleNavigate('/staff/new')}
              onEnterResult={handleOpenEnterResult} 
              onViewPatientHistory={handleViewPatientHistory}
              onRequestLabTest={handleOpenRequestLab}
              opRecords={scopedOpRecords} 
              labTests={scopedLabTests} 
              staff={scopedStaff}
              doctorsList={scopedDoctors}
              expensesList={scopedExpenses}
              pharmacySales={scopedPharmacySales}
              onSavePharmacySale={(newSale) => setPharmacySales((prev) => [newSale, ...prev])}
              branchesList={branchesList}
              effectiveBranch={effectiveBranch}
              notify={notify} 
            />
          )}

          {path === '/branches' && (
            <BranchesPage
              branches={branchesList}
              onAddBranch={(newBranch) => setBranchesList((prev) => [newBranch, ...prev])}
              onUpdateBranch={(updatedBranch) => setBranchesList((prev) => prev.map((b) => (b.id === updatedBranch.id ? updatedBranch : b)))}
              staffList={staff}
              doctorsList={doctorsList}
              patientsList={patients}
              opRecordsList={opRecords}
              onNotify={notify}
            />
          )}

          {path === '/patients/new' && (
            <RegisterPatientForm 
              onSave={addPatient} 
              onCancel={() => handleNavigate('/op-records')} 
              notify={notify} 
            />
          )}

          {path === '/patients/history' && (
            <PatientHistoryPage 
              patient={selectedPatientForHistory} 
              patientHistoryMap={patientHistoryMap} 
              onRequestLabTest={handleOpenRequestLab}
              onBack={() => handleNavigate('/op-records')} 
            />
          )}

          {path === '/op-records' && (
            <OPRecordsPage 
              records={scopedOpRecords}
              upiHandles={currentBranding?.upiHandles}
              isDoctor={profile?.role === 'Doctor'}
              initialRecordTypeFilter={selectedRecordTypeFilter}
              onAddOP={() => handleNavigate('/op-records/new')} 
              onViewHistory={handleViewPatientHistory}
              onRequestLabTest={handleOpenRequestLab}
              onUpdateOPRecord={updateOPRecord}
              onDeleteOPRecord={deleteOPRecord}
              onNotify={notify} 
            />
          )}

          {path === '/op-records/new' && (
            <CreateOPRecordForm 
              patients={scopedPatients} 
              opRecords={scopedOpRecords}
              doctorsList={scopedDoctors}
              upiHandles={currentBranding?.upiHandles}
              effectiveBranch={effectiveBranch}
              branchesList={branchesList}
              onSave={addOPRecord} 
              onCancel={() => handleNavigate('/op-records')} 
              notify={notify} 
            />
          )}

          {path === '/laboratory' && (
            <LaboratoryPage 
              tests={scopedLabTests} 
              isDoctor={profile?.role === 'Doctor'}
              doctorName={profile?.full_name}
              branding={currentBranding}
              onEnterResult={handleOpenEnterResult} 
              onUpdateLabOrder={updateLabOrder}
              onNotify={notify} 
            />
          )}

          {path === '/laboratory/enter-result' && (
            <EnterLabResultForm 
              tests={scopedLabTests} 
              masterServices={masterServices}
              initialSelectedTest={selectedTestForResult} 
              effectiveBranch={effectiveBranch}
              branchesList={branchesList}
              onSave={saveLabResult} 
              onCancel={() => {
                setSelectedTestForResult(null);
                handleNavigate('/laboratory');
              }} 
              notify={notify} 
            />
          )}

          {path === '/pharmacy' && (
            <PharmacyDashboard
              profile={profile}
              onNavigate={handleNavigate}
              onAddPharmacySale={() => handleNavigate('/pharmacy/new')}
              pharmacySales={scopedPharmacySales}
              branchesList={branchesList}
              effectiveBranch={effectiveBranch}
              onNotify={notify}
            />
          )}

          {path === '/pharmacy/new' && (
            <AddPharmacySaleForm
              onSave={handleSavePharmacySale}
              onCancel={() => handleNavigate('/pharmacy')}
              notify={notify}
              effectiveBranch={effectiveBranch}
              branchesList={branchesList}
            />
          )}

          {path === '/admin/services' && (
            <LabServicesPage
              masterServices={masterServices}
              onSaveService={addMasterService}
              onUpdateService={updateMasterService}
              onDeleteService={deleteMasterService}
              notify={notify}
            />
          )}

          {path === '/expenses' && (
            <ExpensesPage
              expenses={scopedExpenses}
              profile={profile}
              effectiveBranch={effectiveBranch}
              onAddExpense={addExpense}
              onDeleteExpense={deleteExpense}
              onNotify={notify}
            />
          )}

          {path === '/marketing' && (
            <MarketingPage notify={notify} effectiveBranch={effectiveBranch} />
          )}

          {path === '/flow-builder' && (
            <WhatsAppFlowBuilderPage notify={notify} effectiveBranch={effectiveBranch} />
          )}

          {path === '/templates' && (
            <WhatsAppTemplatesPage notify={notify} effectiveBranch={effectiveBranch} />
          )}

          {path === '/inbox' && (
            <WhatsAppInboxPage notify={notify} effectiveBranch={effectiveBranch} />
          )}

          {path === '/finance' && (
            <FinancePage 
              expensesList={scopedExpenses} 
              opRecords={scopedOpRecords}
              labTests={scopedLabTests}
              pharmacySales={scopedPharmacySales}
              effectiveBranch={effectiveBranch}
              branchesList={branchesList}
              isSuperAdmin={isSuperAdmin}
              onNotify={notify} 
            />
          )}

          {path === '/doctors' && (
            <DoctorsPage 
              doctors={scopedDoctors} 
              effectiveBranch={effectiveBranch}
              branchesList={branchesList}
              notify={notify} 
            />
          )}

          {path === '/staff' && (
            <StaffPage 
              staff={scopedStaff} 
              effectiveBranch={effectiveBranch}
              branchesList={branchesList}
              onAddStaff={() => handleNavigate('/staff/new')} 
              onNotify={notify} 
            />
          )}

          {path === '/staff/new' && (
            <AddStaffForm 
              onSave={addStaffMember} 
              onCancel={() => handleNavigate('/staff')} 
              effectiveBranch={effectiveBranch}
              branchesList={branchesList}
              notify={notify} 
            />
          )}

          {path === '/settings' && (
            <SettingsPage 
              profile={profile}
              currentBranding={currentBranding}
              onSaveBranding={handleSaveBranding}
              onNotify={notify} 
            />
          )}
        </div>
      </main>

      {/* Doctor Prescribe / Request Lab Test Modal */}
      {isRequestLabModalOpen && (
        <RequestLabTestModal
          initialPatient={patientForLabOrder}
          masterServices={masterServices}
          opRecords={opRecords}
          patients={patients}
          doctorsList={scopedDoctors}
          staffList={scopedStaff}
          doctorName={profile?.role === 'Doctor' ? profile.full_name : ''}
          isLabAssistant={profile?.role === 'Lab Assistant'}
          effectiveBranch={effectiveBranch}
          branchesList={branchesList}
          onSubmitOrder={handleSaveLabOrder}
          onClose={() => setIsRequestLabModalOpen(false)}
          notify={notify}
        />
      )}

      {toast && (
        <div className="toast">
          <div className="toast-check">✓</div>
          {toast}
        </div>
      )}
    </div>
  );
}