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

export const seedInitialInventoryIfEmpty = async () => {
  // Mock data seeding removed - only show database items
  return;
};

