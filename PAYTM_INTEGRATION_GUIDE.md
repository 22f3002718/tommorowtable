Let me create a comprehensive Paytm integration guide and clarify the pricing structure:
Action: file_editor create /app/PAYTM_INTEGRATION_GUIDE.md --file-text "# 🔷 Paytm Payment Gateway Integration Guide

## ⚠️ IMPORTANT: Paytm Pricing Clarification

### **MYTH vs REALITY**

❌ **MYTH:** Paytm charges 0% commission for transactions under ₹2000

✅ **REALITY:** Paytm charges fees on ALL transactions:

| Transaction Type | Fee Structure |
|-----------------|---------------|
| **UPI** | 0% (Government mandate - all UPI free till 2025) |
| **Debit Card** | 0.4% - 0.9% + ₹3 + GST |
| **Credit Card** | 1.75% - 2.5% + ₹3 + GST |
| **Wallets** | 1.99% + GST |
| **Net Banking** | Varies by bank (₹5 - ₹15 per transaction) |

### **Key Points:**
1. **No \"free for under ₹2000\" policy exists**
2. Only **UPI is free** (Government regulation, not Paytm's policy)
3. **Settlement time:** T+1 days (next business day)
4. **Setup fee:** ₹0 (but activation requires KYC + business verification)
5. **AMC (Annual Maintenance):** Usually ₹0 for small businesses
6. **GST:** 18% applicable on all charges

### **Comparison with Other Gateways**

| Gateway | UPI | Debit Card | Credit Card | Setup Fee |
|---------|-----|------------|-------------|-----------|
| **Paytm** | 0% | 0.4-0.9% | 1.75-2.5% | ₹0 |
| **Razorpay** | 0% | 0.4-0.9% | 2% | ₹0 |
| **PayU** | 0% | 0.9-1.2% | 2% | ₹0 |
| **Cashfree** | 0% | 0.4-0.9% | 1.75-2% | ₹0 |
| **PhonePe** | 0% | 0.5-1% | 2% | ₹0 |

### **My Recommendation for Your Grocery App:**

🎯 **Use Razorpay** - Here's why:
1. ✅ Better documentation & developer experience
2. ✅ Easier integration (simpler SDK)
3. ✅ Better dashboard & analytics
4. ✅ Superior customer support
5. ✅ Same pricing as Paytm
6. ✅ More reliable refund system
7. ✅ Better suited for startups

However, if you still want Paytm (brand recognition), I'll show you both integrations below.

---

## 📋 Prerequisites

### 1. Create Paytm Merchant Account

**Step 1:** Go to https://business.paytm.com/
**Step 2:** Click \"Sign Up\" → \"Payment Gateway\"
**Step 3:** Fill business details:
- Business name
- Website/App URL
- Business PAN
- Bank account details
- Business address
- Expected monthly volume

**Step 4:** KYC Documents Required:
- Business registration certificate
- PAN card (business/proprietor)
- Address proof
- Bank account proof
- GST certificate (if applicable)

**Step 5:** Activation Timeline:
- Document submission: Same day
- Verification: 2-5 business days
- Test credentials: Available immediately
- Live credentials: After KYC approval

### 2. Get API Credentials

After approval, you'll receive:
```
Production:
- Merchant ID (MID): MIDxxxxxxxxxxxx
- Merchant Key: xxxxxxxxxxxxxxxxxx
- Website: WEBSTAGING / PROD_WEBSITE_NAME
- Industry Type ID: Retail

Staging (Test):
- Merchant ID: Use test credentials from docs
- Merchant Key: Test key from docs
```

---

## 🔧 Backend Integration (Python/FastAPI)

### Step 1: Install Dependencies

```bash
pip install paytmchecksum requests pycryptodome
```

Update `requirements.txt`:
```txt
paytmchecksum==1.7.0
pycryptodome==3.19.0
requests==2.31.0
```

### Step 2: Configuration

Create `backend/config.py` or add to existing:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Paytm Configuration
    paytm_merchant_id: str
    paytm_merchant_key: str
    paytm_website: str = \"WEBSTAGING\"  # Change to production website name
    paytm_industry_type: str = \"Retail\"
    paytm_channel_id: str = \"WEB\"
    paytm_callback_url: str = \"http://localhost:8001/api/wallet/paytm-callback\"
    
    # Environment
    paytm_environment: str = \"staging\"  # \"staging\" or \"production\"
    
    class Config:
        env_file = \".env\"

settings = Settings()

# Paytm URLs
PAYTM_URLS = {
    \"staging\": {
        \"transaction\": \"https://securegw-stage.paytm.in/theia/api/v1/showPaymentPage\",
        \"status\": \"https://securegw-stage.paytm.in/v3/order/status\"
    },
    \"production\": {
        \"transaction\": \"https://securegw.paytm.in/theia/api/v1/showPaymentPage\",
        \"status\": \"https://securegw.paytm.in/v3/order/status\"
    }
}
```

Create `.env` file:
```bash
# Paytm Staging Credentials (for testing)
PAYTM_MERCHANT_ID=YOUR_STAGING_MID
PAYTM_MERCHANT_KEY=YOUR_STAGING_KEY
PAYTM_WEBSITE=WEBSTAGING
PAYTM_CALLBACK_URL=http://localhost:8001/api/wallet/paytm-callback
PAYTM_ENVIRONMENT=staging

# For Production (after approval)
# PAYTM_MERCHANT_ID=YOUR_PROD_MID
# PAYTM_MERCHANT_KEY=YOUR_PROD_KEY
# PAYTM_WEBSITE=YOUR_WEBSITE_NAME
# PAYTM_ENVIRONMENT=production
```

### Step 3: Create Paytm Utility Functions

Create `backend/paytm_utils.py`:

```python
import PaytmChecksum
import requests
import uuid
from datetime import datetime
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class PaytmPayment:
    def __init__(self, config):
        self.merchant_id = config.paytm_merchant_id
        self.merchant_key = config.paytm_merchant_key
        self.website = config.paytm_website
        self.industry_type = config.paytm_industry_type
        self.channel_id = config.paytm_channel_id
        self.callback_url = config.paytm_callback_url
        self.environment = config.paytm_environment
        
    def get_transaction_url(self):
        \"\"\"Get Paytm transaction URL based on environment\"\"\"
        from config import PAYTM_URLS
        return PAYTM_URLS[self.environment][\"transaction\"]
    
    def get_status_url(self):
        \"\"\"Get Paytm status check URL based on environment\"\"\"
        from config import PAYTM_URLS
        return PAYTM_URLS[self.environment][\"status\"]
    
    def generate_order_id(self, user_id: str) -> str:
        \"\"\"Generate unique order ID\"\"\"
        timestamp = datetime.now().strftime(\"%Y%m%d%H%M%S\")
        return f\"WALLET_{user_id}_{timestamp}_{uuid.uuid4().hex[:8]}\"
    
    def initiate_transaction(
        self,
        order_id: str,
        customer_id: str,
        amount: float,
        mobile: str,
        email: str
    ) -> Dict:
        \"\"\"
        Initiate Paytm payment transaction
        
        Returns:
            dict: Contains txn_token and order_id for frontend
        \"\"\"
        try:
            # Prepare parameters
            paytm_params = {
                \"body\": {
                    \"requestType\": \"Payment\",
                    \"mid\": self.merchant_id,
                    \"websiteName\": self.website,
                    \"orderId\": order_id,
                    \"callbackUrl\": self.callback_url,
                    \"txnAmount\": {
                        \"value\": str(amount),
                        \"currency\": \"INR\",
                    },
                    \"userInfo\": {
                        \"custId\": customer_id,
                        \"mobile\": mobile,
                        \"email\": email,
                    },
                }
            }
            
            # Generate checksum
            checksum = PaytmChecksum.generateSignature(
                str(paytm_params[\"body\"]),
                self.merchant_key
            )
            
            paytm_params[\"head\"] = {
                \"signature\": checksum
            }
            
            # Make API call to Paytm
            url = f\"{self.get_transaction_url()}?mid={self.merchant_id}&orderId={order_id}\"
            
            response = requests.post(
                url,
                json=paytm_params,
                headers={\"Content-Type\": \"application/json\"}
            )
            
            response_data = response.json()
            
            if response_data.get(\"body\", {}).get(\"resultInfo\", {}).get(\"resultStatus\") == \"S\":
                return {
                    \"success\": True,
                    \"txn_token\": response_data[\"body\"][\"txnToken\"],
                    \"order_id\": order_id,
                    \"amount\": amount
                }
            else:
                error_msg = response_data.get(\"body\", {}).get(\"resultInfo\", {}).get(\"resultMsg\", \"Unknown error\")
                logger.error(f\"Paytm transaction initiation failed: {error_msg}\")
                return {
                    \"success\": False,
                    \"error\": error_msg
                }
                
        except Exception as e:
            logger.error(f\"Paytm initiate_transaction error: {str(e)}\", exc_info=True)
            return {
                \"success\": False,
                \"error\": str(e)
            }
    
    def verify_checksum(self, post_data: Dict, checksum: str) -> bool:
        \"\"\"
        Verify Paytm checksum for callback
        \"\"\"
        try:
            return PaytmChecksum.verifySignature(post_data, self.merchant_key, checksum)
        except Exception as e:
            logger.error(f\"Checksum verification error: {str(e)}\")
            return False
    
    def check_transaction_status(self, order_id: str) -> Dict:
        \"\"\"
        Check transaction status from Paytm
        \"\"\"
        try:
            # Prepare parameters
            paytm_params = {
                \"body\": {
                    \"mid\": self.merchant_id,
                    \"orderId\": order_id,
                }
            }
            
            # Generate checksum
            checksum = PaytmChecksum.generateSignature(
                str(paytm_params[\"body\"]),
                self.merchant_key
            )
            
            paytm_params[\"head\"] = {
                \"signature\": checksum
            }
            
            # Make API call
            url = self.get_status_url()
            response = requests.post(
                url,
                json=paytm_params,
                headers={\"Content-Type\": \"application/json\"}
            )
            
            return response.json()
            
        except Exception as e:
            logger.error(f\"Status check error: {str(e)}\")
            return {\"error\": str(e)}

# Initialize global instance
from config import settings
paytm_payment = PaytmPayment(settings)
```

### Step 4: Update Backend API Endpoints

Update `backend/server.py`:

```python
from paytm_utils import paytm_payment
from fastapi import Form
from fastapi.responses import HTMLResponse

# Model for wallet add money request
class PaytmAddMoneyRequest(BaseModel):
    amount: float

@api_router.post(\"/wallet/initiate-payment\")
async def initiate_paytm_payment(
    request: PaytmAddMoneyRequest,
    current_user: dict = Depends(get_current_user)
):
    \"\"\"
    Step 1: Initiate Paytm payment
    Returns txn_token for frontend to show payment page
    \"\"\"
    try:
        # Validate amount
        if request.amount < 10:
            raise HTTPException(status_code=400, detail=\"Minimum amount is ₹10\")
        if request.amount > 100000:
            raise HTTPException(status_code=400, detail=\"Maximum amount is ₹1,00,000\")
        
        # Generate order ID
        order_id = paytm_payment.generate_order_id(current_user['id'])
        
        # Get user details
        user = await db.users.find_one({\"id\": current_user['id']}, {\"_id\": 0})
        
        # Initiate transaction
        result = paytm_payment.initiate_transaction(
            order_id=order_id,
            customer_id=current_user['id'],
            amount=request.amount,
            mobile=user.get('phone', ''),
            email=user.get('email', '')
        )
        
        if not result.get('success'):
            raise HTTPException(status_code=500, detail=result.get('error', 'Payment initiation failed'))
        
        # Store pending transaction in DB
        transaction = WalletTransaction(
            user_id=current_user['id'],
            transaction_type=\"deposit\",
            amount=request.amount,
            payment_method=\"paytm\",
            paytm_order_id=order_id,
            status=\"pending\",
            description=f\"Wallet recharge via Paytm\",
            balance_before=user.get('wallet_balance', 0.0),
            balance_after=user.get('wallet_balance', 0.0)  # Will update after success
        )
        
        transaction_dict = transaction.model_dump()
        transaction_dict['created_at'] = transaction_dict['created_at'].isoformat()
        await db.wallet_transactions.insert_one(transaction_dict)
        
        return {
            \"success\": True,
            \"txn_token\": result['txn_token'],
            \"order_id\": result['order_id'],
            \"amount\": result['amount'],
            \"merchant_id\": paytm_payment.merchant_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f\"Payment initiation error: {str(e)}\", exc_info=True)
        raise HTTPException(status_code=500, detail=\"Failed to initiate payment\")

@api_router.post(\"/wallet/paytm-callback\")
async def paytm_payment_callback(
    ORDERID: str = Form(...),
    TXNID: str = Form(...),
    TXNAMOUNT: str = Form(...),
    STATUS: str = Form(...),
    RESPCODE: str = Form(...),
    RESPMSG: str = Form(...),
    CHECKSUMHASH: str = Form(...)
):
    \"\"\"
    Step 2: Paytm callback after payment
    This endpoint is called by Paytm after payment completion
    \"\"\"
    try:
        logger.info(f\"Paytm callback received for order: {ORDERID}, status: {STATUS}\")
        
        # Prepare post data for checksum verification
        post_data = {
            \"ORDERID\": ORDERID,
            \"TXNID\": TXNID,
            \"TXNAMOUNT\": TXNAMOUNT,
            \"STATUS\": STATUS,
            \"RESPCODE\": RESPCODE,
            \"RESPMSG\": RESPMSG
        }
        
        # Verify checksum
        is_valid = paytm_payment.verify_checksum(post_data, CHECKSUMHASH)
        
        if not is_valid:
            logger.error(f\"Invalid checksum for order {ORDERID}\")
            return HTMLResponse(\"\"\"
                <html>
                    <body>
                        <h2>Payment Verification Failed</h2>
                        <p>Invalid checksum. Please contact support.</p>
                        <script>
                            setTimeout(() => { window.close(); }, 3000);
                        </script>
                    </body>
                </html>
            \"\"\")
        
        # Find transaction
        transaction = await db.wallet_transactions.find_one(
            {\"paytm_order_id\": ORDERID},
            {\"_id\": 0}
        )
        
        if not transaction:
            logger.error(f\"Transaction not found for order {ORDERID}\")
            return HTMLResponse(\"<h2>Transaction not found</h2>\")
        
        # Payment successful
        if STATUS == \"TXN_SUCCESS\":
            # Update transaction
            await db.wallet_transactions.update_one(
                {\"paytm_order_id\": ORDERID},
                {\"$set\": {
                    \"status\": \"completed\",
                    \"paytm_txn_id\": TXNID,
                    \"completed_at\": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Credit wallet
            user = await db.users.find_one({\"id\": transaction['user_id']}, {\"_id\": 0})
            new_balance = user.get('wallet_balance', 0.0) + float(TXNAMOUNT)
            
            await db.users.update_one(
                {\"id\": transaction['user_id']},
                {\"$set\": {\"wallet_balance\": new_balance}}
            )
            
            # Update transaction balance
            await db.wallet_transactions.update_one(
                {\"paytm_order_id\": ORDERID},
                {\"$set\": {\"balance_after\": new_balance}}
            )
            
            logger.info(f\"Payment successful for order {ORDERID}. Amount: ₹{TXNAMOUNT}\")
            
            return HTMLResponse(f\"\"\"
                <html>
                    <head>
                        <style>
                            body {{
                                font-family: Arial, sans-serif;
                                text-align: center;
                                padding: 50px;
                                background: linear-gradient(135deg, #10B981, #059669);
                            }}
                            .success-box {{
                                background: white;
                                padding: 40px;
                                border-radius: 10px;
                                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                max-width: 500px;
                                margin: 0 auto;
                            }}
                            .checkmark {{
                                font-size: 60px;
                                color: #10B981;
                            }}
                        </style>
                    </head>
                    <body>
                        <div class=\"success-box\">
                            <div class=\"checkmark\">✓</div>
                            <h2>Payment Successful!</h2>
                            <p>₹{TXNAMOUNT} added to your wallet</p>
                            <p>Transaction ID: {TXNID}</p>
                            <p>Redirecting to app...</p>
                        </div>
                        <script>
                            setTimeout(() => {{
                                window.location.href = '/orders';  // Redirect to orders page
                            }}, 3000);
                        </script>
                    </body>
                </html>
            \"\"\")
        
        else:
            # Payment failed
            await db.wallet_transactions.update_one(
                {\"paytm_order_id\": ORDERID},
                {\"$set\": {
                    \"status\": \"failed\",
                    \"paytm_txn_id\": TXNID
                }}
            )
            
            logger.warning(f\"Payment failed for order {ORDERID}. Reason: {RESPMSG}\")
            
            return HTMLResponse(f\"\"\"
                <html>
                    <head>
                        <style>
                            body {{
                                font-family: Arial, sans-serif;
                                text-align: center;
                                padding: 50px;
                            }}
                            .error-box {{
                                background: #FEE2E2;
                                padding: 40px;
                                border-radius: 10px;
                                max-width: 500px;
                                margin: 0 auto;
                            }}
                        </style>
                    </head>
                    <body>
                        <div class=\"error-box\">
                            <h2>Payment Failed</h2>
                            <p>Reason: {RESPMSG}</p>
                            <p>Please try again</p>
                        </div>
                        <script>
                            setTimeout(() => {{
                                window.location.href = '/orders';
                            }}, 3000);
                        </script>
                    </body>
                </html>
            \"\"\")
            
    except Exception as e:
        logger.error(f\"Callback error: {str(e)}\", exc_info=True)
        return HTMLResponse(\"<h2>Error processing payment</h2>\")

@api_router.get(\"/wallet/check-status/{order_id}\")
async def check_payment_status(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    \"\"\"
    Step 3: Check payment status (optional - for reconciliation)
    \"\"\"
    try:
        result = paytm_payment.check_transaction_status(order_id)
        return result
    except Exception as e:
        logger.error(f\"Status check error: {str(e)}\")
        raise HTTPException(status_code=500, detail=\"Failed to check status\")
```

---

## 🎨 Frontend Integration (React Web)

### Update WalletScreen Component

Update `frontend/src/pages/OrdersPage.js`:

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const WalletSection = () => {
  const [walletBalance, setWalletBalance] = useState(0);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchWalletBalance = async () => {
    try {
      const response = await axios.get(`${API}/wallet/balance`);
      setWalletBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const handleAddMoney = async () => {
    if (!amount || parseFloat(amount) < 10) {
      toast.error('Minimum amount is ₹10');
      return;
    }

    if (parseFloat(amount) > 100000) {
      toast.error('Maximum amount is ₹1,00,000');
      return;
    }

    try {
      setLoading(true);

      // Step 1: Initiate payment
      const response = await axios.post(`${API}/wallet/initiate-payment`, {
        amount: parseFloat(amount)
      });

      if (response.data.success) {
        // Step 2: Show Paytm payment page
        openPaytmPopup(
          response.data.txn_token,
          response.data.order_id,
          response.data.amount,
          response.data.merchant_id
        );
      } else {
        toast.error('Failed to initiate payment');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error(error.response?.data?.detail || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const openPaytmPopup = (txnToken, orderId, amount, mid) => {
    // Create Paytm configuration
    const config = {
      root: '',
      flow: 'DEFAULT',
      data: {
        orderId: orderId,
        token: txnToken,
        tokenType: 'TXN_TOKEN',
        amount: amount,
      },
      merchant: {
        mid: mid,
        name: 'LocalTokri'
      },
      handler: {
        notifyMerchant: function (eventName, data) {
          console.log('Paytm Notification:', eventName, data);
          
          if (eventName === 'APP_CLOSED') {
            console.log('Payment cancelled by user');
            toast.info('Payment cancelled');
            setShowAddMoney(false);
            setAmount('');
          }
        },
        transactionStatus: function (data) {
          console.log('Payment Status:', data);
          
          // Refresh wallet balance
          setTimeout(() => {
            fetchWalletBalance();
            setShowAddMoney(false);
            setAmount('');
          }, 2000);
        }
      }
    };

    // Check if Paytm script is loaded
    if (window.Paytm && window.Paytm.CheckoutJS) {
      window.Paytm.CheckoutJS.init(config).then(() => {
        window.Paytm.CheckoutJS.invoke();
      }).catch((error) => {
        console.error('Paytm initialization error:', error);
        toast.error('Failed to open payment page');
      });
    } else {
      toast.error('Payment service not available');
    }
  };

  return (
    <div className=\"wallet-section\">
      {/* Add Paytm script in index.html */}
      {/* Wallet UI remains same */}
      <Button onClick={() => setShowAddMoney(true)}>Add Money</Button>
      
      {/* Add Money Dialog */}
      {showAddMoney && (
        <Dialog open={showAddMoney} onOpenChange={setShowAddMoney}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Money to Wallet</DialogTitle>
            </DialogHeader>
            <div className=\"space-y-4\">
              <Input
                type=\"number\"
                placeholder=\"Enter amount (₹10 - ₹1,00,000)\"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min=\"10\"
                max=\"100000\"
              />
              <div className=\"flex gap-2\">
                <Button variant=\"outline\" onClick={() => setAmount('100')}>₹100</Button>
                <Button variant=\"outline\" onClick={() => setAmount('500')}>₹500</Button>
                <Button variant=\"outline\" onClick={() => setAmount('1000')}>₹1000</Button>
                <Button variant=\"outline\" onClick={() => setAmount('2000')}>₹2000</Button>
              </div>
              <Button 
                className=\"w-full bg-blue-600 hover:bg-blue-700\"
                onClick={handleAddMoney}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Proceed to Pay'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
```

### Add Paytm Script to HTML

Update `frontend/public/index.html`:

```html
<!DOCTYPE html>
<html lang=\"en\">
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>LocalTokri - Fresh Groceries Delivered</title>
    
    <!-- Paytm Checkout JS - Staging -->
    <script type=\"application/javascript\" crossorigin=\"anonymous\" src=\"https://securegw-stage.paytm.in/merchantpgpui/checkoutjs/merchants/YOUR_MID.js\"></script>
    
    <!-- For Production (after approval), replace with: -->
    <!-- <script type=\"application/javascript\" crossorigin=\"anonymous\" src=\"https://securegw.paytm.in/merchantpgpui/checkoutjs/merchants/YOUR_MID.js\"></script> -->
  </head>
  <body>
    <div id=\"root\"></div>
  </body>
</html>
```

---

## 📱 React Native Integration

### Install Dependencies

```bash
cd frontend_reactnative
yarn add react-native-webview
npx pod-install  # For iOS
```

### Create Paytm Payment Component

Create `frontend_reactnative/src/components/PaytmPayment.js`:

```javascript
import React, { useRef } from 'react';
import { Modal, View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const PaytmPayment = ({ visible, txnToken, orderId, amount, mid, onClose, onSuccess, onFailure }) => {
  const webViewRef = useRef(null);

  const paytmHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
        <script type=\"application/javascript\" src=\"https://securegw-stage.paytm.in/merchantpgpui/checkoutjs/merchants/${mid}.js\"></script>
      </head>
      <body>
        <div id=\"paytm-container\"></div>
        <script>
          const config = {
            root: '',
            flow: 'DEFAULT',
            data: {
              orderId: '${orderId}',
              token: '${txnToken}',
              tokenType: 'TXN_TOKEN',
              amount: '${amount}'
            },
            merchant: {
              mid: '${mid}',
              name: 'LocalTokri'
            },
            handler: {
              notifyMerchant: function(eventName, data) {
                console.log('Event:', eventName);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  event: eventName,
                  data: data
                }));
                
                if (eventName === 'APP_CLOSED') {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    event: 'CANCELLED'
                  }));
                }
              },
              transactionStatus: function(data) {
                console.log('Transaction Status:', data);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  event: 'TRANSACTION_STATUS',
                  data: data
                }));
              }
            }
          };

          if (window.Paytm && window.Paytm.CheckoutJS) {
            window.Paytm.CheckoutJS.init(config).then(() => {
              window.Paytm.CheckoutJS.invoke();
            }).catch((error) => {
              console.error('Error:', error);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                event: 'ERROR',
                error: error.message
              }));
            });
          }
        </script>
      </body>
    </html>
  `;

  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      console.log('Message from WebView:', message);
      
      switch (message.event) {
        case 'TRANSACTION_STATUS':
          if (message.data.STATUS === 'TXN_SUCCESS') {
            onSuccess(message.data);
          } else {
            onFailure(message.data);
          }
          onClose();
          break;
          
        case 'CANCELLED':
          onClose();
          break;
          
        case 'ERROR':
          onFailure({ error: message.error });
          onClose();
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  return (
    <Modal visible={visible} animationType=\"slide\" onRequestClose={onClose}>
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ html: paytmHTML }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size=\"large\" color=\"#10B981\" />
            </View>
          )}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default PaytmPayment;
```

### Update WalletScreen (React Native)

Update `frontend_reactnative/src/screens/Customer/WalletScreen.js`:

```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import PaytmPayment from '../../components/PaytmPayment';
import { initiatePayment } from '../../services/api';

const WalletScreen = () => {
  const [amount, setAmount] = useState('');
  const [showPaytm, setShowPaytm] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  const handleAddMoney = async () => {
    if (!amount || parseFloat(amount) < 10) {
      Alert.alert('Error', 'Minimum amount is ₹10');
      return;
    }

    try {
      const response = await initiatePayment(parseFloat(amount));
      
      if (response.success) {
        setPaymentData({
          txnToken: response.txn_token,
          orderId: response.order_id,
          amount: response.amount,
          mid: response.merchant_id
        });
        setShowPaytm(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate payment');
    }
  };

  const handlePaymentSuccess = (data) => {
    Alert.alert('Success', `₹${data.TXNAMOUNT} added to wallet!`);
    setAmount('');
    // Refresh wallet balance
  };

  const handlePaymentFailure = (data) => {
    Alert.alert('Failed', data.RESPMSG || 'Payment failed');
  };

  return (
    <View>
      {/* Your wallet UI */}
      <TextInput
        value={amount}
        onChangeText={setAmount}
        keyboardType=\"numeric\"
        placeholder=\"Enter amount\"
      />
      <TouchableOpacity onPress={handleAddMoney}>
        <Text>Add Money</Text>
      </TouchableOpacity>

      {paymentData && (
        <PaytmPayment
          visible={showPaytm}
          txnToken={paymentData.txnToken}
          orderId={paymentData.orderId}
          amount={paymentData.amount}
          mid={paymentData.mid}
          onClose={() => setShowPaytm(false)}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
        />
      )}
    </View>
  );
};
```

---

## 🧪 Testing Guide

### 1. Test Credentials (Staging)

Paytm provides test credentials for staging:

```
Merchant ID: Use your staging MID
Environment: staging

Test Cards:
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: Any future date
OTP: 489871

Test Net Banking:
Bank: Any bank
User ID/Password: Any value
OTP: 489871

Test UPI:
VPA: success@paytm (for success)
VPA: failure@paytm (for failure)
```

### 2. Testing Flow

**Step 1: Test Payment Initiation**
```bash
curl -X POST http://localhost:8001/api/wallet/initiate-payment \
  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \
  -H \"Content-Type: application/json\" \
  -d '{\"amount\": 100}'
```

Expected Response:
```json
{
  \"success\": true,
  \"txn_token\": \"xxxxxxxxxxxx\",
  \"order_id\": \"WALLET_user123_20250125_abc123\",
  \"amount\": 100,
  \"merchant_id\": \"YOUR_MID\"
}
```

**Step 2: Test Payment Page**
- Open your app
- Click \"Add Money\"
- Enter amount
- Click \"Proceed to Pay\"
- Use test credentials
- Verify callback is triggered

**Step 3: Verify Wallet Credit**
```bash
curl http://localhost:8001/api/wallet/balance \
  -H \"Authorization: Bearer YOUR_JWT_TOKEN\"
```

### 3. Test Cases

```python
# tests/test_paytm.py
import pytest

@pytest.mark.asyncio
async def test_payment_initiation():
    # Test successful initiation
    response = await client.post(\"/api/wallet/initiate-payment\", 
                                  json={\"amount\": 100})
    assert response.status_code == 200
    assert \"txn_token\" in response.json()

@pytest.mark.asyncio  
async def test_payment_minimum_amount():
    # Test minimum amount validation
    response = await client.post(\"/api/wallet/initiate-payment\",
                                  json={\"amount\": 5})
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_callback_verification():
    # Test callback with valid checksum
    # ... implement callback test
    pass
```

---

## 🚀 Going Live Checklist

### 1. Before Going Live

- [ ] KYC documents submitted and approved
- [ ] Live credentials received from Paytm
- [ ] Updated environment variables with production credentials
- [ ] Changed Paytm URLs from staging to production
- [ ] Updated callback URL to production domain
- [ ] SSL certificate installed on domain
- [ ] Tested all payment methods (UPI, cards, net banking)
- [ ] Tested callback and webhook
- [ ] Implemented proper error logging
- [ ] Set up monitoring for failed transactions
- [ ] Created reconciliation process

### 2. Environment Variables for Production

```bash
# Production .env
PAYTM_MERCHANT_ID=YOUR_PROD_MID
PAYTM_MERCHANT_KEY=YOUR_PROD_KEY
PAYTM_WEBSITE=YOUR_WEBSITE_NAME  # Provided by Paytm
PAYTM_CALLBACK_URL=https://yourdomain.com/api/wallet/paytm-callback
PAYTM_ENVIRONMENT=production
```

### 3. Update HTML Script Tag

```html
<!-- Production Paytm script -->
<script type=\"application/javascript\" 
        crossorigin=\"anonymous\" 
        src=\"https://securegw.paytm.in/merchantpgpui/checkoutjs/merchants/YOUR_PROD_MID.js\">
</script>
```

---

## 📊 Transaction Reconciliation

### Daily Reconciliation Process

```python
@api_router.get(\"/admin/reconcile-payments\")
async def reconcile_payments(
    date: str,  # Format: YYYY-MM-DD
    current_user: dict = Depends(get_current_user)
):
    \"\"\"Admin endpoint to reconcile Paytm payments\"\"\"
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail=\"Admin access required\")
    
    # Get all pending transactions for the date
    start_date = datetime.strptime(date, \"%Y-%m-%d\")
    end_date = start_date + timedelta(days=1)
    
    transactions = await db.wallet_transactions.find({
        \"payment_method\": \"paytm\",
        \"status\": \"pending\",
        \"created_at\": {
            \"$gte\": start_date.isoformat(),
            \"$lt\": end_date.isoformat()
        }
    }).to_list(1000)
    
    results = []
    for txn in transactions:
        # Check status with Paytm
        status = paytm_payment.check_transaction_status(txn['paytm_order_id'])
        
        if status.get('body', {}).get('resultInfo', {}).get('resultStatus') == 'TXN_SUCCESS':
            # Update transaction and credit wallet
            # ... (similar to callback logic)
            results.append({
                \"order_id\": txn['paytm_order_id'],
                \"status\": \"reconciled\",
                \"amount\": txn['amount']
            })
        else:
            results.append({
                \"order_id\": txn['paytm_order_id'],
                \"status\": \"still_pending\"
            })
    
    return {\"reconciled\": len([r for r in results if r['status'] == 'reconciled']),
            \"details\": results}
```

---

## 🔍 Debugging & Troubleshooting

### Common Issues

**1. \"Invalid checksum\" error**
```python
# Solution: Ensure merchant key is correct
# Check if checksum is being generated properly
checksum = PaytmChecksum.generateSignature(json.dumps(params[\"body\"]), MERCHANT_KEY)
```

**2. \"Callback not received\"**
```python
# Solutions:
# 1. Check if callback URL is publicly accessible (use ngrok for local testing)
# 2. Ensure callback URL is registered in Paytm dashboard
# 3. Check firewall/security group settings
# 4. Verify HTTPS is working (Paytm requires HTTPS for production)
```

**3. \"Paytm popup not opening\"**
```javascript
// Solution: Check if script is loaded
console.log('Paytm available:', window.Paytm);

// Ensure MID in script URL matches your merchant ID
```

**4. \"Transaction showing pending even after success\"**
```python
# Solution: Implement status check API
# Call status API after 5 minutes if callback not received
# Update transaction status accordingly
```

### Logging

```python
# Add comprehensive logging
import logging

logger.info(f\"Payment initiated: Order {order_id}, Amount ₹{amount}\")
logger.error(f\"Payment failed: Order {order_id}, Error: {error_msg}\")
logger.warning(f\"Callback checksum invalid: Order {order_id}\")
```

---

## 📞 Paytm Support

**Integration Support:**
- Email: integrations@paytm.com
- Phone: 0120-4456-456
- Portal: https://dashboard.paytm.com/support

**Documentation:**
- https://developer.paytm.com/docs/
- Postman Collection: Available on developer portal

**Settlement:**
- T+1 days (next business day)
- Check settlement report in Paytm dashboard

---

## 💡 Final Recommendations

### ✅ **Stick with Razorpay Instead**

Here's why I strongly recommend **Razorpay over Paytm**:

1. **Better Developer Experience** - Cleaner API, better docs
2. **Same Pricing** - No advantage with Paytm
3. **Superior Dashboard** - Better transaction management
4. **Faster Support** - Razorpay support is more responsive
5. **Easier Integration** - Less code, fewer edge cases
6. **Better for Startups** - More startup-friendly policies

### 🔄 **Razorpay Quick Start** (Recommended Alternative)

If you want, I can provide a similar detailed guide for Razorpay integration, which will be simpler and cleaner.

---

**This guide provides complete Paytm integration. However, I strongly recommend considering Razorpay for better developer experience and support. Let me know if you want the Razorpay integration guide instead!**
"
Observation: Create successful: /app/PAYTM_INTEGRATION_GUIDE.md