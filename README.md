# Music Tutorship - Course Payment & Registration Portal

Official course fee payment and student enrollment portal for **Music Tutorship** (`payments.musictutorship.in`).

## Features

- **Course Selection & Checkout**: Instant program selection with transparent fee breakdown.
- **PayU Payment Gateway**: Secure live integration with PayU using SHA-512 cryptographic verification.
- **Student KYC Registration**: Mandatory 9-field student verification post-payment (Full Name, DOB, Address, Aadhaar, Gender, Email, Phone, PAN, Occupation).
- **Official Admission Receipt**: Printable receipt generation with Order ID and WhatsApp batch onboarding link.
- **Student Lookup**: Self-service receipt lookup by Transaction / Order ID.
- **Neon Cloud PostgreSQL**: Serverless database for persisting payment records and student KYC data.

## Environment Variables

Copy `.env.example` to `.env.local` or set these in your hosting provider dashboard:

```env
# Application URL
NEXT_PUBLIC_APP_URL=https://payments.musictutorship.in

# PayU Credentials
PAYU_MERCHANT_KEY=your_merchant_key
PAYU_MERCHANT_SALT=your_merchant_salt
PAYU_MERCHANT_MID=your_merchant_mid
PAYU_ENV=production
PAYU_IS_LIVE=true
PAYU_PAYMENT_URL=https://secure.payu.in/_payment

# Neon Cloud PostgreSQL
DATABASE_URL=postgresql://user:password@ep-host.region.aws.neon.tech/neondb?sslmode=require
NEON_PROJECT_ID=your_neon_project_id
NEON_BRANCH=production
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

