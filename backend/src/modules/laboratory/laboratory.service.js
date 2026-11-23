import mongoose from 'mongoose';
import { Laboratory } from './laboratory.model.js';

export const generateNextLabNo = async (branch) => {
  const allOrders = await Laboratory.find({}, { labOrderNo: 1 }).lean();
  let maxNum = allOrders.length;
  allOrders.forEach((o) => {
    const match = String(o.labOrderNo || '').match(/LAB-(\d+)/i);
    if (match) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  });
  return `LAB-${String(maxNum + 1).padStart(4, '0')}`;
};

export const createLabOrder = async (orderData) => {
  const branchToUse = orderData.branch || '';
  const branchCodeToUse = orderData.branchCode || (branchToUse ? branchToUse.toUpperCase().replace(/\s+/g, '-').slice(0, 10) : '');

  // If an existing lab order already exists for this _id or OP Registration Number, update it instead of creating a duplicate
  const opNoTrimmed = (orderData.opNumber || orderData.opNo || '').trim();
  const patNameTrimmed = (orderData.patientName || orderData.patient || '').trim();
  let existingOrder = null;
  if (orderData._id && mongoose.Types.ObjectId.isValid(orderData._id)) {
    existingOrder = await Laboratory.findById(orderData._id);
  }
  if (!existingOrder && opNoTrimmed && !opNoTrimmed.toUpperCase().startsWith('LAB-')) {
    const opEscaped = opNoTrimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const candidateOrders = await Laboratory.find({
      opNumber: new RegExp(`^${opEscaped}$`, 'i'),
    }).sort({ createdAt: -1 });
    if (candidateOrders.length > 0) {
      existingOrder = candidateOrders.find(
        (c) => !patNameTrimmed || (c.patientName && c.patientName.toLowerCase() === patNameTrimmed.toLowerCase())
      ) || candidateOrders[0];
    }
  }

  let labOrderNoToUse = existingOrder?.labOrderNo || orderData.labOrderNo || orderData.id || orderData.testId;

  if (!labOrderNoToUse || labOrderNoToUse.length < 3) {
    labOrderNoToUse = await generateNextLabNo(branchToUse);
  }

    const grossVal = parseFloat(String(orderData.grossFee || orderData.testFee || orderData.amount || '1200').replace(/[^0-9.]/g, '')) || 1200;
    const discountVal = parseFloat(String(orderData.discount || '0').replace(/[^0-9.]/g, '')) || 0;
    const discountPctVal = orderData.discountPercent != null
      ? (parseFloat(String(orderData.discountPercent).replace(/[^0-9.]/g, '')) || 0)
      : (grossVal > 0 && discountVal > 0 ? Math.round(((discountVal / grossVal) * 100) * 100) / 100 : 0);
    const feeVal = Math.max(0, grossVal - discountVal);
    const paidVal = parseFloat(String(orderData.amountPaidNow || orderData.amountPaid || orderData.paidAmount || '0').replace(/[^0-9.]/g, '')) || 0;
    const dueVal = typeof orderData.dueBalance === 'number' ? orderData.dueBalance : Math.max(0, feeVal - paidVal);
    const payStat = orderData.paymentStatus || (dueVal <= 0 ? 'Paid' : paidVal > 0 ? 'Partial' : 'Pending');

    if (existingOrder) {
      const existingTests = ( existingOrder.testName || '' ).split(' + ').map((s) => s.trim()).filter(Boolean);
      const incomingTests = ( orderData.testName || orderData.test || '' ).split(' + ').map((s) => s.trim()).filter(Boolean);
      const mergedTestNames = Array.from(new Set([...existingTests, ...incomingTests]));
      const mergedTestNameStr = mergedTestNames.join(' + ') || existingOrder.testName;

      const existingTestsList = Array.isArray(existingOrder.testsList) ? existingOrder.testsList : [];
      const incomingTestsList = Array.isArray(orderData.testsList) ? orderData.testsList : [];
      const mergedTestsList = [...existingTestsList];
      incomingTestsList.forEach((it) => {
        const itName = typeof it === 'string' ? it : it?.name;
        if (itName && !mergedTestsList.some((et) => (typeof et === 'string' ? et : et?.name) === itName)) {
          mergedTestsList.push(it);
        }
      });

      const existingRows = Array.isArray(existingOrder.testRows) ? existingOrder.testRows : [];
      const incomingRows = Array.isArray(orderData.testRows) ? orderData.testRows : (orderData.results?.testRows || []);
      const mergedRows = [...existingRows];
      incomingRows.forEach((ir) => {
        const alreadyHas = mergedRows.some(
          (er) => er.name === ir.name && (er.testSource || '') === (ir.testSource || '')
        );
        if (!alreadyHas) {
          mergedRows.push(ir);
        } else if (ir.result) {
          const idx = mergedRows.findIndex((er) => er.name === ir.name && (er.testSource || '') === (ir.testSource || ''));
          if (idx !== -1) mergedRows[idx] = { ...mergedRows[idx], result: ir.result };
        }
      });

      const updated = await Laboratory.findByIdAndUpdate(
        existingOrder._id,
        {
          testName: mergedTestNameStr,
          testsList: mergedTestsList,
          grossFee: grossVal,
          discount: discountVal,
          discountPercent: discountPctVal,
          testFee: feeVal.toString(),
          amount: feeVal,
          amountPaid: paidVal.toString(),
          paidAmount: paidVal,
          dueBalance: dueVal,
          paymentStatus: payStat,
          paymentMethod: orderData.paymentMethod || existingOrder.paymentMethod || 'Cash',
          upiTxnId: orderData.upiTxnId || existingOrder.upiTxnId || '',
          status: orderData.status || existingOrder.status || 'Sample Collected',
          clinicalNotes: orderData.clinicalNotes || orderData.notes || existingOrder.clinicalNotes || '',
          notes: orderData.notes || orderData.clinicalNotes || existingOrder.notes || '',
          age: orderData.age !== undefined ? orderData.age : (existingOrder.age || ''),
          gender: orderData.gender !== undefined ? orderData.gender : (existingOrder.gender || ''),
          area: orderData.area !== undefined ? orderData.area : (existingOrder.area || ''),
          inTime: orderData.inTime !== undefined ? orderData.inTime : (existingOrder.inTime || ''),
          outTime: orderData.outTime !== undefined ? orderData.outTime : (existingOrder.outTime || ''),
          testingPersonName: orderData.testingPersonName !== undefined ? orderData.testingPersonName : (existingOrder.testingPersonName || ''),
          reportingPersonName: orderData.reportingPersonName !== undefined ? orderData.reportingPersonName : (existingOrder.reportingPersonName || ''),
          branch: branchToUse || existingOrder.branch || '',
          branchCode: branchCodeToUse || existingOrder.branchCode || '',
          result: orderData.result || orderData.results?.summaryResult || existingOrder.result || '',
          testRows: mergedRows,
          results: {
            testRows: mergedRows,
            summaryResult: orderData.result || orderData.results?.summaryResult || existingOrder.result || '',
          },
        },
        { new: true, runValidators: true }
      );
      return updated;
    }

    const newOrder = await Laboratory.create({
      labOrderNo: labOrderNoToUse,
      opNumber: orderData.opNumber || orderData.opNo || labOrderNoToUse,
      patientName: orderData.patientName ? orderData.patientName.trim() : (orderData.patient || 'Patient'),
      phone: orderData.phone || '',
      age: orderData.age || '',
      gender: orderData.gender || '',
      area: orderData.area || '',
      inTime: orderData.inTime || '',
      outTime: orderData.outTime || '',
      testingPersonName: orderData.testingPersonName || '',
      reportingPersonName: orderData.reportingPersonName || '',
      doctor: orderData.orderingDoctor || orderData.doctor || 'Self Created / Walk-In',
      testName: orderData.testName ? orderData.testName.trim() : (orderData.test || 'Blood Test'),
      testsList: Array.isArray(orderData.testsList) ? orderData.testsList : [],
      category: orderData.category || 'General Pathology',
      priority: orderData.priority || 'Routine',
      grossFee: grossVal,
      discount: discountVal,
      discountPercent: discountPctVal,
      testFee: feeVal.toString(),
      amount: feeVal,
      amountPaid: paidVal.toString(),
      paidAmount: paidVal,
      dueBalance: dueVal,
      paymentStatus: payStat,
      paymentMethod: orderData.paymentMethod || 'Cash',
      upiTxnId: orderData.upiTxnId || '',
      status: orderData.status || 'Sample Collected',
      clinicalNotes: orderData.clinicalNotes || orderData.notes || '',
      notes: orderData.notes || orderData.clinicalNotes || '',
      result: orderData.result || orderData.results?.summaryResult || orderData.results?.result || '',
      testRows: Array.isArray(orderData.testRows) ? orderData.testRows : (orderData.results?.testRows || []),
      results: orderData.results || {
        testRows: Array.isArray(orderData.testRows) ? orderData.testRows : [],
        summaryResult: orderData.result || '',
      },
      createdBy: orderData.createdBy || 'Doctor',
      assignedFrom: orderData.assignedFrom || (['Admin', 'Super Admin', 'Front Desk', 'Hospital'].includes(orderData.createdBy) ? 'Hospital' : (orderData.createdBy === 'Lab Assistant' || orderData.createdBy === 'Self') ? 'Lab' : 'Doctor'),
      isSelfCreated: orderData.isSelfCreated !== undefined ? Boolean(orderData.isSelfCreated) : (orderData.assignedFrom === 'Lab' || orderData.createdBy === 'Self'),
      branch: branchToUse,
      branchCode: branchCodeToUse,
    });

  return newOrder;
};

export const getAllLabOrders = async (branchFilter = null) => {
  const query = {};
  if (branchFilter && branchFilter !== 'All') {
    const escaped = branchFilter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    query.$or = [
      { branch: { $regex: new RegExp(escaped, 'i') } },
      { branchCode: { $regex: new RegExp(escaped, 'i') } },
    ];
  }
  return await Laboratory.find(query).sort({ createdAt: -1 });
};

export const getLabOrderById = async (id) => {
  const order = await Laboratory.findById(id);
  if (!order) {
    throw new Error('Lab order not found');
  }
  return order;
};

export const updateLabOrder = async (id, updateData) => {
  let order = null;
  const { _id, __v, ...dataToUpdate } = updateData;

  if (dataToUpdate.notes && !dataToUpdate.clinicalNotes) {
    dataToUpdate.clinicalNotes = dataToUpdate.notes;
  }
  if (dataToUpdate.clinicalNotes && !dataToUpdate.notes) {
    dataToUpdate.notes = dataToUpdate.clinicalNotes;
  }
  if (dataToUpdate.testRows && (!dataToUpdate.results || !dataToUpdate.results.testRows)) {
    dataToUpdate.results = {
      ...(dataToUpdate.results || {}),
      testRows: dataToUpdate.testRows,
      summaryResult: dataToUpdate.result || '',
    };
  }

  if (mongoose.Types.ObjectId.isValid(id)) {
    order = await Laboratory.findByIdAndUpdate(id, dataToUpdate, { new: true, runValidators: true });
  }
  if (!order) {
    order = await Laboratory.findOneAndUpdate(
      { $or: [{ labOrderNo: id }, { testId: id }, { opNumber: id }] },
      dataToUpdate,
      { new: true, runValidators: true }
    );
  }
  if (!order) {
    throw new Error('Lab order not found');
  }
  return order;
};

export const deleteLabOrder = async (id) => {
  let order = null;
  if (id && mongoose.Types.ObjectId.isValid(id)) {
    order = await Laboratory.findByIdAndDelete(id);
  }
  if (!order) {
    const escaped = (id || '').trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    order = await Laboratory.findOneAndDelete({
      $or: [
        { labOrderNo: id },
        { testId: id },
        { opNumber: id },
        { labOrderNo: new RegExp(`^${escaped}$`, 'i') },
      ],
    });
  }
  return order;
};
