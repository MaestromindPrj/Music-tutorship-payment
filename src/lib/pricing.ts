/**
 * Centralized Pricing Configuration & Test Mode Controls
 *
 * ============================================================================
 * PRODUCTION (ACTUAL) AMOUNTS BEFORE TEST MODE:
 * - Producer Transformation Path course fee: ₹1,59,000 (original: ₹1,70,000)
 * - Call Consultation session fee: ₹10,000
 * - Consultation credit deduction on course fee: ₹10,000 (course becomes ₹1,49,000)
 * - Taxes: 18% GST applies to Course fee; 0% tax on Call Consultation.
 * ============================================================================
 *
 * TEST MODE AMOUNTS (Current Active Flow for Testing):
 * - Course fee: ₹2
 * - If Call Consultation is booked first: Course fee becomes ₹1 (₹1 consultation credit applied)
 * - Call Consultation fee: ₹1
 *
 * ============================================================================
 * TO REVERT BACK TO PRODUCTION:
 * Simply set `IS_TEST_FLOW: false` below. Both course and call consultation will
 * automatically restore to their exact production amounts and calculations.
 * ============================================================================
 */

export const PRICING_CONFIG = {
  // Set to true for test flow, false for production actual pricing
  IS_TEST_FLOW: true,

  // Actual production pricing
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

  // Test flow pricing for testing checkout flow
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
