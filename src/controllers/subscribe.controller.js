import { stripe } from "../config/stripe.js";
import { STRIPE_PRICES } from "../config/plans.js";

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://pedai-frontend.vercel.app';

export const subscribe = async (req, res, next) => {
  try {
    const { plano } = req.body;
    const user = req.user;

    if (!plano || !STRIPE_PRICES[plano]) {
      res.status(400).json({ error: 'Plano inválido' });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: `${FRONTEND_URL}/dashboard`,
      cancel_url: `${FRONTEND_URL}/subscribe`,
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICES[plano],
          quantity: 1
        }
      ],
      metadata: {
        user_id: user.id,
        plano
      },
      customer_email: user.email
    });

    res.json({ checkout_url: session.url });
  } catch (err) {
    next(err);
  }
};
