#!/usr/bin/env python3
"""
Backend API Tests for QuickBite Rider Assignment Feature
Tests the new rider assignment functionality for vendors
"""

import requests
import json
import os
from datetime import datetime
import urllib3

# Disable SSL warnings for testing
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Get backend URL from environment
BACKEND_URL = "https://delivery-handoff.preview.emergentagent.com/api"

class QuickBiteAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.vendor_token = None
        self.customer_token = None
        self.rider_token = None
        self.vendor_restaurant_id = None
        self.test_order_id = None
        self.available_riders = []
        
    def log(self, message):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")
        
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        try:
            # Add timeout and SSL verification settings
            kwargs = {
                'timeout': 30,
                'verify': True  # Enable SSL verification
            }
            
            if headers:
                kwargs['headers'] = headers
                
            if data is not None:
                kwargs['json'] = data
                
            if method.upper() == 'GET':
                # Remove json parameter for GET requests
                get_kwargs = {k: v for k, v in kwargs.items() if k != 'json'}
                response = requests.get(url, **get_kwargs)
            elif method.upper() == 'POST':
                response = requests.post(url, **kwargs)
            elif method.upper() == 'PATCH':
                response = requests.patch(url, **kwargs)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Request failed: {e}")
            self.log(f"URL: {url}")
            self.log(f"Method: {method}")
            self.log(f"Data: {data}")
            return None
            
    def authenticate_vendor(self):
        """Login as vendor to get authentication token"""
        self.log("🔐 Authenticating as vendor...")
        
        # First try to register vendor (in case it doesn't exist)
        register_data = {
            "email": "vendor1@quickbite.com",
            "password": "vendor123",
            "name": "Test Vendor",
            "role": "vendor",
            "phone": "+1234567890"
        }
        
        register_response = self.make_request('POST', '/auth/register', register_data)
        if register_response and register_response.status_code == 200:
            data = register_response.json()
            self.vendor_token = data.get('token')
            self.log(f"✅ Vendor registered and authenticated successfully")
            return True
        
        # If registration failed (probably already exists), try login
        login_data = {
            "email": "vendor1@quickbite.com",
            "password": "vendor123"
        }
        
        response = self.make_request('POST', '/auth/login', login_data)
        if not response or response.status_code != 200:
            self.log(f"❌ Vendor login failed: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
            
        data = response.json()
        self.vendor_token = data.get('token')
        self.log(f"✅ Vendor authenticated successfully")
        return True
        
    def authenticate_customer(self):
        """Login as customer to test authorization failures"""
        self.log("🔐 Authenticating as customer...")
        
        # Try to find existing customer or create one
        login_data = {
            "email": "customer1@quickbite.com", 
            "password": "customer123"
        }
        
        response = self.make_request('POST', '/auth/login', login_data)
        if response and response.status_code == 200:
            data = response.json()
            self.customer_token = data.get('token')
            self.log(f"✅ Customer authenticated successfully")
            return True
        else:
            # Try to register customer
            register_data = {
                "email": "customer1@quickbite.com",
                "password": "customer123", 
                "name": "Test Customer",
                "role": "customer",
                "phone": "+1234567890"
            }
            
            response = self.make_request('POST', '/auth/register', register_data)
            if response and response.status_code == 200:
                data = response.json()
                self.customer_token = data.get('token')
                self.log(f"✅ Customer registered and authenticated")
                return True
            else:
                self.log(f"❌ Customer authentication failed")
                return False
                
    def get_vendor_restaurant(self):
        """Get vendor's restaurant ID"""
        self.log("🏪 Getting vendor restaurant...")
        
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        response = self.make_request('GET', '/vendor/restaurant', headers=headers)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Failed to get vendor restaurant: {response.status_code if response else 'No response'}")
            return False
            
        data = response.json()
        self.vendor_restaurant_id = data.get('id')
        self.log(f"✅ Got vendor restaurant ID: {self.vendor_restaurant_id}")
        return True
        
    def create_test_rider(self):
        """Create a test rider account"""
        self.log("🏍️ Creating test rider...")
        
        rider_data = {
            "email": "rider1@quickbite.com",
            "password": "rider123",
            "name": "Test Rider",
            "role": "rider",
            "phone": "+1987654321"
        }
        
        response = self.make_request('POST', '/auth/register', rider_data)
        if response and response.status_code == 200:
            self.log(f"✅ Test rider created successfully")
            return True
        elif response and response.status_code == 400 and "already registered" in response.text:
            self.log(f"ℹ️ Test rider already exists")
            return True
        else:
            self.log(f"❌ Failed to create test rider: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
            
    def create_test_order(self):
        """Create a test order and update it to 'ready' status"""
        self.log("📦 Creating test order...")
        
        # First, get menu items from vendor's restaurant
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        response = self.make_request('GET', f'/restaurants/{self.vendor_restaurant_id}/menu', headers=headers)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to get menu items")
            return False
            
        menu_items = response.json()
        if not menu_items:
            # Create a test menu item
            self.log("📝 Creating test menu item...")
            menu_item_data = {
                "name": "Test Burger",
                "description": "Delicious test burger",
                "price": 12.99,
                "category": "Main Course"
            }
            
            response = self.make_request('POST', f'/restaurants/{self.vendor_restaurant_id}/menu', 
                                       menu_item_data, headers=headers)
            if not response or response.status_code != 200:
                self.log("❌ Failed to create test menu item")
                return False
                
            menu_items = [response.json()]
            
        # Create order as customer
        customer_headers = {"Authorization": f"Bearer {self.customer_token}"}
        order_data = {
            "restaurant_id": self.vendor_restaurant_id,
            "items": [{
                "menu_item_id": menu_items[0]['id'],
                "name": menu_items[0]['name'],
                "quantity": 2,
                "price": menu_items[0]['price']
            }],
            "delivery_address": "123 Test Street, Test City, TC 12345",
            "special_instructions": "Test order for rider assignment"
        }
        
        response = self.make_request('POST', '/orders', order_data, headers=customer_headers)
        if not response or response.status_code != 200:
            self.log(f"❌ Failed to create test order: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
            
        order = response.json()
        self.test_order_id = order['id']
        self.log(f"✅ Test order created: {self.test_order_id}")
        
        # Update order status to 'ready' (simulate order lifecycle)
        statuses = ['confirmed', 'preparing', 'ready']
        for status in statuses:
            status_data = {"status": status}
            response = self.make_request('PATCH', f'/orders/{self.test_order_id}/status', 
                                       status_data, headers=headers)
            if not response or response.status_code != 200:
                self.log(f"❌ Failed to update order status to {status}")
                return False
            self.log(f"✅ Order status updated to: {status}")
            
        return True
        
    def test_get_available_riders_success(self):
        """Test GET /api/riders/available with vendor authentication"""
        self.log("\n🧪 Testing GET /api/riders/available (vendor auth)...")
        
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        response = self.make_request('GET', '/riders/available', headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
            
        if response.status_code != 200:
            self.log(f"❌ Expected 200, got {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
            
        try:
            riders = response.json()
            self.available_riders = riders
            self.log(f"✅ Got {len(riders)} available riders")
            
            # Verify all returned users have role='rider'
            for rider in riders:
                if rider.get('role') != 'rider':
                    self.log(f"❌ Non-rider user returned: {rider}")
                    return False
                    
            self.log("✅ All returned users have role='rider'")
            return True
            
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
            
    def test_get_available_riders_unauthorized(self):
        """Test GET /api/riders/available with customer authentication (should fail)"""
        self.log("\n🧪 Testing GET /api/riders/available (customer auth - should fail)...")
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        self.log(f"Using customer token: {self.customer_token[:20]}...")
        
        response = self.make_request('GET', '/riders/available', headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
            
        if response.status_code != 403:
            self.log(f"❌ Expected 403, got {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
            
        self.log("✅ Customer correctly denied access (403)")
        return True
        
    def test_assign_rider_success(self):
        """Test PATCH /api/orders/{order_id}/assign-rider with valid data"""
        self.log("\n🧪 Testing PATCH /api/orders/{order_id}/assign-rider (success case)...")
        
        if not self.available_riders:
            self.log("❌ No available riders to test with")
            return False
            
        rider_id = self.available_riders[0]['id']
        self.log(f"Using rider ID: {rider_id}")
        
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        assignment_data = {"rider_id": rider_id}
        
        response = self.make_request('PATCH', f'/orders/{self.test_order_id}/assign-rider', 
                                   assignment_data, headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
            
        if response.status_code != 200:
            self.log(f"❌ Expected 200, got {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
            
        try:
            result = response.json()
            self.log(f"✅ Rider assigned successfully: {result}")
            
            # Verify order was updated
            order_response = self.make_request('GET', f'/orders/{self.test_order_id}', headers=headers)
            if order_response and order_response.status_code == 200:
                order = order_response.json()
                
                if order.get('rider_id') != rider_id:
                    self.log(f"❌ Order rider_id not updated. Expected: {rider_id}, Got: {order.get('rider_id')}")
                    return False
                    
                if order.get('status') != 'out-for-delivery':
                    self.log(f"❌ Order status not updated. Expected: out-for-delivery, Got: {order.get('status')}")
                    return False
                    
                self.log("✅ Order correctly updated with rider_id and status")
                return True
            else:
                self.log("❌ Failed to verify order update")
                return False
                
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
            
    def test_assign_rider_invalid_rider(self):
        """Test PATCH /api/orders/{order_id}/assign-rider with invalid rider_id"""
        self.log("\n🧪 Testing PATCH /api/orders/{order_id}/assign-rider (invalid rider)...")
        
        # Create another test order for this test
        if not self.create_another_test_order():
            self.log("❌ Failed to create another test order")
            return False
            
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        assignment_data = {"rider_id": "invalid-rider-id-12345"}
        
        response = self.make_request('PATCH', f'/orders/{self.test_order_id}/assign-rider', 
                                   assignment_data, headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
            
        if response.status_code != 404:
            self.log(f"❌ Expected 404, got {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
            
        self.log("✅ Invalid rider correctly rejected (404)")
        return True
        
    def create_another_test_order(self):
        """Create another test order for testing"""
        # Get menu items
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        response = self.make_request('GET', f'/restaurants/{self.vendor_restaurant_id}/menu', headers=headers)
        
        if not response or response.status_code != 200:
            return False
            
        menu_items = response.json()
        if not menu_items:
            return False
            
        # Create order as customer
        customer_headers = {"Authorization": f"Bearer {self.customer_token}"}
        order_data = {
            "restaurant_id": self.vendor_restaurant_id,
            "items": [{
                "menu_item_id": menu_items[0]['id'],
                "name": menu_items[0]['name'],
                "quantity": 1,
                "price": menu_items[0]['price']
            }],
            "delivery_address": "456 Another Street, Test City, TC 12345",
            "special_instructions": "Another test order"
        }
        
        response = self.make_request('POST', '/orders', order_data, headers=customer_headers)
        if not response or response.status_code != 200:
            return False
            
        order = response.json()
        self.test_order_id = order['id']
        
        # Update to ready status
        statuses = ['confirmed', 'preparing', 'ready']
        for status in statuses:
            status_data = {"status": status}
            response = self.make_request('PATCH', f'/orders/{self.test_order_id}/status', 
                                       status_data, headers=headers)
            if not response or response.status_code != 200:
                return False
                
        return True
        
    def test_assign_rider_unauthorized(self):
        """Test PATCH /api/orders/{order_id}/assign-rider with customer auth (should fail)"""
        self.log("\n🧪 Testing PATCH /api/orders/{order_id}/assign-rider (customer auth - should fail)...")
        
        if not self.available_riders:
            self.log("❌ No available riders to test with")
            return False
            
        rider_id = self.available_riders[0]['id']
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        assignment_data = {"rider_id": rider_id}
        
        response = self.make_request('PATCH', f'/orders/{self.test_order_id}/assign-rider', 
                                   assignment_data, headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
            
        if response.status_code != 403:
            self.log(f"❌ Expected 403, got {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
            
        self.log("✅ Customer correctly denied access (403)")
        return True
        
    def test_rider_availability_after_assignment(self):
        """Test that assigned rider is no longer in available riders list"""
        self.log("\n🧪 Testing rider availability after assignment...")
        
        # Get available riders again
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        response = self.make_request('GET', '/riders/available', headers=headers)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to get available riders")
            return False
            
        current_available = response.json()
        
        # Check if the assigned rider is still in the list
        assigned_rider_id = self.available_riders[0]['id'] if self.available_riders else None
        
        for rider in current_available:
            if rider['id'] == assigned_rider_id:
                self.log(f"❌ Assigned rider {assigned_rider_id} still appears as available")
                return False
                
        self.log("✅ Assigned rider correctly removed from available list")
        return True
        
    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting QuickBite Rider Assignment API Tests")
        self.log(f"Backend URL: {self.base_url}")
        
        test_results = {}
        
        # Setup phase
        self.log("\n=== SETUP PHASE ===")
        if not self.authenticate_vendor():
            self.log("❌ Setup failed: Could not authenticate vendor")
            return
            
        if not self.authenticate_customer():
            self.log("❌ Setup failed: Could not authenticate customer")
            return
            
        if not self.get_vendor_restaurant():
            self.log("❌ Setup failed: Could not get vendor restaurant")
            return
            
        if not self.create_test_rider():
            self.log("❌ Setup failed: Could not create test rider")
            return
            
        if not self.create_test_order():
            self.log("❌ Setup failed: Could not create test order")
            return
            
        # Test phase
        self.log("\n=== TESTING PHASE ===")
        
        # Test 1: Get Available Riders (Success)
        test_results['get_riders_success'] = self.test_get_available_riders_success()
        
        # Test 2: Get Available Riders (Unauthorized)
        test_results['get_riders_unauthorized'] = self.test_get_available_riders_unauthorized()
        
        # Test 3: Assign Rider (Success)
        test_results['assign_rider_success'] = self.test_assign_rider_success()
        
        # Test 4: Assign Rider (Invalid Rider)
        test_results['assign_rider_invalid'] = self.test_assign_rider_invalid_rider()
        
        # Test 5: Assign Rider (Unauthorized)
        test_results['assign_rider_unauthorized'] = self.test_assign_rider_unauthorized()
        
        # Test 6: Rider Availability After Assignment
        test_results['rider_availability_check'] = self.test_rider_availability_after_assignment()
        
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
            self.log("🎉 All tests passed!")
            return True
        else:
            self.log("⚠️ Some tests failed!")
            return False

if __name__ == "__main__":
    tester = QuickBiteAPITester()
    success = tester.run_all_tests()
    exit(0 if success else 1)