export const PRICING_CONFIG = {
  IS_TEST_FLOW: true,

  ACTUAL: {
    coursePrice: 159000,
    courseOriginalPrice: 170000,
    consultationPrice: 10000,
    consultationCredit: 10000,
    courseDiscountedPrice: 149000,
    creditText: '₹10,000',
    coursePriceText: '₹1,59,000',
    courseDiscountedText: '₹1,49,000',
    callPriceText: '₹10,000',
  },

  TEST: {
    coursePrice: 2,
    courseOriginalPrice: 170000,
    consultationPrice: 1,
    consultationCredit: 1,
    courseDiscountedPrice: 1,
    creditText: '₹1',
    coursePriceText: '₹2',
    courseDiscountedText: '₹1',
    callPriceText: '₹1',
  }
} as const;

export function getPricing() {
  return PRICING_CONFIG.IS_TEST_FLOW ? PRICING_CONFIG.TEST : PRICING_CONFIG.ACTUAL;
}
