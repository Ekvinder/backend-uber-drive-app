const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { createPayment, getUser_Payments, listPayment, addPayment, deletePayment } = require('../controllers/paymentsController');
const router = express.Router();


router.post('/', authenticate, createPayment);
router.get('/', authenticate, getUser_Payments);
router.get('/methods', authenticate, listPayment);
router.post('/methods', authenticate,addPayment);
router.delete('/methods/:id', authenticate,deletePayment);


module.exports = router;