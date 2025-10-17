#!/usr/bin/env python3
"""
Critical Backend API Tests for Route Ordering Fix & Admin User Management
Tests the critical route ordering fix and new admin user management features
"""

import requests
import json
import os
from datetime import datetime
import uuid

# Get backend URL from environment
BACKEND_URL = "http://localhost:8001/api"

class CriticalAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.admin_token = None
        self.customer_token = None
        self.vendor_token = None
        self.rider_token = None
        self.test_users = {}  # Store created test users
        
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
    
    def create_or_login_user(self, email, password, name, role, phone=None):
        """Create user or login if already exists"""
        self.log(f"🔐 Authenticating as {role}: {email}")
        
        # Try login first
        login_data = {"email": email, "password": password}
        response = self.make_request('POST', '/auth/login', login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            token = data.get('token')
            user = data.get('user')
            self.log(f"✅ {role.capitalize()} logged in successfully")
            return token, user
        
        # If login failed, try registration
        register_data = {
            "email": email,
            "password": password,
            "name": name,
            "role": role,
            "phone": phone or f"+123456789{len(self.test_users)}"
        }
        
        response = self.make_request('POST', '/auth/register', register_data)
        if response and response.status_code == 200:
            data = response.json()
            token = data.get('token')
            user = data.get('user')
            self.log(f"✅ {role.capitalize()} registered successfully")
            return token, user
        else:
            self.log(f"❌ Failed to authenticate {role}: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return None, None
    
    def setup_test_users(self):
        """Setup all required test users"""
        self.log("\n=== SETTING UP TEST USERS ===")
        
        # Create admin user
        self.admin_token, admin_user = self.create_or_login_user(
            "admin@localtokri.com", "admin123", "Test Admin", "admin"
        )
        if not self.admin_token:
            return False
        self.test_users['admin'] = admin_user
        
        # Create customer user
        self.customer_token, customer_user = self.create_or_login_user(
            "testcustomer@localtokri.com", "customer123", "Rajesh Kumar", "customer", "+919876543210"
        )
        if not self.customer_token:
            return False
        self.test_users['customer'] = customer_user
        
        # Create vendor user
        self.vendor_token, vendor_user = self.create_or_login_user(
            "vendor@localtokri.com", "vendor123", "Priya Sharma", "vendor", "+919876543211"
        )
        if not self.vendor_token:
            return False
        self.test_users['vendor'] = vendor_user
        
        # Create rider user
        self.rider_token, rider_user = self.create_or_login_user(
            "rider@localtokri.com", "rider123", "Amit Singh", "rider", "+919876543212"
        )
        if not self.rider_token:
            return False
        self.test_users['rider'] = rider_user
        
        return True
    
    def create_test_order(self):
        """Create a test order for the customer to test my-orders endpoint"""
        self.log("📦 Creating test order for customer...")
        
        # Get vendor's restaurant
        vendor_headers = {"Authorization": f"Bearer {self.vendor_token}"}
        response = self.make_request('GET', '/vendor/restaurant', headers=vendor_headers)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to get vendor restaurant")
            return False
        
        restaurant = response.json()
        restaurant_id = restaurant['id']
        
        # Get menu items
        response = self.make_request('GET', f'/restaurants/{restaurant_id}/menu', headers=vendor_headers)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to get menu items")
            return False
        
        menu_items = response.json()
        if not menu_items:
            # Create a test menu item
            menu_item_data = {
                "name": "Butter Chicken",
                "description": "Creamy tomato-based curry with tender chicken",
                "price": 299.0,
                "category": "Main Course"
            }
            
            response = self.make_request('POST', f'/restaurants/{restaurant_id}/menu', 
                                       menu_item_data, headers=vendor_headers)
            if not response or response.status_code != 200:
                self.log("❌ Failed to create test menu item")
                return False
            
            menu_items = [response.json()]
        
        # Add money to customer wallet first
        wallet_response = self.make_request('POST', '/wallet/add-money', 
                                          {"amount": 1000.0}, 
                                          headers={"Authorization": f"Bearer {self.customer_token}"})
        
        if not wallet_response or wallet_response.status_code != 200:
            self.log("❌ Failed to add money to customer wallet")
            return False
        
        # Create order as customer
        customer_headers = {"Authorization": f"Bearer {self.customer_token}"}
        order_data = {
            "restaurant_id": restaurant_id,
            "items": [{
                "menu_item_id": menu_items[0]['id'],
                "name": menu_items[0]['name'],
                "quantity": 1,
                "price": menu_items[0]['price']
            }],
            "delivery_address": "123 MG Road, Mumbai, Maharashtra 400001",
            "delivery_latitude": 19.0760,
            "delivery_longitude": 72.8777,
            "special_instructions": "Test order for route testing"
        }
        
        response = self.make_request('POST', '/orders', order_data, headers=customer_headers)
        if not response or response.status_code != 200:
            self.log(f"❌ Failed to create test order: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
        
        order = response.json()
        self.log(f"✅ Test order created: {order['id']}")
        return True
    
    # PRIORITY 1 TESTS - CRITICAL ROUTE FIX
    def test_my_orders_route_fix(self):
        """Test GET /api/orders/my-orders endpoint - CRITICAL ROUTE FIX"""
        self.log("\n🧪 PRIORITY 1: Testing GET /api/orders/my-orders route fix...")
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        response = self.make_request('GET', '/orders/my-orders', headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
        
        if response.status_code == 404:
            self.log("❌ CRITICAL: Route still returns 404 - route ordering fix failed!")
            self.log("❌ The /orders/my-orders route is still being matched by /orders/{order_id}")
            return False
        
        if response.status_code != 200:
            self.log(f"❌ Expected 200, got {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
        
        try:
            orders = response.json()
            self.log(f"✅ CRITICAL FIX WORKING: Got {len(orders)} orders from /orders/my-orders")
            
            # Verify it returns a list
            if not isinstance(orders, list):
                self.log(f"❌ Expected list, got {type(orders)}")
                return False
            
            # Verify customer can only see their own orders
            customer_id = self.test_users['customer']['id']
            for order in orders:
                if order.get('customer_id') != customer_id:
                    self.log(f"❌ Customer seeing other customer's order: {order}")
                    return False
            
            self.log("✅ Route fix successful - customer can access their orders")
            return True
            
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def test_orders_by_id_still_works(self):
        """Test that /orders/{order_id} endpoint still works after route fix"""
        self.log("\n🧪 Testing GET /orders/{order_id} still works after route fix...")
        
        # Get customer's orders first
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        response = self.make_request('GET', '/orders/my-orders', headers=headers)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to get customer orders")
            return False
        
        orders = response.json()
        if not orders:
            self.log("❌ No orders found to test with")
            return False
        
        # Test accessing specific order by ID
        order_id = orders[0]['id']
        response = self.make_request('GET', f'/orders/{order_id}', headers=headers)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Failed to get order by ID: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
        
        order = response.json()
        if order['id'] != order_id:
            self.log(f"❌ Wrong order returned. Expected: {order_id}, Got: {order['id']}")
            return False
        
        self.log("✅ /orders/{order_id} endpoint still works correctly")
        return True
    
    # PRIORITY 2 TESTS - ADMIN USER MANAGEMENT
    def test_admin_update_user_name_only(self):
        """Test PATCH /api/admin/update-user/{user_id} - name only"""
        self.log("\n🧪 PRIORITY 2: Testing admin update user name only...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        customer_id = self.test_users['customer']['id']
        
        update_data = {"name": "Rajesh Kumar Updated"}
        response = self.make_request('PATCH', f'/admin/update-user/{customer_id}', 
                                   update_data, headers=headers)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Failed to update user name: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
        
        result = response.json()
        updated_user = result.get('user')
        
        if not updated_user or updated_user.get('name') != "Rajesh Kumar Updated":
            self.log(f"❌ Name not updated correctly: {updated_user}")
            return False
        
        # Verify password field is not returned
        if 'password' in updated_user:
            self.log("❌ Password field returned in response")
            return False
        
        self.log("✅ Admin successfully updated user name")
        return True
    
    def test_admin_update_user_email_uniqueness(self):
        """Test PATCH /api/admin/update-user/{user_id} - email uniqueness validation"""
        self.log("\n🧪 Testing admin update user email uniqueness validation...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        customer_id = self.test_users['customer']['id']
        vendor_email = self.test_users['vendor']['email']
        
        # Try to update customer email to vendor's email (should fail)
        update_data = {"email": vendor_email}
        response = self.make_request('PATCH', f'/admin/update-user/{customer_id}', 
                                   update_data, headers=headers)
        
        if not response or response.status_code != 400:
            self.log(f"❌ Expected 400 for duplicate email, got {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
        
        # Verify error message
        error_response = response.json()
        if "already in use" not in error_response.get('detail', ''):
            self.log(f"❌ Wrong error message: {error_response}")
            return False
        
        self.log("✅ Email uniqueness validation working correctly")
        return True
    
    def test_admin_update_user_phone_uniqueness(self):
        """Test PATCH /api/admin/update-user/{user_id} - phone uniqueness validation"""
        self.log("\n🧪 Testing admin update user phone uniqueness validation...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        customer_id = self.test_users['customer']['id']
        vendor_phone = self.test_users['vendor']['phone']
        
        # Try to update customer phone to vendor's phone (should fail)
        update_data = {"phone": vendor_phone}
        response = self.make_request('PATCH', f'/admin/update-user/{customer_id}', 
                                   update_data, headers=headers)
        
        if not response or response.status_code != 400:
            self.log(f"❌ Expected 400 for duplicate phone, got {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
        
        # Verify error message
        error_response = response.json()
        if "already in use" not in error_response.get('detail', ''):
            self.log(f"❌ Wrong error message: {error_response}")
            return False
        
        self.log("✅ Phone uniqueness validation working correctly")
        return True
    
    def test_admin_update_user_password(self):
        """Test PATCH /api/admin/update-user/{user_id} - password update and verification"""
        self.log("\n🧪 Testing admin update user password...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        customer_id = self.test_users['customer']['id']
        new_password = "newpassword123"
        
        # Update password
        update_data = {"password": new_password}
        response = self.make_request('PATCH', f'/admin/update-user/{customer_id}', 
                                   update_data, headers=headers)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Failed to update password: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
        
        # Verify new password works by logging in
        login_data = {
            "email": self.test_users['customer']['email'],
            "password": new_password
        }
        
        login_response = self.make_request('POST', '/auth/login', login_data)
        
        if not login_response or login_response.status_code != 200:
            self.log(f"❌ New password doesn't work for login: {login_response.status_code if login_response else 'No response'}")
            if login_response:
                self.log(f"Response: {login_response.text}")
            return False
        
        # Update customer token for future tests
        login_result = login_response.json()
        self.customer_token = login_result.get('token')
        
        self.log("✅ Admin successfully updated user password and it works")
        return True
    
    def test_admin_update_user_multiple_fields(self):
        """Test PATCH /api/admin/update-user/{user_id} - multiple fields at once"""
        self.log("\n🧪 Testing admin update user multiple fields...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        rider_id = self.test_users['rider']['id']
        
        update_data = {
            "name": "Amit Singh Updated",
            "email": "amit.updated@localtokri.com",
            "phone": "+919999888877"
        }
        
        response = self.make_request('PATCH', f'/admin/update-user/{rider_id}', 
                                   update_data, headers=headers)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Failed to update multiple fields: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
        
        result = response.json()
        updated_user = result.get('user')
        
        # Verify all fields were updated
        if (updated_user.get('name') != update_data['name'] or
            updated_user.get('email') != update_data['email'] or
            updated_user.get('phone') != update_data['phone']):
            self.log(f"❌ Not all fields updated correctly: {updated_user}")
            return False
        
        self.log("✅ Admin successfully updated multiple user fields")
        return True
    
    def test_non_admin_cannot_update_users(self):
        """Test that non-admin users cannot access update-user endpoint"""
        self.log("\n🧪 Testing non-admin users cannot update users...")
        
        customer_headers = {"Authorization": f"Bearer {self.customer_token}"}
        vendor_id = self.test_users['vendor']['id']
        
        update_data = {"name": "Unauthorized Update"}
        response = self.make_request('PATCH', f'/admin/update-user/{vendor_id}', 
                                   update_data, headers=customer_headers)
        
        if not response or response.status_code != 403:
            self.log(f"❌ Expected 403 for non-admin access, got {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
        
        self.log("✅ Non-admin users correctly denied access (403)")
        return True
    
    # EXISTING ADMIN ENDPOINTS VERIFICATION
    def test_existing_admin_endpoints(self):
        """Test that existing admin endpoints still work"""
        self.log("\n🧪 Testing existing admin endpoints still work...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test GET /api/admin/customers
        response = self.make_request('GET', '/admin/customers', headers=headers)
        if not response or response.status_code != 200:
            self.log(f"❌ GET /admin/customers failed: {response.status_code if response else 'No response'}")
            return False
        
        customers = response.json()
        if not isinstance(customers, list):
            self.log(f"❌ Expected list from /admin/customers, got {type(customers)}")
            return False
        
        # Test GET /api/admin/vendors
        response = self.make_request('GET', '/admin/vendors', headers=headers)
        if not response or response.status_code != 200:
            self.log(f"❌ GET /admin/vendors failed: {response.status_code if response else 'No response'}")
            return False
        
        vendors = response.json()
        if not isinstance(vendors, list):
            self.log(f"❌ Expected list from /admin/vendors, got {type(vendors)}")
            return False
        
        # Test GET /api/admin/riders
        response = self.make_request('GET', '/admin/riders', headers=headers)
        if not response or response.status_code != 200:
            self.log(f"❌ GET /admin/riders failed: {response.status_code if response else 'No response'}")
            return False
        
        riders = response.json()
        if not isinstance(riders, list):
            self.log(f"❌ Expected list from /admin/riders, got {type(riders)}")
            return False
        
        # Test GET /api/admin/stats
        response = self.make_request('GET', '/admin/stats', headers=headers)
        if not response or response.status_code != 200:
            self.log(f"❌ GET /admin/stats failed: {response.status_code if response else 'No response'}")
            return False
        
        stats = response.json()
        if not isinstance(stats, dict):
            self.log(f"❌ Expected dict from /admin/stats, got {type(stats)}")
            return False
        
        # Test POST /api/admin/add-wallet-money
        customer_id = self.test_users['customer']['id']
        wallet_data = {
            "user_id": customer_id,
            "amount": 100.0,
            "description": "Test admin credit"
        }
        
        response = self.make_request('POST', '/admin/add-wallet-money', wallet_data, headers=headers)
        if not response or response.status_code != 200:
            self.log(f"❌ POST /admin/add-wallet-money failed: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
        
        self.log("✅ All existing admin endpoints working correctly")
        return True
    
    def run_all_tests(self):
        """Run all critical tests in sequence"""
        self.log("🚀 Starting Critical Backend API Tests")
        self.log(f"Backend URL: {self.base_url}")
        
        test_results = {}
        
        # Setup phase
        self.log("\n=== SETUP PHASE ===")
        if not self.setup_test_users():
            self.log("❌ Setup failed: Could not create test users")
            return False
        
        if not self.create_test_order():
            self.log("❌ Setup failed: Could not create test order")
            return False
        
        # PRIORITY 1 TESTS - CRITICAL ROUTE FIX
        self.log("\n=== PRIORITY 1: CRITICAL ROUTE FIX TESTS ===")
        test_results['my_orders_route_fix'] = self.test_my_orders_route_fix()
        test_results['orders_by_id_still_works'] = self.test_orders_by_id_still_works()
        
        # PRIORITY 2 TESTS - ADMIN USER MANAGEMENT
        self.log("\n=== PRIORITY 2: ADMIN USER MANAGEMENT TESTS ===")
        test_results['admin_update_name'] = self.test_admin_update_user_name_only()
        test_results['admin_email_uniqueness'] = self.test_admin_update_user_email_uniqueness()
        test_results['admin_phone_uniqueness'] = self.test_admin_update_user_phone_uniqueness()
        test_results['admin_update_password'] = self.test_admin_update_user_password()
        test_results['admin_update_multiple'] = self.test_admin_update_user_multiple_fields()
        test_results['non_admin_denied'] = self.test_non_admin_cannot_update_users()
        
        # EXISTING ENDPOINTS VERIFICATION
        self.log("\n=== EXISTING ADMIN ENDPOINTS VERIFICATION ===")
        test_results['existing_admin_endpoints'] = self.test_existing_admin_endpoints()
        
        # Results summary
        self.log("\n=== TEST RESULTS SUMMARY ===")
        passed = 0
        total = len(test_results)
        
        priority_1_tests = ['my_orders_route_fix', 'orders_by_id_still_works']
        priority_2_tests = ['admin_update_name', 'admin_email_uniqueness', 'admin_phone_uniqueness', 
                           'admin_update_password', 'admin_update_multiple', 'non_admin_denied']
        
        self.log("\n🔥 PRIORITY 1 - CRITICAL ROUTE FIX:")
        for test_name in priority_1_tests:
            result = test_results.get(test_name, False)
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"  {test_name}: {status}")
            if result:
                passed += 1
        
        self.log("\n🔧 PRIORITY 2 - ADMIN USER MANAGEMENT:")
        for test_name in priority_2_tests:
            result = test_results.get(test_name, False)
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"  {test_name}: {status}")
            if result:
                passed += 1
        
        self.log("\n📋 EXISTING ENDPOINTS:")
        for test_name, result in test_results.items():
            if test_name not in priority_1_tests + priority_2_tests:
                status = "✅ PASS" if result else "❌ FAIL"
                self.log(f"  {test_name}: {status}")
                if result:
                    passed += 1
        
        self.log(f"\n📊 Overall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All critical tests passed!")
            return True
        else:
            self.log("⚠️ Some critical tests failed!")
            return False

if __name__ == "__main__":
    tester = CriticalAPITester()
    success = tester.run_all_tests()
    exit(0 if success else 1)