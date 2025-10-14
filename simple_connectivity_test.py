#!/usr/bin/env python3
"""
Simple test for the failing cases
"""

import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BACKEND_URL = "https://delivery-sequence.preview.emergentagent.com/api"

def test_invalid_token():
    print("Testing invalid token rejection...")
    try:
        # Test with invalid token
        response = requests.get(f'{BACKEND_URL}/auth/me', 
                              headers={'Authorization': 'Bearer invalid.jwt.token'}, 
                              timeout=30, verify=False)
        print(f"Invalid token response: {response.status_code}")
        if response.status_code == 401:
            print("✅ Invalid token correctly rejected")
            return True
        else:
            print(f"❌ Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

def test_no_token():
    print("Testing no token rejection...")
    try:
        # Test with no token
        response = requests.get(f'{BACKEND_URL}/auth/me', timeout=30, verify=False)
        print(f"No token response: {response.status_code}")
        if response.status_code == 401:
            print("✅ No token correctly rejected")
            return True
        else:
            print(f"❌ Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

def test_unauthorized_push_token():
    print("Testing unauthorized push token...")
    try:
        response = requests.post(f'{BACKEND_URL}/auth/register-push-token',
                               json={'push_token': 'test', 'platform': 'ios'},
                               timeout=30, verify=False)
        print(f"Unauthorized push token response: {response.status_code}")
        if response.status_code == 401:
            print("✅ Unauthorized push token correctly rejected")
            return True
        else:
            print(f"❌ Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

if __name__ == "__main__":
    print("Running simple connectivity tests...")
    
    results = []
    results.append(test_invalid_token())
    results.append(test_no_token())
    results.append(test_unauthorized_push_token())
    
    passed = sum(results)
    total = len(results)
    print(f"\nResults: {passed}/{total} tests passed")