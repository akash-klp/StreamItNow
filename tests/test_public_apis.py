"""
Backend API Tests for Wedding Photography App
Tests public endpoints: settings, photos/guest, wall-photos, background-images
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPublicAPIs:
    """Test public API endpoints (no auth required)"""
    
    def test_settings_endpoint_returns_200(self):
        """Test /api/settings returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_settings_endpoint_returns_required_fields(self):
        """Test /api/settings returns required photographer settings fields"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        
        data = response.json()
        # Check required fields exist
        assert "photography_name" in data, "Missing photography_name field"
        assert "email" in data, "Missing email field"
        assert "instagram_link" in data, "Missing instagram_link field"
        assert "youtube_link" in data, "Missing youtube_link field"
        assert "whatsapp_number" in data, "Missing whatsapp_number field"
        assert "location_link" in data, "Missing location_link field"
        
        # Validate field types
        assert isinstance(data["photography_name"], str)
        assert isinstance(data["email"], str)
    
    def test_guest_photos_endpoint_returns_200(self):
        """Test /api/photos/guest returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/photos/guest")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_guest_photos_endpoint_returns_list(self):
        """Test /api/photos/guest returns a list"""
        response = requests.get(f"{BASE_URL}/api/photos/guest")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Expected list response"
    
    def test_guest_photos_structure_if_photos_exist(self):
        """Test photo structure if photos exist in database"""
        response = requests.get(f"{BASE_URL}/api/photos/guest")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            photo = data[0]
            assert "photo_id" in photo, "Missing photo_id field"
            assert "filename" in photo, "Missing filename field"
            assert "image_data" in photo, "Missing image_data field"
            # Verify image_data is base64 encoded
            assert photo["image_data"].startswith("data:image/"), "image_data should be base64 data URL"
    
    def test_wall_photos_endpoint_returns_200(self):
        """Test /api/wall-photos returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/wall-photos")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_wall_photos_endpoint_returns_list(self):
        """Test /api/wall-photos returns a list"""
        response = requests.get(f"{BASE_URL}/api/wall-photos")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Expected list response"
    
    def test_wall_photos_structure_if_photos_exist(self):
        """Test wall photo structure if photos exist"""
        response = requests.get(f"{BASE_URL}/api/wall-photos")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            photo = data[0]
            assert "photo_id" in photo, "Missing photo_id field"
            assert "filename" in photo, "Missing filename field"
            assert "image_data" in photo, "Missing image_data field"
    
    def test_background_images_endpoint_returns_200(self):
        """Test /api/background-images returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/background-images")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_background_images_endpoint_returns_list(self):
        """Test /api/background-images returns a list"""
        response = requests.get(f"{BASE_URL}/api/background-images")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Expected list response"
    
    def test_api_root_endpoint(self):
        """Test /api/ root endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data


class TestProtectedAPIs:
    """Test protected API endpoints (require auth)"""
    
    def test_auth_me_without_token_returns_401(self):
        """Test /api/auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_photos_list_without_token_returns_401(self):
        """Test /api/photos/list without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/photos/list")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_photos_upload_without_token_returns_401(self):
        """Test /api/photos/upload without token returns 401"""
        response = requests.post(f"{BASE_URL}/api/photos/upload", json={
            "filename": "test.jpg",
            "image_data": "data:image/jpeg;base64,test",
            "wedding_date": "2025-01-01"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_wall_photos_upload_without_token_returns_401(self):
        """Test /api/wall-photos/upload without token returns 401"""
        response = requests.post(f"{BASE_URL}/api/wall-photos/upload", json={
            "filename": "test.jpg",
            "image_data": "data:image/jpeg;base64,test"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_background_images_upload_without_token_returns_401(self):
        """Test /api/background-images/upload without token returns 401"""
        response = requests.post(f"{BASE_URL}/api/background-images/upload", json={
            "filename": "test.jpg",
            "image_data": "data:image/jpeg;base64,test"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_settings_update_without_token_returns_401(self):
        """Test POST /api/settings without token returns 401"""
        response = requests.post(f"{BASE_URL}/api/settings", json={
            "photography_name": "Test Photography"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestPhotoEndpoints:
    """Test individual photo endpoints"""
    
    def test_get_nonexistent_photo_returns_404(self):
        """Test /api/photos/{photo_id} with invalid ID returns 404"""
        response = requests.get(f"{BASE_URL}/api/photos/nonexistent-photo-id")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_delete_photo_without_token_returns_401(self):
        """Test DELETE /api/photos/{photo_id} without token returns 401"""
        response = requests.delete(f"{BASE_URL}/api/photos/some-photo-id")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
