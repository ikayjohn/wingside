# Embedly API Integration Guide

## Overview
This guide provides a complete overview of the Embedly API integration implemented for Wingside, including digital wallet creation, customer management, and payment processing capabilities.

## ✅ Completed Features

### 1. **Embedly API Client Service** (`lib/embedly/client.ts`)
- Full TypeScript client with all Embedly endpoints
- Environment-aware (production/staging) configuration
- Comprehensive error handling and validation
- Type definitions for all API responses

### 2. **Customer Management**
- **API Endpoint**: `/api/embedly/customers`
- Automatic customer creation and detection
- Profile synchronization with Embedly customer IDs
- Duplicate customer handling

### 3. **Digital Wallet Management**
- **API Endpoint**: `/api/embedly/wallets`
- Virtual account creation with Nigerian banks
- Wallet balance synchronization
- Transaction history tracking

### 4. **Payment Processing**
- **Wallet-to-Wallet Transfers**: Instant internal transfers
- **Interbank Transfers**: Transfer to all Nigerian banks
- **Account Verification**: Real-time account name validation
- **Transaction Status Tracking**: Monitor transfer progress

### 5. **Webhook Integration**
- **Endpoint**: `/api/embedly/webhooks`
- Real-time transaction status updates
- HMAC-SHA256 signature verification
- Event handling for payouts, NIP, checkout, and wallet transfers

### 6. **User Interface**
- **Component**: `EmbedlyWalletSection`
- Complete wallet management dashboard
- Transfer modal with bank selection
- Transaction history with detailed tracking
- Seamless wallet creation flow

### 7. **Database Schema**
- Enhanced `profiles` table with Embedly integration fields
- `transfer_logs` for transaction tracking
- `wallet_transactions` for detailed history
- `checkout_transactions` for one-time payments
- `webhook_logs` for debugging
- Row-level security policies implemented

## 🔧 Configuration

### Environment Variables
Add these to your `.env.local` file:

```bash
# Embedly Configuration
EMBEDLY_API_KEY=your_production_api_key_here
EMBEDLY_ORG_ID=your_organization_id_here
EMBEDLY_WEBHOOK_SECRET=your_webhook_secret_here
EMBEDLY_BASE_URL=https://waas-prod.embedly.ng/api/v1
```

### For Staging Environment:
```bash
EMBEDLY_API_KEY=BSK-sqg0f3hCF3sC2KGtNBVsfxbOFFaiOgCEraaCYmg6G0EsqUQ9ihAbeIE2FkAvFlBtIv4kecDVsy4H
EMBEDLY_ORG_ID=02600494-1a3c-11f0-a818-6045bd97b81d
EMBEDLY_BASE_URL=https://waas-staging.embedly.ng/api/v1
```

## 🚀 Getting Started

### 1. **Customer Account Creation**
Users can create their Embedly customer account through:
- Manual creation via dashboard "Create Wallet" button
- API call to `/api/embedly/customers` (POST)
- Automatic creation during wallet setup

### 2. **Wallet Creation**
After customer account creation:
- Click "Create Wallet" in the dashboard
- System automatically generates virtual account
- Account details displayed immediately

### 3. **Making Transfers**
- **Wallet Transfers**: Use account number for internal transfers
- **Bank Transfers**: Select bank, verify account name, and transfer
- Real-time status tracking for all transfers

### 4. **Receiving Funds**
- Share virtual account number with anyone
- Funds appear in wallet balance automatically
- Transaction history updated in real-time

## 📱 Dashboard Integration

The `EmbedlyWalletSection` component is integrated into:
- **Location**: `/my-account/dashboard`
- **Features**:
  - Wallet overview with balance
  - Virtual account display with copy functionality
  - Transaction history grouped by date
  - Transfer modal for sending funds
  - Real-time balance updates

## 🔗 API Endpoints

### Customer Management
- `GET /api/embedly/customers` - Get customer details
- `POST /api/embedly/customers` - Create new customer

### Wallet Management
- `GET /api/embedly/wallets` - Get wallet details
- `POST /api/embedly/wallets` - Create new wallet
- `GET /api/embedly/wallets/history` - Get transaction history

### Transfers
- `POST /api/embedly/transfers` - Initiate transfer
- `GET /api/embedly/transfers` - Check transfer status

### Utilities
- `GET /api/embedly/utilities` - Get banks, countries, currencies
- `POST /api/embedly/utilities` - Account name verification

### Webhooks
- `POST /api/embedly/webhooks` - Handle Embedly webhooks

## 🔒 Security Features

### 1. **Authentication**
- All endpoints require user authentication
- Row-level security on database access
- Profile-based authorization

### 2. **Webhook Security**
- HMAC-SHA256 signature verification
- Configurable webhook secret
- Request validation and error handling

### 3. **Data Validation**
- Input sanitization on all endpoints
- Type checking with TypeScript
- API response validation

## 🔄 Database Migration

Run this SQL script to create Embedly tables:
```bash
psql $SUPABASE_DB_URL -f scripts/create-embedly-tables.sql
```

Or use the Supabase Dashboard to run the migration manually.

## 🧪 Testing

### Local Development
```bash
npm run dev
# Open http://localhost:3003/my-account/dashboard
```

### API Testing
```bash
# Test customer creation
curl -X POST http://localhost:3003/api/embedly/customers

# Test wallet creation
curl -X POST http://localhost:3003/api/embedly/wallets

# Test utilities
curl http://localhost:3003/api/embedly/utilities?type=banks
```

## 📊 Monitoring

### Webhook Logging
All webhooks are logged in the `webhook_logs` table for debugging:
```sql
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;
```

### Transaction Tracking
Monitor transfers in real-time:
```sql
SELECT * FROM transfer_logs ORDER BY created_at DESC;
```

### Wallet Summary
View user wallet overview:
```sql
SELECT * FROM user_wallet_summary WHERE user_id = 'user_id_here';
```

## 🚨 Error Handling

### Common Issues
1. **Invalid API Key**: Check EMBEDLY_API_KEY in environment
2. **Customer Exists**: System handles duplicates automatically
3. **Wallet Creation Failed**: Check customer account status
4. **Transfer Failed**: Verify account details and balances

### Debugging
- Check browser console for frontend errors
- Review webhook logs for API failures
- Monitor Supabase logs for database issues
- Use staging environment for testing

## 🌐 Production Deployment

### 1. **Update Environment Variables**
```bash
# Production values
EMBEDLY_API_KEY=your_production_key
EMBEDLY_ORG_ID=your_production_org_id
EMBEDLY_WEBHOOK_SECRET=your_production_secret
```

### 2. **Configure Webhook URL**
Set webhook endpoint in Embedly dashboard:
```
https://www.wingside.ng/api/embedly/webhooks
```

### 3. **Database Migration**
Ensure all tables are created in production database.

### 4. **Testing**
Test all functionality in staging before production deployment.

## 📞 Support

### Embedly Documentation
- Production API: https://waas-prod.embedly.ng/api/v1
- Staging API: https://waas-staging.embedly.ng/api/v1
- Support: Contact Embedly support team

### Common Integration Questions
1. **Customer Creation**: Automatic on first wallet creation
2. **Balance Updates**: Real-time via webhooks
3. **Transaction Limits**: Set in Embedly dashboard
4. **Bank Coverage**: All Nigerian banks supported

## 🔄 Next Steps

1. **Configure Production API Keys**: Get from Embedly dashboard
2. **Test Staging Environment**: Verify all functionality
3. **Set Up Webhooks**: Configure production webhook URL
4. **Deploy to Production**: Follow deployment checklist
5. **Monitor Integration**: Set up alerts for errors

The integration is now complete and ready for production use! 🎉