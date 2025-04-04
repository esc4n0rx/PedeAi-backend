import { Request, Response, NextFunction } from 'express'
import { stripe } from '../config/stripe'
import { STRIPE_PRICES, PlanoKey } from '../config/plans'

export const subscribe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { plano } = req.body
      const user = (req as any).user
  
      if (!plano || !STRIPE_PRICES[plano as PlanoKey]) {
        res.status(400).json({ error: 'Plano inválido' })
        return
      }
  
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        success_url: 'http://localhost:3000/sucesso',
        cancel_url: 'http://localhost:3000/cancelado',
        payment_method_types: ['card'],
        line_items: [
          {
            price: STRIPE_PRICES[plano as PlanoKey],
            quantity: 1
          }
        ],
        metadata: {
          user_id: user.id,
          plano
        },
        customer_email: user.email
      })
  
      res.json({ checkout_url: session.url })
    } catch (err) {
      next(err)
    }
  }
  