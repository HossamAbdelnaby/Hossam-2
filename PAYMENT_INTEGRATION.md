# Payment Gateway Integration

This document describes the payment gateway integration implemented for the Clash of Clans Tournament Platform.

## Overview

The payment system supports multiple payment methods and provides a complete payment processing workflow including:
- Payment creation and processing
- Payment confirmation and status tracking
- Payment history and management
- Notifications and reminders
- Support for multiple payment providers

## Supported Payment Methods

### 1. PayPal
- **Integration**: Simulated PayPal API integration
- **Flow**: User creates payment → Redirect to PayPal confirmation → Payment processed
- **Features**: Automatic confirmation, webhook support

### 2. Credit Cards (Stripe)
- **Integration**: Simulated Stripe API integration
- **Flow**: User creates payment → Redirect to Stripe confirmation → Payment processed
- **Features**: Secure payment processing, automatic confirmation

### 3. Binance (Cryptocurrency)
- **Integration**: Manual cryptocurrency payment
- **Flow**: User creates payment → Gets wallet address → Sends crypto → Manual confirmation
- **Features**: USDT support, BSC network, manual verification

### 4. Western Union
- **Integration**: Manual money transfer
- **Flow**: User creates payment → Gets receiver info → Sends money → Manual confirmation
- **Features**: Global coverage, manual verification

## Architecture

### Core Components

#### 1. Payment Service (`/src/lib/payment/payment-service.ts`)
- Main service class for payment operations
- Handles payment creation, confirmation, and status updates
- Integrates with different payment providers
- Provides unified interface for all payment methods

#### 2. Payment Notifications (`/src/lib/payment/payment-notifications.ts`)
- Handles payment-related notifications
- Sends notifications for payment events (created, completed, failed, refunded)
- Integrates with the existing notification system

#### 3. Payment Reminders (`/src/lib/payment/payment-reminders.ts`)
- Automated payment reminder system
- Sends reminders for pending payments
- Provides statistics and reporting

#### 4. API Routes
- `/api/payment/create` - Create new payment
- `/api/payment/[paymentId]` - Get payment details
- `/api/payment/paypal/confirm` - Confirm PayPal payment
- `/api/payment/stripe/confirm` - Confirm Stripe payment
- `/api/payment/binance/instructions` - Get Binance payment instructions
- `/api/payment/western-union/instructions` - Get Western Union instructions
- `/api/payment/user` - Get user's payment history

### Database Schema

The payment system uses the following database models:

#### Payment Model
```prisma
model Payment {
  id            String        @id @default(cuid())
  amount        Float
  method        PaymentMethod
  status        PaymentStatus @default(PENDING)
  transactionId String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  tournamentId  String?
  tournament    Tournament?   @relation(fields: [tournamentId], references: [id])
  contractId    String?
  contract      Contract?     @relation(fields: [contractId], references: [id])
  serviceOrderId String?
  serviceOrder  ServiceOrder? @relation(fields: [serviceOrderId], references: [id])

  @@map("payments")
}
```

#### Payment Method Enum
```prisma
enum PaymentMethod {
  PAYPAL
  WESTERN_UNION
  BINANCE
  CREDIT_CARD
}
```

#### Payment Status Enum
```prisma
enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
```

## Usage

### Creating a Payment

```typescript
const paymentRequest = {
  amount: 29.99,
  method: 'PAYPAL',
  tournamentId: 'tournament_id',
  userId: 'user_id'
}

const result = await PaymentService.createPayment(paymentRequest)

if (result.success) {
  // Redirect to payment URL
  window.location.href = result.paymentUrl
}
```

### Confirming a Payment

```typescript
const result = await PaymentService.confirmPayment(paymentId)

if (result.success) {
  // Payment confirmed successfully
  console.log('Payment completed:', result.payment)
}
```

### Getting Payment History

```typescript
const payments = await PaymentService.getUserPayments(userId)

payments.forEach(payment => {
  console.log(`${payment.method}: $${payment.amount} - ${payment.status}`)
})
```

## Frontend Integration

### Payment Creation Form

The tournament creation form has been updated to handle payments:

```typescript
// In tournament form submission
if (features.requiresPayment) {
  const paymentResponse = await fetch('/api/payment/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: packagePrices[packageType],
      method: formData.paymentMethod,
      tournamentId: data.tournament.id,
    }),
  })

  const paymentData = await paymentResponse.json()
  
  if (paymentData.paymentUrl) {
    window.location.href = paymentData.paymentUrl
  }
}
```

### Payment Page

The payment page (`/payment`) handles payment completion:

- Displays payment details and instructions
- Provides payment confirmation interface
- Shows payment status and history
- Handles different payment methods appropriately

### Payment History

The payments page (`/payments`) provides:
- Overview of all user payments
- Payment statistics and summaries
- Detailed transaction history
- Links to complete pending payments

## Security Considerations

1. **Authentication**: All payment operations require valid authentication
2. **Authorization**: Users can only access their own payments
3. **Validation**: All payment data is validated before processing
4. **HTTPS**: All payment operations should use HTTPS in production
5. **Environment Variables**: Sensitive data stored in environment variables

## Environment Variables

Add these to your `.env` file:

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENVIRONMENT=sandbox

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Binance Configuration
BINANCE_WALLET_ADDRESS=your_binance_wallet_address
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret

# JWT Secret
JWT_SECRET=your_jwt_secret
```

## Testing

### Testing Payment Flow

1. **Create Tournament**: Create a tournament with a paid package
2. **Select Payment Method**: Choose PayPal, Credit Card, Binance, or Western Union
3. **Complete Payment**: Follow the payment instructions
4. **Verify Payment**: Check payment status and history

### Testing Notifications

1. **Create Payment**: Verify payment creation notification
2. **Complete Payment**: Verify payment completion notification
3. **Fail Payment**: Verify payment failure notification

### Testing Reminders

1. **Create Pending Payment**: Create a payment that remains pending
2. **Wait for Reminder**: System should send reminder after 1 hour
3. **Verify Reminder**: Check notification system for reminder

## Production Deployment

### Prerequisites

1. **Payment Provider Accounts**: Set up accounts with PayPal, Stripe
2. **SSL Certificate**: Install SSL certificate for HTTPS
3. **Environment Configuration**: Set up all environment variables
4. **Database Migration**: Run database migrations

### Deployment Steps

1. **Install Dependencies**: `npm install`
2. **Build Application**: `npm run build`
3. **Set Environment Variables**: Configure all required environment variables
4. **Start Application**: `npm start`

### Monitoring

1. **Payment Transactions**: Monitor payment success/failure rates
2. **Notification Delivery**: Ensure notifications are being delivered
3. **System Performance**: Monitor API response times
4. **Error Logs**: Monitor for payment-related errors

## Future Enhancements

1. **Real Payment Integration**: Replace simulated payment processing with real API calls
2. **Webhook Handlers**: Implement proper webhook handlers for instant payment confirmation
3. **Refund Processing**: Add support for payment refunds
4. **Subscription Management**: Add support for recurring payments
5. **Multi-currency Support**: Add support for multiple currencies
6. **Payment Analytics**: Add detailed payment analytics and reporting

## Troubleshooting

### Common Issues

1. **Payment Creation Fails**: Check authentication and required fields
2. **Payment Confirmation Fails**: Verify payment ID and transaction details
3. **Notifications Not Sent**: Check notification system configuration
4. **Payment History Not Loading**: Verify database connection and user authentication

### Debug Mode

Enable debug mode by setting:

```env
DEBUG=payment:*
```

This will provide detailed logging for all payment operations.