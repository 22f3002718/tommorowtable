#!/usr/bin/env python3
"""
Test user registration with new email addresses
"""

import requests
import json
import uuid
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BACKEND_URL = "https://sdk-upgrade-54.preview.emergentagent.com/api"

def test_registration():
    """Test registration with unique email addresses"""
    
    # Generate unique emails
    unique_id = str(uuid.uuid4())[:8]
    
    test_users = [
        {
            "role": "customer",
            "email": f"customer_{unique_id}@localtokri.com",
            "password": "customer123",
            "name": "New Test Customer",
            "phone": "+91-9876543210"
        },
        {
            "role": "vendor", 
            "email": f"vendor_{unique_id}@localtokri.com",
            "password": "vendor123",
            "name": "New Test Vendor",
            "phone": "+91-9876543211"
        },
        {
            "role": "rider",
            "email": f"rider_{unique_id}@localtokri.com",
            "password": "rider123",
            "name": "New Test Rider",
            "phone": "+91-9876543212"
        }
    ]
    
    for user_data in test_users:
        print(f"Testing {user_data['role']} registration...")
        
        try:
            response = requests.post(
                f"{BACKEND_URL}/auth/register",
                json=user_data,
                timeout=30,
                verify=False
            )
            
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {user_data['role']} registration successful")
                print(f"User ID: {data.get('user', {}).get('id')}")
                print(f"Token: {data.get('token', '')[:20]}...")
            else:
                print(f"❌ {user_data['role']} registration failed")
                
        except Exception as e:
            print(f"❌ Request failed: {e}")
            
        print("-" * 50)

if __name__ == "__main__":
    test_registration()