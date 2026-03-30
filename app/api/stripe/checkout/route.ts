import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 既存のStripe顧客IDを取得
  const { data: userData } = await supabase
    .from('users')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single()

  let customerId = userData?.stripe_customer_id

  // 顧客IDがなければStripeに新規作成
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userData?.email ?? user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?upgraded=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
    locale: 'ja',
  })

  return NextResponse.json({ url: session.url })
}
