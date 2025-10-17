#!/usr/bin/env python3
"""
Backend API Tests for Role-Specific Order Endpoints
Tests the new role-specific endpoints that were added to fix 404 errors in React Native app
"""

import requests
import json
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "http://localhost:8001/api"

class RoleSpecificEndpointsTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.customer_token = None
        self.vendor_token = None
        self.rider_token = None
        self.customer_id = None
        self.vendor_id = None
        self.rider_id = None
        self.restaurant_id = None
        self.menu_item_id = None
        self.order_id = None
        
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
    
    def create_users(self):
        """Create customer, vendor, and rider users"""
        self.log("👥 Creating test users...")
        
        # Create customer
        customer_data = {
            "email": "customer@localtokri.com",
            "password": "customer123",
            "name": "Priya Sharma",
            "role": "customer",
            "phone": "+919876543210"
        }
        
        response = self.make_request('POST', '/auth/register', customer_data)
        if response and response.status_code == 200:
            data = response.json()
            self.customer_token = data.get('token')
            self.customer_id = data.get('user', {}).get('id')
            self.log(f"✅ Customer created: {customer_data['name']}")
        else:
            # Try login if already exists
            login_data = {"email": customer_data["email"], "password": customer_data["password"]}
            response = self.make_request('POST', '/auth/login', login_data)
            if response and response.status_code == 200:
                data = response.json()
                self.customer_token = data.get('token')
                self.customer_id = data.get('user', {}).get('id')
                self.log(f"✅ Customer logged in: {customer_data['name']}")
            else:
                self.log(f"❌ Failed to create/login customer")
                return False
        
        # Create vendor
        vendor_data = {
            "email": "vendor@localtokri.com",
            "password": "vendor123",
            "name": "Rajesh Kumar",
            "role": "vendor",
            "phone": "+919876543211"
        }
        
        response = self.make_request('POST', '/auth/register', vendor_data)
        if response and response.status_code == 200:
            data = response.json()
            self.vendor_token = data.get('token')
            self.vendor_id = data.get('user', {}).get('id')
            self.log(f"✅ Vendor created: {vendor_data['name']}")
        else:
            # Try login if already exists
            login_data = {"email": vendor_data["email"], "password": vendor_data["password"]}
            response = self.make_request('POST', '/auth/login', login_data)
            if response and response.status_code == 200:
                data = response.json()
                self.vendor_token = data.get('token')
                self.vendor_id = data.get('user', {}).get('id')
                self.log(f"✅ Vendor logged in: {vendor_data['name']}")
            else:
                self.log(f"❌ Failed to create/login vendor")
                return False
        
        # Create rider
        rider_data = {
            "email": "rider@localtokri.com",
            "password": "rider123",
            "name": "Amit Singh",
            "role": "rider",
            "phone": "+919876543212"
        }
        
        response = self.make_request('POST', '/auth/register', rider_data)
        if response and response.status_code == 200:
            data = response.json()
            self.rider_token = data.get('token')
            self.rider_id = data.get('user', {}).get('id')
            self.log(f"✅ Rider created: {rider_data['name']}")
        else:
            # Try login if already exists
            login_data = {"email": rider_data["email"], "password": rider_data["password"]}
            response = self.make_request('POST', '/auth/login', login_data)
            if response and response.status_code == 200:
                data = response.json()
                self.rider_token = data.get('token')
                self.rider_id = data.get('user', {}).get('id')
                self.log(f"✅ Rider logged in: {rider_data['name']}")
            else:
                self.log(f"❌ Failed to create/login rider")
                return False
        
        return True
    
    def setup_restaurant_and_menu(self):
        """Get vendor's restaurant and add menu items"""
        self.log("🏪 Setting up restaurant and menu...")
        
        # Get vendor's restaurant (auto-created during registration)
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        response = self.make_request('GET', '/vendor/restaurant', headers=headers)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Failed to get vendor restaurant: {response.status_code if response else 'No response'}")
            return False
        
        restaurant = response.json()
        self.restaurant_id = restaurant.get('id')
        self.log(f"✅ Got restaurant: {restaurant.get('name')} (ID: {self.restaurant_id})")
        
        # Add a menu item
        menu_item_data = {
            "name": "Butter Chicken",
            "description": "Creamy tomato-based chicken curry with aromatic spices",
            "price": 299.0,
            "category": "Main Course",
            "image_url": "https://example.com/butter-chicken.jpg"
        }
        
        response = self.make_request('POST', f'/restaurants/{self.restaurant_id}/menu', menu_item_data, headers=headers)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Failed to add menu item: {response.status_code if response else 'No response'}")
            return False
        
        menu_item = response.json()
        self.menu_item_id = menu_item.get('id')
        self.log(f"✅ Added menu item: {menu_item.get('name')} (₹{menu_item.get('price')})")
        
        return True
    
    def add_wallet_money(self):
        """Add money to customer wallet for order creation"""
        self.log("💰 Adding money to customer wallet...")
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        wallet_data = {"amount": 1000.0}
        
        response = self.make_request('POST', '/wallet/add-money', wallet_data, headers=headers)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Failed to add wallet money: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
        
        result = response.json()
        self.log(f"✅ Added ₹{wallet_data['amount']} to wallet. New balance: ₹{result.get('new_balance')}")
        return True
    
    def create_test_order(self):
        """Create an order as customer"""
        self.log("📦 Creating test order...")
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        order_data = {
            "restaurant_id": self.restaurant_id,
            "items": [{
                "menu_item_id": self.menu_item_id,
                "name": "Butter Chicken",
                "quantity": 2,
                "price": 299.0
            }],
            "delivery_address": "A-101, Sunrise Apartments, Bandra West, Mumbai, Maharashtra 400050",
            "delivery_latitude": 19.0596,
            "delivery_longitude": 72.8295,
            "special_instructions": "Please call before delivery"
        }
        
        response = self.make_request('POST', '/orders', order_data, headers=headers)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Failed to create order: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
        
        order = response.json()
        self.order_id = order.get('id')
        self.log(f"✅ Order created: {self.order_id} (Total: ₹{order.get('total_amount')})")
        return True
    
    def test_customer_my_orders(self):
        """Test GET /api/orders/my-orders for customer"""
        self.log("\n🧪 Testing GET /api/orders/my-orders (customer)...")
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        response = self.make_request('GET', '/orders/my-orders', headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
        
        if response.status_code == 404:
            self.log("❌ 404 Error - Endpoint not found!")
            return False
        
        if response.status_code != 200:
            self.log(f"❌ Expected 200, got {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
        
        try:
            orders = response.json()
            self.log(f"✅ Got {len(orders)} orders for customer")
            
            # Verify our test order is in the list
            order_found = any(order.get('id') == self.order_id for order in orders)
            if order_found:
                self.log("✅ Test order found in customer's orders")
                return True
            else:
                self.log("❌ Test order not found in customer's orders")
                return False
                
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def test_vendor_orders(self):
        """Test GET /api/vendor/orders for vendor"""
        self.log("\n🧪 Testing GET /api/vendor/orders (vendor)...")
        
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        response = self.make_request('GET', '/vendor/orders', headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
        
        if response.status_code == 404:
            self.log("❌ 404 Error - Endpoint not found!")
            return False
        
        if response.status_code != 200:
            self.log(f"❌ Expected 200, got {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
        
        try:
            orders = response.json()
            self.log(f"✅ Got {len(orders)} orders for vendor")
            
            # Verify our test order is in the list
            order_found = any(order.get('id') == self.order_id for order in orders)
            if order_found:
                self.log("✅ Test order found in vendor's orders")
                return True
            else:
                self.log("❌ Test order not found in vendor's orders")
                return False
                
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def test_vendor_order_status_update(self):
        """Test PATCH /api/vendor/orders/{order_id}/status"""
        self.log("\n🧪 Testing PATCH /api/vendor/orders/{order_id}/status (vendor)...")
        
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        status_data = {"status": "confirmed"}
        
        response = self.make_request('PATCH', f'/vendor/orders/{self.order_id}/status', status_data, headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
        
        if response.status_code == 404:
            self.log("❌ 404 Error - Endpoint not found!")
            return False
        
        if response.status_code != 200:
            self.log(f"❌ Expected 200, got {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
        
        try:
            result = response.json()
            self.log(f"✅ Order status updated: {result.get('status')}")
            return True
                
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def test_rider_orders(self):
        """Test GET /api/rider/orders for rider"""
        self.log("\n🧪 Testing GET /api/rider/orders (rider)...")
        
        headers = {"Authorization": f"Bearer {self.rider_token}"}
        response = self.make_request('GET', '/rider/orders', headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
        
        if response.status_code == 404:
            self.log("❌ 404 Error - Endpoint not found!")
            return False
        
        if response.status_code != 200:
            self.log(f"❌ Expected 200, got {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
        
        try:
            orders = response.json()
            self.log(f"✅ Got {len(orders)} orders for rider (should be 0 initially)")
            return True
                
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def assign_order_to_rider(self):
        """Assign the test order to rider for testing rider endpoints"""
        self.log("🏍️ Assigning order to rider...")
        
        # First update order to 'ready' status
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        status_data = {"status": "ready"}
        
        response = self.make_request('PATCH', f'/vendor/orders/{self.order_id}/status', status_data, headers=headers)
        if not response or response.status_code != 200:
            self.log("❌ Failed to update order to ready status")
            return False
        
        # Assign rider to order
        assignment_data = {"rider_id": self.rider_id}
        response = self.make_request('PATCH', f'/orders/{self.order_id}/assign-rider', assignment_data, headers=headers)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Failed to assign rider: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
        
        self.log("✅ Order assigned to rider")
        return True
    
    def test_rider_orders_after_assignment(self):
        """Test GET /api/rider/orders after assignment"""
        self.log("\n🧪 Testing GET /api/rider/orders after assignment...")
        
        headers = {"Authorization": f"Bearer {self.rider_token}"}
        response = self.make_request('GET', '/rider/orders', headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
        
        if response.status_code == 404:
            self.log("❌ 404 Error - Endpoint not found!")
            return False
        
        if response.status_code != 200:
            self.log(f"❌ Expected 200, got {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
        
        try:
            orders = response.json()
            self.log(f"✅ Got {len(orders)} orders for rider")
            
            # Verify our test order is in the list
            order_found = any(order.get('id') == self.order_id for order in orders)
            if order_found:
                self.log("✅ Test order found in rider's orders")
                return True
            else:
                self.log("❌ Test order not found in rider's orders")
                return False
                
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def test_rider_order_status_update(self):
        """Test PATCH /api/rider/orders/{order_id}/status"""
        self.log("\n🧪 Testing PATCH /api/rider/orders/{order_id}/status (rider)...")
        
        headers = {"Authorization": f"Bearer {self.rider_token}"}
        status_data = {"status": "delivered"}
        
        response = self.make_request('PATCH', f'/rider/orders/{self.order_id}/status', status_data, headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
        
        if response.status_code == 404:
            self.log("❌ 404 Error - Endpoint not found!")
            return False
        
        if response.status_code != 200:
            self.log(f"❌ Expected 200, got {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
        
        try:
            result = response.json()
            self.log(f"✅ Order status updated by rider: {result.get('status')}")
            return True
                
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def test_location_update_with_building_details(self):
        """Test PATCH /api/auth/update-location with house_number and building_name"""
        self.log("\n🧪 Testing PATCH /api/auth/update-location with building details...")
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        location_data = {
            "address": "B-202, Ocean View Towers, Juhu Beach, Mumbai, Maharashtra 400049",
            "latitude": 19.1075,
            "longitude": 72.8263,
            "house_number": "B-202",
            "building_name": "Ocean View Towers"
        }
        
        response = self.make_request('PATCH', '/auth/update-location', location_data, headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
        
        if response.status_code == 404:
            self.log("❌ 404 Error - Endpoint not found!")
            return False
        
        if response.status_code != 200:
            self.log(f"❌ Expected 200, got {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
        
        try:
            result = response.json()
            self.log(f"✅ Location updated with building details: {result.get('message')}")
            
            # Verify the update by getting user profile
            profile_response = self.make_request('GET', '/auth/me', headers=headers)
            if profile_response and profile_response.status_code == 200:
                profile = profile_response.json()
                if (profile.get('house_number') == location_data['house_number'] and 
                    profile.get('building_name') == location_data['building_name']):
                    self.log("✅ Building details correctly saved in user profile")
                    return True
                else:
                    self.log("❌ Building details not saved correctly")
                    return False
            else:
                self.log("❌ Failed to verify location update")
                return False
                
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def test_restaurant_image_update(self):
        """Test PATCH /api/vendor/restaurant/image"""
        self.log("\n🧪 Testing PATCH /api/vendor/restaurant/image...")
        
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        image_data = {
            "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"
        }
        
        response = self.make_request('PATCH', '/vendor/restaurant/image', image_data, headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
        
        if response.status_code == 404:
            self.log("❌ 404 Error - Endpoint not found!")
            return False
        
        if response.status_code != 200:
            self.log(f"❌ Expected 200, got {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
        
        try:
            result = response.json()
            self.log(f"✅ Restaurant image updated: {result.get('message')}")
            
            # Verify the update by getting restaurant details
            restaurant_response = self.make_request('GET', '/vendor/restaurant', headers=headers)
            if restaurant_response and restaurant_response.status_code == 200:
                restaurant = restaurant_response.json()
                if restaurant.get('image_url') == image_data['image_url']:
                    self.log("✅ Restaurant image URL correctly updated")
                    return True
                else:
                    self.log("❌ Restaurant image URL not updated correctly")
                    return False
            else:
                self.log("❌ Failed to verify restaurant image update")
                return False
                
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def run_all_tests(self):
        """Run all role-specific endpoint tests"""
        self.log("🚀 Starting Role-Specific Endpoints Tests")
        self.log(f"Backend URL: {self.base_url}")
        
        test_results = {}
        
        # Setup phase
        self.log("\n=== SETUP PHASE ===")
        
        if not self.create_users():
            self.log("❌ Setup failed: Could not create users")
            return False
        
        if not self.setup_restaurant_and_menu():
            self.log("❌ Setup failed: Could not setup restaurant and menu")
            return False
        
        if not self.add_wallet_money():
            self.log("❌ Setup failed: Could not add wallet money")
            return False
        
        if not self.create_test_order():
            self.log("❌ Setup failed: Could not create test order")
            return False
        
        # Test phase
        self.log("\n=== TESTING ROLE-SPECIFIC ENDPOINTS ===")
        
        # Test customer endpoints
        test_results['customer_my_orders'] = self.test_customer_my_orders()
        
        # Test vendor endpoints
        test_results['vendor_orders'] = self.test_vendor_orders()
        test_results['vendor_order_status_update'] = self.test_vendor_order_status_update()
        
        # Test rider endpoints (initially empty)
        test_results['rider_orders_empty'] = self.test_rider_orders()
        
        # Assign order to rider and test again
        if self.assign_order_to_rider():
            test_results['rider_orders_after_assignment'] = self.test_rider_orders_after_assignment()
            test_results['rider_order_status_update'] = self.test_rider_order_status_update()
        else:
            test_results['rider_orders_after_assignment'] = False
            test_results['rider_order_status_update'] = False
        
        # Test location update with building details
        test_results['location_update_building_details'] = self.test_location_update_with_building_details()
        
        # Test restaurant image update
        test_results['restaurant_image_update'] = self.test_restaurant_image_update()
        
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
            self.log("🎉 All role-specific endpoint tests passed!")
            return True
        else:
            self.log("⚠️ Some tests failed!")
            return False

if __name__ == "__main__":
    tester = RoleSpecificEndpointsTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)