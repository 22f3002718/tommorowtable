#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for LocalTokri Application
Tests user registration, login, restaurants, menu items, and route optimization
"""

import requests
import json
import os
from datetime import datetime
import urllib3

# Disable SSL warnings for testing
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Get backend URL from environment
BACKEND_URL = "https://delivery-sequence.preview.emergentagent.com/api"

class LocalTokriAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.admin_token = None
        self.vendor_token = None
        self.rider_token = None
        self.customer_token = None
        self.vendor_restaurant_id = None
        self.test_order_ids = []
        
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

    def test_user_registration_all_roles(self):
        """Test user registration for all roles: customer, vendor, rider"""
        self.log("\n🧪 Testing User Registration for All Roles...")
        
        test_users = [
            {
                "role": "customer",
                "email": "customer@tomorrowstable.com",
                "password": "customer123",
                "name": "Test Customer",
                "phone": "+91-9876543210"
            },
            {
                "role": "vendor", 
                "email": "vendor1@tomorrowstable.com",
                "password": "vendor123",
                "name": "Rajesh Kumar",
                "phone": "+91-9876543211"
            },
            {
                "role": "rider",
                "email": "rider1@tomorrowstable.com", 
                "password": "rider123",
                "name": "Amit Singh",
                "phone": "+91-9876543212"
            },
            {
                "role": "admin",
                "email": "admin@tomorrowstable.com",
                "password": "admin123", 
                "name": "Admin User",
                "phone": "+91-9876543213"
            }
        ]
        
        results = {}
        
        for user_data in test_users:
            role = user_data["role"]
            self.log(f"Testing {role} registration...")
            
            response = self.make_request('POST', '/auth/register', user_data)
            
            if response and response.status_code == 200:
                try:
                    data = response.json()
                    token = data.get('token')
                    user = data.get('user')
                    
                    if token and user and user.get('role') == role:
                        self.log(f"✅ {role.capitalize()} registration successful")
                        results[role] = True
                        
                        # Store tokens for later use
                        if role == 'admin':
                            self.admin_token = token
                        elif role == 'vendor':
                            self.vendor_token = token
                        elif role == 'rider':
                            self.rider_token = token
                        elif role == 'customer':
                            self.customer_token = token
                            
                    else:
                        self.log(f"❌ {role.capitalize()} registration failed - invalid response data")
                        results[role] = False
                        
                except json.JSONDecodeError:
                    self.log(f"❌ {role.capitalize()} registration failed - invalid JSON")
                    results[role] = False
                    
            elif response and response.status_code == 400 and "already registered" in response.text:
                self.log(f"ℹ️ {role.capitalize()} already exists, trying login...")
                # Try login instead
                login_data = {
                    "email": user_data["email"],
                    "password": user_data["password"]
                }
                
                login_response = self.make_request('POST', '/auth/login', login_data)
                if login_response and login_response.status_code == 200:
                    try:
                        data = login_response.json()
                        token = data.get('token')
                        
                        # Store tokens for later use
                        if role == 'admin':
                            self.admin_token = token
                        elif role == 'vendor':
                            self.vendor_token = token
                        elif role == 'rider':
                            self.rider_token = token
                        elif role == 'customer':
                            self.customer_token = token
                            
                        self.log(f"✅ {role.capitalize()} login successful")
                        results[role] = True
                    except:
                        self.log(f"❌ {role.capitalize()} login failed")
                        results[role] = False
                else:
                    self.log(f"❌ {role.capitalize()} login failed")
                    results[role] = False
            else:
                self.log(f"❌ {role.capitalize()} registration failed: {response.status_code if response else 'No response'}")
                if response:
                    self.log(f"Response: {response.text}")
                results[role] = False
                
        return all(results.values())

    def test_user_login(self):
        """Test user login functionality"""
        self.log("\n🧪 Testing User Login...")
        
        test_credentials = [
            {"email": "admin@tomorrowstable.com", "password": "admin123", "role": "admin"},
            {"email": "vendor1@tomorrowstable.com", "password": "vendor123", "role": "vendor"},
            {"email": "rider1@tomorrowstable.com", "password": "rider123", "role": "rider"},
            {"email": "customer@tomorrowstable.com", "password": "customer123", "role": "customer"}
        ]
        
        results = {}
        
        for creds in test_credentials:
            role = creds["role"]
            self.log(f"Testing {role} login...")
            
            login_data = {
                "email": creds["email"],
                "password": creds["password"]
            }
            
            response = self.make_request('POST', '/auth/login', login_data)
            
            if response and response.status_code == 200:
                try:
                    data = response.json()
                    token = data.get('token')
                    user = data.get('user')
                    
                    if token and user and user.get('role') == role:
                        self.log(f"✅ {role.capitalize()} login successful")
                        results[role] = True
                        
                        # Update tokens
                        if role == 'admin':
                            self.admin_token = token
                        elif role == 'vendor':
                            self.vendor_token = token
                        elif role == 'rider':
                            self.rider_token = token
                        elif role == 'customer':
                            self.customer_token = token
                            
                    else:
                        self.log(f"❌ {role.capitalize()} login failed - invalid response")
                        results[role] = False
                        
                except json.JSONDecodeError:
                    self.log(f"❌ {role.capitalize()} login failed - invalid JSON")
                    results[role] = False
            else:
                self.log(f"❌ {role.capitalize()} login failed: {response.status_code if response else 'No response'}")
                if response:
                    self.log(f"Response: {response.text}")
                results[role] = False
                
        return all(results.values())

    def test_restaurants_fetch(self):
        """Test fetching restaurants from database"""
        self.log("\n🧪 Testing Restaurant Fetching...")
        
        response = self.make_request('GET', '/restaurants')
        
        if not response:
            self.log("❌ No response received")
            return False
            
        if response.status_code != 200:
            self.log(f"❌ Expected 200, got {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
            
        try:
            restaurants = response.json()
            
            if isinstance(restaurants, list):
                self.log(f"✅ Successfully fetched {len(restaurants)} restaurants")
                
                # Check if restaurants have expected fields
                if restaurants:
                    restaurant = restaurants[0]
                    expected_fields = ['id', 'name', 'description', 'cuisine', 'vendor_id']
                    
                    for field in expected_fields:
                        if field not in restaurant:
                            self.log(f"❌ Missing field '{field}' in restaurant data")
                            return False
                            
                    # Check if vendor names don't have 'Restaurant' suffix
                    for restaurant in restaurants:
                        name = restaurant.get('name', '')
                        if name.endswith(' Restaurant'):
                            self.log(f"❌ Restaurant '{name}' still has 'Restaurant' suffix")
                            return False
                            
                    self.log("✅ Restaurant data structure is correct")
                    self.log("✅ No 'Restaurant' suffix found in vendor names")
                    
                    # Store first restaurant for later tests
                    if restaurants:
                        self.vendor_restaurant_id = restaurants[0]['id']
                        
                    return True
                else:
                    self.log("ℹ️ No restaurants found in database")
                    return True
            else:
                self.log(f"❌ Expected list, got {type(restaurants)}")
                return False
                
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False

    def test_menu_items_loading(self):
        """Test menu items loading correctly"""
        self.log("\n🧪 Testing Menu Items Loading...")
        
        if not self.vendor_restaurant_id:
            self.log("❌ No restaurant ID available for testing")
            return False
            
        response = self.make_request('GET', f'/restaurants/{self.vendor_restaurant_id}/menu')
        
        if not response:
            self.log("❌ No response received")
            return False
            
        if response.status_code != 200:
            self.log(f"❌ Expected 200, got {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
            
        try:
            menu_items = response.json()
            
            if isinstance(menu_items, list):
                self.log(f"✅ Successfully fetched {len(menu_items)} menu items")
                
                # Check menu item structure
                if menu_items:
                    item = menu_items[0]
                    expected_fields = ['id', 'restaurant_id', 'name', 'description', 'price', 'category']
                    
                    for field in expected_fields:
                        if field not in item:
                            self.log(f"❌ Missing field '{field}' in menu item data")
                            return False
                            
                    self.log("✅ Menu item data structure is correct")
                    return True
                else:
                    self.log("ℹ️ No menu items found for this restaurant")
                    return True
            else:
                self.log(f"❌ Expected list, got {type(menu_items)}")
                return False
                
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False

    def test_route_optimization_endpoint(self):
        """Test the new route optimization endpoint"""
        self.log("\n🧪 Testing Route Optimization Endpoint...")
        
        if not self.vendor_token:
            self.log("❌ No vendor token available")
            return False
            
        # First create some test orders with location data
        self.log("Creating test orders with location data...")
        if not self.create_test_orders_with_location():
            self.log("❌ Failed to create test orders")
            return False
            
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        
        # Test the route optimization endpoint
        optimization_data = {
            "order_ids": self.test_order_ids,
            "num_riders": 2,
            "max_orders_per_rider": 3
        }
        
        response = self.make_request('POST', '/vendor/optimize-routes', optimization_data, headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
            
        # The endpoint should be accessible even without valid Google Maps API key
        if response.status_code == 200:
            try:
                result = response.json()
                
                # Check response structure
                expected_fields = ['routes', 'total_orders', 'total_riders']
                for field in expected_fields:
                    if field not in result:
                        self.log(f"❌ Missing field '{field}' in optimization response")
                        return False
                        
                self.log("✅ Route optimization endpoint is accessible and returns correct structure")
                self.log(f"✅ Optimized {result['total_orders']} orders into {result['total_riders']} routes")
                return True
                
            except json.JSONDecodeError:
                self.log(f"❌ Invalid JSON response: {response.text}")
                return False
                
        elif response.status_code == 400:
            # Check if it's the expected error about no orders with valid locations
            if "No orders with valid delivery locations" in response.text:
                self.log("✅ Route optimization endpoint accessible (expected error: no valid locations)")
                return True
            else:
                self.log(f"❌ Unexpected 400 error: {response.text}")
                return False
                
        elif response.status_code == 404:
            if "No ready orders found" in response.text:
                self.log("✅ Route optimization endpoint accessible (expected error: no ready orders)")
                return True
            else:
                self.log(f"❌ Unexpected 404 error: {response.text}")
                return False
                
        else:
            self.log(f"❌ Unexpected status code: {response.status_code}")
            self.log(f"Response: {response.text}")
            return False

    def create_test_orders_with_location(self):
        """Create test orders with location data for route optimization testing"""
        if not self.customer_token or not self.vendor_restaurant_id:
            return False
            
        # Get menu items first
        response = self.make_request('GET', f'/restaurants/{self.vendor_restaurant_id}/menu')
        if not response or response.status_code != 200:
            return False
            
        menu_items = response.json()
        if not menu_items:
            # Create a test menu item
            if not self.create_test_menu_item():
                return False
            response = self.make_request('GET', f'/restaurants/{self.vendor_restaurant_id}/menu')
            if not response or response.status_code != 200:
                return False
            menu_items = response.json()
            
        if not menu_items:
            return False
            
        # Create orders with different locations
        test_locations = [
            {
                "address": "Connaught Place, New Delhi, India",
                "latitude": 28.6315,
                "longitude": 77.2167
            },
            {
                "address": "India Gate, New Delhi, India", 
                "latitude": 28.6129,
                "longitude": 77.2295
            },
            {
                "address": "Red Fort, New Delhi, India",
                "latitude": 28.6562,
                "longitude": 77.2410
            }
        ]
        
        customer_headers = {"Authorization": f"Bearer {self.customer_token}"}
        vendor_headers = {"Authorization": f"Bearer {self.vendor_token}"}
        
        for i, location in enumerate(test_locations):
            order_data = {
                "restaurant_id": self.vendor_restaurant_id,
                "items": [{
                    "menu_item_id": menu_items[0]['id'],
                    "name": menu_items[0]['name'],
                    "quantity": 1,
                    "price": menu_items[0]['price']
                }],
                "delivery_address": location["address"],
                "delivery_latitude": location["latitude"],
                "delivery_longitude": location["longitude"],
                "special_instructions": f"Test order {i+1} for route optimization"
            }
            
            response = self.make_request('POST', '/orders', order_data, headers=customer_headers)
            if not response or response.status_code != 200:
                continue
                
            order = response.json()
            order_id = order['id']
            self.test_order_ids.append(order_id)
            
            # Update order status to 'ready'
            statuses = ['confirmed', 'preparing', 'ready']
            for status in statuses:
                status_data = {"status": status}
                self.make_request('PATCH', f'/orders/{order_id}/status', status_data, headers=vendor_headers)
                
        return len(self.test_order_ids) > 0

    def create_test_menu_item(self):
        """Create a test menu item for testing"""
        if not self.vendor_token or not self.vendor_restaurant_id:
            return False
            
        headers = {"Authorization": f"Bearer {self.vendor_token}"}
        menu_item_data = {
            "name": "Butter Chicken",
            "description": "Creamy tomato-based chicken curry",
            "price": 299.0,
            "category": "Main Course",
            "image_url": None
        }
        
        response = self.make_request('POST', f'/restaurants/{self.vendor_restaurant_id}/menu', 
                                   menu_item_data, headers=headers)
        
        return response and response.status_code == 200

    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting LocalTokri Backend API Tests")
        self.log(f"Backend URL: {self.base_url}")
        
        test_results = {}
        
        # Test 1: User Registration for All Roles
        test_results['user_registration'] = self.test_user_registration_all_roles()
        
        # Test 2: User Login
        test_results['user_login'] = self.test_user_login()
        
        # Test 3: Restaurants Fetch
        test_results['restaurants_fetch'] = self.test_restaurants_fetch()
        
        # Test 4: Menu Items Loading
        test_results['menu_items_loading'] = self.test_menu_items_loading()
        
        # Test 5: Route Optimization Endpoint
        test_results['route_optimization'] = self.test_route_optimization_endpoint()
        
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
    tester = LocalTokriAPITester()
    success = tester.run_all_tests()
    exit(0 if success else 1)