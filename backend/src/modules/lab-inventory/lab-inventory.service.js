import { LabInventoryItem } from './lab-inventory.model.js';
import { Expense } from '../expenses/expense.model.js';

/**
 * Get all lab inventory items with optional branch filter
 */
export const getAllInventoryItems = async (branchFilter) => {
  const query = {};
  if (branchFilter && branchFilter !== 'All') {
    query.$or = [{ branch: branchFilter }, { branch: 'All' }, { branch: '' }];
  }
  return await LabInventoryItem.find(query).sort({ updatedAt: -1 });
};

/**
 * Create a new lab inventory item or machine & auto-sync expense
 */
export const createInventoryItem = async (data) => {
  const unitCostNum = Number(data.unitCost || 0);
  const totalAmtNum = Number(data.totalAmount || (data.itemType === 'Consumable' ? unitCostNum * Number(data.stockQuantity || 1) : unitCostNum));

  const itemData = {
    ...data,
    unitCost: unitCostNum,
    totalAmount: totalAmtNum,
  };

  const item = new LabInventoryItem(itemData);
  const savedItem = await item.save();

  // Auto-sync purchase cost to Expenses module if spent amount > 0
  if (totalAmtNum > 0) {
    try {
      const expCount = await Expense.countDocuments();
      const expNo = `EXP-LAB-${String(expCount + 1).padStart(4, '0')}`;
      await Expense.create({
        expenseNo: expNo,
        title: `Lab ${data.itemType || 'Item'} Purchase: ${data.itemName}${data.itemType === 'Consumable' ? ` (${data.stockQuantity || 1} ${data.unit || 'Kits'} @ ₹${unitCostNum})` : ''}`,
        category: 'Medical & Lab Supplies',
        amount: totalAmtNum,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        notes: `Auto-recorded from Lab Inventory ${data.itemType || 'Item'} registration. ${data.notes || ''}`.trim(),
        branch: data.branch || 'Central Campus',
        createdBy: data.createdBy || 'Lab Assistant',
        status: 'Approved',
      });
    } catch (expErr) {
      console.warn('Could not auto-create Expense for lab inventory item:', expErr.message);
    }
  }

  return savedItem;
};

/**
 * Consume stock of a kit or reagent
 */
export const consumeStockItem = async (id, qtyToConsume = 1, usedBy = 'Lab Assistant') => {
  const item = await LabInventoryItem.findById(id);
  if (!item) {
    throw new Error('Inventory item not found');
  }
  if (item.itemType !== 'Consumable') {
    throw new Error('Only consumable kit stock can be consumed');
  }

  const newQty = Math.max(0, item.stockQuantity - qtyToConsume);
  item.stockQuantity = newQty;
  item.lastUsedAt = new Date();
  item.lastUsedBy = usedBy;

  return await item.save();
};

/**
 * Update inventory item details or machine status
 */
export const updateInventoryItem = async (id, updateData) => {
  const item = await LabInventoryItem.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!item) {
    throw new Error('Inventory item not found');
  }
  return item;
};

/**
 * Delete inventory item
 */
export const deleteInventoryItem = async (id) => {
  return await LabInventoryItem.findByIdAndDelete(id);
};

/**
 * Seed initial sample inventory items if database is empty
 */
export const seedInitialInventoryIfEmpty = async () => {
  const count = await LabInventoryItem.countDocuments();
  if (count > 0) return;

  const sampleData = [
    {
      itemType: 'Consumable',
      itemName: 'Thyroid T1 Kit (FT3 / T3)',
      category: 'Kits & Reagents',
      stockQuantity: 8, // Triggers < 10 red alert
      alertThreshold: 10,
      unit: 'Kits',
      branch: 'Central Campus',
      notes: 'Contains 50 test reagents per kit',
    },
    {
      itemType: 'Consumable',
      itemName: 'Thyroid T2 Kit (FT4 / T4)',
      category: 'Kits & Reagents',
      stockQuantity: 5, // Triggers < 10 red alert
      alertThreshold: 10,
      unit: 'Kits',
      branch: 'Central Campus',
      notes: 'Contains 50 test reagents per kit',
    },
    {
      itemType: 'Consumable',
      itemName: 'TSH Immunoassay Kit',
      category: 'Kits & Reagents',
      stockQuantity: 24,
      alertThreshold: 10,
      unit: 'Kits',
      branch: 'Central Campus',
    },
    {
      itemType: 'Consumable',
      itemName: 'CBC Automated Hematology Reagent Pack',
      category: 'Reagents & Solvents',
      stockQuantity: 15,
      alertThreshold: 10,
      unit: 'Packs',
      branch: 'Central Campus',
    },
    {
      itemType: 'Consumable',
      itemName: 'Blood Glucose Test Strips (50s)',
      category: 'Strips & Vials',
      stockQuantity: 6, // Red alert
      alertThreshold: 10,
      unit: 'Boxes',
      branch: 'Central Campus',
    },
    {
      itemType: 'Consumable',
      itemName: 'EDTA Vacutainer Blood Collection Tubes',
      category: 'Strips & Vials',
      stockQuantity: 120,
      alertThreshold: 20,
      unit: 'Vials',
      branch: 'Central Campus',
    },
    {
      itemType: 'Machine',
      itemName: 'Fully Automated Immunoassay Analyzer (Thyroid Specialist)',
      category: 'Analyzer Machine',
      modelSerialNo: 'IMMUNO-X500 / SN-99823',
      manufacturer: 'Roche Diagnostics',
      machineStatus: 'Active',
      lastMaintenanceDate: '2026-08-15',
      nextMaintenanceDate: '2026-11-15',
      branch: 'Central Campus',
    },
    {
      itemType: 'Machine',
      itemName: '5-Part Hematology Analyzer',
      category: 'Analyzer Machine',
      modelSerialNo: 'HEMA-5P / SN-44120',
      manufacturer: 'Sysmex Corporation',
      machineStatus: 'Active',
      lastMaintenanceDate: '2026-07-01',
      nextMaintenanceDate: '2026-10-01',
      branch: 'Central Campus',
    },
    {
      itemType: 'Machine',
      itemName: 'High-Speed Refrigerated Micro-Centrifuge',
      category: 'Centrifuge & Microscope',
      modelSerialNo: 'CENTRO-200 / SN-11045',
      manufacturer: 'Eppendorf',
      machineStatus: 'Calibration Due',
      lastMaintenanceDate: '2026-03-10',
      nextMaintenanceDate: '2026-09-30',
      branch: 'Central Campus',
    },
    {
      itemType: 'Machine',
      itemName: 'Binocular Clinical Microscope CX23',
      category: 'Centrifuge & Microscope',
      modelSerialNo: 'OLY-CX23 / SN-77219',
      manufacturer: 'Olympus',
      machineStatus: 'Active',
      lastMaintenanceDate: '2026-06-12',
      nextMaintenanceDate: '2026-12-12',
      branch: 'Central Campus',
    },
    {
      itemType: 'Machine',
      itemName: 'Microplate ELISA Reader & Washer',
      category: 'Analyzer Machine',
      modelSerialNo: 'ELISA-READ-96 / SN-33902',
      manufacturer: 'Bio-Rad',
      machineStatus: 'Under Maintenance',
      lastMaintenanceDate: '2026-09-10',
      nextMaintenanceDate: '2026-10-10',
      branch: 'Central Campus',
    },
  ];

  await LabInventoryItem.insertMany(sampleData);
};
