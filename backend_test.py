import requests
import sys
import json
import base64
from datetime import datetime, timezone, timedelta
import uuid
import pymongo

class WeddingPhotographyAPITester:
    def __init__(self, base_url="https://s3-app-bridge.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.photographer_token = None
        self.unregistered_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Connect to MongoDB for setup
        self.mongo_client = pymongo.MongoClient("mongodb://localhost:27017")
        self.db = self.mongo_client["test_database"]

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

    def setup_mock_users(self):
        """Setup mock users and sessions for testing"""
        try:
            # Clear existing test data
            self.db.users.delete_many({"email": {"$in": ["akashklp07@gmail.com", "photographer@test.com", "unregistered@test.com"]}})
            self.db.user_sessions.delete_many({})
            self.db.registered_photographers.delete_many({})
            
            # Create admin user
            admin_user_id = f"user_{uuid.uuid4().hex[:12]}"
            admin_token = f"admin_token_{uuid.uuid4().hex}"
            
            self.db.users.insert_one({
                "user_id": admin_user_id,
                "email": "akashklp07@gmail.com",
                "name": "Admin User",
                "picture": "https://example.com/admin.jpg",
                "role": "admin",
                "status": "active",
                "created_at": datetime.now(timezone.utc)
            })
            
            self.db.user_sessions.insert_one({
                "user_id": admin_user_id,
                "session_token": admin_token,
                "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
                "created_at": datetime.now(timezone.utc)
            })
            
            self.admin_token = admin_token
            
            # Register photographer email first
            self.db.registered_photographers.insert_one({
                "registration_id": str(uuid.uuid4()),
                "email": "photographer@test.com",
                "name": "Test Photographer",
                "registered_by": admin_user_id,
                "created_at": datetime.now(timezone.utc)
            })
            
            # Create photographer user
            photographer_user_id = f"user_{uuid.uuid4().hex[:12]}"
            photographer_token = f"photographer_token_{uuid.uuid4().hex}"
            
            self.db.users.insert_one({
                "user_id": photographer_user_id,
                "email": "photographer@test.com",
                "name": "Test Photographer",
                "picture": "https://example.com/photographer.jpg",
                "role": "photographer",
                "status": "active",
                "created_at": datetime.now(timezone.utc)
            })
            
            self.db.user_sessions.insert_one({
                "user_id": photographer_user_id,
                "session_token": photographer_token,
                "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
                "created_at": datetime.now(timezone.utc)
            })
            
            self.photographer_token = photographer_token
            
            # Create unregistered user (should get 403)
            unregistered_user_id = f"user_{uuid.uuid4().hex[:12]}"
            unregistered_token = f"unregistered_token_{uuid.uuid4().hex}"
            
            self.db.users.insert_one({
                "user_id": unregistered_user_id,
                "email": "unregistered@test.com",
                "name": "Unregistered User",
                "picture": "https://example.com/unregistered.jpg",
                "role": "photographer",
                "status": "pending",
                "created_at": datetime.now(timezone.utc)
            })
            
            self.db.user_sessions.insert_one({
                "user_id": unregistered_user_id,
                "session_token": unregistered_token,
                "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
                "created_at": datetime.now(timezone.utc)
            })
            
            self.unregistered_token = unregistered_token
            
            print("✅ Mock users and sessions created successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to setup mock users: {str(e)}")
            return False

    def test_admin_stats_unauthenticated(self):
        """Test admin stats endpoint without authentication"""
        try:
            response = requests.get(f"{self.base_url}/api/admin/stats")
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected 401)"
            self.log_test("Admin Stats - Unauthenticated", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Stats - Unauthenticated", False, str(e))
            return False

    def test_admin_stats_with_admin_auth(self):
        """Test admin stats endpoint with admin authentication"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/api/admin/stats", headers=headers)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                required_fields = ["total_photographers", "active_photographers", "pending_photographers", 
                                 "inactive_photographers", "total_photos", "total_events", "active_events", "pending_events"]
                has_all_fields = all(field in data for field in required_fields)
                success = has_all_fields
                details += f", Has all required fields: {has_all_fields}"
            self.log_test("Admin Stats - With Admin Auth", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Stats - With Admin Auth", False, str(e))
            return False

    def test_admin_stats_with_photographer_auth(self):
        """Test admin stats endpoint with photographer authentication (should fail)"""
        try:
            headers = {"Authorization": f"Bearer {self.photographer_token}"}
            response = requests.get(f"{self.base_url}/api/admin/stats", headers=headers)
            success = response.status_code == 403
            details = f"Status: {response.status_code} (Expected 403)"
            self.log_test("Admin Stats - With Photographer Auth", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Stats - With Photographer Auth", False, str(e))
            return False

    def test_admin_photographers_list(self):
        """Test admin photographers list endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/api/admin/photographers", headers=headers)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                photographers = response.json()
                details += f", Photographers count: {len(photographers)}"
                # Check if photographer has required fields
                if photographers:
                    photographer = photographers[0]
                    required_fields = ["user_id", "email", "name", "role", "status", "photo_count", "event_count"]
                    has_required_fields = all(field in photographer for field in required_fields)
                    success = has_required_fields
                    details += f", Has required fields: {has_required_fields}"
            self.log_test("Admin Photographers List", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Photographers List", False, str(e))
            return False

    def test_register_photographer_endpoint(self):
        """Test register photographer endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            data = {
                "email": "newphotographer@test.com",
                "name": "New Photographer"
            }
            response = requests.post(f"{self.base_url}/api/admin/photographers/register", 
                                   json=data, headers=headers)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                result = response.json()
                success = "registration_id" in result and "message" in result
                details += f", Has registration_id: {'registration_id' in result}"
            self.log_test("Register Photographer", success, details)
            return success
        except Exception as e:
            self.log_test("Register Photographer", False, str(e))
            return False

    def test_register_duplicate_photographer(self):
        """Test registering duplicate photographer email"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            data = {
                "email": "photographer@test.com",  # Already registered
                "name": "Duplicate Photographer"
            }
            response = requests.post(f"{self.base_url}/api/admin/photographers/register", 
                                   json=data, headers=headers)
            success = response.status_code == 400
            details = f"Status: {response.status_code} (Expected 400 for duplicate)"
            self.log_test("Register Duplicate Photographer", success, details)
            return success
        except Exception as e:
            self.log_test("Register Duplicate Photographer", False, str(e))
            return False

    def test_list_registered_photographers(self):
        """Test list registered photographers endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/api/admin/registered-photographers", headers=headers)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                registrations = response.json()
                details += f", Registrations count: {len(registrations)}"
            self.log_test("List Registered Photographers", success, details)
            return success
        except Exception as e:
            self.log_test("List Registered Photographers", False, str(e))
            return False

    def test_update_photographer_status(self):
        """Test update photographer status endpoint"""
        try:
            # First get a photographer ID
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/api/admin/photographers", headers=headers)
            if response.status_code != 200:
                self.log_test("Update Photographer Status", False, "Could not get photographers list")
                return False
            
            photographers = response.json()
            if not photographers:
                self.log_test("Update Photographer Status", False, "No photographers found")
                return False
            
            photographer_id = photographers[0]["user_id"]
            
            # Update status
            data = {"status": "inactive"}
            response = requests.put(f"{self.base_url}/api/admin/photographers/{photographer_id}/status", 
                                  json=data, headers=headers)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                result = response.json()
                success = "message" in result
                details += f", Has message: {'message' in result}"
            self.log_test("Update Photographer Status", success, details)
            return success
        except Exception as e:
            self.log_test("Update Photographer Status", False, str(e))
            return False

    def test_delete_photographer(self):
        """Test delete photographer endpoint"""
        try:
            # Create a test photographer to delete
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # First register a photographer
            register_data = {
                "email": "todelete@test.com",
                "name": "To Delete Photographer"
            }
            requests.post(f"{self.base_url}/api/admin/photographers/register", 
                         json=register_data, headers=headers)
            
            # Create user manually in database for testing deletion
            test_user_id = f"user_{uuid.uuid4().hex[:12]}"
            self.db.users.insert_one({
                "user_id": test_user_id,
                "email": "todelete@test.com",
                "name": "To Delete Photographer",
                "role": "photographer",
                "status": "pending",
                "created_at": datetime.now(timezone.utc)
            })
            
            # Now delete the photographer
            response = requests.delete(f"{self.base_url}/api/admin/photographers/{test_user_id}", 
                                     headers=headers)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                result = response.json()
                success = "message" in result
                details += f", Has message: {'message' in result}"
            self.log_test("Delete Photographer", success, details)
            return success
        except Exception as e:
            self.log_test("Delete Photographer", False, str(e))
            return False
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