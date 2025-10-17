#!/usr/bin/env python3
"""
Focused Admin User Management Test
"""

import requests
import json

BACKEND_URL = "http://localhost:8001/api"

def test_admin_functionality():
    print("🧪 Testing Admin User Management...")
    
    # Login as admin
    login_data = {"email": "testadmin@localtokri.com", "password": "admin123"}
    response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data, timeout=5)
    
    if response.status_code != 200:
        print(f"❌ Admin login failed: {response.status_code}")
        return False
    
    admin_token = response.json()['token']
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Get customers
    response = requests.get(f"{BACKEND_URL}/admin/customers", headers=headers, timeout=5)
    if response.status_code != 200:
        print(f"❌ Get customers failed: {response.status_code}")
        return False
    
    customers = response.json()
    if not customers:
        print("❌ No customers found")
        return False
    
    customer_id = customers[0]['id']
    print(f"✅ Found customer: {customer_id}")
    
    # Test email uniqueness validation
    print("🧪 Testing email uniqueness...")
    update_data = {"email": "testvendor@localtokri.com"}
    response = requests.patch(f"{BACKEND_URL}/admin/update-user/{customer_id}", 
                            json=update_data, headers=headers, timeout=5)
    
    if response.status_code == 400 and "already in use" in response.json().get('detail', ''):
        print("✅ Email uniqueness validation working")
    else:
        print(f"❌ Email uniqueness test failed: {response.status_code} - {response.text}")
        return False
    
    # Test valid update
    print("🧪 Testing valid name update...")
    update_data = {"name": "Updated Test Customer"}
    response = requests.patch(f"{BACKEND_URL}/admin/update-user/{customer_id}", 
                            json=update_data, headers=headers, timeout=5)
    
    if response.status_code == 200:
        result = response.json()
        if result['user']['name'] == "Updated Test Customer":
            print("✅ Name update working")
        else:
            print(f"❌ Name not updated: {result}")
            return False
    else:
        print(f"❌ Name update failed: {response.status_code} - {response.text}")
        return False
    
    # Test non-admin access
    print("🧪 Testing non-admin access denial...")
    customer_login = {"email": "testcustomer@localtokri.com", "password": "customer123"}
    response = requests.post(f"{BACKEND_URL}/auth/login", json=customer_login, timeout=5)
    
    if response.status_code != 200:
        print(f"❌ Customer login failed: {response.status_code}")
        return False
    
    customer_token = response.json()['token']
    customer_headers = {"Authorization": f"Bearer {customer_token}"}
    
    update_data = {"name": "Unauthorized Update"}
    response = requests.patch(f"{BACKEND_URL}/admin/update-user/{customer_id}", 
                            json=update_data, headers=customer_headers, timeout=5)
    
    if response.status_code == 403:
        print("✅ Non-admin access correctly denied")
    else:
        print(f"❌ Non-admin access not denied: {response.status_code}")
        return False
    
    print("🎉 All admin tests passed!")
    return True

if __name__ == "__main__":
    success = test_admin_functionality()
    exit(0 if success else 1)