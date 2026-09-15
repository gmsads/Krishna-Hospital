import { Router } from 'express';
import { create, getExpenses, getExpense, getNextExpenseNo, remove } from './expense.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', protect, getExpenses);
router.get('/next-expenseno', getNextExpenseNo);
router.post('/', protect, create);
router.get('/:id', protect, getExpense);
router.delete('/:id', protect, remove);

export default router;
