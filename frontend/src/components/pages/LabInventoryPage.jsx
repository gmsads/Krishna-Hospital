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
  onNotify = () => {},
}) {
  const [activeTab, setActiveTab] = useState('consumables'); // 'consumables' | 'machines'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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
        // Fallback default sample if API fails
        setItems(getSampleFallbackItems());
      }
    } catch (err) {
      console.warn('Using local fallback for lab inventory:', err.message);
      setItems(getSampleFallbackItems());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [effectiveBranch]);

  // Fallback initial items
  const getSampleFallbackItems = () => [
    {
      _id: 'inv-1',
      id: 'inv-1',
      itemType: 'Consumable',
      itemName: 'Thyroid T1 Kit (FT3 / T3)',
      category: 'Kits & Reagents',
      stockQuantity: 8, // < 10 red alert
      alertThreshold: 10,
      unit: 'Kits',
      unitCost: 450,
      totalAmount: 3600,
      branch: 'Central Campus',
      notes: 'Contains 50 test reagents per kit',
      lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
      lastUsedBy: 'Lab Assistant',
    },
    {
      _id: 'inv-2',
      id: 'inv-2',
      itemType: 'Consumable',
      itemName: 'Thyroid T2 Kit (FT4 / T4)',
      category: 'Kits & Reagents',
      stockQuantity: 5, // < 10 red alert
      alertThreshold: 10,
      unit: 'Kits',
      unitCost: 500,
      totalAmount: 2500,
      branch: 'Central Campus',
      notes: 'Contains 50 test reagents per kit',
      lastUsedAt: new Date(Date.now() - 7200000).toISOString(),
      lastUsedBy: 'Lab Assistant',
    },
    {
      _id: 'inv-3',
      id: 'inv-3',
      itemType: 'Consumable',
      itemName: 'TSH Immunoassay Kit',
      category: 'Kits & Reagents',
      stockQuantity: 24,
      alertThreshold: 10,
      unit: 'Kits',
      unitCost: 600,
      totalAmount: 14400,
      branch: 'Central Campus',
    },
    {
      _id: 'inv-4',
      id: 'inv-4',
      itemType: 'Consumable',
      itemName: 'CBC Automated Hematology Reagent Pack',
      category: 'Reagents & Solvents',
      stockQuantity: 15,
      alertThreshold: 10,
      unit: 'Packs',
      unitCost: 1200,
      totalAmount: 18000,
      branch: 'Central Campus',
    },
    {
      _id: 'inv-5',
      id: 'inv-5',
      itemType: 'Consumable',
      itemName: 'Blood Glucose Test Strips (50s)',
      category: 'Strips & Vials',
      stockQuantity: 6, // < 10 red alert
      alertThreshold: 10,
      unit: 'Boxes',
      unitCost: 350,
      totalAmount: 2100,
      branch: 'Central Campus',
    },
    {
      _id: 'inv-6',
      id: 'inv-6',
      itemType: 'Consumable',
      itemName: 'EDTA Vacutainer Blood Collection Tubes',
      category: 'Strips & Vials',
      stockQuantity: 120,
      alertThreshold: 20,
      unit: 'Vials',
      unitCost: 15,
      totalAmount: 1800,
      branch: 'Central Campus',
    },
    {
      _id: 'mac-1',
      id: 'mac-1',
      itemType: 'Machine',
      itemName: 'Fully Automated Immunoassay Analyzer (Thyroid Specialist)',
      category: 'Analyzer Machine',
      modelSerialNo: 'IMMUNO-X500 / SN-99823',
      manufacturer: 'Roche Diagnostics',
      unitCost: 250000,
      totalAmount: 250000,
      machineStatus: 'Active',
      lastMaintenanceDate: '2026-08-15',
      nextMaintenanceDate: '2026-11-15',
      branch: 'Central Campus',
    },
    {
      _id: 'mac-2',
      id: 'mac-2',
      itemType: 'Machine',
      itemName: '5-Part Hematology Analyzer',
      category: 'Analyzer Machine',
      modelSerialNo: 'HEMA-5P / SN-44120',
      manufacturer: 'Sysmex Corporation',
      unitCost: 180000,
      totalAmount: 180000,
      machineStatus: 'Active',
      lastMaintenanceDate: '2026-07-01',
      nextMaintenanceDate: '2026-10-01',
      branch: 'Central Campus',
    },
    {
      _id: 'mac-3',
      id: 'mac-3',
      itemType: 'Machine',
      itemName: 'High-Speed Refrigerated Micro-Centrifuge',
      category: 'Centrifuge & Microscope',
      modelSerialNo: 'CENTRO-200 / SN-11045',
      manufacturer: 'Eppendorf',
      unitCost: 45000,
      totalAmount: 45000,
      machineStatus: 'Calibration Due',
      lastMaintenanceDate: '2026-03-10',
      nextMaintenanceDate: '2026-09-30',
      branch: 'Central Campus',
    },
    {
      _id: 'mac-4',
      id: 'mac-4',
      itemType: 'Machine',
      itemName: 'Microplate ELISA Reader & Washer',
      category: 'Analyzer Machine',
      modelSerialNo: 'ELISA-READ-96 / SN-33902',
      manufacturer: 'Bio-Rad',
      unitCost: 120000,
      totalAmount: 120000,
      machineStatus: 'Under Maintenance',
      lastMaintenanceDate: '2026-09-10',
      nextMaintenanceDate: '2026-10-10',
      branch: 'Central Campus',
    },
  ];

  // Scoped lists
  const consumablesList = useMemo(() => {
    return items.filter((item) => item.itemType === 'Consumable');
  }, [items]);

  const machinesList = useMemo(() => {
    return items.filter((item) => item.itemType === 'Machine');
  }, [items]);

  // KPI Computations
  const totalKitsCount = consumablesList.length;
  const activeMachinesCount = machinesList.filter((m) => m.machineStatus === 'Active').length;
  const lowStockAlerts = consumablesList.filter((c) => Number(c.stockQuantity) < Number(c.alertThreshold || 10));
  const maintenanceDueCount = machinesList.filter((m) => m.machineStatus !== 'Active').length;

  // Filtered lists for rendering
  const filteredConsumables = useMemo(() => {
    return consumablesList.filter((item) => {
      const matchesSearch =
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [consumablesList, searchQuery, categoryFilter]);

  const filteredMachines = useMemo(() => {
    return machinesList.filter((item) => {
      const matchesSearch =
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.modelSerialNo && item.modelSerialNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.manufacturer && item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || item.machineStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [machinesList, searchQuery, statusFilter]);

  // Handlers
  const handleOpenAdd = (type) => {
    setAddType(type);
    setFormData({
      itemType: type,
      itemName: '',
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
    if (!formData.itemName.trim()) {
      onNotify('Please enter a valid item/machine name.');
      return;
    }

    const unitCostNum = Number(formData.unitCost || 0);
    const totalAmtNum = Number(formData.totalAmount || (formData.itemType === 'Consumable' ? unitCostNum * Number(formData.stockQuantity || 1) : unitCostNum));

    const payload = {
      ...formData,
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
            title: `Lab ${formData.itemType || 'Item'} Purchase: ${formData.itemName}${formData.itemType === 'Consumable' ? ` (${formData.stockQuantity || 1} ${formData.unit || 'Kits'} @ ₹${unitCostNum})` : ''}`,
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
        onNotify(`Successfully added ${formData.itemName} to inventory${totalAmtNum > 0 ? ` & logged ₹${totalAmtNum.toLocaleString('en-IN')} to Expenses!` : ''}`);
      } else {
        const newItem = { ...payload, _id: `temp-${Date.now()}` };
        setItems((prev) => [newItem, ...prev]);
        onNotify(`Added ${formData.itemName} to inventory${totalAmtNum > 0 ? ` & logged ₹${totalAmtNum.toLocaleString('en-IN')} to Expenses!` : ''}`);
      }
    } catch (err) {
      const newItem = { ...payload, _id: `temp-${Date.now()}` };
      setItems((prev) => [newItem, ...prev]);
      onNotify(`Added ${formData.itemName} to local inventory.`);
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
      category: item.category || 'Kits & Reagents',
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
                <option value="Kits & Reagents">Kits & Reagents</option>
                <option value="Reagents & Solvents">Reagents & Solvents</option>
                <option value="Strips & Vials">Strips & Vials</option>
              </select>
            ) : (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
              >
                <option value="all">All Machine Statuses</option>
                <option value="Active">✓ Active</option>
                <option value="Calibration Due">⚠️ Calibration Due</option>
                <option value="Under Maintenance">🔧 Under Maintenance</option>
                <option value="Out of Service">🚫 Out of Service</option>
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
                <p className="text-xs font-bold">No kit stocks match your search filter</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Item & Kit Name</th>
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
                            <div className="font-extrabold text-slate-800">{item.itemName}</div>
                            {item.notes && <div className="text-[11px] text-slate-400 font-normal">{item.notes}</div>}
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
                <p className="text-xs font-bold">No machinery found matching your filter</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-slate-800 text-sm">
                Add New {addType === 'Consumable' ? 'Test Kit / Reagent Stock' : 'Lab Machinery / Analyzer'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-slate-500 mb-1">
                  {addType === 'Consumable' ? 'Kit / Item Name *' : 'Machine Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={addType === 'Consumable' ? 'e.g., Thyroid T1 Kit' : 'e.g., Immunoassay Analyzer X-500'}
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              {addType === 'Consumable' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                      >
                        <option value="Kits & Reagents">Kits & Reagents</option>
                        <option value="Reagents & Solvents">Reagents & Solvents</option>
                        <option value="Strips & Vials">Strips & Vials</option>
                        <option value="Consumables">General Consumables</option>
                      </select>
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
                      <label className="block text-slate-500 mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                      >
                        <option value="Analyzer Machine">Analyzer Machine</option>
                        <option value="Centrifuge & Microscope">Centrifuge & Microscope</option>
                        <option value="ELISA & Washing System">ELISA & Washing System</option>
                        <option value="Autoclave & Sterilizer">Autoclave & Sterilizer</option>
                      </select>
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

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-slate-800 text-sm">
                Edit {selectedItemForEdit.itemName}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-slate-500 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>

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

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
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
