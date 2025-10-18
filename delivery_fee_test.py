#!/usr/bin/env python3
"""
Backend API Tests for Rs 11 Flat Delivery Fee Implementation
Tests the delivery fee functionality as requested in the review
"""

import requests
import json
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "http://localhost:8001/api"

class DeliveryFeeAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.customer_token = None
        self.vendor_token = None
        self.restaurant_id = None
        self.menu_item_id = None
        self.test_results = {}
        
    def log(self, message):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")
        
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            self.log(f"❌ Request failed: {e}")
            self.log(f"URL: {url}")
            return None
            
    def setup_test_environment(self):
        """Setup test users and data"""
        self.log("🔧 Setting up test environment...")
        
        # Create/login customer with sufficient wallet balance
        customer_data = {
            "email": "delivery_test_customer@localtokri.com",
            "password": "customer123",
            "name": "Delivery Test Customer",
            "role": "customer",
            "phone": "+919876543210"
        }
        
        # Try register first
        response = self.make_request('POST', '/auth/register', customer_data)
        if response and response.status_code == 200:
            data = response.json()
            self.customer_token = data.get('token')
            self.log("✅ Customer registered successfully")
        else:
            # Try login if already exists
            login_data = {
                "email": customer_data["email"],
                "password": customer_data["password"]
            }
            response = self.make_request('POST', '/auth/login', login_data)
            if response and response.status_code == 200:
                data = response.json()
                self.customer_token = data.get('token')
                self.log("✅ Customer logged in successfully")
            else:
                self.log("❌ Failed to authenticate customer")
                return False
        
        # Update customer location to Mumbai coordinates
        location_data = {
            "address": "123 Test Street, Mumbai, India",
            "latitude": 19.076,
            "longitude": 72.8777
        }
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        response = self.make_request('PATCH', '/auth/update-location', location_data, headers)
        if response and response.status_code == 200:
            self.log("✅ Customer location updated to Mumbai")
        
        # Create/login vendor
        vendor_data = {
            "email": "delivery_test_vendor@localtokri.com",
            "password": "vendor123",
            "name": "Delivery Test Vendor",
            "role": "vendor",
            "phone": "+919876543211"
        }
        
        response = self.make_request('POST', '/auth/register', vendor_data)
        if response and response.status_code == 200:
            data = response.json()
            self.vendor_token = data.get('token')
            self.log("✅ Vendor registered successfully")
        else:
            login_data = {
                "email": vendor_data["email"],
                "password": vendor_data["password"]
            }
            response = self.make_request('POST', '/auth/login', login_data)
            if response and response.status_code == 200:
                data = response.json()
                self.vendor_token = data.get('token')
                self.log("✅ Vendor logged in successfully")
            else:
                self.log("❌ Failed to authenticate vendor")
                return False
        
        # Get vendor's restaurant
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        response = self.make_request('GET', '/vendor/restaurant', headers=headers)
        if response and response.status_code == 200:
            restaurant = response.json()
            self.restaurant_id = restaurant['id']
            self.log(f"✅ Got vendor restaurant ID: {self.restaurant_id}")
        else:
            self.log("❌ Failed to get vendor restaurant")
            return False
        
        # Create a test menu item
        menu_item_data = {
            "name": "Test Delivery Item",
            "description": "Item for testing delivery fee",
            "price": 100.0,  # Rs 100 for easy calculation
            "category": "Test Category"
        }
        
        response = self.make_request('POST', f'/restaurants/{self.restaurant_id}/menu', menu_item_data, headers)
        if response and response.status_code == 200:
            menu_item = response.json()
            self.menu_item_id = menu_item['id']
            self.log(f"✅ Created test menu item: {self.menu_item_id}")
        else:
            # Try to get existing menu items
            response = self.make_request('GET', f'/restaurants/{self.restaurant_id}/menu', headers=headers)
            if response and response.status_code == 200:
                menu_items = response.json()
                if menu_items:
                    self.menu_item_id = menu_items[0]['id']
                    self.log(f"✅ Using existing menu item: {self.menu_item_id}")
                else:
                    self.log("❌ No menu items available")
                    return False
            else:
                self.log("❌ Failed to get menu items")
                return False
        
        return True
    
    def add_wallet_money(self, amount):
        """Add money to customer wallet"""
        self.log(f"💰 Adding ₹{amount} to customer wallet...")
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        wallet_data = {"amount": amount}
        
        response = self.make_request('POST', '/wallet/add-money', wallet_data, headers)
        if response and response.status_code == 200:
            data = response.json()
            self.log(f"✅ Added ₹{amount} to wallet. New balance: ₹{data.get('new_balance', 'unknown')}")
            return True
        else:
            self.log(f"❌ Failed to add money to wallet: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
    
    def get_wallet_balance(self):
        """Get current wallet balance"""
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        response = self.make_request('GET', '/wallet/balance', headers=headers)
        if response and response.status_code == 200:
            data = response.json()
            return data.get('balance', 0)
        return 0
    
    def test_order_with_delivery_fee(self, item_total, expected_total):
        """Test order creation with delivery fee calculation"""
        self.log(f"\n🧪 Testing order with items totaling ₹{item_total} (expected total: ₹{expected_total})...")
        
        # Ensure sufficient wallet balance
        current_balance = self.get_wallet_balance()
        if current_balance < expected_total:
            needed = expected_total - current_balance + 50  # Add buffer
            if not self.add_wallet_money(needed):
                return False
        
        # Create order
        quantity = max(1, int(item_total / 100))  # At least 1 item
        actual_item_total = quantity * 100.0
        
        order_data = {
            "restaurant_id": self.restaurant_id,
            "items": [{
                "menu_item_id": self.menu_item_id,
                "name": "Test Delivery Item",
                "quantity": quantity,
                "price": 100.0
            }],
            "delivery_address": "123 Test Street, Mumbai, India",
            "delivery_latitude": 19.076,
            "delivery_longitude": 72.8777,
            "special_instructions": f"Test order for ₹{item_total} items"
        }
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        response = self.make_request('POST', '/orders', order_data, headers)
        
        if not response:
            self.log("❌ No response received")
            return False
        
        if response.status_code != 200:
            self.log(f"❌ Order creation failed: {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
        
        order = response.json()
        
        # Verify delivery fee is Rs 11
        delivery_fee = order.get('delivery_fee', 0)
        if delivery_fee != 11.0:
            self.log(f"❌ Incorrect delivery fee. Expected: 11.0, Got: {delivery_fee}")
            return False
        
        # Verify total amount includes delivery fee
        total_amount = order.get('total_amount', 0)
        if total_amount != expected_total:
            self.log(f"❌ Incorrect total amount. Expected: {expected_total}, Got: {total_amount}")
            return False
        
        self.log(f"✅ Order created successfully:")
        self.log(f"   - Items total: ₹{item_total}")
        self.log(f"   - Delivery fee: ₹{delivery_fee}")
        self.log(f"   - Total amount: ₹{total_amount}")
        
        return True
    
    def test_insufficient_balance_error(self):
        """Test error message when wallet balance is insufficient"""
        self.log(f"\n🧪 Testing insufficient balance error message...")
        
        # Get current balance and create order that exceeds it
        current_balance = self.get_wallet_balance()
        
        # Create order with high quantity to exceed balance
        order_data = {
            "restaurant_id": self.restaurant_id,
            "items": [{
                "menu_item_id": self.menu_item_id,
                "name": "Test Delivery Item",
                "quantity": 100,  # ₹10,000 worth of items
                "price": 100.0
            }],
            "delivery_address": "123 Test Street, Mumbai, India",
            "delivery_latitude": 19.076,
            "delivery_longitude": 72.8777,
            "special_instructions": "Test order for insufficient balance"
        }
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        response = self.make_request('POST', '/orders', order_data, headers)
        
        if not response:
            self.log("❌ No response received")
            return False
        
        if response.status_code != 400:
            self.log(f"❌ Expected 400 error, got: {response.status_code}")
            return False
        
        error_message = response.text
        
        # Check if error message includes delivery fee breakdown
        if "delivery" not in error_message.lower():
            self.log(f"❌ Error message doesn't mention delivery fee: {error_message}")
            return False
        
        if "₹11" not in error_message:
            self.log(f"❌ Error message doesn't show ₹11 delivery fee: {error_message}")
            return False
        
        self.log(f"✅ Correct insufficient balance error with delivery fee breakdown")
        self.log(f"   Error message: {error_message}")
        
        return True
    
    def test_wallet_transaction_includes_delivery_fee(self):
        """Test that wallet transaction description includes delivery fee"""
        self.log(f"\n🧪 Testing wallet transaction includes delivery fee...")
        
        # Ensure sufficient balance
        if not self.add_wallet_money(200):
            return False
        
        # Create order
        order_data = {
            "restaurant_id": self.restaurant_id,
            "items": [{
                "menu_item_id": self.menu_item_id,
                "name": "Test Delivery Item",
                "quantity": 1,
                "price": 100.0
            }],
            "delivery_address": "123 Test Street, Mumbai, India",
            "delivery_latitude": 19.076,
            "delivery_longitude": 72.8777,
            "special_instructions": "Test transaction description"
        }
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        response = self.make_request('POST', '/orders', order_data, headers)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to create order")
            return False
        
        # Get wallet transactions
        response = self.make_request('GET', '/wallet/transactions', headers=headers)
        if not response or response.status_code != 200:
            self.log("❌ Failed to get wallet transactions")
            return False
        
        transactions = response.json()
        
        # Find the most recent debit transaction
        debit_transaction = None
        for txn in transactions:
            if txn.get('transaction_type') == 'debit' and txn.get('amount') == 111.0:
                debit_transaction = txn
                break
        
        if not debit_transaction:
            self.log("❌ Could not find debit transaction for ₹111")
            return False
        
        description = debit_transaction.get('description', '')
        
        # Check if description mentions delivery fee
        if "delivery" not in description.lower():
            self.log(f"❌ Transaction description doesn't mention delivery: {description}")
            return False
        
        self.log(f"✅ Transaction description includes delivery fee:")
        self.log(f"   Description: {description}")
        
        return True
    
    def run_all_tests(self):
        """Run all delivery fee tests"""
        self.log("🚀 Starting Rs 11 Delivery Fee API Tests")
        self.log(f"Backend URL: {self.base_url}")
        
        # Setup
        if not self.setup_test_environment():
            self.log("❌ Setup failed")
            return False
        
        # Test cases
        test_cases = [
            # Test 1: Order with ₹100 items (should be ₹111 total)
            ("order_100_items", lambda: self.test_order_with_delivery_fee(100, 111)),
            
            # Test 2: Order with ₹50 items (should be ₹61 total)
            ("order_50_items", lambda: self.test_order_with_delivery_fee(50, 61)),
            
            # Test 3: Order with ₹200 items (should be ₹211 total)
            ("order_200_items", lambda: self.test_order_with_delivery_fee(200, 211)),
            
            # Test 4: Insufficient balance error message
            ("insufficient_balance_error", self.test_insufficient_balance_error),
            
            # Test 5: Transaction description includes delivery fee
            ("transaction_description", self.test_wallet_transaction_includes_delivery_fee),
        ]
        
        self.log("\n=== TESTING PHASE ===")
        
        passed = 0
        total = len(test_cases)
        
        for test_name, test_func in test_cases:
            try:
                result = test_func()
                self.test_results[test_name] = result
                if result:
                    passed += 1
            except Exception as e:
                self.log(f"❌ Test {test_name} failed with exception: {e}")
                self.test_results[test_name] = False
        
        # Results summary
        self.log("\n=== TEST RESULTS SUMMARY ===")
        
        for test_name, result in self.test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All delivery fee tests passed!")
            return True
        else:
            self.log("⚠️ Some delivery fee tests failed!")
            return False

if __name__ == "__main__":
    tester = DeliveryFeeAPITester()
    success = tester.run_all_tests()
    exit(0 if success else 1)