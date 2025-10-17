#!/usr/bin/env python3
"""
Debug script to test the customer my-orders endpoint
"""

import requests
import json

BACKEND_URL = "http://localhost:8001/api"

def test_customer_endpoint():
    # Login as customer
    login_data = {
        "email": "customer@localtokri.com",
        "password": "customer123"
    }
    
    response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.status_code}")
        print(response.text)
        return
    
    data = response.json()
    token = data.get('token')
    print(f"Got token: {token[:50]}...")
    
    # Test the my-orders endpoint
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BACKEND_URL}/orders/my-orders", headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    # Also test the regular orders endpoint for comparison
    response2 = requests.get(f"{BACKEND_URL}/orders", headers=headers)
    print(f"Regular orders endpoint - Status: {response2.status_code}")
    print(f"Regular orders response: {response2.text}")

if __name__ == "__main__":
    test_customer_endpoint()