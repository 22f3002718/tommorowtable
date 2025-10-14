#!/usr/bin/env python3
"""
Detailed test for route optimization endpoint
"""

import requests
import json
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BACKEND_URL = "https://auth-mobilize.preview.emergentagent.com/api"

def test_route_optimization():
    """Test route optimization endpoint accessibility"""
    
    # Login as vendor
    login_data = {
        "email": "vendor1@tomorrowstable.com",
        "password": "vendor123"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/auth/login",
            json=login_data,
            timeout=30,
            verify=False
        )
        
        if response.status_code != 200:
            print(f"❌ Vendor login failed: {response.status_code}")
            return False
            
        vendor_token = response.json().get('token')
        print(f"✅ Vendor login successful")
        
        # Test route optimization endpoint
        headers = {"Authorization": f"Bearer {vendor_token}"}
        
        # Test with empty order list (should fail gracefully)
        optimization_data = {
            "order_ids": [],
            "num_riders": 2,
            "max_orders_per_rider": 3
        }
        
        print("\n🧪 Testing route optimization with empty order list...")
        response = requests.post(
            f"{BACKEND_URL}/vendor/optimize-routes",
            json=optimization_data,
            headers=headers,
            timeout=30,
            verify=False
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 404 and "No ready orders found" in response.text:
            print("✅ Route optimization endpoint accessible (expected error for empty orders)")
        elif response.status_code == 400:
            print("✅ Route optimization endpoint accessible (validation error as expected)")
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            
        # Test with invalid order IDs
        print("\n🧪 Testing route optimization with invalid order IDs...")
        optimization_data = {
            "order_ids": ["invalid-id-1", "invalid-id-2"],
            "num_riders": 2,
            "max_orders_per_rider": 3
        }
        
        response = requests.post(
            f"{BACKEND_URL}/vendor/optimize-routes",
            json=optimization_data,
            headers=headers,
            timeout=30,
            verify=False
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code in [404, 400]:
            print("✅ Route optimization endpoint accessible (expected error for invalid IDs)")
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            
        # Test without authentication
        print("\n🧪 Testing route optimization without authentication...")
        response = requests.post(
            f"{BACKEND_URL}/vendor/optimize-routes",
            json=optimization_data,
            timeout=30,
            verify=False
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 401:
            print("✅ Route optimization endpoint correctly requires authentication")
        else:
            print(f"❌ Expected 401, got {response.status_code}")
            
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    test_route_optimization()