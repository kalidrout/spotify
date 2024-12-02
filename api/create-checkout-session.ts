import Stripe from 'stripe'
import { supabase } from '../src/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { userId } = req.body

    // Get or create Stripe customer
    let { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    let customerId = subscription?.stripe_customer_id

    if (!customerId) {
      // Get user email from auth
      const { data: { user } } = await supabase.auth.admin.getUserById(userId)
      if (!user?.email) {
        throw new Error('User email not found')
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: userId
        }
      })
      customerId = customer.id

      // Save customer ID
      await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId
        })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PREMIUM_PRICE_ID!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.PUBLIC_URL}/premium-success`,
      cancel_url: `${process.env.PUBLIC_URL}/premium-cancel`,
      metadata: {
        userId: userId
      }
    })

    res.json({ sessionId: session.id })
  } catch (err) {
    console.error('Error creating checkout session:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
}