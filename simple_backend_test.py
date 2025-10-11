#!/usr/bin/env python3
"""
Simple Backend API Tests for QuickBite Rider Assignment Feature
"""

import requests
import json
from datetime import datetime

BACKEND_URL = "https://localtokri.preview.emergentagent.com/api"

def log(message):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}")

def test_rider_assignment_feature():
    """Test the complete rider assignment feature"""
    log("🚀 Starting QuickBite Rider Assignment Tests")
    
    # Step 1: Login as vendor
    log("🔐 Logging in as vendor...")
    vendor_login = {
        "email": "vendor1@quickbite.com",
        "password": "vendor123"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/login", json=vendor_login, timeout=10)
        if response.status_code != 200:
            log(f"❌ Vendor login failed: {response.status_code} - {response.text}")
            return False
        
        vendor_token = response.json()['token']
        vendor_headers = {"Authorization": f"Bearer {vendor_token}"}
        log("✅ Vendor login successful")
        
    except Exception as e:
        log(f"❌ Vendor login error: {e}")
        return False
    
    # Step 2: Test GET /api/riders/available (vendor auth)
    log("\n🧪 Testing GET /api/riders/available (vendor auth)...")
    try:
        response = requests.get(f"{BACKEND_URL}/riders/available", headers=vendor_headers, timeout=10)
        if response.status_code != 200:
            log(f"❌ Get available riders failed: {response.status_code} - {response.text}")
            return False
        
        riders = response.json()
        log(f"✅ Got {len(riders)} available riders")
        
        # Verify all are riders
        for rider in riders:
            if rider.get('role') != 'rider':
                log(f"❌ Non-rider returned: {rider}")
                return False
        
        if not riders:
            log("❌ No riders available for testing")
            return False
            
        available_rider_id = riders[0]['id']
        log(f"✅ Will use rider: {available_rider_id}")
        
    except Exception as e:
        log(f"❌ Get available riders error: {e}")
        return False
    
    # Step 3: Login as customer for unauthorized test
    log("\n🔐 Logging in as customer...")
    customer_login = {
        "email": "customer1@quickbite.com", 
        "password": "customer123"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/login", json=customer_login, timeout=10)
        if response.status_code != 200:
            log(f"❌ Customer login failed: {response.status_code} - {response.text}")
            return False
        
        customer_token = response.json()['token']
        customer_headers = {"Authorization": f"Bearer {customer_token}"}
        log("✅ Customer login successful")
        
    except Exception as e:
        log(f"❌ Customer login error: {e}")
        return False
    
    # Step 4: Test GET /api/riders/available (customer auth - should fail)
    log("\n🧪 Testing GET /api/riders/available (customer auth - should fail)...")
    try:
        response = requests.get(f"{BACKEND_URL}/riders/available", headers=customer_headers, timeout=10)
        if response.status_code != 403:
            log(f"❌ Expected 403, got {response.status_code} - {response.text}")
            return False
        
        log("✅ Customer correctly denied access (403)")
        
    except Exception as e:
        log(f"❌ Customer unauthorized test error: {e}")
        return False
    
    # Step 5: Get vendor's restaurant
    log("\n🏪 Getting vendor restaurant...")
    try:
        response = requests.get(f"{BACKEND_URL}/vendor/restaurant", headers=vendor_headers, timeout=10)
        if response.status_code != 200:
            log(f"❌ Get restaurant failed: {response.status_code} - {response.text}")
            return False
        
        restaurant = response.json()
        restaurant_id = restaurant['id']
        log(f"✅ Got restaurant: {restaurant_id}")
        
    except Exception as e:
        log(f"❌ Get restaurant error: {e}")
        return False
    
    # Step 6: Create a test order and set it to 'ready'
    log("\n📦 Creating test order...")
    try:
        # Get menu items
        response = requests.get(f"{BACKEND_URL}/restaurants/{restaurant_id}/menu", headers=vendor_headers, timeout=10)
        if response.status_code != 200:
            log(f"❌ Get menu failed: {response.status_code} - {response.text}")
            return False
        
        menu_items = response.json()
        if not menu_items:
            # Create a menu item
            menu_item_data = {
                "name": "Test Burger",
                "description": "Test item",
                "price": 12.99,
                "category": "Main"
            }
            response = requests.post(f"{BACKEND_URL}/restaurants/{restaurant_id}/menu", 
                                   json=menu_item_data, headers=vendor_headers, timeout=10)
            if response.status_code != 200:
                log(f"❌ Create menu item failed: {response.status_code} - {response.text}")
                return False
            menu_items = [response.json()]
        
        # Create order as customer
        order_data = {
            "restaurant_id": restaurant_id,
            "items": [{
                "menu_item_id": menu_items[0]['id'],
                "name": menu_items[0]['name'],
                "quantity": 1,
                "price": menu_items[0]['price']
            }],
            "delivery_address": "123 Test St, Test City",
            "special_instructions": "Test order"
        }
        
        response = requests.post(f"{BACKEND_URL}/orders", json=order_data, headers=customer_headers, timeout=10)
        if response.status_code != 200:
            log(f"❌ Create order failed: {response.status_code} - {response.text}")
            return False
        
        order = response.json()
        order_id = order['id']
        log(f"✅ Created order: {order_id}")
        
        # Update order to 'ready' status
        for status in ['confirmed', 'preparing', 'ready']:
            status_data = {"status": status}
            response = requests.patch(f"{BACKEND_URL}/orders/{order_id}/status", 
                                    json=status_data, headers=vendor_headers, timeout=10)
            if response.status_code != 200:
                log(f"❌ Update status to {status} failed: {response.status_code} - {response.text}")
                return False
        
        log("✅ Order status updated to 'ready'")
        
    except Exception as e:
        log(f"❌ Create order error: {e}")
        return False
    
    # Step 7: Test PATCH /api/orders/{order_id}/assign-rider (success)
    log("\n🧪 Testing PATCH /api/orders/{order_id}/assign-rider (success)...")
    try:
        assignment_data = {"rider_id": available_rider_id}
        response = requests.patch(f"{BACKEND_URL}/orders/{order_id}/assign-rider", 
                                json=assignment_data, headers=vendor_headers, timeout=10)
        if response.status_code != 200:
            log(f"❌ Assign rider failed: {response.status_code} - {response.text}")
            return False
        
        result = response.json()
        log(f"✅ Rider assigned: {result}")
        
        # Verify order was updated
        response = requests.get(f"{BACKEND_URL}/orders/{order_id}", headers=vendor_headers, timeout=10)
        if response.status_code != 200:
            log(f"❌ Get order failed: {response.status_code} - {response.text}")
            return False
        
        updated_order = response.json()
        if updated_order.get('rider_id') != available_rider_id:
            log(f"❌ Order rider_id not updated correctly")
            return False
        
        if updated_order.get('status') != 'out-for-delivery':
            log(f"❌ Order status not updated to 'out-for-delivery'")
            return False
        
        log("✅ Order correctly updated with rider and status")
        
    except Exception as e:
        log(f"❌ Assign rider error: {e}")
        return False
    
    # Step 8: Test that assigned rider is no longer available
    log("\n🧪 Testing rider availability after assignment...")
    try:
        response = requests.get(f"{BACKEND_URL}/riders/available", headers=vendor_headers, timeout=10)
        if response.status_code != 200:
            log(f"❌ Get available riders failed: {response.status_code} - {response.text}")
            return False
        
        current_riders = response.json()
        for rider in current_riders:
            if rider['id'] == available_rider_id:
                log(f"❌ Assigned rider still appears as available")
                return False
        
        log("✅ Assigned rider correctly removed from available list")
        
    except Exception as e:
        log(f"❌ Check rider availability error: {e}")
        return False
    
    # Step 9: Test unauthorized assignment (customer trying to assign)
    log("\n🧪 Testing PATCH /api/orders/{order_id}/assign-rider (customer auth - should fail)...")
    try:
        # Create another order for this test
        order_data = {
            "restaurant_id": restaurant_id,
            "items": [{
                "menu_item_id": menu_items[0]['id'],
                "name": menu_items[0]['name'],
                "quantity": 1,
                "price": menu_items[0]['price']
            }],
            "delivery_address": "456 Test St, Test City",
            "special_instructions": "Another test order"
        }
        
        response = requests.post(f"{BACKEND_URL}/orders", json=order_data, headers=customer_headers, timeout=10)
        if response.status_code == 200:
            test_order_id = response.json()['id']
            
            # Update to ready
            for status in ['confirmed', 'preparing', 'ready']:
                requests.patch(f"{BACKEND_URL}/orders/{test_order_id}/status", 
                             json={"status": status}, headers=vendor_headers, timeout=10)
            
            # Try to assign as customer (should fail)
            assignment_data = {"rider_id": available_rider_id}
            response = requests.patch(f"{BACKEND_URL}/orders/{test_order_id}/assign-rider", 
                                    json=assignment_data, headers=customer_headers, timeout=10)
            
            if response.status_code != 403:
                log(f"❌ Expected 403, got {response.status_code} - {response.text}")
                return False
            
            log("✅ Customer correctly denied assignment access (403)")
        
    except Exception as e:
        log(f"❌ Unauthorized assignment test error: {e}")
        return False
    
    # Step 10: Test invalid rider assignment
    log("\n🧪 Testing PATCH /api/orders/{order_id}/assign-rider (invalid rider)...")
    try:
        assignment_data = {"rider_id": "invalid-rider-id-12345"}
        response = requests.patch(f"{BACKEND_URL}/orders/{order_id}/assign-rider", 
                                json=assignment_data, headers=vendor_headers, timeout=10)
        
        if response.status_code != 404:
            log(f"❌ Expected 404, got {response.status_code} - {response.text}")
            return False
        
        log("✅ Invalid rider correctly rejected (404)")
        
    except Exception as e:
        log(f"❌ Invalid rider test error: {e}")
        return False
    
    log("\n🎉 All tests passed successfully!")
    return True

if __name__ == "__main__":
    success = test_rider_assignment_feature()
    if success:
        print("\n✅ RIDER ASSIGNMENT FEATURE WORKING CORRECTLY")
    else:
        print("\n❌ RIDER ASSIGNMENT FEATURE HAS ISSUES")
    exit(0 if success else 1)