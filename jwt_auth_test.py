#!/usr/bin/env python3
"""
JWT Authentication and Push Notification Token Tests
Tests JWT token expiry (30 days) and push notification token registration
"""

import requests
import json
import jwt
import os
from datetime import datetime, timezone, timedelta
import time

# Get backend URL from environment
BACKEND_URL = "https://delivery-sequence.preview.emergentagent.com/api"

class JWTAuthTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_user_token = None
        self.test_user_id = None
        
    def log(self, message):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")
        
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=60, verify=False)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=60, verify=False)
            elif method.upper() == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=60, verify=False)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.Timeout:
            self.log(f"❌ Request timed out after 60 seconds")
            self.log(f"URL: {url}")
            return None
        except requests.exceptions.ConnectionError as e:
            self.log(f"❌ Connection error: {e}")
            self.log(f"URL: {url}")
            return None
        except Exception as e:
            self.log(f"❌ Request failed: {e}")
            self.log(f"URL: {url}")
            return None
    
    def test_user_registration_and_login(self):
        """Test user registration and login, verify JWT token is returned"""
        self.log("\n🧪 Testing user registration and login...")
        
        # Generate unique email for this test
        timestamp = int(time.time())
        test_email = f"jwttest{timestamp}@localtokri.com"
        
        # Register new user
        register_data = {
            "email": test_email,
            "password": "testpass123",
            "name": "JWT Test User",
            "role": "customer",
            "phone": "+1234567890"
        }
        
        self.log(f"Registering user: {test_email}")
        response = self.make_request('POST', '/auth/register', register_data)
        
        if not response:
            self.log("❌ No response received for registration")
            return False
            
        if response.status_code != 200:
            self.log(f"❌ Registration failed: {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
            
        try:
            data = response.json()
            token = data.get('token')
            user = data.get('user')
            
            if not token:
                self.log("❌ No token returned in registration response")
                return False
                
            if not user or not user.get('id'):
                self.log("❌ No user data returned in registration response")
                return False
                
            self.test_user_token = token
            self.test_user_id = user['id']
            self.log(f"✅ User registered successfully, token received")
            self.log(f"User ID: {self.test_user_id}")
            return True
            
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def test_jwt_token_structure_and_expiry(self):
        """Test JWT token structure and verify 30-day expiry"""
        self.log("\n🧪 Testing JWT token structure and 30-day expiry...")
        
        if not self.test_user_token:
            self.log("❌ No token available for testing")
            return False
        
        try:
            # Decode JWT token without verification (to inspect structure)
            decoded_token = jwt.decode(self.test_user_token, options={"verify_signature": False})
            self.log(f"Token payload: {decoded_token}")
            
            # Check if 'exp' field exists
            if 'exp' not in decoded_token:
                self.log("❌ Token missing 'exp' (expiry) field")
                return False
            
            # Check if 'user_id' field exists
            if 'user_id' not in decoded_token:
                self.log("❌ Token missing 'user_id' field")
                return False
                
            # Verify user_id matches
            if decoded_token['user_id'] != self.test_user_id:
                self.log(f"❌ Token user_id mismatch. Expected: {self.test_user_id}, Got: {decoded_token['user_id']}")
                return False
            
            # Check expiry time (should be approximately 30 days from now)
            exp_timestamp = decoded_token['exp']
            exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
            current_time = datetime.now(timezone.utc)
            
            # Calculate difference
            time_diff = exp_datetime - current_time
            days_diff = time_diff.total_seconds() / (24 * 3600)
            
            self.log(f"Token expires at: {exp_datetime}")
            self.log(f"Current time: {current_time}")
            self.log(f"Days until expiry: {days_diff:.2f}")
            
            # Verify it's approximately 30 days (allow some margin for processing time)
            if not (29.9 <= days_diff <= 30.1):
                self.log(f"❌ Token expiry not set to 30 days. Got: {days_diff:.2f} days")
                return False
            
            self.log("✅ JWT token structure and 30-day expiry verified")
            return True
            
        except jwt.InvalidTokenError as e:
            self.log(f"❌ Failed to decode JWT token: {e}")
            return False
        except Exception as e:
            self.log(f"❌ Error testing JWT token: {e}")
            return False
    
    def test_token_authentication_success(self):
        """Test that valid token works for authenticated endpoints"""
        self.log("\n🧪 Testing token authentication on /api/auth/me...")
        
        if not self.test_user_token:
            self.log("❌ No token available for testing")
            return False
        
        headers = {"Authorization": f"Bearer {self.test_user_token}"}
        response = self.make_request('GET', '/auth/me', headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
            
        if response.status_code != 200:
            self.log(f"❌ Authentication failed: {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
            
        try:
            user_data = response.json()
            
            if user_data.get('id') != self.test_user_id:
                self.log(f"❌ User ID mismatch. Expected: {self.test_user_id}, Got: {user_data.get('id')}")
                return False
                
            self.log("✅ Token authentication successful")
            return True
            
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def test_invalid_token_rejection(self):
        """Test that invalid tokens are properly rejected"""
        self.log("\n🧪 Testing invalid token rejection...")
        
        # Test with invalid token
        invalid_token = "invalid.jwt.token"
        headers = {"Authorization": f"Bearer {invalid_token}"}
        
        # Add a small delay to avoid connection issues
        import time
        time.sleep(0.5)
        
        response = self.make_request('GET', '/auth/me', headers=headers)
        
        if not response:
            self.log("❌ No response received for invalid token test")
            # Try once more with a longer delay
            time.sleep(2)
            response = self.make_request('GET', '/auth/me', headers=headers)
            if not response:
                self.log("❌ Still no response after retry")
                return False
            
        if response.status_code != 401:
            self.log(f"❌ Expected 401 for invalid token, got: {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
            
        self.log("✅ Invalid token correctly rejected (401)")
        
        # Test with no token
        time.sleep(0.5)
        response = self.make_request('GET', '/auth/me')
        
        if not response:
            self.log("❌ No response received for no-token test")
            # Try once more
            time.sleep(2)
            response = self.make_request('GET', '/auth/me')
            if not response:
                self.log("❌ Still no response for no-token test after retry")
                return False
            
        if response.status_code != 401:
            self.log(f"❌ Expected 401 for no token, got: {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
            
        self.log("✅ No token correctly rejected (401)")
        return True
    
    def test_push_token_registration(self):
        """Test push notification token registration endpoint"""
        self.log("\n🧪 Testing push notification token registration...")
        
        if not self.test_user_token:
            self.log("❌ No token available for testing")
            return False
        
        # Test push token registration
        push_token_data = {
            "push_token": "test_push_token_abc123",
            "platform": "ios"
        }
        
        headers = {"Authorization": f"Bearer {self.test_user_token}"}
        response = self.make_request('POST', '/auth/register-push-token', push_token_data, headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
            
        if response.status_code != 200:
            self.log(f"❌ Push token registration failed: {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
            
        try:
            result = response.json()
            if result.get('message') != 'Push token registered successfully':
                self.log(f"❌ Unexpected response message: {result}")
                return False
                
            self.log("✅ Push token registration successful")
            return True
            
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def test_push_token_persistence(self):
        """Test that push token is saved to user profile"""
        self.log("\n🧪 Testing push token persistence in user profile...")
        
        if not self.test_user_token:
            self.log("❌ No token available for testing")
            return False
        
        # Get user profile to verify push token was saved
        headers = {"Authorization": f"Bearer {self.test_user_token}"}
        response = self.make_request('GET', '/auth/me', headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
            
        if response.status_code != 200:
            self.log(f"❌ Failed to get user profile: {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
            
        try:
            user_data = response.json()
            
            expected_push_token = "test_push_token_abc123"
            expected_platform = "ios"
            
            if user_data.get('push_token') != expected_push_token:
                self.log(f"❌ Push token not saved. Expected: {expected_push_token}, Got: {user_data.get('push_token')}")
                return False
                
            if user_data.get('push_platform') != expected_platform:
                self.log(f"❌ Push platform not saved. Expected: {expected_platform}, Got: {user_data.get('push_platform')}")
                return False
                
            self.log("✅ Push token and platform correctly saved to user profile")
            return True
            
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def test_push_token_update(self):
        """Test updating push token with different platform"""
        self.log("\n🧪 Testing push token update...")
        
        if not self.test_user_token:
            self.log("❌ No token available for testing")
            return False
        
        # Update push token with different platform
        updated_push_data = {
            "push_token": "updated_push_token_xyz789",
            "platform": "android"
        }
        
        headers = {"Authorization": f"Bearer {self.test_user_token}"}
        response = self.make_request('POST', '/auth/register-push-token', updated_push_data, headers=headers)
        
        if not response:
            self.log("❌ No response received")
            return False
            
        if response.status_code != 200:
            self.log(f"❌ Push token update failed: {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
        
        # Verify the update
        response = self.make_request('GET', '/auth/me', headers=headers)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to verify push token update")
            return False
            
        try:
            user_data = response.json()
            
            if user_data.get('push_token') != "updated_push_token_xyz789":
                self.log(f"❌ Push token not updated. Expected: updated_push_token_xyz789, Got: {user_data.get('push_token')}")
                return False
                
            if user_data.get('push_platform') != "android":
                self.log(f"❌ Push platform not updated. Expected: android, Got: {user_data.get('push_platform')}")
                return False
                
            self.log("✅ Push token successfully updated")
            return True
            
        except json.JSONDecodeError:
            self.log(f"❌ Invalid JSON response: {response.text}")
            return False
    
    def test_push_token_unauthorized(self):
        """Test push token registration without authentication"""
        self.log("\n🧪 Testing push token registration without authentication...")
        
        push_token_data = {
            "push_token": "unauthorized_token",
            "platform": "ios"
        }
        
        # Add a small delay to avoid connection issues
        import time
        time.sleep(0.5)
        
        # No authorization header
        response = self.make_request('POST', '/auth/register-push-token', push_token_data)
        
        if not response:
            self.log("❌ No response received")
            # Try once more with a longer delay
            time.sleep(2)
            response = self.make_request('POST', '/auth/register-push-token', push_token_data)
            if not response:
                self.log("❌ Still no response after retry")
                return False
            
        if response.status_code != 401:
            self.log(f"❌ Expected 401 for unauthorized request, got: {response.status_code}")
            self.log(f"Response: {response.text}")
            return False
            
        self.log("✅ Unauthorized push token registration correctly rejected (401)")
        return True
    
    def run_all_tests(self):
        """Run all JWT and push notification tests"""
        self.log("🚀 Starting JWT Authentication and Push Notification Tests")
        self.log(f"Backend URL: {self.base_url}")
        
        test_results = {}
        
        # Test 1: User Registration and Login
        test_results['user_registration_login'] = self.test_user_registration_and_login()
        
        # Test 2: JWT Token Structure and 30-day Expiry
        test_results['jwt_token_expiry'] = self.test_jwt_token_structure_and_expiry()
        
        # Test 3: Token Authentication Success
        test_results['token_auth_success'] = self.test_token_authentication_success()
        
        # Test 4: Invalid Token Rejection
        test_results['invalid_token_rejection'] = self.test_invalid_token_rejection()
        
        # Test 5: Push Token Registration
        test_results['push_token_registration'] = self.test_push_token_registration()
        
        # Test 6: Push Token Persistence
        test_results['push_token_persistence'] = self.test_push_token_persistence()
        
        # Test 7: Push Token Update
        test_results['push_token_update'] = self.test_push_token_update()
        
        # Test 8: Push Token Unauthorized
        test_results['push_token_unauthorized'] = self.test_push_token_unauthorized()
        
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
            self.log("🎉 All JWT and Push Notification tests passed!")
            return True
        else:
            self.log("⚠️ Some tests failed!")
            return False

if __name__ == "__main__":
    tester = JWTAuthTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)