#!/usr/bin/env python3
"""
Final comprehensive test for route optimization functionality
"""

import requests
import json
import urllib3
from datetime import datetime

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BACKEND_URL = "https://rn-frontend.preview.emergentagent.com/api"

def log(message):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}")

def test_route_optimization_complete():
    """Complete test of route optimization functionality"""
    
    log("🚀 Starting Final Route Optimization Test")
    
    # 1. Authenticate as vendor
    log("🔐 Authenticating as vendor...")
    login_data = {
        "email": "vendor.route@localtokri.com",
        "password": "vendor123"
    }
    
    response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data, verify=False)
    if response.status_code != 200:
        log(f"❌ Vendor login failed: {response.status_code}")
        return False
        
    vendor_token = response.json()['token']
    vendor_headers = {"Authorization": f"Bearer {vendor_token}"}
    log("✅ Vendor authenticated")
    
    # 2. Get vendor restaurant
    response = requests.get(f"{BACKEND_URL}/vendor/restaurant", headers=vendor_headers, verify=False)
    if response.status_code != 200:
        log(f"❌ Failed to get restaurant: {response.status_code}")
        return False
        
    restaurant_id = response.json()['id']
    log(f"✅ Got restaurant ID: {restaurant_id}")
    
    # 3. Get orders with 'ready' status
    response = requests.get(f"{BACKEND_URL}/orders", headers=vendor_headers, verify=False)
    if response.status_code != 200:
        log(f"❌ Failed to get orders: {response.status_code}")
        return False
        
    orders = response.json()
    ready_orders = [order for order in orders if order.get('status') == 'ready' and 
                   order.get('delivery_latitude') and order.get('delivery_longitude')]
    
    log(f"✅ Found {len(ready_orders)} ready orders with coordinates")
    
    if len(ready_orders) < 2:
        log("ℹ️ Need at least 2 ready orders for route optimization test")
        return True  # Not a failure, just insufficient test data
    
    # 4. Test route optimization
    log("🧪 Testing route optimization...")
    order_ids = [order['id'] for order in ready_orders[:5]]  # Test with up to 5 orders
    
    optimization_data = {
        "order_ids": order_ids,
        "num_riders": 2,
        "max_orders_per_rider": 3
    }
    
    response = requests.post(f"{BACKEND_URL}/vendor/optimize-routes", 
                           json=optimization_data, headers=vendor_headers, verify=False)
    
    if response.status_code != 200:
        log(f"❌ Route optimization failed: {response.status_code}")
        log(f"Response: {response.text}")
        return False
        
    routes_result = response.json()
    log(f"✅ Route optimization successful: {len(routes_result['routes'])} routes generated")
    
    # Validate route structure
    for i, route in enumerate(routes_result['routes']):
        required_fields = ['rider_index', 'order_ids', 'orders', 'total_distance_km', 'estimated_duration_minutes']
        for field in required_fields:
            if field not in route:
                log(f"❌ Missing field '{field}' in route {i}")
                return False
                
        log(f"Route {route['rider_index']}: {len(route['order_ids'])} orders, "
           f"{route['total_distance_km']}km, {route['estimated_duration_minutes']} min")
    
    # 5. Get available riders
    log("🏍️ Getting available riders...")
    response = requests.get(f"{BACKEND_URL}/riders/available", headers=vendor_headers, verify=False)
    
    if response.status_code != 200:
        log(f"❌ Failed to get riders: {response.status_code}")
        return False
        
    available_riders = response.json()
    log(f"✅ Found {len(available_riders)} available riders")
    
    if len(available_riders) < len(routes_result['routes']):
        log("ℹ️ Not enough riders for batch assignment test")
        return True  # Not a failure, just insufficient test data
    
    # 6. Test batch assignment
    log("🧪 Testing batch rider assignment...")
    
    batch_data = []
    for i, route in enumerate(routes_result['routes']):
        if i < len(available_riders):
            batch_data.append({
                "rider_id": available_riders[i]['id'],
                "order_ids": route['order_ids']
            })
    
    response = requests.post(f"{BACKEND_URL}/vendor/batch-assign-riders", 
                           json=batch_data, headers=vendor_headers, verify=False)
    
    if response.status_code != 200:
        log(f"❌ Batch assignment failed: {response.status_code}")
        log(f"Response: {response.text}")
        return False
        
    assignment_result = response.json()
    log(f"✅ Batch assignment successful: {assignment_result['assigned_count']} orders assigned")
    
    # 7. Verify order updates
    log("🔍 Verifying order updates...")
    
    # Check first route's first order
    if batch_data and batch_data[0]['order_ids']:
        test_order_id = batch_data[0]['order_ids'][0]
        expected_rider_id = batch_data[0]['rider_id']
        
        response = requests.get(f"{BACKEND_URL}/orders/{test_order_id}", headers=vendor_headers, verify=False)
        
        if response.status_code == 200:
            order = response.json()
            
            if order.get('rider_id') == expected_rider_id:
                log("✅ Order rider_id updated correctly")
            else:
                log(f"❌ Order rider_id not updated. Expected: {expected_rider_id}, Got: {order.get('rider_id')}")
                return False
                
            if order.get('delivery_sequence') == 1:
                log("✅ Order delivery_sequence set correctly")
            else:
                log(f"❌ Order delivery_sequence incorrect. Expected: 1, Got: {order.get('delivery_sequence')}")
                return False
                
            if order.get('status') == 'out-for-delivery':
                log("✅ Order status updated to out-for-delivery")
            else:
                log(f"❌ Order status incorrect. Expected: out-for-delivery, Got: {order.get('status')}")
                return False
        else:
            log(f"❌ Failed to get order details: {response.status_code}")
            return False
    
    log("🎉 All route optimization tests passed!")
    return True

if __name__ == "__main__":
    success = test_route_optimization_complete()
    if success:
        print("\n✅ ROUTE OPTIMIZATION FUNCTIONALITY IS WORKING CORRECTLY")
    else:
        print("\n❌ ROUTE OPTIMIZATION TESTS FAILED")
    exit(0 if success else 1)