const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('../config/supabase');

async function getOrCreateCustomer(userId, userEmail) {
  // Check if user already has a Stripe customer ID saved in your DB
  const { data, error } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error) throw new Error('Failed to fetch user data');

  if (data?.stripe_customer_id) {
    return data.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: userEmail,
    metadata: { supabase_user_id: userId },
  });

  // Save customer ID back to your DB
  const { error: updateError } = await supabase
    .from('users')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  if (updateError) throw new Error('Failed to save Stripe customer ID');

  return customer.id;
}

module.exports = { getOrCreateCustomer };