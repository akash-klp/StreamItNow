import requests
import sys
import json
import base64
from datetime import datetime

class WeddingPhotographyAPITester:
    def __init__(self, base_url="https://photo-share-live.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'No message')}"
            self.log_test("API Root", success, details)
            return success
        except Exception as e:
            self.log_test("API Root", False, str(e))
            return False

    def test_guest_photos_endpoint(self):
        """Test public guest photos endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/photos/guest")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                photos = response.json()
                details += f", Photos count: {len(photos)}"
            self.log_test("Guest Photos Endpoint", success, details)
            return success, response.json() if success else []
        except Exception as e:
            self.log_test("Guest Photos Endpoint", False, str(e))
            return False, []

    def test_auth_me_without_token(self):
        """Test /auth/me endpoint without token (should fail)"""
        try:
            response = requests.get(f"{self.base_url}/api/auth/me")
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected 401)"
            self.log_test("Auth Me Without Token", success, details)
            return success
        except Exception as e:
            self.log_test("Auth Me Without Token", False, str(e))
            return False

    def test_photo_upload_without_auth(self):
        """Test photo upload without authentication (should fail)"""
        try:
            # Create a simple base64 image
            sample_image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A"
            
            upload_data = {
                "filename": "test.jpg",
                "image_data": sample_image,
                "wedding_date": "2024-12-25",
                "photographer_notes": "Test upload"
            }
            
            response = requests.post(
                f"{self.base_url}/api/photos/upload",
                json=upload_data
            )
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected 401)"
            self.log_test("Photo Upload Without Auth", success, details)
            return success
        except Exception as e:
            self.log_test("Photo Upload Without Auth", False, str(e))
            return False

    def test_cors_headers(self):
        """Test CORS headers are present"""
        try:
            response = requests.options(f"{self.base_url}/api/")
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers'
            ]
            
            present_headers = []
            for header in cors_headers:
                if header in response.headers:
                    present_headers.append(header)
            
            success = len(present_headers) > 0
            details = f"CORS headers present: {present_headers}"
            self.log_test("CORS Headers", success, details)
            return success
        except Exception as e:
            self.log_test("CORS Headers", False, str(e))
            return False

    def test_invalid_photo_id(self):
        """Test getting photo with invalid ID"""
        try:
            response = requests.get(f"{self.base_url}/api/photos/invalid-id-123")
            success = response.status_code == 404
            details = f"Status: {response.status_code} (Expected 404)"
            self.log_test("Invalid Photo ID", success, details)
            return success
        except Exception as e:
            self.log_test("Invalid Photo ID", False, str(e))
            return False

    def test_auth_session_without_header(self):
        """Test auth session endpoint without X-Session-ID header"""
        try:
            response = requests.post(f"{self.base_url}/api/auth/session")
            success = response.status_code in [400, 422]  # Missing header should return 400 or 422
            details = f"Status: {response.status_code} (Expected 400/422)"
            self.log_test("Auth Session Without Header", success, details)
            return success
        except Exception as e:
            self.log_test("Auth Session Without Header", False, str(e))
            return False

    def test_auth_session_with_invalid_session_id(self):
        """Test auth session endpoint with invalid session ID"""
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/session",
                headers={"X-Session-ID": "invalid-session-id-123"}
            )
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected 401)"
            self.log_test("Auth Session Invalid ID", success, details)
            return success
        except Exception as e:
            self.log_test("Auth Session Invalid ID", False, str(e))
            return False

    def test_logout_without_auth(self):
        """Test logout without authentication"""
        try:
            response = requests.post(f"{self.base_url}/api/auth/logout")
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected 401)"
            self.log_test("Logout Without Auth", success, details)
            return success
        except Exception as e:
            self.log_test("Logout Without Auth", False, str(e))
            return False

    def test_list_photos_without_auth(self):
        """Test list photos endpoint without authentication"""
        try:
            response = requests.get(f"{self.base_url}/api/photos/list")
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected 401)"
            self.log_test("List Photos Without Auth", success, details)
            return success
        except Exception as e:
            self.log_test("List Photos Without Auth", False, str(e))
            return False

    def test_delete_photo_without_auth(self):
        """Test delete photo without authentication"""
        try:
            response = requests.delete(f"{self.base_url}/api/photos/test-photo-id")
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected 401)"
            self.log_test("Delete Photo Without Auth", success, details)
            return success
        except Exception as e:
            self.log_test("Delete Photo Without Auth", False, str(e))
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Wedding Photography API Tests")
        print(f"📍 Testing endpoint: {self.base_url}")
        print("=" * 60)

        # Test basic connectivity and public endpoints
        self.test_api_root()
        self.test_guest_photos_endpoint()
        self.test_cors_headers()
        
        # Test authentication-related endpoints (should fail without auth)
        self.test_auth_me_without_token()
        self.test_auth_session_without_header()
        self.test_auth_session_with_invalid_session_id()
        self.test_logout_without_auth()
        
        # Test photo-related endpoints
        self.test_invalid_photo_id()
        self.test_photo_upload_without_auth()
        self.test_list_photos_without_auth()
        self.test_delete_photo_without_auth()

        # Print summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check details above.")
            return 1

def main():
    tester = WeddingPhotographyAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())