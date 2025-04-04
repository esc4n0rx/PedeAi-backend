// src/config/plans.ts
export const STRIPE_PRICES = {
    vitrine: 'price_1R95iLI5nlZeb0Ylp9ghJpVN',
    prateleira: 'price_1R95jhI5nlZeb0YlyNmLoY01',
    mercado: 'price_1R95kuI5nlZeb0YlJmEFU2dK'
  } as const
  
  export type PlanoKey = keyof typeof STRIPE_PRICES
  