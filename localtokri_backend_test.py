#!/usr/bin/env python3
"""
Backend API Tests for LocalTokri Food Delivery App
Tests the specific backend changes requested:
1. Vendor Registration - No Restaurant Suffix
2. User Location Update Endpoint
3. Order Creation with Location
"""

import requests
import json
import os
from datetime import datetime
import uuid

# Get backend URL from environment
BACKEND_URL = "https://localtokri.preview.emergentagent.com/api"

class LocalTokriAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.vendor_token = None
        self.customer_token = None
        self.vendor_restaurant_id = None
        self.test_order_id = None
        self.vendor_name = "Rajesh Kumar"  # Real-looking vendor name
        self.customer_name = "Priya Sharma"  # Real-looking customer name
        
    def log(self, message):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")
        
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        try:
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            
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
            
    def test_vendor_registration_no_suffix(self):
        """Test 1: Vendor Registration - Verify restaurant name has NO 'Restaurant' suffix"""
        self.log("\n🧪 Test 1: Vendor Registration - No Restaurant Suffix")
        
        # Generate unique email to avoid conflicts
        unique_id = str(uuid.uuid4())[:8]
        vendor_email = f"vendor_{unique_id}@localtokri.com"
        
        register_data = {
            "email": vendor_email,
            "password": "vendor123",
            "name": self.vendor_name,
            "role": "vendor",
            "phone": "+919876543210"
        }
        
        self.log(f"Registering vendor: {self.vendor_name}")
        response = self.make_request('POST', '/auth/register', register_data)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Vendor registration failed: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
            
        try:
            data = response.json()
            self.vendor_token = data.get('token')
            self.log(f"✅ Vendor registered successfully")
            
            # Now get the auto-created restaurant
            headers = {"Authorization": f"Bearer {self.vendor_token}"}
            restaurant_response = self.make_request('GET', '/vendor/restaurant', headers=headers)
            
            if not restaurant_response or restaurant_response.status_code != 200:
                self.log(f"❌ Failed to get vendor restaurant: {restaurant_response.status_code if restaurant_response else 'No response'}")
                return False
                
            restaurant_data = restaurant_response.json()
            restaurant_name = restaurant_data.get('name')
            self.vendor_restaurant_id = restaurant_data.get('id')
            
            self.log(f"Restaurant name: '{restaurant_name}'")
            self.log(f"Vendor name: '{self.vendor_name}'")
            
            # Check that restaurant name is exactly the vendor name (no suffix)
            if restaurant_name != self.vendor_name:
                self.log(f"❌ Restaurant name mismatch. Expected: '{self.vendor_name}', Got: '{restaurant_name}'")
                return False
                
            # Specifically check it doesn't have "Restaurant" suffix
            if "Restaurant" in restaurant_name:
                self.log(f"❌ Restaurant name contains 'Restaurant' suffix: '{restaurant_name}'")
                return False
                
            self.log(f"✅ Restaurant name correctly uses vendor name without suffix: '{restaurant_name}'")
            return True
            
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
            
    def setup_customer_account(self):
        """Setup customer account for location and order tests"""
        self.log("🔐 Setting up customer account...")
        
        # Generate unique email
        unique_id = str(uuid.uuid4())[:8]
        customer_email = f"customer_{unique_id}@localtokri.com"
        
        register_data = {
            "email": customer_email,
            "password": "customer123",
            "name": self.customer_name,
            "role": "customer",
            "phone": "+919123456789"
        }
        
        response = self.make_request('POST', '/auth/register', register_data)
        if response and response.status_code == 200:
            data = response.json()
            self.customer_token = data.get('token')
            self.log(f"✅ Customer registered: {self.customer_name}")
            return True
        else:
            self.log(f"❌ Customer registration failed")
            return False
            
    def test_location_update_endpoint(self):
        """Test 2: User Location Update Endpoint"""
        self.log("\n🧪 Test 2: User Location Update Endpoint")
        
        if not self.customer_token:
            self.log("❌ No customer token available")
            return False
            
        # Test location data (Mumbai coordinates)
        location_data = {
            "address": "123 Test Street, Mumbai, India",
            "latitude": 19.0760,
            "longitude": 72.8777
        }
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        self.log(f"Updating location: {location_data['address']}")
        
        response = self.make_request('PATCH', '/auth/update-location', location_data, headers=headers)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Location update failed: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
            
        try:
            result = response.json()
            self.log(f"✅ Location update response: {result}")
            
            # Verify the location was actually saved by getting user profile
            profile_response = self.make_request('GET', '/auth/me', headers=headers)
            
            if not profile_response or profile_response.status_code != 200:
                self.log(f"❌ Failed to get user profile for verification")
                return False
                
            profile_data = profile_response.json()
            
            # Check if location fields are present and correct
            saved_address = profile_data.get('address')
            saved_latitude = profile_data.get('latitude')
            saved_longitude = profile_data.get('longitude')
            
            if saved_address != location_data['address']:
                self.log(f"❌ Address not saved correctly. Expected: '{location_data['address']}', Got: '{saved_address}'")
                return False
                
            if saved_latitude != location_data['latitude']:
                self.log(f"❌ Latitude not saved correctly. Expected: {location_data['latitude']}, Got: {saved_latitude}")
                return False
                
            if saved_longitude != location_data['longitude']:
                self.log(f"❌ Longitude not saved correctly. Expected: {location_data['longitude']}, Got: {saved_longitude}")
                return False
                
            self.log(f"✅ Location fields correctly saved in user document:")
            self.log(f"   Address: {saved_address}")
            self.log(f"   Latitude: {saved_latitude}")
            self.log(f"   Longitude: {saved_longitude}")
            return True
            
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
            
    def test_order_creation_with_location(self):
        """Test 3: Order Creation with Location"""
        self.log("\n🧪 Test 3: Order Creation with Location")
        
        if not self.customer_token or not self.vendor_restaurant_id:
            self.log("❌ Missing customer token or restaurant ID")
            return False
            
        # First, create a menu item for the restaurant
        self.log("📝 Creating test menu item...")
        vendor_headers = {"Authorization": f"Bearer {self.vendor_token}"}
        
        menu_item_data = {
            "name": "Butter Chicken",
            "description": "Creamy and delicious butter chicken",
            "price": 299.0,
            "category": "Main Course"
        }
        
        menu_response = self.make_request('POST', f'/restaurants/{self.vendor_restaurant_id}/menu', 
                                        menu_item_data, headers=vendor_headers)
        
        if not menu_response or menu_response.status_code != 200:
            self.log(f"❌ Failed to create menu item")
            return False
            
        menu_item = menu_response.json()
        self.log(f"✅ Menu item created: {menu_item['name']}")
        
        # Now create order with location data
        customer_headers = {"Authorization": f"Bearer {self.customer_token}"}
        
        order_data = {
            "restaurant_id": self.vendor_restaurant_id,
            "items": [{
                "menu_item_id": menu_item['id'],
                "name": menu_item['name'],
                "quantity": 2,
                "price": menu_item['price']
            }],
            "delivery_address": "456 Delivery Street, Mumbai, India",
            "delivery_latitude": 19.0825,
            "delivery_longitude": 72.8811,
            "special_instructions": "Please call before delivery"
        }
        
        self.log(f"Creating order with location: lat={order_data['delivery_latitude']}, lng={order_data['delivery_longitude']}")
        
        response = self.make_request('POST', '/orders', order_data, headers=customer_headers)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Order creation failed: {response.status_code if response else 'No response'}")
            if response:
                self.log(f"Response: {response.text}")
            return False
            
        try:
            order = response.json()
            self.test_order_id = order['id']
            
            # Verify location fields are present in the order
            saved_lat = order.get('delivery_latitude')
            saved_lng = order.get('delivery_longitude')
            saved_address = order.get('delivery_address')
            
            if saved_lat != order_data['delivery_latitude']:
                self.log(f"❌ Delivery latitude not saved. Expected: {order_data['delivery_latitude']}, Got: {saved_lat}")
                return False
                
            if saved_lng != order_data['delivery_longitude']:
                self.log(f"❌ Delivery longitude not saved. Expected: {order_data['delivery_longitude']}, Got: {saved_lng}")
                return False
                
            if saved_address != order_data['delivery_address']:
                self.log(f"❌ Delivery address not saved. Expected: '{order_data['delivery_address']}', Got: '{saved_address}'")
                return False
                
            self.log(f"✅ Order created successfully with location data:")
            self.log(f"   Order ID: {order['id']}")
            self.log(f"   Delivery Address: {saved_address}")
            self.log(f"   Delivery Coordinates: ({saved_lat}, {saved_lng})")
            self.log(f"   Total Amount: ₹{order['total_amount']}")
            
            # Verify order can be retrieved with location data intact
            order_response = self.make_request('GET', f'/orders/{self.test_order_id}', headers=customer_headers)
            
            if not order_response or order_response.status_code != 200:
                self.log(f"❌ Failed to retrieve created order")
                return False
                
            retrieved_order = order_response.json()
            
            if (retrieved_order.get('delivery_latitude') != order_data['delivery_latitude'] or
                retrieved_order.get('delivery_longitude') != order_data['delivery_longitude']):
                self.log(f"❌ Location data not persisted correctly in database")
                return False
                
            self.log(f"✅ Order location data persisted correctly in database")
            return True
            
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
            
    def test_authentication_required(self):
        """Test that location update requires authentication"""
        self.log("\n🧪 Test: Location Update Authentication Required")
        
        location_data = {
            "address": "Unauthorized Test",
            "latitude": 19.0760,
            "longitude": 72.8777
        }
        
        # Try without authorization header
        response = self.make_request('PATCH', '/auth/update-location', location_data)
        
        if not response:
            self.log(f"❌ No response received for unauthorized request")
            return False
            
        if response.status_code != 401:
            self.log(f"❌ Expected 401 for unauthorized request, got {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
            
        self.log(f"✅ Location update correctly requires authentication (401)")
        return True
        
    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting LocalTokri Backend API Tests")
        self.log(f"Backend URL: {self.base_url}")
        
        test_results = {}
        
        # Test 1: Vendor Registration - No Restaurant Suffix
        test_results['vendor_registration_no_suffix'] = self.test_vendor_registration_no_suffix()
        
        # Setup customer for remaining tests
        if not self.setup_customer_account():
            self.log("❌ Failed to setup customer account")
            return False
            
        # Test 2: User Location Update Endpoint
        test_results['location_update_endpoint'] = self.test_location_update_endpoint()
        
        # Test 3: Order Creation with Location
        test_results['order_creation_with_location'] = self.test_order_creation_with_location()
        
        # Test 4: Authentication Required
        test_results['authentication_required'] = self.test_authentication_required()
        
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
            self.log("🎉 All LocalTokri backend tests passed!")
            return True
        else:
            self.log("⚠️ Some tests failed!")
            return False

if __name__ == "__main__":
    tester = LocalTokriAPITester()
    success = tester.run_all_tests()
    exit(0 if success else 1)