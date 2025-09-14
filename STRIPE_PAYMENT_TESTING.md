# 🔒 Stripe Payment Testing Guide

This guide will help you test the Stripe payment integration using the `client_secret` returned from your bid acceptance API.

## 📋 Prerequisites

1. **Stripe Account**: You need a Stripe account with test mode enabled
2. **Publishable Key**: Get your Stripe publishable key from the Stripe Dashboard
3. **API Response**: The `client_secret` from your bid acceptance endpoint

## 🚀 Quick Start

### Step 1: Get Your Stripe Publishable Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Make sure you're in **Test mode** (toggle in the top-left)
3. Go to **Developers** → **API keys**
4. Copy your **Publishable key** (starts with `pk_test_`)

### Step 2: Update the HTML File

1. Open `stripe-payment-test.html`
2. Find this line (around line 120):
   ```javascript
   const stripe = Stripe('pk_test_51234567890abcdef'); // You need to replace this
   ```
3. Replace `pk_test_51234567890abcdef` with your actual publishable key

### Step 3: Test the Payment

1. Open `stripe-payment-test.html` in your web browser
2. The `client_secret` field should be pre-filled with the value from your API response:
   ```
   pi_3S71w0Lje7aworqD0ld0dyNO_secret_kQc5lbCZAO42culgaEwLTwyEd
   ```
3. Use one of the test card numbers provided on the page
4. Click "Confirm Payment"

## 🧪 Test Card Numbers

| Scenario | Card Number | Expected Result |
|----------|-------------|----------------|
| **Success** | `4242 4242 4242 4242` | Payment succeeds |
| **Declined** | `4000 0000 0000 0002` | Card declined |
| **Insufficient Funds** | `4000 0000 0000 9995` | Insufficient funds |
| **3D Secure** | `4000 0000 0000 3220` | Requires authentication |

**For all test cards:**
- Use any future expiry date (e.g., `12/25`)
- Use any 3-digit CVC (e.g., `123`)
- Use any postal code (e.g., `12345`)

## 🔄 Testing Your API Endpoint

### 1. Make the API Call

First, call your bid acceptance endpoint to get the `client_secret`:

```bash
# Example using curl
curl -X PATCH "http://localhost:3000/api/v1/bids/68c5ecd5f8658a4d5ae0012d/accept" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Extract the Client Secret

From the API response, copy the `client_secret` value:

```json
{
  "success": true,
  "message": "Bid accepted successfully",
  "data": {
    "payment": {
      "client_secret": "pi_3S71w0Lje7aworqD0ld0dyNO_secret_kQc5lbCZAO42culgaEwLTwyEd"
    }
  }
}
```

### 3. Test the Payment

1. Paste the `client_secret` into the HTML form
2. Use a test card number
3. Complete the payment

## 📊 Understanding the Results

### Successful Payment
- ✅ Green success message appears
- Payment Intent status becomes `succeeded`
- You can verify in Stripe Dashboard → Payments

### Failed Payment
- ❌ Red error message appears
- Shows specific error reason (declined, insufficient funds, etc.)
- Payment Intent remains in `requires_payment_method` status

## 🔍 Debugging Tips

### Common Issues

1. **"No such payment_intent" error**
   - The `client_secret` is invalid or expired
   - Make sure you're using the correct secret from the API response

2. **"Invalid publishable key" error**
   - Check that you're using the correct publishable key
   - Ensure you're in test mode

3. **CORS errors**
   - Open the HTML file directly in browser (file:// protocol)
   - Or serve it from a local web server

### Browser Developer Tools

1. Open Developer Tools (F12)
2. Check the **Console** tab for JavaScript errors
3. Check the **Network** tab to see Stripe API calls

## 🌐 Serving the HTML File

If you encounter CORS issues, serve the HTML file using a local server:

### Option 1: Python
```bash
# Python 3
python -m http.server 8000

# Then open: http://localhost:8000/stripe-payment-test.html
```

### Option 2: Node.js (if you have it)
```bash
npx serve .

# Then open the URL provided
```

### Option 3: Live Server (VS Code Extension)
1. Install "Live Server" extension in VS Code
2. Right-click on `stripe-payment-test.html`
3. Select "Open with Live Server"

## 🔐 Security Notes

- ⚠️ **Never use real card numbers in test mode**
- ⚠️ **Never commit your secret keys to version control**
- ⚠️ **Always use HTTPS in production**
- ✅ **The publishable key is safe to use in frontend code**
- ✅ **Client secrets are single-use and expire automatically**

## 📱 Testing Different Scenarios

### Test Flow 1: Successful Payment
1. Use card `4242 4242 4242 4242`
2. Enter any future date and CVC
3. Payment should succeed immediately

### Test Flow 2: Declined Payment
1. Use card `4000 0000 0000 0002`
2. Payment should be declined
3. Try again with a different card

### Test Flow 3: 3D Secure Authentication
1. Use card `4000 0000 0000 3220`
2. A popup will appear for authentication
3. Click "Complete authentication" to succeed

## 🎯 Next Steps

After successful testing:

1. **Integrate into your frontend application**
2. **Add proper error handling**
3. **Style the payment form to match your app**
4. **Add loading states and user feedback**
5. **Test with different browsers and devices**
6. **Set up webhooks for payment status updates**

## 📞 Support

If you encounter issues:

1. Check the [Stripe Documentation](https://stripe.com/docs/payments/accept-a-payment)
2. Review the [Stripe Testing Guide](https://stripe.com/docs/testing)
3. Use Stripe's [Payment Element](https://stripe.com/docs/payments/payment-element) for production

---

**Happy Testing! 🚀**