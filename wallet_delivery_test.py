#!/usr/bin/env python3
"""
Wallet System and Delivery Sequence Testing
Tests the newly implemented wallet system and delivery sequence features
"""

import requests
import json
import os
from datetime import datetime
import time

# Get backend URL from environment
BACKEND_URL = "https://delivery-tracker-66.preview.emergentagent.com/api"

class WalletDeliveryTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.customer_token = None
        self.vendor_token = None
        self.rider_token = None
        self.vendor_restaurant_id = None
        self.test_order_ids = []
        self.menu_item_id = None
        
    def log(self, message):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")
        
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=30, verify=False)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30, verify=False)
            elif method.upper() == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=30, verify=False)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            self.log(f"❌ Request failed: {e}")
            self.log(f"URL: {url}")
            return None
    
    def setup_test_users(self):
        """Setup test users for wallet and delivery testing"""
        self.log("🔐 Setting up test users...")
        
        # Create/login customer
        customer_data = {
            "email": "wallet_customer@localtokri.com",
            "password": "customer123",
            "name": "Wallet Test Customer",
            "role": "customer",
            "phone": "+919876543210"
        }
        
        # Try register first
        response = self.make_request('POST', '/auth/register', customer_data)
        if response and response.status_code == 200:
            self.customer_token = response.json().get('token')
            self.log("✅ Customer registered successfully")
        else:
            # Try login if already exists
            login_data = {"email": customer_data["email"], "password": customer_data["password"]}
            response = self.make_request('POST', '/auth/login', login_data)
            if response and response.status_code == 200:
                self.customer_token = response.json().get('token')
                self.log("✅ Customer logged in successfully")
            else:
                self.log("❌ Failed to authenticate customer")
                return False
        
        # Create/login vendor
        vendor_data = {
            "email": "wallet_vendor@localtokri.com",
            "password": "vendor123",
            "name": "Wallet Test Vendor",
            "role": "vendor",
            "phone": "+919876543211"
        }
        
        response = self.make_request('POST', '/auth/register', vendor_data)
        if response and response.status_code == 200:
            self.vendor_token = response.json().get('token')
            self.log("✅ Vendor registered successfully")
        else:
            login_data = {"email": vendor_data["email"], "password": vendor_data["password"]}
            response = self.make_request('POST', '/auth/login', login_data)
            if response and response.status_code == 200:
                self.vendor_token = response.json().get('token')
                self.log("✅ Vendor logged in successfully")
            else:
                self.log("❌ Failed to authenticate vendor")
                return False
        
        # Create/login rider
        rider_data = {
            "email": "wallet_rider@localtokri.com",
            "password": "rider123",
            "name": "Wallet Test Rider",
            "role": "rider",
            "phone": "+919876543212"
        }
        
        response = self.make_request('POST', '/auth/register', rider_data)
        if response and response.status_code == 200:
            self.rider_token = response.json().get('token')
            self.log("✅ Rider registered successfully")
        else:
            login_data = {"email": rider_data["email"], "password": rider_data["password"]}
            response = self.make_request('POST', '/auth/login', login_data)
            if response and response.status_code == 200:
                self.rider_token = response.json().get('token')
                self.log("✅ Rider logged in successfully")
            else:
                self.log("❌ Failed to authenticate rider")
                return False
        
        return True
    
    def setup_restaurant_and_menu(self):
        """Setup vendor restaurant and menu items"""
        self.log("🏪 Setting up restaurant and menu...")
        
        # Get vendor restaurant
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        response = self.make_request('GET', '/vendor/restaurant', headers=headers)
        
        if response and response.status_code == 200:
            restaurant = response.json()
            self.vendor_restaurant_id = restaurant['id']
            self.log(f"✅ Got vendor restaurant: {restaurant['name']}")
        else:
            self.log("❌ Failed to get vendor restaurant")
            return False
        
        # Check if menu items exist, create if needed
        response = self.make_request('GET', f'/restaurants/{self.vendor_restaurant_id}/menu', headers=headers)
        
        if response and response.status_code == 200:
            menu_items = response.json()
            if menu_items:
                self.menu_item_id = menu_items[0]['id']
                self.log(f"✅ Using existing menu item: {menu_items[0]['name']}")
                return True
        
        # Create test menu item
        menu_item_data = {
            "name": "Deluxe Thali",
            "description": "Complete Indian meal with rice, dal, vegetables, and roti",
            "price": 150.0,
            "category": "Main Course",
            "image_url": None
        }
        
        response = self.make_request('POST', f'/restaurants/{self.vendor_restaurant_id}/menu', 
                                   menu_item_data, headers=headers)
        
        if response and response.status_code == 200:
            menu_item = response.json()
            self.menu_item_id = menu_item['id']
            self.log(f"✅ Created menu item: {menu_item['name']} - ₹{menu_item['price']}")
            return True
        else:
            self.log("❌ Failed to create menu item")
            return False
    
    def test_wallet_balance_initial(self):
        """Test GET /api/wallet/balance - initial balance should be 0.0"""
        self.log("\n🧪 Testing GET /api/wallet/balance (initial balance)...")
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        response = self.make_request('GET', '/wallet/balance', headers=headers)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Failed to get wallet balance: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
        
        try:
            data = response.json()
            balance = data.get('balance', -1)
            currency = data.get('currency', '')
            
            if balance != 0.0:
                self.log(f"❌ Expected initial balance 0.0, got {balance}")
                return False
            
            if currency != 'INR':
                self.log(f"❌ Expected currency INR, got {currency}")
                return False
            
            self.log(f"✅ Initial wallet balance: ₹{balance} {currency}")
            return True
            
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def test_wallet_add_money_valid(self):
        """Test POST /api/wallet/add-money with valid amounts"""
        self.log("\n🧪 Testing POST /api/wallet/add-money (valid amounts)...")
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        
        # Test adding ₹500
        add_money_data = {"amount": 500.0}
        response = self.make_request('POST', '/wallet/add-money', add_money_data, headers=headers)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Failed to add ₹500: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
        
        try:
            data = response.json()
            new_balance = data.get('new_balance', -1)
            
            if new_balance != 500.0:
                self.log(f"❌ Expected balance 500.0, got {new_balance}")
                return False
            
            self.log(f"✅ Added ₹500, new balance: ₹{new_balance}")
            
            # Verify balance via GET endpoint
            balance_response = self.make_request('GET', '/wallet/balance', headers=headers)
            if balance_response and balance_response.status_code == 200:
                balance_data = balance_response.json()
                if balance_data.get('balance') != 500.0:
                    self.log(f"❌ Balance verification failed. Expected 500.0, got {balance_data.get('balance')}")
                    return False
                self.log("✅ Balance verified via GET endpoint")
            
            # Test adding ₹100 more (should accumulate)
            add_money_data = {"amount": 100.0}
            response = self.make_request('POST', '/wallet/add-money', add_money_data, headers=headers)
            
            if not response or response.status_code != 200:
                self.log(f"❌ Failed to add ₹100: {response.status_code if response else 'No response'}")
                return False
            
            data = response.json()
            new_balance = data.get('new_balance', -1)
            
            if new_balance != 600.0:
                self.log(f"❌ Expected accumulated balance 600.0, got {new_balance}")
                return False
            
            self.log(f"✅ Added ₹100 more, accumulated balance: ₹{new_balance}")
            return True
            
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def test_wallet_add_money_invalid(self):
        """Test POST /api/wallet/add-money with invalid amounts"""
        self.log("\n🧪 Testing POST /api/wallet/add-money (invalid amounts)...")
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        
        # Test negative amount
        add_money_data = {"amount": -100.0}
        response = self.make_request('POST', '/wallet/add-money', add_money_data, headers=headers)
        
        if not response or response.status_code != 400:
            self.log(f"❌ Expected 400 for negative amount, got {response.status_code if response else 'No response'}")
            return False
        
        self.log("✅ Negative amount correctly rejected")
        
        # Test zero amount
        add_money_data = {"amount": 0.0}
        response = self.make_request('POST', '/wallet/add-money', add_money_data, headers=headers)
        
        if not response or response.status_code != 400:
            self.log(f"❌ Expected 400 for zero amount, got {response.status_code if response else 'No response'}")
            return False
        
        self.log("✅ Zero amount correctly rejected")
        
        # Test amount > 50000
        add_money_data = {"amount": 60000.0}
        response = self.make_request('POST', '/wallet/add-money', add_money_data, headers=headers)
        
        if not response or response.status_code != 400:
            self.log(f"❌ Expected 400 for amount > 50000, got {response.status_code if response else 'No response'}")
            return False
        
        self.log("✅ Amount > ₹50,000 correctly rejected")
        return True
    
    def test_wallet_transactions_history(self):
        """Test GET /api/wallet/transactions"""
        self.log("\n🧪 Testing GET /api/wallet/transactions...")
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        response = self.make_request('GET', '/wallet/transactions', headers=headers)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Failed to get transactions: {response.status_code if response else 'No response'}")
            return False
        
        try:
            transactions = response.json()
            
            if not isinstance(transactions, list):
                self.log(f"❌ Expected list, got {type(transactions)}")
                return False
            
            if len(transactions) < 2:
                self.log(f"❌ Expected at least 2 transactions (₹500 + ₹100), got {len(transactions)}")
                return False
            
            # Check transaction structure and data
            for txn in transactions[:2]:  # Check first 2 transactions
                required_fields = ['transaction_type', 'amount', 'status', 'description', 'balance_before', 'balance_after']
                for field in required_fields:
                    if field not in txn:
                        self.log(f"❌ Missing field '{field}' in transaction")
                        return False
                
                if txn['transaction_type'] != 'deposit':
                    self.log(f"❌ Expected transaction_type 'deposit', got '{txn['transaction_type']}'")
                    return False
                
                if txn['status'] != 'completed':
                    self.log(f"❌ Expected status 'completed', got '{txn['status']}'")
                    return False
            
            self.log(f"✅ Got {len(transactions)} transactions with correct structure")
            
            # Verify balance progression
            first_txn = transactions[0]  # Most recent (₹100 addition)
            second_txn = transactions[1]  # Second most recent (₹500 addition)
            
            if first_txn['amount'] != 100.0 or first_txn['balance_after'] != 600.0:
                self.log(f"❌ First transaction incorrect: amount={first_txn['amount']}, balance_after={first_txn['balance_after']}")
                return False
            
            if second_txn['amount'] != 500.0 or second_txn['balance_after'] != 500.0:
                self.log(f"❌ Second transaction incorrect: amount={second_txn['amount']}, balance_after={second_txn['balance_after']}")
                return False
            
            self.log("✅ Transaction history shows correct balance progression")
            return True
            
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def test_order_creation_insufficient_balance(self):
        """Test order creation with insufficient wallet balance"""
        self.log("\n🧪 Testing order creation with insufficient balance...")
        
        # First, create a new customer with ₹0 balance
        customer_data = {
            "email": "poor_customer@localtokri.com",
            "password": "customer123",
            "name": "Poor Customer",
            "role": "customer",
            "phone": "+919876543213"
        }
        
        response = self.make_request('POST', '/auth/register', customer_data)
        if response and response.status_code == 200:
            poor_customer_token = response.json().get('token')
            self.log("✅ Created customer with ₹0 balance")
        else:
            # Try login if already exists
            login_data = {"email": customer_data["email"], "password": customer_data["password"]}
            response = self.make_request('POST', '/auth/login', login_data)
            if response and response.status_code == 200:
                poor_customer_token = response.json().get('token')
                self.log("✅ Logged in customer with ₹0 balance")
            else:
                self.log("❌ Failed to create/login poor customer")
                return False
        
        # Try to place order for ₹150 (menu item price)
        headers = {"Authorization": f"Bearer {poor_customer_token}"}
        order_data = {
            "restaurant_id": self.vendor_restaurant_id,
            "items": [{
                "menu_item_id": self.menu_item_id,
                "name": "Deluxe Thali",
                "quantity": 1,
                "price": 150.0
            }],
            "delivery_address": "123 Test Street, Mumbai, India",
            "delivery_latitude": 19.0760,
            "delivery_longitude": 72.8777,
            "special_instructions": "Test order for insufficient balance"
        }
        
        response = self.make_request('POST', '/orders', order_data, headers=headers)
        
        if not response or response.status_code != 400:
            self.log(f"❌ Expected 400 for insufficient balance, got {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
        
        try:
            error_data = response.json()
            error_detail = error_data.get('detail', '')
            
            if 'Insufficient wallet balance' not in error_detail:
                self.log(f"❌ Expected 'Insufficient wallet balance' error, got: {error_detail}")
                return False
            
            self.log(f"✅ Order correctly rejected: {error_detail}")
            return True
            
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def test_order_creation_sufficient_balance(self):
        """Test order creation with sufficient wallet balance and verify deduction"""
        self.log("\n🧪 Testing order creation with sufficient balance...")
        
        # Use customer with ₹600 balance
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        
        # Place order for ₹150
        order_data = {
            "restaurant_id": self.vendor_restaurant_id,
            "items": [{
                "menu_item_id": self.menu_item_id,
                "name": "Deluxe Thali",
                "quantity": 1,
                "price": 150.0
            }],
            "delivery_address": "456 Success Street, Mumbai, India",
            "delivery_latitude": 19.0825,
            "delivery_longitude": 72.8811,
            "special_instructions": "Test order with sufficient balance"
        }
        
        response = self.make_request('POST', '/orders', order_data, headers=headers)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Order creation failed: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
        
        try:
            order = response.json()
            order_id = order['id']
            self.test_order_ids.append(order_id)
            
            self.log(f"✅ Order created successfully: {order_id}")
            
            # Verify wallet balance reduced to ₹450 (600 - 150)
            balance_response = self.make_request('GET', '/wallet/balance', headers=headers)
            if not balance_response or balance_response.status_code != 200:
                self.log("❌ Failed to check balance after order")
                return False
            
            balance_data = balance_response.json()
            new_balance = balance_data.get('balance', -1)
            
            if new_balance != 450.0:
                self.log(f"❌ Expected balance ₹450 after order, got ₹{new_balance}")
                return False
            
            self.log(f"✅ Wallet balance correctly reduced to ₹{new_balance}")
            
            # Check transaction history for debit transaction
            txn_response = self.make_request('GET', '/wallet/transactions', headers=headers)
            if txn_response and txn_response.status_code == 200:
                transactions = txn_response.json()
                
                # Find the debit transaction
                debit_txn = None
                for txn in transactions:
                    if txn.get('transaction_type') == 'debit' and txn.get('order_id') == order_id:
                        debit_txn = txn
                        break
                
                if not debit_txn:
                    self.log("❌ Debit transaction not found in history")
                    return False
                
                if debit_txn['amount'] != 150.0:
                    self.log(f"❌ Expected debit amount ₹150, got ₹{debit_txn['amount']}")
                    return False
                
                if debit_txn['balance_after'] != 450.0:
                    self.log(f"❌ Expected balance_after ₹450 in debit txn, got ₹{debit_txn['balance_after']}")
                    return False
                
                self.log("✅ Debit transaction correctly recorded")
            
            return True
            
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def test_order_creation_insufficient_remaining_balance(self):
        """Test order creation when remaining balance is insufficient"""
        self.log("\n🧪 Testing order with insufficient remaining balance...")
        
        # Customer now has ₹450, try to place order for ₹500 (should fail)
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        
        # Create expensive menu item
        expensive_item_data = {
            "name": "Premium Feast",
            "description": "Expensive premium meal",
            "price": 500.0,
            "category": "Premium",
            "image_url": None
        }
        
        vendor_headers = {"Authorization": f"Bearer {self.vendor_token}"}
        response = self.make_request('POST', f'/restaurants/{self.vendor_restaurant_id}/menu', 
                                   expensive_item_data, headers=vendor_headers)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to create expensive menu item")
            return False
        
        expensive_item = response.json()
        
        # Try to order the expensive item
        order_data = {
            "restaurant_id": self.vendor_restaurant_id,
            "items": [{
                "menu_item_id": expensive_item['id'],
                "name": expensive_item['name'],
                "quantity": 1,
                "price": expensive_item['price']
            }],
            "delivery_address": "789 Expensive Street, Mumbai, India",
            "delivery_latitude": 19.0900,
            "delivery_longitude": 72.8900,
            "special_instructions": "Expensive order test"
        }
        
        response = self.make_request('POST', '/orders', order_data, headers=headers)
        
        if not response or response.status_code != 400:
            self.log(f"❌ Expected 400 for insufficient balance, got {response.status_code if response else 'No response'}")
            return False
        
        try:
            error_data = response.json()
            error_detail = error_data.get('detail', '')
            
            if 'Insufficient wallet balance' not in error_detail:
                self.log(f"❌ Expected 'Insufficient wallet balance' error, got: {error_detail}")
                return False
            
            if 'Required: ₹500' not in error_detail or 'Available: ₹450' not in error_detail:
                self.log(f"❌ Error message should show required and available amounts: {error_detail}")
                return False
            
            self.log(f"✅ Expensive order correctly rejected: {error_detail}")
            return True
            
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def create_orders_for_delivery_sequence(self):
        """Create 3 orders with 'ready' status for delivery sequence testing"""
        self.log("\n🧪 Creating orders for delivery sequence testing...")
        
        # Add more money to customer wallet for multiple orders
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        add_money_data = {"amount": 1000.0}
        response = self.make_request('POST', '/wallet/add-money', add_money_data, headers=headers)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to add money for delivery sequence test")
            return False
        
        self.log("✅ Added ₹1000 for delivery sequence testing")
        
        # Create 3 orders
        order_addresses = [
            {"address": "Location A, Bandra West, Mumbai", "lat": 19.0596, "lng": 72.8295},
            {"address": "Location B, Andheri East, Mumbai", "lat": 19.1136, "lng": 72.8697},
            {"address": "Location C, Powai, Mumbai", "lat": 19.1176, "lng": 72.9060}
        ]
        
        vendor_headers = {"Authorization": f"Bearer {self.vendor_token}"}
        
        for i, location in enumerate(order_addresses, 1):
            order_data = {
                "restaurant_id": self.vendor_restaurant_id,
                "items": [{
                    "menu_item_id": self.menu_item_id,
                    "name": "Deluxe Thali",
                    "quantity": 1,
                    "price": 150.0
                }],
                "delivery_address": location["address"],
                "delivery_latitude": location["lat"],
                "delivery_longitude": location["lng"],
                "special_instructions": f"Delivery sequence test order {i}"
            }
            
            response = self.make_request('POST', '/orders', order_data, headers=headers)
            
            if not response or response.status_code != 200:
                self.log(f"❌ Failed to create order {i}")
                return False
            
            order = response.json()
            order_id = order['id']
            self.test_order_ids.append(order_id)
            
            # Update order status to 'ready'
            statuses = ['confirmed', 'preparing', 'ready']
            for status in statuses:
                status_data = {"status": status}
                response = self.make_request('PATCH', f'/orders/{order_id}/status', 
                                           status_data, headers=vendor_headers)
                if not response or response.status_code != 200:
                    self.log(f"❌ Failed to update order {i} status to {status}")
                    return False
            
            self.log(f"✅ Created and prepared order {i}: {order_id}")
        
        return True
    
    def test_route_optimization(self):
        """Test POST /api/vendor/optimize-routes"""
        self.log("\n🧪 Testing POST /api/vendor/optimize-routes...")
        
        # Get the last 3 orders (ready status)
        ready_order_ids = self.test_order_ids[-3:]
        
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        optimization_data = {
            "order_ids": ready_order_ids,
            "num_riders": 2,
            "max_orders_per_rider": 2
        }
        
        response = self.make_request('POST', '/vendor/optimize-routes', optimization_data, headers=headers)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Route optimization failed: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False, None
        
        try:
            optimization_result = response.json()
            
            required_fields = ['routes', 'total_orders', 'total_riders']
            for field in required_fields:
                if field not in optimization_result:
                    self.log(f"❌ Missing field '{field}' in optimization result")
                    return False, None
            
            routes = optimization_result['routes']
            
            if not isinstance(routes, list) or len(routes) == 0:
                self.log(f"❌ Expected non-empty routes list, got {routes}")
                return False, None
            
            # Verify route structure
            for route in routes:
                route_fields = ['rider_index', 'order_ids', 'orders', 'total_distance_km', 'estimated_duration_minutes']
                for field in route_fields:
                    if field not in route:
                        self.log(f"❌ Missing field '{field}' in route")
                        return False, None
            
            self.log(f"✅ Route optimization successful: {len(routes)} routes created")
            self.log(f"   Total orders: {optimization_result['total_orders']}")
            self.log(f"   Total riders: {optimization_result['total_riders']}")
            
            for i, route in enumerate(routes):
                self.log(f"   Route {i+1}: {len(route['order_ids'])} orders, {route['total_distance_km']}km, {route['estimated_duration_minutes']}min")
            
            return True, optimization_result
            
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False, None
    
    def test_batch_assign_riders(self, optimization_result):
        """Test POST /api/vendor/batch-assign-riders with delivery sequence"""
        self.log("\n🧪 Testing POST /api/vendor/batch-assign-riders...")
        
        if not optimization_result:
            self.log("❌ No optimization result to test with")
            return False
        
        # Get available riders
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        response = self.make_request('GET', '/riders/available', headers=headers)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to get available riders")
            return False
        
        available_riders = response.json()
        
        if len(available_riders) < len(optimization_result['routes']):
            self.log(f"❌ Not enough riders available. Need {len(optimization_result['routes'])}, got {len(available_riders)}")
            return False
        
        # Prepare batch assignment data
        batch_data = []
        for i, route in enumerate(optimization_result['routes']):
            batch_data.append({
                "rider_id": available_riders[i]['id'],
                "order_ids": route['order_ids']
            })
        
        response = self.make_request('POST', '/vendor/batch-assign-riders', batch_data, headers=headers)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Batch assign riders failed: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
        
        try:
            result = response.json()
            assigned_count = result.get('assigned_count', 0)
            
            expected_count = sum(len(route['order_ids']) for route in optimization_result['routes'])
            
            if assigned_count != expected_count:
                self.log(f"❌ Expected {expected_count} assignments, got {assigned_count}")
                return False
            
            self.log(f"✅ Batch assignment successful: {assigned_count} orders assigned")
            
            # Verify delivery sequence in orders
            return self.verify_delivery_sequence(batch_data)
            
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def verify_delivery_sequence(self, batch_data):
        """Verify that orders have delivery_sequence field set correctly"""
        self.log("\n🧪 Verifying delivery sequence in orders...")
        
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        
        for route in batch_data:
            rider_id = route['rider_id']
            order_ids = route['order_ids']
            
            for expected_sequence, order_id in enumerate(order_ids, start=1):
                response = self.make_request('GET', f'/orders/{order_id}', headers=headers)
                
                if not response or response.status_code != 200:
                    self.log(f"❌ Failed to get order {order_id}")
                    return False
                
                try:
                    order = response.json()
                    
                    # Check delivery_sequence
                    actual_sequence = order.get('delivery_sequence')
                    if actual_sequence != expected_sequence:
                        self.log(f"❌ Order {order_id}: expected sequence {expected_sequence}, got {actual_sequence}")
                        return False
                    
                    # Check rider assignment
                    if order.get('rider_id') != rider_id:
                        self.log(f"❌ Order {order_id}: expected rider {rider_id}, got {order.get('rider_id')}")
                        return False
                    
                    # Check status
                    if order.get('status') != 'out-for-delivery':
                        self.log(f"❌ Order {order_id}: expected status 'out-for-delivery', got {order.get('status')}")
                        return False
                    
                    self.log(f"✅ Order {order_id}: sequence #{actual_sequence}, rider {rider_id}, status {order.get('status')}")
                    
                except json.JSONDecodeError:
                    self.log(f"❌ Invalid JSON response for order {order_id}")
                    return False
        
        self.log("✅ All orders have correct delivery sequence and assignments")
        return True
    
    def run_all_tests(self):
        """Run all wallet and delivery sequence tests"""
        self.log("🚀 Starting Wallet System and Delivery Sequence Tests")
        self.log(f"Backend URL: {self.base_url}")
        
        test_results = {}
        
        # Setup phase
        self.log("\n=== SETUP PHASE ===")
        if not self.setup_test_users():
            self.log("❌ Setup failed: Could not setup test users")
            return False
        
        if not self.setup_restaurant_and_menu():
            self.log("❌ Setup failed: Could not setup restaurant and menu")
            return False
        
        # Wallet tests
        self.log("\n=== WALLET SYSTEM TESTS ===")
        
        test_results['wallet_balance_initial'] = self.test_wallet_balance_initial()
        test_results['wallet_add_money_valid'] = self.test_wallet_add_money_valid()
        test_results['wallet_add_money_invalid'] = self.test_wallet_add_money_invalid()
        test_results['wallet_transactions_history'] = self.test_wallet_transactions_history()
        test_results['order_insufficient_balance'] = self.test_order_creation_insufficient_balance()
        test_results['order_sufficient_balance'] = self.test_order_creation_sufficient_balance()
        test_results['order_insufficient_remaining'] = self.test_order_creation_insufficient_remaining_balance()
        
        # Delivery sequence tests
        self.log("\n=== DELIVERY SEQUENCE TESTS ===")
        
        if not self.create_orders_for_delivery_sequence():
            self.log("❌ Failed to create orders for delivery sequence testing")
            return False
        
        optimization_success, optimization_result = self.test_route_optimization()
        test_results['route_optimization'] = optimization_success
        
        if optimization_success:
            test_results['batch_assign_riders'] = self.test_batch_assign_riders(optimization_result)
        else:
            test_results['batch_assign_riders'] = False
        
        # Results summary
        self.log("\n=== TEST RESULTS SUMMARY ===")
        passed = 0
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
            if result:
                passed += 1
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All wallet and delivery sequence tests passed!")
            return True
        else:
            self.log("⚠️ Some tests failed!")
            return False

if __name__ == "__main__":
    tester = WalletDeliveryTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)