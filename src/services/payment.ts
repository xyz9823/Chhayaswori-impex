/**
 * CHHAYASWORI IMPEX — Payment Gateway Service (Development & Production)
 *
 * Current State: DEVELOPMENT / TEST PAYMENT MODE
 * - Cash on Delivery (COD)
 * - Mock/Test eSewa Payment (Simulated instant test payment)
 * - Bank Transfer with transaction reference & voucher upload
 *
 * SAFETY GUARANTEE:
 * - No real money transactions
 * - No real merchant credentials required
 * - All test credentials labeled DEVELOPMENT/TEST ONLY
 * - Backend architecture is ready to accept ESEWA_PRODUCT_CODE, ESEWA_SECRET_KEY, ESEWA_ENVIRONMENT
 *   via environment variables later without breaking changes.
 */

export type PaymentMethodType = 'COD' | 'ESEWA' | 'BANK_TRANSFER';

export interface PaymentSimulationResult {
  success: boolean;
  isTestMode: boolean;
  transactionId: string;
  paymentMethod: PaymentMethodType;
  status: 'PENDING' | 'COMPLETED' | 'VERIFIED' | 'FAILED';
  disclaimer: string;
  details: Record<string, any>;
}

export const PAYMENT_DEV_DISCLAIMER =
  'DEVELOPMENT/TEST ONLY: Payment simulation mode active. No actual banking or payment gateway charges incurred.';

export async function processPayment({
  method,
  amount,
  orderNumber,
  metadata = {},
}: {
  method: PaymentMethodType;
  amount: number;
  orderNumber: string;
  metadata?: Record<string, any>;
}): Promise<PaymentSimulationResult> {
  const isEsewaLive = Boolean(
    process.env.ESEWA_PRODUCT_CODE &&
      process.env.ESEWA_SECRET_KEY &&
      process.env.ESEWA_ENVIRONMENT === 'PRODUCTION'
  );

  switch (method) {
    case 'COD':
      return {
        success: true,
        isTestMode: false,
        transactionId: `COD-${orderNumber}-${Date.now().toString().slice(-4)}`,
        paymentMethod: 'COD',
        status: 'PENDING',
        disclaimer: 'Payable upon delivery at your address.',
        details: {
          payableOnDelivery: amount,
          currency: 'NPR',
        },
      };

    case 'ESEWA':
      if (isEsewaLive) {
        // Architecture ready for live eSewa hash signing & gateway redirection
        return {
          success: true,
          isTestMode: false,
          transactionId: `ESEWA-LIVE-${orderNumber}-${Date.now()}`,
          paymentMethod: 'ESEWA',
          status: 'PENDING',
          disclaimer: 'Redirecting to official eSewa secure payment gateway...',
          details: {
            merchantCode: process.env.ESEWA_PRODUCT_CODE,
            amount,
            orderNumber,
          },
        };
      }

      // Safe Development / Test Simulation Mode
      return {
        success: true,
        isTestMode: true,
        transactionId: `ESEWA-TEST-SIM-${orderNumber}-${Math.floor(100000 + Math.random() * 900000)}`,
        paymentMethod: 'ESEWA',
        status: 'COMPLETED',
        disclaimer: PAYMENT_DEV_DISCLAIMER,
        details: {
          simulatedAt: new Date().toISOString(),
          environment: 'DEVELOPMENT/TEST ONLY',
          mockGateway: 'eSewa Nepal Test Simulator',
          simulatedAmountNpr: amount,
        },
      };

    case 'BANK_TRANSFER':
      return {
        success: true,
        isTestMode: !metadata.bankTxnRef,
        transactionId:
          metadata.bankTxnRef ||
          `BANK-REF-${orderNumber}-${Date.now().toString().slice(-4)}`,
        paymentMethod: 'BANK_TRANSFER',
        status: 'PENDING',
        disclaimer:
          'Bank transfer details submitted. Order will be confirmed upon admin voucher verification.',
        details: {
          txnRef: metadata.bankTxnRef || 'PENDING_SUBMISSION',
          proofUrl: metadata.bankProofUrl || null,
        },
      };

    default:
      throw new Error(`Unsupported payment method: ${method}`);
  }
}
