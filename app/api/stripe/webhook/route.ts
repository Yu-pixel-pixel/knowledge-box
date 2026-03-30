import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const customerId = session.customer as string

    await supabase
      .from('users')
      .update({ is_premium: true })
      .eq('stripe_customer_id', customerId)
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string

    await supabase
      .from('users')
      .update({ is_premium: false })
      .eq('stripe_customer_id', customerId)
  }

  return NextResponse.json({ received: true })
}
