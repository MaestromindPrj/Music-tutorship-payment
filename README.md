# Music Tutorship - Course Payment & Registration Portal

Official course fee payment and student enrollment portal for **Music Tutorship** (`payments.musictutorship.in`).

## Features

- **Course Selection & Checkout**: Instant program selection with transparent fee breakdown.
- **PayU Payment Gateway**: Secure live integration with PayU using SHA-512 cryptographic verification.
- **Student KYC Registration**: Mandatory 9-field student verification post-payment (Full Name, DOB, Address, Aadhaar, Gender, Email, Phone, PAN, Occupation).
- **Official Admission Receipt**: Printable receipt generation with Order ID and WhatsApp batch onboarding link.
- **Student Lookup**: Self-service receipt lookup by Transaction / Order ID.
- **Neon PostgreSQL Database**: Direct cloud PostgreSQL database persistence for payments, registrations, consultation credits, and user management.

## Environment Variables

Copy `.env.example` to `.env.local` or set these in your Vercel dashboard:

```env
# Neon PostgreSQL Connection
DATABASE_URL=postgresql://username:password@ep-example-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# Application URL
NEXT_PUBLIC_APP_URL=https://payments.musictutorship.in

# PayU Credentials
PAYU_MERCHANT_KEY=your_merchant_key
PAYU_MERCHANT_SALT=your_merchant_salt
PAYU_MERCHANT_MID=your_merchant_mid
PAYU_ENV=production
PAYU_IS_LIVE=true
PAYU_PAYMENT_URL=https://secure.payu.in/_payment

# Admin Authentication
ADMIN_EMAIL=admin@musictutorship.in
ADMIN_PASSWORD=your_admin_password
ADMIN_SECRET=your_admin_jwt_secret
```

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```
