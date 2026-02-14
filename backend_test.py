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

    def test_create_event_as_photographer(self):
        """Test creating event as photographer (should be pending)"""
        try:
            headers = {"Authorization": f"Bearer {self.photographer_token}"}
            data = {
                "event_name": "Test Wedding",
                "bride_name": "Jane Doe",
                "groom_name": "John Doe",
                "event_date": "2024-12-25",
                "venue": "Test Venue",
                "notes": "Test event creation"
            }
            response = requests.post(f"{self.base_url}/api/events", json=data, headers=headers)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                result = response.json()
                success = result.get("status") == "pending" and "event_id" in result
                details += f", Status: {result.get('status')}, Has event_id: {'event_id' in result}"
            self.log_test("Create Event as Photographer", success, details)
            return success, result.get("event_id") if success else None
        except Exception as e:
            self.log_test("Create Event as Photographer", False, str(e))
            return False, None

    def test_create_event_as_admin(self):
        """Test creating event as admin (should be active)"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            data = {
                "event_name": "Admin Test Wedding",
                "bride_name": "Admin Jane",
                "groom_name": "Admin John",
                "event_date": "2024-12-26",
                "venue": "Admin Test Venue",
                "notes": "Admin event creation"
            }
            response = requests.post(f"{self.base_url}/api/events", json=data, headers=headers)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                result = response.json()
                success = result.get("status") == "active" and "event_id" in result
                details += f", Status: {result.get('status')}, Has event_id: {'event_id' in result}"
            self.log_test("Create Event as Admin", success, details)
            return success, result.get("event_id") if success else None
        except Exception as e:
            self.log_test("Create Event as Admin", False, str(e))
            return False, None

    def test_list_events_as_photographer(self):
        """Test listing events as photographer (should see only own events)"""
        try:
            headers = {"Authorization": f"Bearer {self.photographer_token}"}
            response = requests.get(f"{self.base_url}/api/events", headers=headers)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                events = response.json()
                details += f", Events count: {len(events)}"
            self.log_test("List Events as Photographer", success, details)
            return success
        except Exception as e:
            self.log_test("List Events as Photographer", False, str(e))
            return False

    def test_admin_list_all_events(self):
        """Test admin-only endpoint to list all events"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/api/admin/events", headers=headers)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                events = response.json()
                details += f", Events count: {len(events)}"
            self.log_test("Admin List All Events", success, details)
            return success
        except Exception as e:
            self.log_test("Admin List All Events", False, str(e))
            return False

    def test_admin_list_pending_events(self):
        """Test admin-only endpoint to list pending events"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/api/admin/events/pending", headers=headers)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                events = response.json()
                details += f", Pending events count: {len(events)}"
            self.log_test("Admin List Pending Events", success, details)
            return success
        except Exception as e:
            self.log_test("Admin List Pending Events", False, str(e))
            return False

    def test_admin_approve_event(self):
        """Test admin approving an event"""
        try:
            # First create a pending event
            success, event_id = self.test_create_event_as_photographer()
            if not success or not event_id:
                self.log_test("Admin Approve Event", False, "Could not create test event")
                return False
            
            # Now approve it
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            data = {"status": "active"}
            response = requests.put(f"{self.base_url}/api/admin/events/{event_id}/status", 
                                  json=data, headers=headers)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                result = response.json()
                success = "message" in result
                details += f", Has message: {'message' in result}"
            self.log_test("Admin Approve Event", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Approve Event", False, str(e))
            return False

    def test_photographer_cannot_access_admin_events(self):
        """Test that photographer cannot access admin-only event endpoints"""
        try:
            headers = {"Authorization": f"Bearer {self.photographer_token}"}
            response = requests.get(f"{self.base_url}/api/admin/events", headers=headers)
            success = response.status_code == 403
            details = f"Status: {response.status_code} (Expected 403)"
            self.log_test("Photographer Cannot Access Admin Events", success, details)
            return success
        except Exception as e:
            self.log_test("Photographer Cannot Access Admin Events", False, str(e))
            return False

    def test_api_root(self):
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

    # ==================== S3 INTEGRATION TESTS ====================

    def test_s3_connection_test_unauthenticated(self):
        """Test S3 connection test endpoint without authentication"""
        try:
            response = requests.get(f"{self.base_url}/api/admin/test-s3")
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected 401)"
            self.log_test("S3 Connection Test - Unauthenticated", success, details)
            return success
        except Exception as e:
            self.log_test("S3 Connection Test - Unauthenticated", False, str(e))
            return False

    def test_s3_connection_test_with_admin_auth(self):
        """Test S3 connection test endpoint with admin authentication"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/api/admin/test-s3", headers=headers)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                has_status = "status" in data
                has_bucket = "bucket" in data or "message" in data
                success = has_status
                details += f", Has status: {has_status}, Response: {data}"
            self.log_test("S3 Connection Test - With Admin Auth", success, details)
            return success, response.json() if success else None
        except Exception as e:
            self.log_test("S3 Connection Test - With Admin Auth", False, str(e))
            return False, None

    def test_s3_connection_test_with_photographer_auth(self):
        """Test S3 connection test endpoint with photographer authentication (should fail)"""
        try:
            headers = {"Authorization": f"Bearer {self.photographer_token}"}
            response = requests.get(f"{self.base_url}/api/admin/test-s3", headers=headers)
            success = response.status_code == 403
            details = f"Status: {response.status_code} (Expected 403)"
            self.log_test("S3 Connection Test - With Photographer Auth", success, details)
            return success
        except Exception as e:
            self.log_test("S3 Connection Test - With Photographer Auth", False, str(e))
            return False

    def test_event_creation_with_s3_folders_and_qr_code(self):
        """Test event creation includes event_slug, event_url, qr_code and S3 folder creation"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            data = {
                "event_name": "S3 Test Wedding",
                "bride_name": "Sarah Smith",
                "groom_name": "Mike Johnson",
                "event_date": "2024-12-30",
                "venue": "S3 Test Venue",
                "notes": "Testing S3 integration"
            }
            response = requests.post(f"{self.base_url}/api/events", json=data, headers=headers)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                result = response.json()
                required_fields = ["event_id", "event_slug", "event_url", "qr_code", "status"]
                has_all_fields = all(field in result for field in required_fields)
                has_qr_base64 = result.get("qr_code", "").startswith("data:image/png;base64,")
                success = has_all_fields and has_qr_base64
                details += f", Has all fields: {has_all_fields}, QR code format valid: {has_qr_base64}"
                
                # Store event details for further tests
                if success:
                    self.test_event_id = result["event_id"]
                    self.test_event_slug = result["event_slug"]
                    
            self.log_test("Event Creation with S3 Folders and QR Code", success, details)
            return success, result if success else None
        except Exception as e:
            self.log_test("Event Creation with S3 Folders and QR Code", False, str(e))
            return False, None

    def test_create_event_section(self):
        """Test creating a custom section in event's main gallery"""
        try:
            # First ensure we have an event
            if not hasattr(self, 'test_event_id'):
                success, event_data = self.test_event_creation_with_s3_folders_and_qr_code()
                if not success:
                    self.log_test("Create Event Section", False, "Could not create test event")
                    return False
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            data = {"section_name": "Ceremony Photos"}
            
            response = requests.post(
                f"{self.base_url}/api/events/{self.test_event_id}/sections",
                json=data,
                headers=headers
            )
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                result = response.json()
                has_message = "message" in result
                has_section_name = "section_name" in result
                success = has_message and has_section_name
                details += f", Has message: {has_message}, Has section_name: {has_section_name}"
                
            self.log_test("Create Event Section", success, details)
            return success
        except Exception as e:
            self.log_test("Create Event Section", False, str(e))
            return False

    def test_list_event_sections(self):
        """Test listing sections in an event's main gallery"""
        try:
            if not hasattr(self, 'test_event_id'):
                self.log_test("List Event Sections", False, "No test event available")
                return False
                
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(
                f"{self.base_url}/api/events/{self.test_event_id}/sections",
                headers=headers
            )
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                result = response.json()
                has_sections = "sections" in result
                success = has_sections
                details += f", Has sections: {has_sections}, Sections: {result.get('sections', [])}"
                
            self.log_test("List Event Sections", success, details)
            return success
        except Exception as e:
            self.log_test("List Event Sections", False, str(e))
            return False

    def test_photo_upload_to_cover_photos(self):
        """Test uploading photo to cover-photos folder"""
        try:
            if not hasattr(self, 'test_event_id'):
                self.log_test("Photo Upload to Cover Photos", False, "No test event available")
                return False
                
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Create a simple test image file
            test_image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
            
            files = {
                'file': ('test_cover.png', test_image_content, 'image/png')
            }
            data = {
                'folder_type': 'cover-photos'
            }
            
            response = requests.post(
                f"{self.base_url}/api/events/{self.test_event_id}/photos/upload",
                files=files,
                data=data,
                headers=headers
            )
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                result = response.json()
                required_fields = ["photo_id", "original_url", "message"]
                has_required_fields = all(field in result for field in required_fields)
                success = has_required_fields
                details += f", Has required fields: {has_required_fields}"
                
                # Store photo ID for further tests
                if success:
                    self.test_photo_id = result["photo_id"]
                    
            self.log_test("Photo Upload to Cover Photos", success, details)
            return success
        except Exception as e:
            self.log_test("Photo Upload to Cover Photos", False, str(e))
            return False

    def test_photo_upload_to_wall_section(self):
        """Test uploading photo to wall-section folder"""
        try:
            if not hasattr(self, 'test_event_id'):
                self.log_test("Photo Upload to Wall Section", False, "No test event available")
                return False
                
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Create a simple test image file
            test_image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
            
            files = {
                'file': ('test_wall.png', test_image_content, 'image/png')
            }
            data = {
                'folder_type': 'wall-section'
            }
            
            response = requests.post(
                f"{self.base_url}/api/events/{self.test_event_id}/photos/upload",
                files=files,
                data=data,
                headers=headers
            )
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                result = response.json()
                required_fields = ["photo_id", "original_url", "message"]
                has_required_fields = all(field in result for field in required_fields)
                success = has_required_fields
                details += f", Has required fields: {has_required_fields}"
                
            self.log_test("Photo Upload to Wall Section", success, details)
            return success
        except Exception as e:
            self.log_test("Photo Upload to Wall Section", False, str(e))
            return False

    def test_photo_upload_to_main_gallery_with_section(self):
        """Test uploading photo to main-gallery with section"""
        try:
            if not hasattr(self, 'test_event_id'):
                self.log_test("Photo Upload to Main Gallery with Section", False, "No test event available")
                return False
                
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Create a simple test image file
            test_image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
            
            files = {
                'file': ('test_gallery.png', test_image_content, 'image/png')
            }
            data = {
                'folder_type': 'main-gallery',
                'section_name': 'ceremony-photos'
            }
            
            response = requests.post(
                f"{self.base_url}/api/events/{self.test_event_id}/photos/upload",
                files=files,
                data=data,
                headers=headers
            )
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                result = response.json()
                required_fields = ["photo_id", "original_url", "message"]
                has_required_fields = all(field in result for field in required_fields)
                success = has_required_fields
                details += f", Has required fields: {has_required_fields}"
                
            self.log_test("Photo Upload to Main Gallery with Section", success, details)
            return success
        except Exception as e:
            self.log_test("Photo Upload to Main Gallery with Section", False, str(e))
            return False

    def test_photo_upload_invalid_folder_type(self):
        """Test uploading photo with invalid folder type"""
        try:
            if not hasattr(self, 'test_event_id'):
                self.log_test("Photo Upload Invalid Folder Type", False, "No test event available")
                return False
                
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Create a simple test image file
            test_image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
            
            files = {
                'file': ('test_invalid.png', test_image_content, 'image/png')
            }
            data = {
                'folder_type': 'invalid-folder'
            }
            
            response = requests.post(
                f"{self.base_url}/api/events/{self.test_event_id}/photos/upload",
                files=files,
                data=data,
                headers=headers
            )
            success = response.status_code == 400
            details = f"Status: {response.status_code} (Expected 400)"
            
            self.log_test("Photo Upload Invalid Folder Type", success, details)
            return success
        except Exception as e:
            self.log_test("Photo Upload Invalid Folder Type", False, str(e))
            return False

    def test_list_event_photos(self):
        """Test listing photos in an event"""
        try:
            if not hasattr(self, 'test_event_id'):
                self.log_test("List Event Photos", False, "No test event available")
                return False
                
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(
                f"{self.base_url}/api/events/{self.test_event_id}/photos",
                headers=headers
            )
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                result = response.json()
                has_photos = "photos" in result
                has_count = "count" in result
                success = has_photos and has_count
                details += f", Has photos: {has_photos}, Has count: {has_count}, Count: {result.get('count', 0)}"
                
            self.log_test("List Event Photos", success, details)
            return success
        except Exception as e:
            self.log_test("List Event Photos", False, str(e))
            return False

    def test_get_event_photo_counts(self):
        """Test getting photo counts for each folder in an event"""
        try:
            if not hasattr(self, 'test_event_id'):
                self.log_test("Get Event Photo Counts", False, "No test event available")
                return False
                
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(
                f"{self.base_url}/api/events/{self.test_event_id}/photo-counts",
                headers=headers
            )
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                result = response.json()
                expected_keys = ["cover_photos", "wall_section", "main_gallery"]
                has_expected_keys = all(key in result for key in expected_keys)
                success = has_expected_keys
                details += f", Has expected keys: {has_expected_keys}, Counts: {result}"
                
            self.log_test("Get Event Photo Counts", success, details)
            return success
        except Exception as e:
            self.log_test("Get Event Photo Counts", False, str(e))
            return False

    def test_public_event_endpoint_with_valid_slug(self):
        """Test public event endpoint with valid event slug"""
        try:
            if not hasattr(self, 'test_event_slug'):
                self.log_test("Public Event Endpoint Valid Slug", False, "No test event slug available")
                return False
                
            response = requests.get(f"{self.base_url}/api/public/event/{self.test_event_slug}")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                result = response.json()
                expected_fields = ["event_name", "photographer_name", "cover_photos", "wall_photos", "main_gallery", "sections"]
                has_expected_fields = all(field in result for field in expected_fields)
                success = has_expected_fields
                details += f", Has expected fields: {has_expected_fields}"
                
            self.log_test("Public Event Endpoint Valid Slug", success, details)
            return success
        except Exception as e:
            self.log_test("Public Event Endpoint Valid Slug", False, str(e))
            return False

    def test_public_event_endpoint_with_invalid_slug(self):
        """Test public event endpoint with invalid event slug"""
        try:
            response = requests.get(f"{self.base_url}/api/public/event/invalid-slug-123")
            success = response.status_code == 404
            details = f"Status: {response.status_code} (Expected 404)"
            
            self.log_test("Public Event Endpoint Invalid Slug", success, details)
            return success
        except Exception as e:
            self.log_test("Public Event Endpoint Invalid Slug", False, str(e))
            return False

    def test_photo_download_with_valid_photo_id(self):
        """Test photo download with valid photo ID"""
        try:
            if not hasattr(self, 'test_event_slug') or not hasattr(self, 'test_photo_id'):
                self.log_test("Photo Download Valid Photo ID", False, "No test event slug or photo ID available")
                return False
                
            response = requests.get(
                f"{self.base_url}/api/public/event/{self.test_event_slug}/download/{self.test_photo_id}"
            )
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                result = response.json()
                has_download_url = "download_url" in result
                has_filename = "filename" in result
                success = has_download_url and has_filename
                details += f", Has download_url: {has_download_url}, Has filename: {has_filename}"
                
            self.log_test("Photo Download Valid Photo ID", success, details)
            return success
        except Exception as e:
            self.log_test("Photo Download Valid Photo ID", False, str(e))
            return False

    def test_photo_download_with_invalid_photo_id(self):
        """Test photo download with invalid photo ID"""
        try:
            if not hasattr(self, 'test_event_slug'):
                self.log_test("Photo Download Invalid Photo ID", False, "No test event slug available")
                return False
                
            response = requests.get(
                f"{self.base_url}/api/public/event/{self.test_event_slug}/download/invalid-photo-id-123"
            )
            success = response.status_code == 404
            details = f"Status: {response.status_code} (Expected 404)"
            
            self.log_test("Photo Download Invalid Photo ID", success, details)
            return success
        except Exception as e:
            self.log_test("Photo Download Invalid Photo ID", False, str(e))
            return False

    def test_photo_upload_without_auth(self):
        """Test photo upload without authentication"""
        try:
            if not hasattr(self, 'test_event_id'):
                self.log_test("Photo Upload Without Auth", False, "No test event available")
                return False
                
            # Create a simple test image file
            test_image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
            
            files = {
                'file': ('test_unauth.png', test_image_content, 'image/png')
            }
            data = {
                'folder_type': 'cover-photos'
            }
            
            response = requests.post(
                f"{self.base_url}/api/events/{self.test_event_id}/photos/upload",
                files=files,
                data=data
            )
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected 401)"
            
            self.log_test("Photo Upload Without Auth", success, details)
            return success
        except Exception as e:
            self.log_test("Photo Upload Without Auth", False, str(e))
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Wedding Photography Multi-Tenant Admin System Tests")
        print(f"📍 Testing endpoint: {self.base_url}")
        print("=" * 60)

        # Setup mock users and sessions
        if not self.setup_mock_users():
            print("❌ Failed to setup mock users. Aborting tests.")
            return 1

        print("\n🔐 Testing Admin Authentication & Authorization")
        print("-" * 40)
        
        # Test admin endpoints without authentication
        self.test_admin_stats_unauthenticated()
        
        # Test admin endpoints with proper admin authentication
        self.test_admin_stats_with_admin_auth()
        self.test_admin_photographers_list()
        self.test_register_photographer_endpoint()
        self.test_register_duplicate_photographer()
        self.test_list_registered_photographers()
        self.test_update_photographer_status()
        self.test_delete_photographer()
        
        # Test admin endpoints with photographer authentication (should fail)
        self.test_admin_stats_with_photographer_auth()
        self.test_photographer_cannot_access_admin_events()

        print("\n📅 Testing Event Management System")
        print("-" * 40)
        
        # Test event creation and management
        self.test_create_event_as_photographer()
        self.test_create_event_as_admin()
        self.test_list_events_as_photographer()
        self.test_admin_list_all_events()
        self.test_admin_list_pending_events()
        self.test_admin_approve_event()

        print("\n🌐 Testing Basic API Functionality")
        print("-" * 40)
        
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
        
        # Cleanup
        try:
            self.mongo_client.close()
        except:
            pass
        
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