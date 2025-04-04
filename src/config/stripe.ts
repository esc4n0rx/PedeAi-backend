// src/config/stripe.ts
import Stripe from 'stripe'
import dotenv from 'dotenv'

dotenv.config()

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-03-31.basil',
})
