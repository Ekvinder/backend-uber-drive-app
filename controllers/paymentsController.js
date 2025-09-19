const supabase = require('../config/supabase');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const {getOrCreateCustomer} = require("../utils/stripeHelpers")
// Create a payment for a ride
exports.createPayment = async (req, res) => {
  const { ride_id, amount } = req.body;
  const user_id = req.user.id;
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          ride_id,
          user_id,
          amount,
          status: 'pending',
        },
      ])
      .select()
      .single();
    if (error) {
      return res.status(400).json({ error: error.message });
    }
      res.status(201).json({ message: 'Payment created', payment: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get payments for logged-in user
exports.getUser_Payments = async (req, res) => {
  const user_id = req.user.id;
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user_id)
      .order('paid_at', { ascending: false });
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.json({ payments: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
// GET /payments/methods - list payment methods
exports.listPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email; 
    const customerId = await getOrCreateCustomer(userId, userEmail);
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    res.json({ methods: paymentMethods.data });
  } catch (err) {
    console.error('Error in listPayment:', err);
    res.status(500).json({ error: err.message });
  }
};

// POST /payments/methods - add payment method
exports.addPayment=  async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;
    const customerId = await getOrCreateCustomer(userId, userEmail);
   
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
   
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    res.json({ message: 'Payment method added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /payments/methods/:id - delete payment method
exports.deletePayment= async (req, res) => {
  try {
    const paymentMethodId = req.params.id;
    // Detach payment method from customer
    await stripe.paymentMethods.detach(paymentMethodId);
    res.json({ message: 'Payment method deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};