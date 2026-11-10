import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Activity,
  Trash2,
  Edit,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  Cpu,
  Package,
  Calendar,
  X,
  Clock,
  UserCheck,
} from 'lucide-react';

export function LabInventoryPage({
  profile,
  effectiveBranch = 'Central Campus',
  branchesList = [],
  masterServices = [],
  onNotify = () => {},
}) {
  const [activeTab, setActiveTab] = useState('consumables'); // 'consumables' | 'machines'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedServiceTest, setSelectedServiceTest] = useState('');

  // Dynamic Options & Custom Entry States for Add Kit & Machinery
  const [selectedKitOption, setSelectedKitOption] = useState('');
  const [customKitName, setCustomKitName] = useState('');
  const [selectedTestOption, setSelectedTestOption] = useState('');
  const [customTestName, setCustomTestName] = useState('');
  const [selectedCategoryOption, setSelectedCategoryOption] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [selectedMachineCategoryOption, setSelectedMachineCategoryOption] = useState('');
  const [customMachineCategory, setCustomMachineCategory] = useState('');

  // Formatted List of Lab Service Categories & Tests for Dropdown (Only database saved services)
  const labServiceOptions = useMemo(() => {
    return Array.isArray(masterServices) ? masterServices : [];
  }, [masterServices]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addType, setAddType] = useState('Consumable'); // 'Consumable' | 'Machine'
  const [isConsumeModalOpen, setIsConsumeModalOpen] = useState(false);
  const [selectedItemForConsume, setSelectedItemForConsume] = useState(null);
  const [consumeQty, setConsumeQty] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    itemType: 'Consumable',
    itemName: '',
    linkedServiceName: '',
    category: 'Kits & Reagents',
    stockQuantity: 10,
    alertThreshold: 10,
    unit: 'Kits',
    unitCost: 0,
    totalAmount: 0,
    modelSerialNo: '',
    manufacturer: '',
    machineStatus: 'Active',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    branch: effectiveBranch === 'All' ? 'Central Campus' : effectiveBranch,
    notes: '',
  });

  // Fetch Inventory from API
  const fetchInventory = async () => {
    setLoading(true);
    const token = localStorage.getItem('kh_auth_token');
    try {
      const res = await fetch(`/api/v1/lab-inventory?branch=${encodeURIComponent(effectiveBranch)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setItems(data.data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.warn('Error fetching lab inventory:', err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [effectiveBranch]);

  // Scoped lists
  const consumablesList = useMemo(() => {
    return items.filter((item) => item.itemType === 'Consumable');
  }, [items]);

  const machinesList = useMemo(() => {
    return items.filter((item) => item.itemType === 'Machine');
  }, [items]);

  // 1. Dynamic Kit Names from MongoDB inventory items + common laboratory kits
  const availableKitNames = useMemo(() => {
    const commonKits = [
      'Urea',
      'Creatinine',
      'Total Cholesterol',
      'Triglycerides',
      'Blood Sugar / Glucose (FBS/PPBS)',
      'Bilirubin (Total & Direct)',
      'SGOT / AST Reagent',
      'SGPT / ALT Reagent',
      'Alkaline Phosphatase (ALP)',
      'Uric Acid',
      'Calcium Reagent',
      'Electrolytes (Na+/K+/Cl-) Reagent Pack',
      'Thyroid T3/T4/TSH Kit',
      'Dengue NS1 Antigen Card',
      'Widal Slide Test Kit',
      'HBsAg Rapid Card',
      'HIV 1 & 2 Rapid Card',
      'Urine Strip (10 Parameter)',
      'Complete Blood Picture (CBP) Reagent Pack',
      'Hemoglobin Reagent'
    ];
    const fromInventory = consumablesList.map((c) => c.itemName).filter(Boolean);
    return Array.from(new Set([...fromInventory, ...commonKits]));
  }, [consumablesList]);

  // 2. Dynamic Test Names from Master Services + Database Inventory linked services + common hospital panels
  const availableTestNames = useMemo(() => {
    const commonTests = [
      'Renal Function Test (RFT)',
      'Liver Function Test (LFT)',
      'Lipid Profile',
      'Complete Blood Picture (CBP)',
      'Complete Urine Examination (CUE)',
      'Fasting Blood Sugar (FBS)',
      'Post Prandial Blood Sugar (PPBS)',
      'Random Blood Sugar (RBS)',
      'HbA1c (Glycated Hemoglobin)',
      'Thyroid Profile (T3, T4, TSH)',
      'Serum Electrolytes',
      'Serum Uric Acid',
      'Serum Calcium',
      'Widal Test',
      'Dengue Serology (NS1 / IgG / IgM)',
      'Viral Hepatitis Markers (HBsAg / HCV)',
      'Coagulation / PT-INR'
    ];
    const fromMaster = (Array.isArray(masterServices) ? masterServices : []).map((s) => s.name || s.test).filter(Boolean);
    const fromInventory = consumablesList.map((c) => c.linkedServiceName).filter(Boolean);
    return Array.from(new Set([...fromInventory, ...fromMaster, ...commonTests]));
  }, [masterServices, consumablesList]);

  // 3. Dynamic Consumable Categories from base defaults + MongoDB inventory items
  const availableConsumableCategories = useMemo(() => {
    const defaults = [
      'Kits & Reagents',
      'Reagents & Solvents',
      'Strips & Vials',
      'General Consumables',
      'Rapid Test Cards',
      'Calibrators & Controls',
      'Stains & Chemicals'
    ];
    const fromDb = consumablesList.map((c) => c.category).filter(Boolean);
    return Array.from(new Set([...defaults, ...fromDb]));
  }, [consumablesList]);

  // 4. Dynamic Machine Categories from base defaults + Kit Method + MongoDB machine items
  const availableMachineCategories = useMemo(() => {
    const defaults = [
      'Analyzer Machine',
      'Centrifuge & Microscope',
      'ELISA & Washing System',
      'Autoclave & Sterilizer',
      'Kit Method',
      'Biochemistry Semi-Auto Analyzer',
      'Cell Counter (Hematology Analyzer)',
      'Electrolyte Analyzer'
    ];
    const fromDb = machinesList.map((m) => m.category).filter(Boolean);
    return Array.from(new Set([...defaults, ...fromDb]));
  }, [machinesList]);

  // KPI Computations
  const totalKitsCount = consumablesList.length;
  const activeMachinesCount = machinesList.filter((m) => m.machineStatus === 'Active').length;
  const lowStockAlerts = consumablesList.filter((c) => Number(c.stockQuantity) < Number(c.alertThreshold || 10));
  const maintenanceDueCount = machinesList.filter((m) => m.machineStatus !== 'Active').length;

  // Filtered lists for rendering
  const filteredConsumables = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return consumablesList.filter((item) => {
      const matchesSearch =
        item.itemName.toLowerCase().includes(q) ||
        (item.linkedServiceName && item.linkedServiceName.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));
      const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [consumablesList, searchQuery, categoryFilter]);

  const filteredMachines = useMemo(() => {
    return machinesList.filter((item) => {
      const matchesSearch =
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.modelSerialNo && item.modelSerialNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.manufacturer && item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || item.machineStatus === statusFilter || item.category === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [machinesList, searchQuery, statusFilter]);

  // Handlers
  const handleOpenAdd = (type) => {
    setAddType(type);
    setSelectedKitOption('');
    setCustomKitName('');
    setSelectedTestOption('');
    setCustomTestName('');
    setSelectedCategoryOption(type === 'Consumable' ? 'Kits & Reagents' : '');
    setCustomCategory('');
    setSelectedMachineCategoryOption(type === 'Machine' ? 'Analyzer Machine' : '');
    setCustomMachineCategory('');
    setFormData({
      itemType: type,
      itemName: '',
      linkedServiceName: '',
      category: type === 'Consumable' ? 'Kits & Reagents' : 'Analyzer Machine',
      stockQuantity: 10,
      alertThreshold: 10,
      unit: 'Kits',
      unitCost: 0,
      totalAmount: 0,
      modelSerialNo: '',
      manufacturer: '',
      machineStatus: 'Active',
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      nextMaintenanceDate: '',
      branch: effectiveBranch === 'All' ? 'Central Campus' : effectiveBranch,
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveNewItem = async (e) => {
    e.preventDefault();

    const resolvedItemName = addType === 'Consumable'
      ? (selectedKitOption && selectedKitOption !== 'MANUAL_CUSTOM'
          ? selectedKitOption.trim()
          : (customKitName.trim() || formData.itemName.trim()))
      : formData.itemName.trim();

    const resolvedLinkedService = addType === 'Consumable'
      ? (selectedTestOption && selectedTestOption !== 'MANUAL_CUSTOM'
          ? selectedTestOption.trim()
          : (customTestName.trim() || formData.linkedServiceName.trim()))
      : '';

    const resolvedCategory = addType === 'Consumable'
      ? (selectedCategoryOption === 'MANUAL_CUSTOM' ? customCategory.trim() : (formData.category.trim() || selectedCategoryOption.trim() || 'Kits & Reagents'))
      : (selectedMachineCategoryOption === 'MANUAL_CUSTOM' ? customMachineCategory.trim() : (formData.category.trim() || selectedMachineCategoryOption.trim() || 'Analyzer Machine'));

    if (addType === 'Consumable') {
      if (!resolvedLinkedService) {
        onNotify('Please select or enter the Test Name (e.g. RFT, LFT, Lipid Profile) for which this kit is used.');
        return;
      }
      if (!resolvedItemName) {
        onNotify('Please select or enter the Kit Name (e.g. Urea, Creatinine).');
        return;
      }
    } else {
      if (!resolvedItemName) {
        onNotify('Please enter a valid machine name.');
        return;
      }
    }

    const unitCostNum = Number(formData.unitCost || 0);
    const totalAmtNum = Number(formData.totalAmount || (formData.itemType === 'Consumable' ? unitCostNum * Number(formData.stockQuantity || 1) : unitCostNum));

    const payload = {
      ...formData,
      itemName: resolvedItemName,
      linkedServiceName: resolvedLinkedService,
      category: resolvedCategory,
      unitCost: unitCostNum,
      totalAmount: totalAmtNum,
      createdBy: profile?.full_name || 'Lab Assistant',
    };

    const token = localStorage.getItem('kh_auth_token');

    // Auto-sync purchase cost to Expenses module if spent amount > 0
    if (totalAmtNum > 0) {
      try {
        fetch('/api/v1/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            expenseNo: `EXP-LAB-${Date.now().toString().slice(-4)}`,
            title: `Lab ${formData.itemType || 'Item'} Purchase: ${resolvedItemName}${formData.itemType === 'Consumable' ? ` (${formData.stockQuantity || 1} ${formData.unit || 'Kits'} @ ₹${unitCostNum})` : ''}`,
            category: 'Medical & Lab Supplies',
            amount: totalAmtNum,
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'Cash',
            notes: `Auto-recorded from Lab Inventory purchase. ${formData.notes || ''}`.trim(),
            branch: formData.branch || effectiveBranch,
            createdBy: profile?.full_name || 'Lab Assistant',
            status: 'Approved',
          }),
        }).catch(() => {});
      } catch (expErr) {}
    }

    try {
      const res = await fetch('/api/v1/lab-inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setItems((prev) => [data.data, ...prev]);
        onNotify(`Successfully added ${resolvedItemName} to inventory${totalAmtNum > 0 ? ` & logged ₹${totalAmtNum.toLocaleString('en-IN')} to Expenses!` : ''}`);
      } else {
        const newItem = { ...payload, _id: `temp-${Date.now()}` };
        setItems((prev) => [newItem, ...prev]);
        onNotify(`Added ${resolvedItemName} to inventory${totalAmtNum > 0 ? ` & logged ₹${totalAmtNum.toLocaleString('en-IN')} to Expenses!` : ''}`);
      }
    } catch (err) {
      const newItem = { ...payload, _id: `temp-${Date.now()}` };
      setItems((prev) => [newItem, ...prev]);
      onNotify(`Added ${resolvedItemName} to local inventory.`);
    }

    setIsAddModalOpen(false);
  };

  // Consume Stock Logic
  const handleOpenConsume = (item) => {
    setSelectedItemForConsume(item);
    setConsumeQty(1);
    setIsConsumeModalOpen(true);
  };

  const handleConfirmConsume = async () => {
    if (!selectedItemForConsume) return;
    const token = localStorage.getItem('kh_auth_token');
    const targetId = selectedItemForConsume._id || selectedItemForConsume.id;

    try {
      const res = await fetch(`/api/v1/lab-inventory/${targetId}/consume`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ quantity: consumeQty }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        setItems((prev) => prev.map((i) => ((i._id || i.id) === targetId ? data.data : i)));
      } else {
        setItems((prev) =>
          prev.map((i) => {
            if ((i._id || i.id) === targetId) {
              const newQty = Math.max(0, i.stockQuantity - consumeQty);
              return {
                ...i,
                stockQuantity: newQty,
                lastUsedAt: new Date().toISOString(),
                lastUsedBy: profile?.full_name || 'Lab Assistant',
              };
            }
            return i;
          })
        );
      }

      onNotify(`Consumed ${consumeQty} unit(s) of ${selectedItemForConsume.itemName}.`);
    } catch (err) {
      setItems((prev) =>
        prev.map((i) => {
          if ((i._id || i.id) === targetId) {
            const newQty = Math.max(0, i.stockQuantity - consumeQty);
            return {
              ...i,
              stockQuantity: newQty,
              lastUsedAt: new Date().toISOString(),
              lastUsedBy: profile?.full_name || 'Lab Assistant',
            };
          }
          return i;
        })
      );
      onNotify(`Consumed ${consumeQty} unit(s) of ${selectedItemForConsume.itemName}.`);
    }

    setIsConsumeModalOpen(false);
  };

  // Fast direct 1-click consume
  const handleDirectConsumeOne = async (item, e) => {
    e.stopPropagation();
    const token = localStorage.getItem('kh_auth_token');
    const targetId = item._id || item.id;

    try {
      const res = await fetch(`/api/v1/lab-inventory/${targetId}/consume`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ quantity: 1 }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        setItems((prev) => prev.map((i) => ((i._id || i.id) === targetId ? data.data : i)));
      } else {
        setItems((prev) =>
          prev.map((i) => {
            if ((i._id || i.id) === targetId) {
              const newQty = Math.max(0, i.stockQuantity - 1);
              return {
                ...i,
                stockQuantity: newQty,
                lastUsedAt: new Date().toISOString(),
                lastUsedBy: profile?.full_name || 'Lab Assistant',
              };
            }
            return i;
          })
        );
      }
      onNotify(`1 unit of ${item.itemName} consumed from stock.`);
    } catch (err) {
      setItems((prev) =>
        prev.map((i) => {
          if ((i._id || i.id) === targetId) {
            const newQty = Math.max(0, i.stockQuantity - 1);
            return {
              ...i,
              stockQuantity: newQty,
              lastUsedAt: new Date().toISOString(),
              lastUsedBy: profile?.full_name || 'Lab Assistant',
            };
          }
          return i;
        })
      );
      onNotify(`1 unit of ${item.itemName} consumed from stock.`);
    }
  };

  // Edit / Restock Modal
  const handleOpenEdit = (item) => {
    setSelectedItemForEdit(item);
    setFormData({
      itemType: item.itemType || 'Consumable',
      itemName: item.itemName || '',
      linkedServiceName: item.linkedServiceName || '',
      category: item.category || (item.itemType === 'Machine' ? 'Analyzer Machine' : 'Kits & Reagents'),
      stockQuantity: item.stockQuantity || 0,
      alertThreshold: item.alertThreshold || 10,
      unit: item.unit || 'Kits',
      modelSerialNo: item.modelSerialNo || '',
      manufacturer: item.manufacturer || '',
      machineStatus: item.machineStatus || 'Active',
      lastMaintenanceDate: item.lastMaintenanceDate || '',
      nextMaintenanceDate: item.nextMaintenanceDate || '',
      branch: item.branch || effectiveBranch,
      notes: item.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedItemForEdit) return;
    const token = localStorage.getItem('kh_auth_token');
    const targetId = selectedItemForEdit._id || selectedItemForEdit.id;

    try {
      const res = await fetch(`/api/v1/lab-inventory/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        setItems((prev) => prev.map((i) => ((i._id || i.id) === targetId ? data.data : i)));
      } else {
        setItems((prev) =>
          prev.map((i) => ((i._id || i.id) === targetId ? { ...i, ...formData } : i))
        );
      }
      onNotify(`Updated details for ${formData.itemName}.`);
    } catch (err) {
      setItems((prev) =>
        prev.map((i) => ((i._id || i.id) === targetId ? { ...i, ...formData } : i))
      );
      onNotify(`Updated details for ${formData.itemName}.`);
    }

    setIsEditModalOpen(false);
  };

  // Delete item
  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete ${item.itemName} from inventory?`)) return;

    const token = localStorage.getItem('kh_auth_token');
    const targetId = item._id || item.id;

    setItems((prev) => prev.filter((i) => (i._id || i.id) !== targetId));
    onNotify(`Deleted ${item.itemName} from inventory.`);

    try {
      await fetch(`/api/v1/lab-inventory/${targetId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (err) {
      console.warn('Could not delete inventory item from backend API:', err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Boxes size={24} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">Lab Inventory & Machinery Directory</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenAdd('Consumable')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Plus size={16} />
            <span>+ Add Kit / Consumable Stock</span>
          </button>
          <button
            onClick={() => handleOpenAdd('Machine')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Plus size={16} />
            <span>+ Add Machinery / Equipment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Consumable Kits */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">Total Reagent & Kit Items</span>
            <span className="text-2xl font-black text-slate-800">{totalKitsCount}</span>
            <span className="text-[11px] font-semibold text-slate-400 block mt-1">Available in Stock</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Package size={26} />
          </div>
        </div>

        {/* Low Stock Red Alert (< 10) */}
        <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-all ${
          lowStockAlerts.length > 0
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`text-xs font-bold ${lowStockAlerts.length > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                Low Stock Alerts (&lt; 10 left)
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${lowStockAlerts.length > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                {lowStockAlerts.length}
              </span>
              {lowStockAlerts.length > 0 && (
                <span className="text-[11px] font-extrabold bg-rose-600 text-white px-2 py-0.5 rounded-md animate-pulse">
                  CRITICAL
                </span>
              )}
            </div>
            <span className={`text-[11px] font-semibold block mt-1 ${lowStockAlerts.length > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {lowStockAlerts.length > 0 ? 'Immediate Re-order Required' : 'All kit stocks sufficient'}
            </span>
          </div>
          <div className={`p-3 rounded-2xl ${lowStockAlerts.length > 0 ? 'bg-rose-200 text-rose-700' : 'bg-slate-100 text-slate-400'}`}>
            <AlertTriangle size={26} />
          </div>
        </div>

        {/* Active Machines Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">Active Lab Machinery</span>
            <span className="text-2xl font-black text-emerald-600">{activeMachinesCount} / {machinesList.length}</span>
            <span className="text-[11px] font-semibold text-emerald-600 block mt-1">Operational Analyzers</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Cpu size={26} />
          </div>
        </div>

        {/* Maintenance / Calibration Due */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">Maintenance / Calibration Due</span>
            <span className="text-2xl font-black text-amber-600">{maintenanceDueCount}</span>
            <span className="text-[11px] font-semibold text-amber-600 block mt-1">Requires Technical Service</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Wrench size={26} />
          </div>
        </div>
      </div>

      {/* Main Container with Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-slate-200 px-6 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('consumables'); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'consumables'
                  ? 'border-blue-600 text-blue-600 bg-white shadow-xs rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Package size={16} />
              <span>1. Test Kits, Reagents & Consumable Stocks</span>
              {lowStockAlerts.length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {lowStockAlerts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('machines'); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'machines'
                  ? 'border-indigo-600 text-indigo-600 bg-white shadow-xs rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Cpu size={16} />
              <span>2. Lab Machinery & Analyzers Directory</span>
              {maintenanceDueCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {maintenanceDueCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 pb-3 sm:pb-0">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'consumables' ? "Search Thyroid T1/T2, Kits..." : "Search Analyzers, Models..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Category / Status Filter */}
            {activeTab === 'consumables' ? (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-1.5 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {availableConsumableCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            ) : (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
              >
                <option value="all">All Machinery & Methods</option>
                <optgroup label="Categories & Methods">
                  {availableMachineCategories.map((mc) => (
                    <option key={`cat-${mc}`} value={mc}>
                      {mc === 'Kit Method' ? '🧪 Kit Method' : mc}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Operating Statuses">
                  <option value="Active">✓ Active</option>
                  <option value="Calibration Due">⚠️ Calibration Due</option>
                  <option value="Under Maintenance">🔧 Under Maintenance</option>
                  <option value="Out of Service">🚫 Out of Service</option>
                </optgroup>
              </select>
            )}
          </div>
        </div>

        {/* Tab 1: Consumables & Test Kits */}
        {activeTab === 'consumables' && (
          <div className="p-6">
            {filteredConsumables.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Package size={36} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold">
                  {consumablesList.length === 0
                    ? 'No lab inventory or consumable items saved in database yet'
                    : 'No kit stocks match your search filter'}
                </p>
                {consumablesList.length === 0 && (
                  <p className="text-[11px] text-slate-400 mt-1">Click "+ Register Lab Consumable" to add your first stock item.</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Test Name & Kit Stock Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Current Stock</th>
                      <th className="py-3 px-4">Spent Cost (₹)</th>
                      <th className="py-3 px-4">Stock Status & Alert</th>
                      <th className="py-3 px-4">Last Stock Usage</th>
                      <th className="py-3 px-4 text-right">Actions / Stock Consumption</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {filteredConsumables.map((item) => {
                      const isLowStock = Number(item.stockQuantity) < Number(item.alertThreshold || 10);

                      return (
                        <tr
                          key={item._id || item.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isLowStock ? 'bg-rose-50/40' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                                  <span className="text-blue-500 font-medium">Test Name:</span>
                                  <span className="font-extrabold">{item.linkedServiceName || 'General Lab'}</span>
                                </span>
                                <span className="text-slate-300 font-black">|</span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                                  <span className="text-slate-500 font-medium">Kit Name:</span>
                                  <span className="font-extrabold">{item.itemName}</span>
                                </span>
                              </div>
                              {item.notes && <div className="text-[11px] text-slate-400 font-normal">{item.notes}</div>}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                              {item.category || 'Kits & Reagents'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-baseline gap-1">
                              <span className={`text-base font-black ${isLowStock ? 'text-rose-600' : 'text-slate-800'}`}>
                                {item.stockQuantity}
                              </span>
                              <span className="text-[11px] text-slate-500 font-bold">{item.unit || 'Kits'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-slate-800 text-xs font-extrabold block">
                              ₹ {(Number(item.unitCost || 0)).toLocaleString('en-IN')} / {item.unit || 'kit'}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-extrabold block">
                              Total: ₹ {(Number(item.totalAmount || (item.unitCost || 0) * (item.stockQuantity || 1))).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {isLowStock ? (
                              <span className="inline-flex items-center gap-1.5 bg-rose-600 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-lg shadow-xs animate-pulse">
                                <AlertTriangle size={13} />
                                <span>⚠️ Low Stock ({item.stockQuantity} left)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 font-bold text-[11px] px-2.5 py-1 rounded-lg">
                                <CheckCircle2 size={13} />
                                <span>In Stock (&gt; {item.alertThreshold || 10})</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {item.lastUsedAt ? (
                              <div>
                                <div className="font-bold text-slate-700">
                                  {new Date(item.lastUsedAt).toLocaleDateString()} {new Date(item.lastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-[10px] text-slate-400">By: {item.lastUsedBy || 'Lab Staff'}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No usage logged</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Fast Consume 1 Kit button */}
                              <button
                                onClick={(e) => handleDirectConsumeOne(item, e)}
                                disabled={item.stockQuantity <= 0}
                                title="Use 1 Kit from stock"
                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg shadow-xs transition-all"
                              >
                                <MinusCircle size={13} />
                                <span>- Use 1 Kit</span>
                              </button>

                              {/* Bulk Consume / Restock / Edit */}
                              <button
                                onClick={() => handleOpenEdit(item)}
                                title="Edit / Add Stock"
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit size={15} />
                              </button>

                              <button
                                onClick={() => handleDeleteItem(item)}
                                title="Delete item"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Lab Machinery & Equipment Directory */}
        {activeTab === 'machines' && (
          <div className="p-6">
            {filteredMachines.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Cpu size={36} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold">
                  {machinesList.length === 0
                    ? 'No machinery or equipment saved in database yet'
                    : 'No machinery found matching your filter'}
                </p>
                {machinesList.length === 0 && (
                  <p className="text-[11px] text-slate-400 mt-1">Click "+ Add Machine" to register your first lab machine.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMachines.map((machine) => {
                  const statusColors = {
                    Active: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    'Calibration Due': 'bg-amber-100 text-amber-900 border-amber-300',
                    'Under Maintenance': 'bg-rose-100 text-rose-900 border-rose-300',
                    'Out of Service': 'bg-slate-200 text-slate-700 border-slate-300',
                  };

                  return (
                    <div
                      key={machine._id || machine.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mt-0.5">
                            <Cpu size={22} />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-800 text-sm leading-snug">
                              {machine.itemName}
                            </h3>
                            <span className="text-[11px] font-semibold text-indigo-600 block">
                              {machine.category || 'Analyzer Machine'}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                              Model / Serial: {machine.modelSerialNo || 'N/A'}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[11px] font-extrabold px-3 py-1 rounded-lg border ${
                            statusColors[machine.machineStatus] || statusColors.Active
                          }`}
                        >
                          {machine.machineStatus === 'Active' && '✓ Active'}
                          {machine.machineStatus === 'Calibration Due' && '⚠️ Calibration Due'}
                          {machine.machineStatus === 'Under Maintenance' && '🔧 Under Maintenance'}
                          {machine.machineStatus === 'Out of Service' && '🚫 Out of Service'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400 font-semibold block">Manufacturer:</span>
                          <span className="font-bold text-slate-700">{machine.manufacturer || 'Standard Medical'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block">Spent Cost (₹):</span>
                          <span className="font-black text-indigo-700">₹ {(Number(machine.totalAmount || machine.unitCost || 0)).toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block">Branch:</span>
                          <span className="font-bold text-slate-700">{machine.branch || effectiveBranch}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block">Next Calibration:</span>
                          <span className="font-bold text-slate-700">{machine.nextMaintenanceDate || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleOpenEdit(machine)}
                          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors"
                        >
                          <Wrench size={14} />
                          <span>Update Status / Maintenance</span>
                        </button>

                        <button
                          onClick={() => handleDeleteItem(machine)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Add Item / Machine */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="font-extrabold text-slate-800 text-sm">
                Add New {addType === 'Consumable' ? 'Test Kit / Reagent Stock' : 'Lab Machinery / Analyzer'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs font-semibold text-slate-700">
              {addType === 'Consumable' ? (
                <>
                  {/* Field 1: Lab Test Name (Used For Test / Service) */}
                  <div>
                    <label className="block font-bold text-blue-700 mb-1">
                      1. Select Test Name (Used For Test) *
                    </label>
                    <select
                      value={selectedTestOption}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedTestOption(val);
                        if (val === 'MANUAL_CUSTOM') {
                          setFormData((prev) => ({ ...prev, linkedServiceName: customTestName }));
                        } else {
                          setFormData((prev) => ({ ...prev, linkedServiceName: val }));
                        }
                      }}
                      className="w-full px-3 py-2 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-800 bg-blue-50/40 mb-1.5"
                    >
                      <option value="">-- Select Lab Test / Panel --</option>
                      {availableTestNames.map((tName) => (
                        <option key={tName} value={tName}>
                          🧪 {tName}
                        </option>
                      ))}
                      <option value="MANUAL_CUSTOM">✍️ Enter Manual / Custom Test Name...</option>
                    </select>

                    {selectedTestOption === 'MANUAL_CUSTOM' && (
                      <input
                        type="text"
                        placeholder="Enter custom test name, e.g. Renal Function Test (RFT)"
                        value={customTestName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomTestName(val);
                          setFormData((prev) => ({ ...prev, linkedServiceName: val }));
                        }}
                        required
                        className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none mb-1.5 bg-white font-semibold text-slate-800"
                      />
                    )}
                  </div>

                  {/* Field 2: Kit / Reagent Name */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      2. Kit / Reagent Name *
                    </label>
                    <select
                      value={selectedKitOption}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedKitOption(val);
                        if (val === 'MANUAL_CUSTOM') {
                          setFormData((prev) => ({ ...prev, itemName: customKitName }));
                        } else {
                          setFormData((prev) => ({ ...prev, itemName: val }));
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-800 bg-slate-50/60 mb-1.5"
                    >
                      <option value="">-- Select Kit Name from Database / Common Kits --</option>
                      {availableKitNames.map((kName) => (
                        <option key={kName} value={kName}>
                          📦 {kName}
                        </option>
                      ))}
                      <option value="MANUAL_CUSTOM">✍️ Enter Manual / Custom Kit Name...</option>
                    </select>

                    {selectedKitOption === 'MANUAL_CUSTOM' && (
                      <input
                        type="text"
                        placeholder="Enter custom kit name, e.g., Urea, Creatinine"
                        value={customKitName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomKitName(val);
                          setFormData((prev) => ({ ...prev, itemName: val }));
                        }}
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-semibold text-slate-800"
                      />
                    )}
                  </div>

                  {/* Category & Unit */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Category</label>
                      <select
                        value={selectedCategoryOption}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedCategoryOption(val);
                          if (val === 'MANUAL_CUSTOM') {
                            setFormData((prev) => ({ ...prev, category: customCategory || 'Kits & Reagents' }));
                          } else {
                            setFormData((prev) => ({ ...prev, category: val }));
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none mb-1.5"
                      >
                        {availableConsumableCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="MANUAL_CUSTOM">✍️ Enter Manual / Custom Category...</option>
                      </select>

                      {selectedCategoryOption === 'MANUAL_CUSTOM' && (
                        <input
                          type="text"
                          placeholder="e.g. Serology Kits, Molecular Reagents"
                          value={customCategory}
                          onChange={(e) => {
                            setCustomCategory(e.target.value);
                            setFormData((prev) => ({ ...prev, category: e.target.value }));
                          }}
                          required
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Unit</label>
                      <input
                        type="text"
                        placeholder="Kits / Packs / Vials"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Initial Stock Quantity</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stockQuantity}
                        onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Red Alert Threshold</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.alertThreshold}
                        onChange={(e) => setFormData({ ...formData, alertThreshold: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                      />
                      <span className="text-[10px] text-slate-400 font-normal">Triggers red alert when &lt; this number</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                    <div>
                      <label className="block text-blue-700 font-extrabold mb-1">Cost per Kit / Unit (₹)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 500"
                        value={formData.unitCost}
                        onChange={(e) => {
                          const cost = Number(e.target.value);
                          setFormData({
                            ...formData,
                            unitCost: cost,
                            totalAmount: cost * Number(formData.stockQuantity || 1),
                          });
                        }}
                        className="w-full px-3 py-2 border border-blue-200 rounded-xl outline-none font-bold text-blue-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Total Batch Expense (₹)</label>
                      <input
                        type="number"
                        disabled
                        value={(Number(formData.unitCost || 0)) * (Number(formData.stockQuantity || 1))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-700 font-black"
                      />
                      <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">Auto-logs to Lab Expenses</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Category / Method</label>
                      <select
                        value={selectedMachineCategoryOption}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedMachineCategoryOption(val);
                          if (val === 'MANUAL_CUSTOM') {
                            setFormData((prev) => ({ ...prev, category: customMachineCategory || 'Analyzer Machine' }));
                          } else {
                            setFormData((prev) => ({ ...prev, category: val }));
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none mb-1.5 font-semibold text-slate-800"
                      >
                        {availableMachineCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat === 'Kit Method' ? '🧪 Kit Method (Manual / Rapid Test)' : cat}
                          </option>
                        ))}
                        <option value="MANUAL_CUSTOM">✍️ Enter Manual / Custom Category...</option>
                      </select>

                      {selectedMachineCategoryOption === 'MANUAL_CUSTOM' && (
                        <input
                          type="text"
                          placeholder="e.g. Semi-Automated Bench, Cold Storage"
                          value={customMachineCategory}
                          onChange={(e) => {
                            setCustomMachineCategory(e.target.value);
                            setFormData((prev) => ({ ...prev, category: e.target.value }));
                          }}
                          required
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Model / Serial No</label>
                      <input
                        type="text"
                        placeholder="e.g. SN-99823"
                        value={formData.modelSerialNo}
                        onChange={(e) => setFormData({ ...formData, modelSerialNo: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Manufacturer</label>
                      <input
                        type="text"
                        placeholder="e.g. Roche / Sysmex"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Status</label>
                      <select
                        value={formData.machineStatus}
                        onChange={(e) => setFormData({ ...formData, machineStatus: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                      >
                        <option value="Active">✓ Active</option>
                        <option value="Calibration Due">⚠️ Calibration Due</option>
                        <option value="Under Maintenance">🔧 Under Maintenance</option>
                        <option value="Out of Service">🚫 Out of Service</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
                    <label className="block text-indigo-700 font-extrabold mb-1">Machine Purchase / Spent Cost (₹)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 150000"
                      value={formData.unitCost}
                      onChange={(e) => {
                        const cost = Number(e.target.value);
                        setFormData({
                          ...formData,
                          unitCost: cost,
                          totalAmount: cost,
                        });
                      }}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-xl outline-none font-bold text-indigo-900 bg-white"
                    />
                    <span className="text-[10px] text-indigo-600 font-semibold block mt-0.5">Auto-logs to Lab Expenses under Medical & Lab Supplies</span>
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-sm"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit / Restock / Update Status */}
      {isEditModalOpen && selectedItemForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="font-extrabold text-slate-800 text-sm">
                Edit {selectedItemForEdit.itemName}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs font-semibold text-slate-700">
              {selectedItemForEdit.itemType === 'Consumable' ? (
                <>
                  <div>
                    <label className="block font-bold text-blue-700 mb-1">Test Name (Used For Test / Service)</label>
                    <input
                      type="text"
                      placeholder="e.g. Renal Function Test (RFT)"
                      value={formData.linkedServiceName || ''}
                      onChange={(e) => setFormData({ ...formData, linkedServiceName: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-200 rounded-xl outline-none font-semibold text-blue-700 mb-1"
                    />
                    <span className="text-[10px] text-slate-400 font-normal">Specifies which diagnostic test this kit is used for (e.g. RFT)</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kit / Reagent Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Urea, Creatinine"
                      value={formData.itemName}
                      onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 mb-1"
                    />
                    <span className="text-[10px] text-slate-400 font-normal">Specifies the specific chemical reagent kit (e.g. Urea or Creatinine)</span>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-slate-500 mb-1">Machine Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.itemName}
                      onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none font-bold mb-2"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Category / Method</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none mb-2"
                    />
                  </div>
                </>
              )}

              {selectedItemForEdit.itemType === 'Consumable' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Low Alert Threshold</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.alertThreshold}
                      onChange={(e) => setFormData({ ...formData, alertThreshold: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Machine Status</label>
                    <select
                      value={formData.machineStatus}
                      onChange={(e) => setFormData({ ...formData, machineStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none font-bold"
                    >
                      <option value="Active">✓ Active</option>
                      <option value="Calibration Due">⚠️ Calibration Due</option>
                      <option value="Under Maintenance">🔧 Under Maintenance</option>
                      <option value="Out of Service">🚫 Out of Service</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Last Maintenance Date</label>
                      <input
                        type="date"
                        value={formData.lastMaintenanceDate}
                        onChange={(e) => setFormData({ ...formData, lastMaintenanceDate: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Next Maintenance Date</label>
                      <input
                        type="date"
                        value={formData.nextMaintenanceDate}
                        onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-sm"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
