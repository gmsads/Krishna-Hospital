import React, { useState, useMemo, useRef } from 'react';
import {
  Pill,
  Plus,
  WalletCards,
  Receipt,
  ShoppingBag,
  TrendingUp,
  BarChart3,
  Search,
  Trash2,
  Calendar,
  Building2,
  CheckCircle2,
  DollarSign,
  ChevronDown,
  ChevronUp,
  CreditCard,
  UserCheck,
  Building,
  AlertCircle,
  Clock,
  X,
  User,
  Phone,
  Layers,
  Download,
  Upload,
  MapPin,
  FileText,
  Printer,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { TimeFilterBar } from '../common/TimeFilterBar';
import { AddPharmacySaleForm } from '../forms/AddPharmacySaleForm';
import { uploadImageToCloudinary } from '../../lib/uploadHelper';

export function PharmacyDashboard({
  profile,
  path = '/pharmacy',
  onNavigate,
  onAddPharmacySale,
  onSavePharmacySale,
  pharmacySales = [],
  branchesList = [],
  effectiveBranch = 'All',
  onNotify,
}) {
  const isCreditsPage = path === '/pharmacy/credits';
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Pharmacist';
  const userRole = profile?.role || 'Admin';
  const isSuperAdmin = userRole === 'Super Admin';
  const isAdmin = userRole === 'Admin';
  const userBranch = profile?.branch || 'Central Campus';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState({ filterMode: 'all' });
  const [localSales, setLocalSales] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);

  // Active Tab for Credits Panel: 'given' (Customer Credit) | 'taken' (Supplier Credit)
  const [creditTab, setCreditTab] = useState('given');

  // Modals state for recording Credit Taken & Credit Given
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditModalType, setCreditModalType] = useState('Given'); // 'Given' | 'Taken'
  const [creditFormData, setCreditFormData] = useState({
    partyName: '',
    partyPhone: '',
    partyAddress: '',
    creditAmount: '',
    recordDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    notes: '',
    branch: effectiveBranch === 'All' ? userBranch : effectiveBranch,
  });

  // Customer / Supplier Ledger Modal State
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedLedgerParty, setSelectedLedgerParty] = useState({ name: '', phone: '', address: '' });
  const fileInputRef = useRef(null);

  // Partial Payment Modal State (Multi-Method settlement just like OP Record)
  const defaultUpiHandles = ['krishnahospital@okicici', 'krishnalab@ybl', 'krishnaglobal@hdfcbank'];
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCreditForPayment, setSelectedCreditForPayment] = useState(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [selectedSettlementMethods, setSelectedSettlementMethods] = useState({
    Cash: true,
    UPI: false,
    Card: false,
    Cheque: false,
    'Bank Transfer': false,
    Free: false,
    Others: false,
  });
  const [settlementSplitAmounts, setSettlementSplitAmounts] = useState({
    Cash: '0',
    UPI: '0',
    Card: '0',
    Cheque: '0',
    'Bank Transfer': '0',
    Free: '0',
    Others: '0',
  });
  const [settlementUpiHandle, setSettlementUpiHandle] = useState(defaultUpiHandles[0]);
  const [settlementTxnId, setSettlementTxnId] = useState('');
  const [settlementReceipt, setSettlementReceipt] = useState(null);
  const [settlementReceiptName, setSettlementReceiptName] = useState('');
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);

  // Safely combine parent pharmacySales & locally added sales without duplicates
  const allSalesCombined = useMemo(() => {
    const combined = [...localSales, ...(pharmacySales || [])];
    const seen = new Set();
    return combined.filter((s) => {
      const key = s._id || s.id || s.saleNo;
      if (!key || seen.has(key) || deletedIds.includes(key)) return false;
      seen.add(key);
      return true;
    });
  }, [pharmacySales, localSales, deletedIds]);

  // Branch & Role-Based Scoping Computation
  // Super Admin: View all across all branches and all creators
  // Helper to extract normalized date parts (year, month: YYYY-MM, fullDate: YYYY-MM-DD)
  const getItemDateParts = (item) => {
    const rawDate = item.date || item.recordDate || item.createdAt || item.updatedAt || '';
    if (!rawDate) return { year: '', month: '', fullDate: '' };

    let d = new Date(rawDate);

    // Support string formats like "DD-MM-YYYY" or "YYYY-MM-DD"
    if (isNaN(d.getTime()) && typeof rawDate === 'string') {
      const parts = rawDate.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
        } else if (parts[2].length === 4) {
          d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
    }

    if (isNaN(d.getTime())) return { year: '', month: '', fullDate: '' };

    const year = d.getFullYear().toString();
    const monthNum = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');

    return {
      year,
      month: `${year}-${monthNum}`,
      fullDate: `${year}-${monthNum}-${dayNum}`,
    };
  };

  // Branch, Role & TimeFilter Scoping Computation
  const activeSales = useMemo(() => {
    let list = allSalesCombined;

    // 1. Branch Scoping
    if (!isSuperAdmin || effectiveBranch !== 'All') {
      const targetBranch = isSuperAdmin ? effectiveBranch : userBranch;
      list = list.filter((s) => {
        if (!s.branch && !s.branchCode) return true; // Include unassigned in general view
        const itemB = (s.branch || '').toLowerCase().trim();
        const targetB = (targetBranch || '').toLowerCase().trim();
        return itemB === targetB || itemB.includes(targetB) || targetB.includes(itemB);
      });
    }

    // 2. Creator Scoping for Admin (Only view pharmacy records created by pharmacy users under their account/branch)
    if (isAdmin && profile?.email) {
      list = list.filter((s) => {
        if (s.createdByEmail && s.createdByEmail === profile.email) return true;
        if (s.branch && s.branch.toLowerCase().trim() === userBranch.toLowerCase().trim()) return true;
        return true;
      });
    }

    // 3. Time Filter Bar Scoping (all, date, monthly, yearly, etc.)
    if (filterState && filterState.filterMode && filterState.filterMode !== 'all') {
      list = list.filter((item) => {
        const { year, month, fullDate } = getItemDateParts(item);
        if (!year && !fullDate) return true;

        if (filterState.filterMode === 'date') {
          if (!filterState.selectedDate) return true;
          return fullDate === filterState.selectedDate;
        }

        if (filterState.filterMode === 'monthly') {
          if (!filterState.selectedMonth) return true;
          return month === filterState.selectedMonth;
        }

        if (filterState.filterMode === 'yearly') {
          if (!filterState.selectedYear) return true;
          return year === filterState.selectedYear;
        }

        if (filterState.filterMode === 'today') {
          const todayStr = new Date().toISOString().split('T')[0];
          return fullDate === todayStr;
        }

        if (filterState.filterMode === 'yesterday') {
          const y = new Date();
          y.setDate(y.getDate() - 1);
          return fullDate === y.toISOString().split('T')[0];
        }

        return true;
      });
    }

    return list;
  }, [allSalesCombined, isSuperAdmin, isAdmin, effectiveBranch, userBranch, profile?.email, filterState]);

  // Separate Credit Records (Credit Given to Patients vs Credit Taken from Suppliers)
  const creditGivenList = useMemo(() => {
    return activeSales.filter((s) => s.creditType === 'Given' || (s.creditAmount > 0 && s.creditType !== 'Taken'));
  }, [activeSales]);

  const creditTakenList = useMemo(() => {
    return activeSales.filter((s) => s.creditType === 'Taken');
  }, [activeSales]);

  // Overall Totals
  const totalCollections = useMemo(() => {
    return activeSales.reduce((sum, s) => {
      const amt = parseFloat(String(s.collectingAmount || s.totalCollection || '0').replace(/[^0-9.]/g, '')) || 0;
      return sum + amt;
    }, 0);
  }, [activeSales]);

  const totalExpenses = useMemo(() => {
    return activeSales.reduce((sum, s) => {
      const amt = parseFloat(String(s.totalExpense || '0').replace(/[^0-9.]/g, '')) || 0;
      return sum + amt;
    }, 0);
  }, [activeSales]);

  const totalPurchases = useMemo(() => {
    return activeSales.reduce((sum, s) => {
      const amt = parseFloat(String(s.totalPurchase || '0').replace(/[^0-9.]/g, '')) || 0;
      return sum + amt;
    }, 0);
  }, [activeSales]);

  // Credit Totals
  const totalCreditGivenAmt = useMemo(() => {
    return creditGivenList.reduce((sum, c) => sum + (Number(c.creditAmount || c.collectingAmount || 0) - Number(c.paidAmount || 0)), 0);
  }, [creditGivenList]);

  const totalCreditTakenAmt = useMemo(() => {
    return creditTakenList.reduce((sum, c) => sum + (Number(c.creditAmount || c.collectingAmount || 0) - Number(c.paidAmount || 0)), 0);
  }, [creditTakenList]);

  // Branch-wise Analytics Computation
  const branchAnalyticsData = useMemo(() => {
    let branchNames = (branchesList || []).map((b) => b.name || b.branchName).filter(Boolean);

    if (branchNames.length === 0) {
      const recordBranches = activeSales.map((s) => s.branch).filter(Boolean);
      branchNames = Array.from(new Set(recordBranches));
    }

    if (effectiveBranch && effectiveBranch !== 'All') {
      branchNames = branchNames.filter((b) => b === effectiveBranch);
    }

    const isBranchMatch = (itemBranch, itemBranchCode, bName) => {
      if (!itemBranch && !itemBranchCode) return true;
      const ib = (itemBranch || '').trim().toLowerCase();
      const target = (bName || '').trim().toLowerCase();
      return ib === target || ib.includes(target) || target.includes(ib);
    };

    const branches = branchNames.map((bName) => {
      const bSales = activeSales.filter((s) => isBranchMatch(s.branch, s.branchCode, bName));

      const rev = bSales.reduce((sum, s) => {
        const amt = parseFloat(String(s.collectingAmount || s.totalCollection || '0').replace(/[^0-9.]/g, '')) || 0;
        return sum + amt;
      }, 0);

      const exp = bSales.reduce((sum, s) => {
        const amt = parseFloat(String(s.totalExpense || '0').replace(/[^0-9.]/g, '')) || 0;
        return sum + amt;
      }, 0);

      const pur = bSales.reduce((sum, s) => {
        const amt = parseFloat(String(s.totalPurchase || '0').replace(/[^0-9.]/g, '')) || 0;
        return sum + amt;
      }, 0);

      const netProfit = rev - (exp + pur);

      return {
        name: bName,
        revenue: rev,
        expenses: exp,
        purchases: pur,
        netProfit,
        saleCount: bSales.length,
      };
    });

    const maxVal = branches.length > 0 ? Math.max(...branches.map((b) => Math.max(b.revenue, b.expenses + b.purchases)), 1000) : 1000;

    return { branches, maxVal };
  }, [activeSales, branchesList, effectiveBranch]);

  // Filtered sales for table
  const filteredSales = useMemo(() => {
    return activeSales.filter((s) =>
      `${s.saleNo} ${s.patientName} ${s.partyName} ${s.branch} ${s.paymentMethod} ${s.notes}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [activeSales, searchQuery]);

  // Delete sale handler
  const handleDeleteSale = async (sale) => {
    const saleId = sale._id || sale.id || sale.saleNo;
    const token = localStorage.getItem('kh_auth_token');

    try {
      if (saleId && String(saleId).length > 5) {
        await fetch(`/api/v1/pharmacy/${saleId}`, {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      }
    } catch (err) {
      console.warn('Could not delete pharmacy sale from backend:', err.message);
    }

    setDeletedIds((prev) => [...prev, saleId]);
    setLocalSales((prev) => prev.filter((item) => (item._id || item.id || item.saleNo) !== saleId));
    onNotify && onNotify(`Deleted pharmacy receipt ${sale.saleNo || sale.id}`);
  };

  // Mark Credit Settled Handler (Opens payment options modal with full due pre-filled)
  const handleSettleCredit = (creditRecord) => {
    handleOpenPaymentModal(creditRecord);
  };

  // Record Partial Payment Handler (with Multi-Method settlement just like OP Record)
  const handleOpenPaymentModal = (cRecord) => {
    setSelectedCreditForPayment(cRecord);
    const total = Number(cRecord.creditAmount || cRecord.collectingAmount || 0);
    const paid = Number(cRecord.paidAmount || 0);
    const due = Math.max(0, total - paid);
    const initialDueStr = due > 0 ? due.toString() : total.toString();

    setSelectedSettlementMethods({
      Cash: true,
      UPI: false,
      Card: false,
      Cheque: false,
      'Bank Transfer': false,
      Free: false,
      Others: false,
    });
    setSettlementSplitAmounts({
      Cash: initialDueStr,
      UPI: '0',
      Card: '0',
      Cheque: '0',
      'Bank Transfer': '0',
      Free: '0',
      Others: '0',
    });
    setSettlementDate(new Date().toISOString().split('T')[0]);
    setSettlementUpiHandle(defaultUpiHandles[0]);
    setSettlementTxnId('');
    setSettlementReceipt(null);
    setSettlementReceiptName('');
    setIsPaymentModalOpen(true);
  };

  const toggleSettlementMethod = (modeKey) => {
    setSelectedSettlementMethods((prev) => {
      const nextState = { ...prev, [modeKey]: !prev[modeKey] };
      const anyChecked = Object.keys(nextState).some((k) => nextState[k]);
      if (!anyChecked) nextState.Cash = true;
      return nextState;
    });
  };

  const handleSettlementSplitAmountChange = (modeKey, val) => {
    setSettlementSplitAmounts((prev) => ({
      ...prev,
      [modeKey]: val,
    }));
  };

  const handleQuickFillSettlement = (amountVal) => {
    const activeKeys = Object.keys(selectedSettlementMethods).filter((k) => selectedSettlementMethods[k]);
    const targetKey = activeKeys.length > 0 ? activeKeys[0] : 'Cash';
    setSettlementSplitAmounts((prev) => ({
      ...prev,
      [targetKey]: amountVal.toString(),
    }));
  };

  const activeSettlementModes = Object.keys(selectedSettlementMethods).filter((k) => selectedSettlementMethods[k]);

  const calculatedSettlementTotal = activeSettlementModes.reduce((sum, key) => {
    const val = parseFloat(String(settlementSplitAmounts[key] || '0').replace(/[^0-9.]/g, '')) || 0;
    return sum + val;
  }, 0);

  const settlementSummaryParts = activeSettlementModes
    .map((key) => {
      const amt = parseFloat(String(settlementSplitAmounts[key] || '0').replace(/[^0-9.]/g, '')) || 0;
      return amt > 0 ? `${key} (₹${amt})` : null;
    })
    .filter(Boolean);

  const settlementSummaryStr = settlementSummaryParts.join(' + ');

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onNotify && onNotify('Uploading settlement receipt proof to Cloudinary...');
      try {
        const url = await uploadImageToCloudinary(file, 'receipts/pharmacy-settlements');
        setSettlementReceipt(url);
        setSettlementReceiptName(file.name);
        onNotify && onNotify(`Attached & uploaded payment receipt proof: ${file.name}`);
      } catch (err) {
        onNotify && onNotify('Failed to upload receipt image.');
      }
    }
  };

  const handleSavePartialPayment = async (e) => {
    e.preventDefault();
    if (!selectedCreditForPayment) return;

    const payingNum = calculatedSettlementTotal;
    if (payingNum <= 0) {
      onNotify && onNotify('Please enter a valid amount being paid.');
      return;
    }

    const creditId = selectedCreditForPayment._id || selectedCreditForPayment.id || selectedCreditForPayment.saleNo;
    const currentPaid = Number(selectedCreditForPayment.paidAmount || 0);
    const fullAmt = Number(selectedCreditForPayment.creditAmount || selectedCreditForPayment.collectingAmount || 0);
    const newPaidTotal = Math.min(fullAmt, currentPaid + payingNum);
    const newStatus = newPaidTotal >= fullAmt ? 'Settled' : 'Partial';

    const finalMethod = settlementSummaryStr || activeSettlementModes.join(', ') || 'Cash';
    const splitBreakdown = {};
    activeSettlementModes.forEach((k) => {
      splitBreakdown[k] = parseFloat(String(settlementSplitAmounts[k] || '0').replace(/[^0-9.]/g, '')) || 0;
    });

    let combinedMethod = finalMethod;
    const prevMethod = selectedCreditForPayment.paymentMethod;
    if (prevMethod && prevMethod !== finalMethod && currentPaid > 0 && !prevMethod.toLowerCase().includes('pending')) {
      combinedMethod = `${prevMethod} + ${finalMethod}`;
    }

    const dateToUse = settlementDate || new Date().toISOString().split('T')[0];
    const now = new Date();
    const historyEntry = {
      date: dateToUse,
      dateStr: dateToUse,
      timeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amount: payingNum,
      method: finalMethod,
      breakdown: splitBreakdown,
      upiTxnId: selectedSettlementMethods.UPI ? settlementTxnId : '',
      upiHandle: selectedSettlementMethods.UPI ? settlementUpiHandle : '',
      receiptImage: settlementReceipt || '',
      type: 'Credit Settlement Payment',
    };

    const existingHistory = Array.isArray(selectedCreditForPayment.paymentHistory) && selectedCreditForPayment.paymentHistory.length > 0
      ? selectedCreditForPayment.paymentHistory
      : (currentPaid > 0 ? [{
          date: selectedCreditForPayment.date || dateToUse,
          dateStr: (selectedCreditForPayment.date || dateToUse).split('T')[0],
          timeStr: 'Initial',
          amount: currentPaid,
          method: selectedCreditForPayment.paymentMethod || 'Cash',
          breakdown: selectedCreditForPayment.splitBreakdown || { [selectedCreditForPayment.paymentMethod || 'Cash']: currentPaid },
          type: 'Initial Credit Registration',
        }] : []);

    const updatedHistory = [...existingHistory, historyEntry];

    const patchPayload = {
      paidAmount: newPaidTotal,
      creditStatus: newStatus,
      paymentMethod: combinedMethod,
      paymentDate: dateToUse,
      lastPaymentDate: dateToUse,
      upiTxnId: selectedSettlementMethods.UPI ? settlementTxnId : (selectedCreditForPayment.upiTxnId || ''),
      receiptImage: settlementReceipt || (selectedCreditForPayment.receiptImage || ''),
      paymentHistory: updatedHistory,
      splitBreakdown,
    };

    const token = localStorage.getItem('kh_auth_token');

    try {
      const res = await fetch(`/api/v1/pharmacy/${creditId}/settle-credit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(patchPayload),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setLocalSales((prev) => prev.map((s) => ((s._id || s.id || s.saleNo) === creditId ? data.data : s)));
        if (onSavePharmacySale) onSavePharmacySale(data.data);
      } else {
        setLocalSales((prev) =>
          prev.map((s) =>
            (s._id || s.id || s.saleNo) === creditId
              ? { ...s, ...patchPayload }
              : s
          )
        );
      }
    } catch (err) {
      setLocalSales((prev) =>
        prev.map((s) =>
          (s._id || s.id || s.saleNo) === creditId
            ? { ...s, ...patchPayload }
            : s
        )
      );
    }

    const partyName = selectedCreditForPayment.partyName || selectedCreditForPayment.patientName || 'Party';
    const remainingDue = Math.max(0, fullAmt - newPaidTotal);
    onNotify &&
      onNotify(
        `Payment of ₹${payingNum.toLocaleString('en-IN')} recorded for ${partyName} via ${finalMethod}. ${
          remainingDue > 0 ? `Remaining Due: ₹${remainingDue.toLocaleString('en-IN')}` : 'Credit fully settled!'
        }`
      );

    setIsPaymentModalOpen(false);
    setSelectedCreditForPayment(null);
  };

  // Phone number auto-lookup in Credit Modal
  const handleCreditPhoneChange = (val) => {
    setCreditFormData((prev) => {
      const updated = { ...prev, partyPhone: val };
      const cleanNum = val.replace(/\D/g, '');
      if (cleanNum.length >= 6) {
        const match = allSalesCombined.find(
          (s) =>
            (s.partyPhone && s.partyPhone.replace(/\D/g, '').includes(cleanNum)) ||
            (s.phone && s.phone.replace(/\D/g, '').includes(cleanNum))
        );
        if (match) {
          if (match.partyName || match.patientName) updated.partyName = match.partyName || match.patientName;
          if (match.partyAddress || match.address) updated.partyAddress = match.partyAddress || match.address;
        }
      }
      return updated;
    });
  };

  // Open Customer / Supplier Ledger View
  const handleOpenLedger = (cRecord) => {
    const phone = cRecord.partyPhone || cRecord.phone || '';
    const name = cRecord.partyName || cRecord.patientName || 'Party Customer';
    const address = cRecord.partyAddress || cRecord.address || 'Address not listed';

    setSelectedLedgerParty({ name, phone, address });
    setIsLedgerModalOpen(true);
  };

  // Compute ledger transactions matching selected party phone or name
  const ledgerTransactions = useMemo(() => {
    if (!selectedLedgerParty.phone && !selectedLedgerParty.name) return [];
    const pClean = selectedLedgerParty.phone ? selectedLedgerParty.phone.replace(/\D/g, '') : '';
    const nClean = selectedLedgerParty.name ? selectedLedgerParty.name.toLowerCase().trim() : '';

    return allSalesCombined.filter((s) => {
      const sPhone = (s.partyPhone || s.phone || '').replace(/\D/g, '');
      const sName = (s.partyName || s.patientName || '').toLowerCase().trim();
      if (pClean && sPhone && sPhone.includes(pClean)) return true;
      if (nClean && sName && sName === nClean) return true;
      return false;
    });
  }, [allSalesCombined, selectedLedgerParty]);

  // Derive all itemized payment records for this ledger party
  const partyPaymentRecords = useMemo(() => {
    const list = [];
    ledgerTransactions.forEach((tx) => {
      if (Array.isArray(tx.paymentHistory) && tx.paymentHistory.length > 0) {
        tx.paymentHistory.forEach((h, idx) => {
          list.push({
            id: `${tx._id || tx.id || tx.saleNo}-pay-${idx}`,
            saleNo: tx.saleNo || tx.id,
            creditType: tx.creditType || 'Given',
            date: h.dateStr || (h.date ? String(h.date).split('T')[0] : (tx.date || 'Recent')),
            time: h.timeStr || '',
            amount: Number(h.amount || 0),
            method: h.method || tx.paymentMethod || 'Cash',
            breakdown: h.breakdown || null,
            refId: h.upiTxnId || h.refId || '',
            type: h.type || 'Payment Record',
            receiptImage: h.receiptImage || '',
          });
        });
      } else if (Number(tx.paidAmount || 0) > 0) {
        list.push({
          id: `${tx._id || tx.id || tx.saleNo}-pay-0`,
          saleNo: tx.saleNo || tx.id,
          creditType: tx.creditType || 'Given',
          date: tx.paymentDate || tx.lastPaymentDate || tx.date || 'Recent',
          time: '',
          amount: Number(tx.paidAmount || 0),
          method: tx.paymentMethod || 'Cash',
          breakdown: null,
          refId: tx.upiTxnId || '',
          type: 'Payment Record',
          receiptImage: tx.receiptImage || '',
        });
      }
    });
    return list;
  }, [ledgerTransactions]);

  // Download Party Ledger Statement as Excel/CSV
  const handleDownloadLedgerCSV = () => {
    if (!ledgerTransactions || ledgerTransactions.length === 0) {
      onNotify && onNotify('No ledger transactions logged to export.');
      return;
    }

    const partyName = selectedLedgerParty.name || 'Party';
    const safeName = partyName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];

    const metadata = [
      ['KRISHNA HOSPITAL & RESEARCH CENTRE - PHARMACY LEDGER STATEMENT', ''],
      ['Party / Contact Name', `"${partyName}"`],
      ['Phone Number', `"${selectedLedgerParty.phone || 'N/A'}"`],
      ['Address', `"${selectedLedgerParty.address || 'N/A'}"`],
      ['Total Payment Records Logged', `"${partyPaymentRecords.length} Payment Receipts"`],
      ['Statement Generated On', `"${dateStr}"`],
      ['', ''],
    ];

    const headers = ['Date', 'Ref / Sale No', 'Transaction Type', 'Total Credit (₹)', 'Paid / Settled (₹)', 'Payments Count', 'Payment Date(s) & Mode(s)', 'Balance Due (₹)', 'Status'];
    const rows = ledgerTransactions.map((tx) => {
      const totalAmt = Number(tx.creditAmount || tx.collectingAmount || 0);
      const paidAmt = Number(tx.paidAmount || 0);
      const dueAmt = Math.max(0, totalAmt - paidAmt);
      const isSettled = tx.creditStatus === 'Settled' || dueAmt <= 0;
      const statusStr = isSettled ? 'SETTLED' : paidAmt > 0 ? 'PARTIAL' : 'PENDING';
      const typeStr = tx.creditType ? `Credit ${tx.creditType}` : 'Direct Sale';

      const paymentsCount = Array.isArray(tx.paymentHistory) && tx.paymentHistory.length > 0
        ? tx.paymentHistory.length
        : (paidAmt > 0 ? 1 : 0);

      let paymentsDetails = 'No payments recorded';
      if (Array.isArray(tx.paymentHistory) && tx.paymentHistory.length > 0) {
        paymentsDetails = tx.paymentHistory
          .map(h => `${h.dateStr || (h.date ? String(h.date).split('T')[0] : 'Recent')}: ₹${h.amount || 0} (${h.method || 'Cash'})`)
          .join('; ');
      } else if (paidAmt > 0) {
        paymentsDetails = `${tx.paymentDate || tx.lastPaymentDate || tx.date || 'Recent'}: ₹${paidAmt} (${tx.paymentMethod || 'Cash'})`;
      }

      return [
        `"${tx.date || tx.recordDate || 'Recent'}"`,
        `"${tx.saleNo || tx.id || ''}"`,
        `"${typeStr}"`,
        `"${totalAmt}"`,
        `"${paidAmt}"`,
        `"${paymentsCount} payment(s)"`,
        `"${paymentsDetails}"`,
        `"${dueAmt}"`,
        `"${statusStr}"`,
      ];
    });

    const totalGiven = ledgerTransactions.filter(t => t.creditType === 'Given').reduce((s, t) => s + Number(t.creditAmount || t.collectingAmount || 0), 0);
    const totalTaken = ledgerTransactions.filter(t => t.creditType === 'Taken').reduce((s, t) => s + Number(t.creditAmount || t.collectingAmount || 0), 0);
    const totalSettled = ledgerTransactions.reduce((s, t) => s + Number(t.paidAmount || 0), 0);
    const netBalance = ledgerTransactions.reduce((s, t) => s + (Math.max(0, Number(t.creditAmount || t.collectingAmount || 0) - Number(t.paidAmount || 0))), 0);

    const summaryRows = [
      ['', ''],
      ['SUMMARY FINANCIAL TOTALS', ''],
      ['Total Credit Given (₹)', `"${totalGiven}"`],
      ['Total Credit Taken (₹)', `"${totalTaken}"`],
      ['Total Settled Amount (₹)', `"${totalSettled}"`],
      ['Total Payment Records Logged', `"${partyPaymentRecords.length} Payment Receipts"`],
      ['Net Outstanding Balance (₹)', `"${netBalance}"`],
    ];

    const paymentHeaders = ['Payment Date & Time', 'Bill / Sale No', 'Credit / Transaction Type', 'Payment Method / Modes', 'Txn Ref ID', 'Amount Paid (₹)', 'Payment Status'];
    const paymentRows = partyPaymentRecords.map((p) => [
      `"${p.date} ${p.time || ''}"`,
      `"${p.saleNo}"`,
      `"${p.creditType === 'Given' ? 'Customer Payment Received' : 'Supplier Payment Paid'}"`,
      `"${p.method}"`,
      `"${p.refId || 'N/A'}"`,
      `"${p.amount}"`,
      `"RECORDED"`,
    ]);

    const csvContent = '\uFEFF' + [
      ...metadata.map(r => r.join(',')),
      'ITEMIZED CREDIT INVOICES & BILLS',
      headers.join(','),
      ...rows.map(r => r.join(',')),
      ...summaryRows.map(r => r.join(',')),
      '',
      '',
      `ITEMIZED PAYMENT RECEIPTS & SETTLEMENT LOG (${partyPaymentRecords.length} PAYMENTS RECORDED)`,
      paymentHeaders.join(','),
      ...(paymentRows.length > 0 ? paymentRows.map(r => r.join(',')) : [['"No payments logged yet"', '""', '""', '""', '""', '""', '""']]),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Ledger_${safeName}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotify && onNotify(`Ledger statement with payment logs for ${partyName} exported successfully!`);
  };

  // Print Party Ledger Statement
  const handlePrintLedger = () => {
    window.print();
  };

  // Export Excel/CSV Handler (Exports current filtered data list)
  const handleExportCSV = (customList = null) => {
    let listToExport = customList;
    if (!listToExport || !Array.isArray(listToExport)) {
      listToExport = isCreditsPage
        ? (creditTab === 'given' ? creditGivenList : creditTakenList)
        : filteredSales;
    }

    if (listToExport.length === 0) {
      onNotify && onNotify('No records available in current view/filter to export.');
      return;
    }

    const headers = ['Sale/Receipt No', 'Date', 'Party/Customer Name', 'Phone', 'Address', 'Collection/Credit Amount (₹)', 'Expense (₹)', 'Purchase (₹)', 'Settled Amount (₹)', 'Due Date', 'Status', 'Branch'];
    const rows = listToExport.map((s) => [
      `"${s.saleNo || s.id || ''}"`,
      `"${s.date || s.recordDate || s.createdAt || ''}"`,
      `"${s.partyName || s.patientName || ''}"`,
      `"${s.partyPhone || s.phone || ''}"`,
      `"${s.partyAddress || s.address || ''}"`,
      `"${s.collectingAmount || s.creditAmount || s.totalCollection || 0}"`,
      `"${s.totalExpense || 0}"`,
      `"${s.totalPurchase || 0}"`,
      `"${s.paidAmount || 0}"`,
      `"${s.dueDate || ''}"`,
      `"${s.creditStatus || s.status || ''}"`,
      `"${s.branch || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pharmacy_filtered_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotify && onNotify(`Exported ${listToExport.length} filtered records to Excel/CSV format!`);
  };

  // Import CSV Handler
  const handleImportCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          onNotify && onNotify('CSV file is empty or invalid.');
          return;
        }

        const importedItems = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 3) {
            importedItems.push({
              saleNo: cols[0] || `CRD-${Date.now()}-${i}`,
              date: cols[1] || new Date().toISOString().split('T')[0],
              partyName: cols[2] || 'Imported Party',
              patientName: cols[2] || 'Imported Party',
              partyPhone: cols[3] || '',
              phone: cols[3] || '',
              partyAddress: cols[4] || '',
              address: cols[4] || '',
              creditType: cols[5] || 'Given',
              creditAmount: Number(cols[6]) || 0,
              collectingAmount: Number(cols[6]) || 0,
              paidAmount: Number(cols[7]) || 0,
              dueDate: cols[8] || '',
              creditStatus: cols[9] || 'Pending',
              branch: cols[10] || effectiveBranch,
              status: 'Completed',
            });
          }
        }

        if (importedItems.length > 0) {
          setLocalSales((prev) => [...importedItems, ...prev]);
          onNotify && onNotify(`Successfully imported ${importedItems.length} records from CSV!`);
        }
      } catch (err) {
        onNotify && onNotify('Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
  };

  // Record New Credit Modal Handler
  const handleOpenCreditModal = (type) => {
    setCreditModalType(type);
    setCreditFormData({
      partyName: '',
      partyPhone: '',
      partyAddress: '',
      creditAmount: '',
      recordDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      notes: type === 'Given' ? 'Credit given to customer/patient' : 'Credit taken from supplier/distributor',
      branch: effectiveBranch === 'All' ? userBranch : effectiveBranch,
    });
    setIsCreditModalOpen(true);
  };

  const handleSaveCreditRecord = async (e) => {
    e.preventDefault();
    if (!creditFormData.partyName.trim() || !creditFormData.creditAmount) {
      onNotify && onNotify('Please enter party name and credit amount.');
      return;
    }

    const amt = Number(creditFormData.creditAmount);
    const token = localStorage.getItem('kh_auth_token');

    const newCreditObj = {
      saleNo: `CRD-${Date.now().toString().slice(-5)}`,
      date: creditFormData.recordDate || new Date().toISOString().split('T')[0],
      creditType: creditModalType,
      partyName: creditFormData.partyName.trim(),
      partyPhone: creditFormData.partyPhone.trim(),
      partyAddress: creditFormData.partyAddress.trim(),
      address: creditFormData.partyAddress.trim(),
      patientName: creditModalType === 'Given' ? creditFormData.partyName.trim() : 'Supplier Purchase',
      creditAmount: amt,
      collectingAmount: amt,
      paidAmount: 0,
      dueDate: creditFormData.dueDate,
      creditStatus: 'Pending',
      notes: creditFormData.notes.trim(),
      branch: creditFormData.branch,
      createdBy: profile?.full_name || 'Pharmacist',
      createdByEmail: profile?.email || '',
      creatorRole: profile?.role || 'Pharmacist',
      status: 'Completed',
    };

    try {
      const res = await fetch('/api/v1/pharmacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newCreditObj),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setLocalSales((prev) => [data.data, ...prev]);
        if (onSavePharmacySale) onSavePharmacySale(data.data);
      } else {
        setLocalSales((prev) => [{ ...newCreditObj, _id: `temp-${Date.now()}` }, ...prev]);
      }
    } catch (err) {
      setLocalSales((prev) => [{ ...newCreditObj, _id: `temp-${Date.now()}` }, ...prev]);
    }

    onNotify && onNotify(`Credit ${creditModalType} record for "${creditFormData.partyName}" saved!`);
    setIsCreditModalOpen(false);
  };

  const stats = [
    {
      label: 'Pharmacy Total Collections',
      value: `₹ ${totalCollections.toLocaleString('en-IN')}`,
      change: `${activeSales.length} Transactions`,
      trend: 'up',
      detail: 'Mandatory collection total',
      icon: <WalletCards />,
      tone: 'teal',
      onClick: () => {},
    },
    {
      label: 'Credit Given (Customer Receivable)',
      value: `₹ ${totalCreditGivenAmt.toLocaleString('en-IN')}`,
      change: `${creditGivenList.filter(c => c.creditStatus !== 'Settled').length} Pending`,
      trend: 'up',
      detail: 'To whom we gave credit (Patients)',
      icon: <CreditCard />,
      tone: 'blue',
      onClick: () => setCreditTab('given'),
    },
    {
      label: 'Credit Taken (Supplier Payable)',
      value: `₹ ${totalCreditTakenAmt.toLocaleString('en-IN')}`,
      change: `${creditTakenList.filter(c => c.creditStatus !== 'Settled').length} Pending`,
      trend: 'down',
      detail: 'From whom we took credit (Vendors)',
      icon: <Receipt />,
      tone: 'red',
      onClick: () => setCreditTab('taken'),
    },
    {
      label: 'Total Medicine Purchases',
      value: `₹ ${totalPurchases.toLocaleString('en-IN')}`,
      change: 'Inventory',
      trend: 'down',
      detail: 'Optional inventory purchases',
      icon: <ShoppingBag />,
      tone: 'amber',
      onClick: () => {},
    },
  ];

  const [showForm, setShowForm] = useState(true);

  // Dedicated Credit Stat Cards when on /pharmacy/credits page
  const creditPageStats = [
    {
      label: 'Credit Given (Customer Receivable)',
      value: `₹ ${totalCreditGivenAmt.toLocaleString('en-IN')}`,
      change: `${creditGivenList.filter(c => c.creditStatus !== 'Settled').length} Pending`,
      trend: 'up',
      detail: 'To whom we gave credit (Patients)',
      icon: <CreditCard />,
      tone: 'blue',
      onClick: () => setCreditTab('given'),
    },
    {
      label: 'Credit Taken (Supplier Payable)',
      value: `₹ ${totalCreditTakenAmt.toLocaleString('en-IN')}`,
      change: `${creditTakenList.filter(c => c.creditStatus !== 'Settled').length} Pending`,
      trend: 'down',
      detail: 'From whom we took credit (Vendors)',
      icon: <Receipt />,
      tone: 'red',
      onClick: () => setCreditTab('taken'),
    },
    {
      label: 'Total Settled Credits',
      value: `₹ ${(
        creditGivenList.filter(c => c.creditStatus === 'Settled').reduce((a, c) => a + Number(c.paidAmount || c.creditAmount || 0), 0) +
        creditTakenList.filter(c => c.creditStatus === 'Settled').reduce((a, c) => a + Number(c.paidAmount || c.creditAmount || 0), 0)
      ).toLocaleString('en-IN')}`,
      change: 'Completed',
      trend: 'up',
      detail: 'Settled credit & debit total',
      icon: <CheckCircle2 />,
      tone: 'teal',
      onClick: () => {},
    },
    {
      label: 'Pending Due Balance',
      value: `₹ ${(
        creditGivenList.filter(c => c.creditStatus !== 'Settled').reduce((a, c) => a + (Number(c.creditAmount || 0) - Number(c.paidAmount || 0)), 0) +
        creditTakenList.filter(c => c.creditStatus !== 'Settled').reduce((a, c) => a + (Number(c.creditAmount || 0) - Number(c.paidAmount || 0)), 0)
      ).toLocaleString('en-IN')}`,
      change: 'Action Required',
      trend: 'down',
      detail: 'Outstanding balances due',
      icon: <Clock />,
      tone: 'amber',
      onClick: () => {},
    },
  ];

  // Dashboard Stat Cards when on main /pharmacy page
  const dashboardStats = [
    {
      label: 'Pharmacy Total Collections',
      value: `₹ ${totalCollections.toLocaleString('en-IN')}`,
      change: `${activeSales.length} Transactions`,
      trend: 'up',
      detail: 'Mandatory collection total',
      icon: <WalletCards />,
      tone: 'teal',
      onClick: () => {},
    },
    {
      label: 'Credit Given (Customer Receivable)',
      value: `₹ ${totalCreditGivenAmt.toLocaleString('en-IN')}`,
      change: `${creditGivenList.filter(c => c.creditStatus !== 'Settled').length} Pending`,
      trend: 'up',
      detail: 'Click to open Credit Manager',
      icon: <CreditCard />,
      tone: 'blue',
      onClick: () => onNavigate && onNavigate('/pharmacy/credits'),
    },
    {
      label: 'Credit Taken (Supplier Payable)',
      value: `₹ ${totalCreditTakenAmt.toLocaleString('en-IN')}`,
      change: `${creditTakenList.filter(c => c.creditStatus !== 'Settled').length} Pending`,
      trend: 'down',
      detail: 'Click to open Debit Manager',
      icon: <Receipt />,
      tone: 'red',
      onClick: () => onNavigate && onNavigate('/pharmacy/credits'),
    },
    {
      label: 'Total Medicine Purchases',
      value: `₹ ${totalPurchases.toLocaleString('en-IN')}`,
      change: 'Inventory',
      trend: 'down',
      detail: 'Optional inventory purchases',
      icon: <ShoppingBag />,
      tone: 'amber',
      onClick: () => {},
    },
  ];

  // DEDICATED PHARMACY CREDITS & DEBITS MANAGER PANEL COMPONENT
  const renderCreditsPanel = () => (
    <section className="panel full-panel" style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #dce7f5', boxShadow: '0 4px 16px rgba(15, 45, 85, 0.06)', padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #edf2f8', paddingBottom: '14px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={20} color="#1d4ed8" />
            <h2 style={{ margin: 0, fontSize: '16px', color: '#0f2d55', fontWeight: '800' }}>
              Pharmacy Credits & Debits Manager
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', flexWrap: 'wrap', width: '100%', maxWidth: '100%' }}>
          <button
            onClick={() => setCreditTab('given')}
            style={{
              flex: '1 1 220px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: '800',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: creditTab === 'given' ? '#1d4ed8' : 'transparent',
              color: creditTab === 'given' ? '#ffffff' : '#64748b',
              transition: 'all 0.15s ease',
              textAlign: 'center',
            }}
          >
            1. Credit Given to Customers (Receivables: ₹{totalCreditGivenAmt.toLocaleString('en-IN')})
          </button>

          <button
            onClick={() => setCreditTab('taken')}
            style={{
              flex: '1 1 220px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: '800',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: creditTab === 'taken' ? '#b91c1c' : 'transparent',
              color: creditTab === 'taken' ? '#ffffff' : '#64748b',
              transition: 'all 0.15s ease',
              textAlign: 'center',
            }}
          >
            2. Credit Taken from Suppliers (Payables: ₹{totalCreditTakenAmt.toLocaleString('en-IN')})
          </button>
        </div>
      </div>

      {/* Table Export & Import Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>
          Showing {(creditTab === 'given' ? creditGivenList : creditTakenList).length} filtered {creditTab === 'given' ? 'Customer Receivable' : 'Supplier Payable'} credit records
        </span>
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button
            className="secondary-button"
            onClick={() => fileInputRef.current?.click()}
            style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a', fontWeight: '800', gap: '5px', fontSize: '12px', padding: '6px 12px' }}
            title="Import Excel / CSV data file into database"
          >
            <Upload size={14} /> Import Excel / CSV
          </button>
          <button
            className="secondary-button"
            onClick={() => handleExportCSV(creditTab === 'given' ? creditGivenList : creditTakenList)}
            style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8', fontWeight: '800', gap: '5px', fontSize: '12px', padding: '6px 12px' }}
            title="Download current filtered table data to Excel / CSV format"
          >
            <Download size={14} /> Export Filtered Data (Excel / CSV)
          </button>
        </div>
      </div>

      {/* Credits Directory Table */}
      <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
        <table className="data-table" style={{ width: '100%', minWidth: '760px', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: creditTab === 'given' ? '#eff6ff' : '#fef2f2' }}>
              <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#334155', fontWeight: '800', borderBottom: '2px solid #cbd5e1' }}>
                {creditTab === 'given' ? 'Patient / Customer Name' : 'Supplier / Vendor Name'}
              </th>
              <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#334155', fontWeight: '800', borderBottom: '2px solid #cbd5e1' }}>Contact Phone</th>
              <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: creditTab === 'given' ? '#1d4ed8' : '#b91c1c', fontWeight: '800', borderBottom: '2px solid #cbd5e1' }}>
                {creditTab === 'given' ? 'Credit Given (₹)' : 'Credit Taken (₹)'}
              </th>
              <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#334155', fontWeight: '800', borderBottom: '2px solid #cbd5e1' }}>Settled Amount</th>
              <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#334155', fontWeight: '800', borderBottom: '2px solid #cbd5e1' }}>Due Date</th>
              <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#334155', fontWeight: '800', borderBottom: '2px solid #cbd5e1' }}>Branch</th>
              <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#334155', fontWeight: '800', borderBottom: '2px solid #cbd5e1' }}>Credit Status</th>
              <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#334155', fontWeight: '800', borderBottom: '2px solid #cbd5e1', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(creditTab === 'given' ? creditGivenList : creditTakenList).length > 0 ? (
              (creditTab === 'given' ? creditGivenList : creditTakenList).map((cRecord) => {
                const creditVal = Number(cRecord.creditAmount || cRecord.collectingAmount || 0);
                const paidVal = Number(cRecord.paidAmount || 0);
                const dueVal = Math.max(0, creditVal - paidVal);
                const isSettled = cRecord.creditStatus === 'Settled' || dueVal <= 0;

                return (
                  <tr key={cRecord._id || cRecord.id || cRecord.saleNo} style={{ borderBottom: '1px solid #edf2f8', background: isSettled ? '#f8fafc' : '#ffffff' }}>
                    <td style={{ padding: '12px' }}>
                      <strong style={{ color: '#0f2d55', fontSize: '13px', display: 'block' }}>
                        {cRecord.partyName || cRecord.patientName || 'Direct Party'}
                      </strong>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Ref: {cRecord.saleNo || cRecord.id}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {cRecord.partyPhone || cRecord.phone ? (
                        <button
                          type="button"
                          onClick={() => handleOpenLedger(cRecord)}
                          style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Click to view Customer / Supplier Ledger"
                        >
                          <Phone size={12} />
                          {cRecord.partyPhone || cRecord.phone}
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '900', color: creditTab === 'given' ? '#1d4ed8' : '#b91c1c' }}>
                        ₹ {creditVal.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', fontWeight: '700', color: '#16a34a' }}>
                      ₹ {paidVal.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                      {cRecord.dueDate || 'Standard Term (14d)'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#1769d7', background: '#eff6ff', padding: '3px 8px', borderRadius: '5px' }}>
                        {cRecord.branch || effectiveBranch}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isSettled ? (
                        <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={13} /> SETTLED
                        </span>
                      ) : paidVal > 0 ? (
                        <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} /> PARTIAL (Paid: ₹{paidVal.toLocaleString('en-IN')}, Due: ₹{dueVal.toLocaleString('en-IN')})
                        </span>
                      ) : (
                        <span style={{ background: creditTab === 'given' ? '#dbeafe' : '#fee2e2', color: creditTab === 'given' ? '#1e40af' : '#991b1b', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} /> PENDING (Due: ₹{dueVal.toLocaleString('en-IN')})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {!isSettled && (
                          <>
                            <button
                              onClick={() => handleOpenPaymentModal(cRecord)}
                              style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Record payment amount received or paid"
                            >
                              <DollarSign size={13} /> Record Payment
                            </button>
                            <button
                              onClick={() => handleSettleCredit(cRecord)}
                              style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                              title="Mark entire credit as fully settled"
                            >
                              ✓ Settle Full
                            </button>
                          </>
                        )}
                        <button
                          className="icon-button"
                          style={{ width: '28px', height: '28px', border: '1px solid #fecaca', background: '#fef2f2' }}
                          onClick={() => handleDeleteSale(cRecord)}
                          title="Delete credit record"
                        >
                          <Trash2 size={13} color="#dc2626" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '24px 16px', color: '#64748b', fontSize: '12px' }}>
                  No {creditTab === 'given' ? 'Customer Credit Given' : 'Supplier Credit Taken'} records registered for this branch scope.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <>
      {/* 1. DEDICATED PHARMACY CREDITS & DEBITS MANAGER PAGE (WHEN ON /pharmacy/credits) */}
      {isCreditsPage ? (
        <>
          {/* Page Heading for Credits & Debits Manager */}
          <div className="page-heading">
            <div>
              <div className="eyebrow">Pharmacy Operations & Credit Manager</div>
              <h1>Pharmacy Credits & Debits Manager</h1>
            </div>
            <div className="heading-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleImportCSV}
              />
              <button
                className="secondary-button"
                onClick={() => handleOpenCreditModal('Given')}
                style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8', fontWeight: '800', gap: '5px' }}
              >
                <CreditCard size={16} /> + Record Credit Given (Customer)
              </button>
              <button
                className="secondary-button"
                onClick={() => handleOpenCreditModal('Taken')}
                style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c', fontWeight: '800', gap: '5px' }}
              >
                <Receipt size={16} /> + Record Credit Taken (Supplier)
              </button>
              <button
                className="secondary-button"
                onClick={() => onNavigate && onNavigate('/pharmacy')}
                style={{ background: '#f8fafc', borderColor: '#cbd5e1', color: '#334155', fontWeight: '700' }}
              >
                ← Back to Pharmacy Workspace
              </button>
            </div>
          </div>

          {/* Interactive Filter Bar */}
          <TimeFilterBar
            title="Filter Branch Scoped Pharmacy Credits & Debits"
            onChange={(state) => setFilterState(state)}
          />

          {/* DEDICATED CREDIT STAT CARDS SECTION */}
          <section className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '20px' }}>
            {creditPageStats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </section>

          {/* DEDICATED PHARMACY CREDITS MANAGER TABLE PANEL */}
          {renderCreditsPanel()}
        </>
      ) : (
        /* 2. MAIN PHARMACY WORKSPACE DASHBOARD PAGE (WHEN ON /pharmacy) */
        <>
          {/* Page Heading for Main Pharmacy Workspace */}
          <div className="page-heading">
            <div>
              <div className="eyebrow">Pharmacy Operations & Sales</div>
              <h1>Pharmacy Workspace</h1>
              <p>
                Welcome back, {firstName}. Branch: <strong>{effectiveBranch === 'All' ? 'All Campuses' : effectiveBranch}</strong> ({userRole})
              </p>
            </div>
            <div className="heading-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="secondary-button"
                onClick={() => onNavigate && onNavigate('/pharmacy/credits')}
                style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8', fontWeight: '800', gap: '5px' }}
              >
                <CreditCard size={16} /> Pharmacy Credits Manager
              </button>
              <button
                className="primary-button"
                onClick={() => setShowForm((prev) => !prev)}
                style={{ background: '#15803d', borderColor: '#15803d', gap: '6px' }}
              >
                <Plus size={17} /> {showForm ? 'Hide Form' : 'Add Record'}
              </button>
            </div>
          </div>

          {/* Interactive Filter Bar */}
          <TimeFilterBar
            title="Filter Pharmacy Analytics & Collections"
            onChange={(state) => setFilterState(state)}
          />

          {/* RECORD PHARMACY COLLECTION FORM EMBEDDED INLINE */}
          {showForm && (
            <section style={{ marginBottom: '24px' }}>
              <AddPharmacySaleForm
                onSave={(newSale) => {
                  setLocalSales((prev) => [newSale, ...prev]);
                  if (onSavePharmacySale) onSavePharmacySale(newSale);
                  onNotify && onNotify(`Pharmacy record ${newSale.saleNo || newSale.id} registered!`);
                }}
                notify={onNotify}
                effectiveBranch={effectiveBranch}
                branchesList={branchesList}
              />
            </section>
          )}

          {/* DASHBOARD STAT CARDS SECTION */}
          <section className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '20px' }}>
            {dashboardStats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </section>

          {/* SINGLE LINE VERTICAL BAR GRAPH */}
          {isSuperAdmin && branchAnalyticsData.branches.length > 0 && (
            <section style={{ width: '100%', marginBottom: '20px', padding: '18px 22px', background: '#ffffff', borderRadius: '14px', border: '1px solid #dce7f5', boxShadow: '0 4px 16px rgba(15, 45, 85, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #edf2f8', paddingBottom: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={20} color="#15803d" />
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#0f2d55', fontWeight: '800' }}>
                    Pharmacy Financial Performance ({effectiveBranch === 'All' ? 'All Campuses' : effectiveBranch})
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', fontWeight: '700' }}>
                  <span style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '9px', height: '9px', background: '#16a34a', borderRadius: '3px', display: 'inline-block' }}></span> Collections
                  </span>
                  <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '9px', height: '9px', background: '#ef4444', borderRadius: '3px', display: 'inline-block' }}></span> Expenses & Purchases
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${branchAnalyticsData.branches.length}, 1fr)`, gap: '16px', alignItems: 'end', padding: '16px 14px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                {branchAnalyticsData.branches.map((b) => {
                  const revHeight = Math.max(16, Math.round((b.revenue / branchAnalyticsData.maxVal) * 125));
                  const expHeight = Math.max(16, Math.round(((b.expenses + b.purchases) / branchAnalyticsData.maxVal) * 125));

                  return (
                    <div key={b.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '145px', paddingBottom: '4px', borderBottom: '2px solid #cbd5e1', width: '100%', justifyContent: 'center' }}>
                        {/* Collection Bar */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#15803d' }}>
                            ₹{(b.revenue / 1000).toFixed(1)}k
                          </span>
                          <div
                            style={{
                              width: '24px',
                              height: `${revHeight}px`,
                              background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                              borderRadius: '5px 5px 0 0',
                              boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                            }}
                            title={`${b.name} Collections: ₹ ${b.revenue.toLocaleString('en-IN')}`}
                          />
                        </div>

                        {/* Expense & Purchase Bar */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#dc2626' }}>
                            ₹{((b.expenses + b.purchases) / 1000).toFixed(1)}k
                          </span>
                          <div
                            style={{
                              width: '24px',
                              height: `${expHeight}px`,
                              background: 'linear-gradient(180deg, #f87171 0%, #ef4444 100%)',
                              borderRadius: '5px 5px 0 0',
                              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.25)',
                            }}
                            title={`${b.name} Expenses: ₹ ${b.expenses.toLocaleString('en-IN')} | Purchases: ₹ ${b.purchases.toLocaleString('en-IN')}`}
                          />
                        </div>
                      </div>

                      <div style={{ textAlign: 'center', marginTop: '2px' }}>
                        <strong style={{ fontSize: '12px', color: '#0f2d55', display: 'block', lineHeight: '1.2' }}>{b.name}</strong>
                        <span style={{ fontSize: '11px', color: b.netProfit >= 0 ? '#15803d' : '#dc2626', fontWeight: '700' }}>
                          Net: ₹{b.netProfit.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* PHARMACY TRANSACTIONS TABLE PANEL */}
          <section className="panel full-panel" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #dce7f5', boxShadow: '0 4px 16px rgba(15, 45, 85, 0.05)', padding: '20px' }}>
            <div className="list-toolbar" style={{ flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #edf2f8', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', background: '#f0fdf4', borderRadius: '8px', display: 'grid', placeItems: 'center', border: '1px solid #bbf7d0' }}>
                  <Pill size={18} color="#15803d" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', color: '#0f2d55', fontWeight: '800' }}>
                    Pharmacy Sales & Collections ({filteredSales.length})
                  </h2>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Audited medicine sales and mandatory collection receipts
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', maxWidth: '280px', width: '100%' }}>
                  <input
                    type="text"
                    placeholder="Search receipt, customer, branch..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', background: '#f8fafc' }}
                  />
                  <Search size={15} color="#64748b" style={{ position: 'absolute', left: '11px', top: '10px' }} />
                </div>

                <button
                  className="secondary-button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a', fontWeight: '800', gap: '5px', fontSize: '12px', padding: '7px 12px' }}
                  title="Import Excel / CSV data file into database"
                >
                  <Upload size={14} /> Import Excel / CSV
                </button>

                <button
                  className="secondary-button"
                  onClick={() => handleExportCSV(filteredSales)}
                  style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8', fontWeight: '800', gap: '5px', fontSize: '12px', padding: '7px 12px' }}
                  title="Download current filtered transactions to Excel / CSV format"
                >
                  <Download size={14} /> Export Filtered Data (Excel / CSV)
                </button>
              </div>
            </div>

            <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
              <table className="data-table" style={{ width: '100%', minWidth: '720px', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: '800', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Receipt / Sale No</th>
                    <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: '800', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Patient / Customer / Vendor</th>
                    <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#15803d', fontWeight: '800', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Collecting Amount (Mandatory)</th>
                    <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: '800', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Total Collection</th>
                    <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: '800', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Expense</th>
                    <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: '800', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Purchase</th>
                    <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: '800', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Branch Campus</th>
                    <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: '800', borderBottom: '2px solid #e2e8f0', textAlign: 'center', whiteSpace: 'nowrap' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length > 0 ? (
                    filteredSales.map((sale) => (
                      <tr key={sale._id || sale.id || sale.saleNo} style={{ borderBottom: '1px solid #edf2f8' }}>
                        <td style={{ padding: '12px' }}>
                          <strong style={{ color: '#0f2d55', fontSize: '12px', fontFamily: 'monospace' }}>{sale.saleNo || sale.id}</strong>
                          {sale.creditType && sale.creditType !== 'None' && (
                            <span style={{ fontSize: '10px', background: sale.creditType === 'Given' ? '#dbeafe' : '#fee2e2', color: sale.creditType === 'Given' ? '#1e40af' : '#991b1b', fontWeight: '800', padding: '1px 6px', borderRadius: '4px', display: 'block', width: 'fit-content', marginTop: '2px' }}>
                              Credit {sale.creditType}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: '700', color: '#162d4a', fontSize: '12px' }}>{sale.partyName || sale.patientName || 'Walk-In Customer'}</div>
                          {(sale.partyPhone || sale.phone) && (
                            <button
                              type="button"
                              onClick={() => handleOpenLedger(sale)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                color: '#1d4ed8',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                marginTop: '2px',
                              }}
                              title="Click to view Customer / Supplier Ledger"
                            >
                              <Phone size={11} /> {sale.partyPhone || sale.phone}
                            </button>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ color: '#15803d', fontSize: '13px', fontWeight: '900', background: '#f0fdf4', padding: '4px 8px', borderRadius: '6px', border: '1px solid #bbf7d0', display: 'inline-block' }}>
                            ₹ {parseFloat(sale.collectingAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ color: '#0369a1', fontWeight: '700', fontSize: '12px' }}>
                            ₹ {parseFloat(sale.totalCollection || sale.collectingAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ color: '#dc2626', fontSize: '12px' }}>
                            ₹ {parseFloat(sale.totalExpense || 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ color: '#d97706', fontSize: '12px' }}>
                            ₹ {parseFloat(sale.totalPurchase || 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontWeight: '700', color: '#1769d7', fontSize: '11px' }}>
                            {sale.branch || 'Main Branch'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            className="icon-button"
                            style={{ width: '30px', height: '30px', border: '1px solid #fecaca', background: '#fef2f2', borderRadius: '6px', cursor: 'pointer', display: 'inline-grid', placeItems: 'center' }}
                            onClick={() => handleDeleteSale(sale)}
                            title="Delete Sale Record from Database"
                          >
                            <Trash2 size={14} color="#dc2626" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', background: '#fafbfc' }}>
                        <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#f0fdf4', display: 'grid', placeItems: 'center', border: '1px solid #bbf7d0' }}>
                            <Pill size={22} color="#16a34a" />
                          </div>
                          <h4 style={{ margin: 0, fontSize: '14px', color: '#0f2d55', fontWeight: '800' }}>No Pharmacy Collections Recorded</h4>
                          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                            No pharmacy receipts match your filter. Click <strong>Add Record</strong> to register a sale or credit.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
      {/* RECORD CREDIT MODAL (CREDIT TAKEN FROM SUPPLIER OR CREDIT GIVEN TO CUSTOMER) */}
      {isCreditModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(15, 45, 85, 0.45)', display: 'grid', placeItems: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 40px rgba(16, 45, 85, 0.2)', border: '1px solid #dbe6f5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f8', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} color={creditModalType === 'Given' ? '#1d4ed8' : '#b91c1c'} />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#162d4a', fontWeight: '800' }}>
                  Record {creditModalType === 'Given' ? 'Credit Given (Customer Receivable)' : 'Credit Taken (Supplier Payable)'}
                </h3>
              </div>
              <button className="icon-button" onClick={() => setIsCreditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCreditRecord} style={{ display: 'grid', gap: '14px' }}>
              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '800', color: creditModalType === 'Given' ? '#1d4ed8' : '#b91c1c' }}>
                  {creditModalType === 'Given' ? 'Patient / Customer Full Name *' : 'Supplier / Distributor Name *'}
                </span>
                <input
                  type="text"
                  required
                  placeholder={creditModalType === 'Given' ? 'e.g. Ramesh Kumar' : 'e.g. MedPharma Distributors'}
                  value={creditFormData.partyName}
                  onChange={(e) => setCreditFormData({ ...creditFormData, partyName: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '13px' }}
                />
              </div>

              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Contact Phone Number (Auto-Fetches Data)</span>
                <input
                  type="tel"
                  placeholder="+91 98470 00000"
                  value={creditFormData.partyPhone}
                  onChange={(e) => handleCreditPhoneChange(e.target.value)}
                  style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '13px' }}
                />
              </div>

              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Address Section</span>
                <input
                  type="text"
                  placeholder="e.g. Street, Colony, City"
                  value={creditFormData.partyAddress}
                  onChange={(e) => setCreditFormData({ ...creditFormData, partyAddress: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '13px' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Record Date (Default Today)</span>
                  <input
                    type="date"
                    value={creditFormData.recordDate}
                    onChange={(e) => setCreditFormData({ ...creditFormData, recordDate: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '13px' }}
                  />
                </div>
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Due Date</span>
                  <input
                    type="date"
                    value={creditFormData.dueDate}
                    onChange={(e) => setCreditFormData({ ...creditFormData, dueDate: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#16a34a' }}>Credit Amount (₹) *</span>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1500"
                  value={creditFormData.creditAmount}
                  onChange={(e) => setCreditFormData({ ...creditFormData, creditAmount: e.target.value })}
                  style={{ padding: '10px 12px', border: '2px solid #86efac', borderRadius: '7px', fontSize: '15px', fontWeight: '900', color: '#16a34a', background: '#f0fdf4' }}
                />
              </div>

              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Remarks & Notes</span>
                <textarea
                  rows={2}
                  value={creditFormData.notes}
                  onChange={(e) => setCreditFormData({ ...creditFormData, notes: e.target.value })}
                  style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '12px', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="secondary-button" onClick={() => setIsCreditModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  style={{ background: creditModalType === 'Given' ? '#1d4ed8' : '#b91c1c', borderColor: creditModalType === 'Given' ? '#1d4ed8' : '#b91c1c' }}
                >
                  Save Credit Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER / SUPPLIER LEDGER MODAL */}
      {isLedgerModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(15, 45, 85, 0.55)', display: 'grid', placeItems: 'center', padding: '16px' }}>
          {/* Printable Styles for Ledger Statement */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .ledger-printable-modal, .ledger-printable-modal * {
                visibility: visible;
              }
              .ledger-printable-modal {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                max-height: none !important;
                overflow: visible !important;
                box-shadow: none !important;
                border: none !important;
                padding: 10px !important;
                background: #ffffff !important;
              }
              .no-print {
                display: none !important;
              }
              .print-only {
                display: block !important;
              }
            }
            @media screen {
              .print-only {
                display: none !important;
              }
            }
          `}</style>

          <div
            className="ledger-printable-modal"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(16, 45, 85, 0.25)',
              border: '1px solid #cbd5e1',
            }}
          >
            {/* Print Header (Visible only when printed) */}
            <div className="print-only" style={{ borderBottom: '2px solid #0f2d55', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '20px', color: '#0f2d55', fontWeight: '900', letterSpacing: '-0.5px' }}>
                    KRISHNA HOSPITAL & RESEARCH CENTRE
                  </h1>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    Pharmacy Department • Customer & Supplier Ledger Statement
                  </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569' }}>
                  <span>Statement Date: <strong>{new Date().toISOString().split('T')[0]}</strong></span><br />
                  <span>Branch: <strong>{effectiveBranch === 'All' ? userBranch : effectiveBranch}</strong></span>
                </div>
              </div>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #edf2f8', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={22} color="#1d4ed8" />
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#0f2d55', fontWeight: '800' }}>
                    Party Statement & Ledger View
                  </h2>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px', fontSize: '12px', color: '#475569' }}>
                  <span style={{ fontWeight: '700', color: '#0f2d55' }}>
                    👤 {selectedLedgerParty.name || 'Walk-In Customer'}
                  </span>
                  <span>
                    📞 {selectedLedgerParty.phone || 'No phone number'}
                  </span>
                  <span>
                    📍 {selectedLedgerParty.address || 'Address not listed'}
                  </span>
                </div>
              </div>
              <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
                  onClick={handleDownloadLedgerCSV}
                  title="Download Ledger CSV"
                >
                  <Download size={14} /> Download CSV
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
                  onClick={handlePrintLedger}
                  title="Print Statement / Save PDF"
                >
                  <Printer size={14} /> Print Statement
                </button>
                <button className="icon-button" onClick={() => setIsLedgerModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Summary KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '18px' }}>
              <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '12px', border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: '11px', color: '#1e40af', fontWeight: '700', display: 'block' }}>Total Credit Given</span>
                <strong style={{ fontSize: '16px', color: '#1d4ed8' }}>
                  ₹ {ledgerTransactions.filter(t => t.creditType === 'Given').reduce((s, t) => s + Number(t.creditAmount || t.collectingAmount || 0), 0).toLocaleString('en-IN')}
                </strong>
              </div>

              <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '12px', border: '1px solid #fecaca' }}>
                <span style={{ fontSize: '11px', color: '#991b1b', fontWeight: '700', display: 'block' }}>Total Credit Taken</span>
                <strong style={{ fontSize: '16px', color: '#b91c1c' }}>
                  ₹ {ledgerTransactions.filter(t => t.creditType === 'Taken').reduce((s, t) => s + Number(t.creditAmount || t.collectingAmount || 0), 0).toLocaleString('en-IN')}
                </strong>
              </div>

              <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '11px', color: '#166534', fontWeight: '700', display: 'block' }}>Total Settled Amount</span>
                <strong style={{ fontSize: '16px', color: '#16a34a' }}>
                  ₹ {ledgerTransactions.reduce((s, t) => s + Number(t.paidAmount || 0), 0).toLocaleString('en-IN')}
                </strong>
                <span style={{ fontSize: '10px', color: '#15803d', fontWeight: '800', display: 'block', marginTop: '3px' }}>
                  {partyPaymentRecords.length} Payment Receipt{partyPaymentRecords.length === 1 ? '' : 's'} Logged
                </span>
              </div>

              <div style={{ background: '#fffbeb', borderRadius: '10px', padding: '12px', border: '1px solid #fde68a' }}>
                <span style={{ fontSize: '11px', color: '#92400e', fontWeight: '700', display: 'block' }}>Net Outstanding Balance</span>
                <strong style={{ fontSize: '16px', color: '#d97706' }}>
                  ₹ {ledgerTransactions.reduce((s, t) => s + (Math.max(0, Number(t.creditAmount || t.collectingAmount || 0) - Number(t.paidAmount || 0))), 0).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* Transactions History Table */}
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>Date</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>Ref / Sale No</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>Type</th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #cbd5e1' }}>Total Credit (₹)</th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #cbd5e1' }}>Paid / Settled (₹)</th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #cbd5e1' }}>Balance Due (₹)</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #cbd5e1' }}>Status</th>
                    <th className="no-print" style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #cbd5e1' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerTransactions.length > 0 ? (
                    ledgerTransactions.map((tx) => {
                      const totalAmt = Number(tx.creditAmount || tx.collectingAmount || 0);
                      const paidAmt = Number(tx.paidAmount || 0);
                      const dueAmt = Math.max(0, totalAmt - paidAmt);
                      const isSettled = tx.creditStatus === 'Settled' || dueAmt <= 0;

                      const txPaymentsCount = Array.isArray(tx.paymentHistory) && tx.paymentHistory.length > 0
                        ? tx.paymentHistory.length
                        : (paidAmt > 0 ? 1 : 0);

                      let txPaymentsDetailStr = '';
                      if (Array.isArray(tx.paymentHistory) && tx.paymentHistory.length > 0) {
                        txPaymentsDetailStr = tx.paymentHistory
                          .map((h) => `${h.dateStr || (h.date ? String(h.date).split('T')[0] : 'Recent')} (₹${Number(h.amount || 0).toLocaleString('en-IN')})`)
                          .join(', ');
                      } else if (paidAmt > 0) {
                        txPaymentsDetailStr = `${tx.paymentDate || tx.lastPaymentDate || tx.date || 'Recent'} (₹${paidAmt.toLocaleString('en-IN')})`;
                      }

                      return (
                        <tr key={tx._id || tx.id || tx.saleNo} style={{ borderBottom: '1px solid #edf2f8' }}>
                          <td style={{ padding: '10px', color: '#64748b' }}>
                            {tx.date || tx.recordDate || 'Recent'}
                          </td>
                          <td style={{ padding: '10px', fontWeight: '800', fontFamily: 'monospace' }}>
                            {tx.saleNo || tx.id}
                          </td>
                          <td style={{ padding: '10px' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: '800',
                              fontSize: '11px',
                              background: tx.creditType === 'Given' ? '#dbeafe' : tx.creditType === 'Taken' ? '#fee2e2' : '#f1f5f9',
                              color: tx.creditType === 'Given' ? '#1e40af' : tx.creditType === 'Taken' ? '#991b1b' : '#334155',
                            }}>
                              {tx.creditType ? `Credit ${tx.creditType}` : 'Direct Sale'}
                            </span>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800' }}>
                            ₹ {totalAmt.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#16a34a' }}>
                            <div>₹ {paidAmt.toLocaleString('en-IN')}</div>
                            {txPaymentsCount > 0 && (
                              <div style={{ fontSize: '10px', color: '#0369a1', fontWeight: '800', marginTop: '2px' }}>
                                {txPaymentsCount} payment{txPaymentsCount === 1 ? '' : 's'} recorded
                              </div>
                            )}
                            {txPaymentsDetailStr && (
                              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal', marginTop: '1px' }}>
                                📅 {txPaymentsDetailStr}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: '900', color: dueAmt > 0 ? '#b91c1c' : '#16a34a' }}>
                            ₹ {dueAmt.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: '800',
                              background: isSettled ? '#dcfce7' : paidAmt > 0 ? '#fef3c7' : '#fee2e2',
                              color: isSettled ? '#15803d' : paidAmt > 0 ? '#b45309' : '#991b1b',
                            }}>
                              {isSettled ? 'SETTLED' : paidAmt > 0 ? 'PARTIAL' : 'PENDING'}
                            </span>
                          </td>
                          <td className="no-print" style={{ padding: '10px', textAlign: 'center' }}>
                            {dueAmt > 0 ? (
                              <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  style={{
                                    padding: '4px 8px',
                                    background: '#0284c7',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                  }}
                                  onClick={() => handleOpenPaymentModal(tx)}
                                  title="Record payment against this transaction"
                                >
                                  Record Payment
                                </button>
                                <button
                                  type="button"
                                  style={{
                                    padding: '4px 8px',
                                    background: '#16a34a',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                  }}
                                  onClick={() => handleSettleCredit(tx)}
                                  title="Settle full balance with payment options"
                                >
                                  ✓ Settle Full
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700' }}>
                                ✓ Settled
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                        No ledger transactions logged for {selectedLedgerParty.name || 'this contact'}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Itemized Payment Records & Receipts History Log */}
            <div style={{ marginTop: '20px', borderTop: '2px dashed #cbd5e1', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <WalletCards size={18} color="#0284c7" />
                  <h3 style={{ margin: 0, fontSize: '14px', color: '#0f2d55', fontWeight: '800' }}>
                    Itemized Payment Records & Receipts Log ({partyPaymentRecords.length} Payment{partyPaymentRecords.length === 1 ? '' : 's'} Logged)
                  </h3>
                </div>
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '800' }}>
                  Total Settled: ₹ {partyPaymentRecords.reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#f0fdf4' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #bbf7d0' }}>Payment Date</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #bbf7d0' }}>Bill / Ref No</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #bbf7d0' }}>Transaction Type</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #bbf7d0' }}>Payment Method / Modes</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #bbf7d0' }}>Txn Ref ID</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '2px solid #bbf7d0' }}>Amount Paid (₹)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '2px solid #bbf7d0' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partyPaymentRecords.length > 0 ? (
                      partyPaymentRecords.map((p, idx) => (
                        <tr key={p.id || idx} style={{ borderBottom: '1px solid #edf2f8' }}>
                          <td style={{ padding: '8px 10px', color: '#0f2d55', fontWeight: '700' }}>
                            📅 {p.date} {p.time && p.time !== 'Initial' ? `· ${p.time}` : ''}
                          </td>
                          <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: '700' }}>
                            {p.saleNo}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: '700',
                              fontSize: '10px',
                              background: p.creditType === 'Given' ? '#dbeafe' : '#fee2e2',
                              color: p.creditType === 'Given' ? '#1e40af' : '#991b1b',
                            }}>
                              {p.creditType === 'Given' ? 'Customer Payment (Received)' : 'Supplier Payment (Paid)'}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', color: '#0369a1', fontWeight: '700' }}>
                            💳 {p.method}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#64748b' }}>
                            {p.refId || 'N/A'}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '800', color: '#16a34a' }}>
                            ₹ {Number(p.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '800', background: '#dcfce7', color: '#15803d' }}>
                              ✓ RECORDED
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                          No payments recorded yet for {selectedLedgerParty.name || 'this contact'}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print Signatory (Visible only in print) */}
            <div className="print-only" style={{ marginTop: '36px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#334155', borderTop: '1px dashed #cbd5e1', paddingTop: '16px' }}>
              <div>
                <span>Statement Generated By: <strong>{profile?.full_name || 'Pharmacist'}</strong></span><br />
                <span>Branch: <strong>{effectiveBranch === 'All' ? userBranch : effectiveBranch}</strong></span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ width: '180px', borderBottom: '1px solid #334155', marginBottom: '6px', marginLeft: 'auto' }}></div>
                <span>Authorized Pharmacist Signatory</span>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid #edf2f8', paddingTop: '12px' }}>
              <div className="no-print" style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
                  onClick={handleDownloadLedgerCSV}
                >
                  <Download size={14} /> Download Statement (CSV)
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
                  onClick={handlePrintLedger}
                >
                  <Printer size={14} /> Print Statement
                </button>
              </div>
              <button className="primary-button no-print" onClick={() => setIsLedgerModalOpen(false)}>
                Close Ledger
              </button>
            </div>

          </div>
        </div>
      )}

      {/* RECORD PARTIAL PAYMENT MODAL (CUSTOMER PAYMENT RECEIVED OR SUPPLIER PAYMENT PAID) */}
      {isPaymentModalOpen && selectedCreditForPayment && (() => {
        const fullAmt = Number(selectedCreditForPayment.creditAmount || selectedCreditForPayment.collectingAmount || 0);
        const currentPaid = Number(selectedCreditForPayment.paidAmount || 0);
        const currentDue = Math.max(0, fullAmt - currentPaid);
        const payingNum = parseFloat(calculatedSettlementTotal) || 0;
        const remainingBal = Math.max(0, currentDue - payingNum);
        const isSupplier = selectedCreditForPayment?.creditType === 'Taken' || (!selectedCreditForPayment?.creditType && creditTab === 'taken');

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 160, background: 'rgba(15, 45, 85, 0.45)', display: 'grid', placeItems: 'center', padding: '16px', overflowY: 'auto' }}>
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(16, 45, 85, 0.2)', border: '1px solid #dbe6f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f8', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <WalletCards size={20} color={isSupplier ? '#b91c1c' : '#0284c7'} />
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#162d4a', fontWeight: '800' }}>
                    Record Payment Settlement {isSupplier ? 'Paid (Supplier)' : 'Received (Customer)'}
                  </h3>
                </div>
                <button className="icon-button" onClick={() => setIsPaymentModalOpen(false)} aria-label="Close modal">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSavePartialPayment} style={{ display: 'grid', gap: '14px' }}>
                {/* Party Summary Header */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', display: 'grid', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '14px', color: '#0f2d55' }}>
                      {selectedCreditForPayment.partyName || selectedCreditForPayment.patientName || 'Party Customer'}
                    </strong>
                    <span style={{ fontSize: '11px', color: '#4a5e7a', fontWeight: '700' }}>
                      Ref: {selectedCreditForPayment.saleNo || selectedCreditForPayment.id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                    <span>Phone: <strong>{selectedCreditForPayment.partyPhone || selectedCreditForPayment.phone || 'N/A'}</strong></span>
                    <span>Type: <strong style={{ color: isSupplier ? '#b91c1c' : '#1d4ed8' }}>{isSupplier ? 'Credit Taken (Payable)' : 'Credit Given (Receivable)'}</strong></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                    <span>Total Credit Amount: <strong>₹ {fullAmt.toLocaleString('en-IN')}</strong></span>
                    <span>Paid So Far: <strong style={{ color: '#15803d' }}>₹ {currentPaid.toLocaleString('en-IN')}</strong></span>
                  </div>
                </div>

                {/* Outstanding Due & Quick Fill Buttons Banner */}
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#dc2626', textTransform: 'uppercase' }}>OUTSTANDING BALANCE DUE</span>
                    <strong style={{ fontSize: '18px', color: '#dc2626', display: 'block' }}>₹ {currentDue.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleQuickFillSettlement(currentDue)}
                      style={{ border: '1px solid #b8d5f7', background: '#f4f8fe', color: '#1769d7', fontSize: '11px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}
                    >
                      ⚡ Full Due (₹{currentDue})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFillSettlement(Math.round(currentDue / 2))}
                      style={{ border: '1px solid #fed7aa', background: '#fff7ed', color: '#c2410c', fontSize: '11px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}
                    >
                      Half Due (₹{Math.round(currentDue / 2)})
                    </button>
                  </div>
                </div>

                {/* Live Remaining Balance Box */}
                <div
                  style={{
                    background: remainingBal <= 0 ? '#f0fdf4' : '#fffbeb',
                    border: `1px solid ${remainingBal <= 0 ? '#bbf7d0' : '#fde68a'}`,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: '700', color: remainingBal <= 0 ? '#15803d' : '#b45309' }}>
                    {remainingBal <= 0 ? '✓ Settlement Result: FULLY PAID (Zero Balance)' : '⚠️ Settlement Result: PARTIAL PAYMENT'}
                  </span>
                  <strong style={{ fontSize: '15px', color: remainingBal <= 0 ? '#15803d' : '#b45309' }}>
                    Balance: ₹ {remainingBal.toLocaleString('en-IN')}
                  </strong>
                </div>

                {/* Payment Date Field */}
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f2d55', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Calendar size={14} color="#0284c7" /> Payment Date *
                  </span>
                  <input
                    type="date"
                    required
                    value={settlementDate}
                    onChange={(e) => setSettlementDate(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '7px',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#0f2d55',
                      background: '#ffffff',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* MULTI-SELECT SETTLEMENT PAYMENT METHODS (TICKS) & SPLIT AMOUNTS */}
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f2d55', display: 'block', marginBottom: '6px' }}>
                    Settlement Payment Method *
                  </span>

                  {/* CHECKBOXES ROW */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #dde7f1', marginBottom: '10px' }}>
                    {[
                      { key: 'Cash', label: 'Cash' },
                      { key: 'UPI', label: 'UPI' },
                      { key: 'Card', label: 'Card' },
                      { key: 'Cheque', label: 'Cheque' },
                      { key: 'Bank Transfer', label: 'Bank Transfer' },
                      { key: 'Free', label: 'Free / Complimentary' },
                      { key: 'Others', label: 'Others / PO' },
                    ].map((m) => (
                      <label key={m.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: selectedSettlementMethods[m.key] ? '#1769d7' : '#475569' }}>
                        <input
                          type="checkbox"
                          checked={!!selectedSettlementMethods[m.key]}
                          onChange={() => toggleSettlementMethod(m.key)}
                          style={{ width: '16px', height: '16px', accentColor: '#1769d7', cursor: 'pointer' }}
                        />
                        <span>{m.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* SPLIT AMOUNT INPUTS FOR CHECKED MODES */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                    {activeSettlementModes.map((modeKey) => (
                      <div key={modeKey} className="field">
                        <span style={{ color: '#15803d', fontSize: '10px', fontWeight: '800' }}>
                          {modeKey} Amount (₹) *
                        </span>
                        <input
                          type="number"
                          step="any"
                          value={settlementSplitAmounts[modeKey] || ''}
                          onChange={(e) => handleSettlementSplitAmountChange(modeKey, e.target.value)}
                          placeholder={`Enter ${modeKey} amount...`}
                          required
                          style={{ padding: '7px 10px', border: '1px solid #86efac', borderRadius: '6px', fontSize: '12px', fontWeight: '800', color: '#15803d', background: '#ffffff', width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* SETTLEMENT TOTAL SUMMARY BANNER */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', background: '#e0f2fe', border: '1px solid #7dd3fc', padding: '8px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: '800', color: '#0369a1' }}>
                    <span>Total Amount Paying Now: <strong>₹ {calculatedSettlementTotal.toLocaleString('en-IN')}</strong> {settlementSummaryStr ? `(${settlementSummaryStr})` : ''}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeSettlementModes.length === 1) {
                          setSettlementSplitAmounts((prev) => ({ ...prev, [activeSettlementModes[0]]: currentDue.toString() }));
                        }
                      }}
                      style={{ fontSize: '10px', background: '#0284c7', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: '700' }}
                    >
                      ⚡ Auto-Set Full Remaining Due (₹ {currentDue})
                    </button>
                  </div>
                </div>

                {/* CONDITIONAL UPI HANDLES DROPDOWN */}
                {selectedSettlementMethods.UPI && (
                  <>
                    <div className="field">
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7' }}>Hospital Available UPI Handle *</span>
                      <select
                        value={settlementUpiHandle}
                        onChange={(e) => setSettlementUpiHandle(e.target.value)}
                        required
                        style={{ padding: '10px 12px', border: '1px solid #93c5fd', borderRadius: '7px', fontSize: '13px', background: '#f0f9ff', fontWeight: '700', color: '#0284c7', width: '100%', boxSizing: 'border-box' }}
                      >
                        {defaultUpiHandles.map((h) => (
                          <option key={h} value={h}>💳 {h}</option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>UPI Transaction Ref ID (Optional)</span>
                      <input
                        value={settlementTxnId}
                        onChange={(e) => setSettlementTxnId(e.target.value)}
                        placeholder="e.g. 402918239102"
                        style={{ padding: '10px 12px', border: '1px solid #dde7f1', borderRadius: '7px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  </>
                )}

                {/* OPTIONAL RECEIPT PROOF PICTURE UPLOAD */}
                <div className="field">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a5e7a' }}>Payment Receipt / Voucher Picture (Optional)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <label className="secondary-button" style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', gap: '6px' }}>
                      <Upload size={14} /> Upload Receipt Picture (Optional)
                      <input type="file" accept="image/*" onChange={handleReceiptUpload} style={{ display: 'none' }} />
                    </label>
                    {settlementReceipt ? (
                      <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> {settlementReceiptName || 'Receipt Attached'}
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', color: '#64748b' }}>No receipt picture selected (Optional)</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" className="secondary-button" onClick={() => setIsPaymentModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-button" style={{ background: '#15803d', borderColor: '#15803d', gap: '6px' }}>
                    <CheckCircle2 size={16} /> Confirm Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </>
  );
}

export default PharmacyDashboard;
