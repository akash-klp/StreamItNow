from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Header, Form
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
import string
import random
from datetime import datetime, timezone, timedelta
import base64
import json
import qrcode
import io
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import S3 service
from s3_service import s3_service

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Admin email configuration
ADMIN_EMAIL = "akashklp07@gmail.com"

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "photographer"  # admin, photographer
    status: str = "pending"  # active, pending, inactive

class SessionData(BaseModel):
    user_id: str
    session_token: str
    expires_at: str

class RegisterPhotographerRequest(BaseModel):
    email: str
    name: Optional[str] = None

class UpdatePhotographerStatusRequest(BaseModel):
    status: str  # active, pending, inactive

class PhotoUploadRequest(BaseModel):
    filename: str
    image_data: str
    wedding_date: str
    photographer_notes: Optional[str] = None

class WallPhotoUploadRequest(BaseModel):
    filename: str
    image_data: str

class BackgroundImageUploadRequest(BaseModel):
    filename: str
    image_data: str

class PhotoMetadata(BaseModel):
    photo_id: str
    filename: str
    image_url: str
    upload_timestamp: str
    wedding_date: str
    photographer_notes: Optional[str]
    photographer_id: str

async def get_current_user_from_header(authorization: Optional[str] = Header(None)):
    """Get current user from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    
    session = await db.user_sessions.find_one(
        {"session_token": token},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

async def get_admin_user(user: dict = Depends(get_current_user_from_header)):
    """Verify user is admin"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def get_active_photographer(user: dict = Depends(get_current_user_from_header)):
    """Verify user is an active photographer or admin"""
    if user.get("role") == "admin":
        return user
    if user.get("role") != "photographer":
        raise HTTPException(status_code=403, detail="Photographer access required")
    if user.get("status") != "active":
        raise HTTPException(status_code=403, detail="Your account is pending approval. Please contact admin.")
    return user

# ==================== ADMIN ENDPOINTS ====================

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_admin_user)):
    """Get admin dashboard statistics"""
    total_photographers = await db.users.count_documents({"role": "photographer"})
    active_photographers = await db.users.count_documents({"role": "photographer", "status": "active"})
    pending_photographers = await db.users.count_documents({"role": "photographer", "status": "pending"})
    inactive_photographers = await db.users.count_documents({"role": "photographer", "status": "inactive"})
    total_photos = await db.photos.count_documents({})
    total_events = await db.events.count_documents({})
    active_events = await db.events.count_documents({"status": "active"})
    pending_events = await db.events.count_documents({"status": "pending"})
    
    return {
        "total_photographers": total_photographers,
        "active_photographers": active_photographers,
        "pending_photographers": pending_photographers,
        "inactive_photographers": inactive_photographers,
        "total_photos": total_photos,
        "total_events": total_events,
        "active_events": active_events,
        "pending_events": pending_events
    }

@api_router.get("/admin/photographers")
async def list_photographers(admin: dict = Depends(get_admin_user)):
    """List all photographers"""
    photographers = await db.users.find(
        {"role": "photographer"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    # Get photo counts for each photographer
    for photographer in photographers:
        photo_count = await db.photos.count_documents({"photographer_id": photographer["user_id"]})
        event_count = await db.events.count_documents({"photographer_id": photographer["user_id"]})
        photographer["photo_count"] = photo_count
        photographer["event_count"] = event_count
    
    return photographers

@api_router.post("/admin/photographers/register")
async def register_photographer(
    request: RegisterPhotographerRequest,
    admin: dict = Depends(get_admin_user)
):
    """Register a new photographer email (pre-approval)"""
    # Check if already registered
    existing = await db.registered_photographers.find_one({"email": request.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Also check if user already exists
    existing_user = await db.users.find_one({"email": request.email.lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    registration_id = str(uuid.uuid4())
    await db.registered_photographers.insert_one({
        "registration_id": registration_id,
        "email": request.email.lower(),
        "name": request.name,
        "registered_by": admin["user_id"],
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": f"Photographer {request.email} registered successfully", "registration_id": registration_id}

@api_router.get("/admin/registered-photographers")
async def list_registered_photographers(admin: dict = Depends(get_admin_user)):
    """List all pre-registered photographer emails"""
    registrations = await db.registered_photographers.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    return registrations

@api_router.delete("/admin/registered-photographers/{email}")
async def remove_registered_photographer(
    email: str,
    admin: dict = Depends(get_admin_user)
):
    """Remove a pre-registered photographer email"""
    result = await db.registered_photographers.delete_one({"email": email.lower()})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    return {"message": f"Registration for {email} removed"}

@api_router.put("/admin/photographers/{user_id}/status")
async def update_photographer_status(
    user_id: str,
    request: UpdatePhotographerStatusRequest,
    admin: dict = Depends(get_admin_user)
):
    """Update photographer status (active, pending, inactive)"""
    if request.status not in ["active", "pending", "inactive"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be: active, pending, inactive")
    
    result = await db.users.update_one(
        {"user_id": user_id, "role": "photographer"},
        {"$set": {
            "status": request.status,
            "updated_at": datetime.now(timezone.utc),
            "updated_by": admin["user_id"]
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Photographer not found")
    
    return {"message": f"Photographer status updated to {request.status}"}

@api_router.delete("/admin/photographers/{user_id}")
async def delete_photographer(
    user_id: str,
    admin: dict = Depends(get_admin_user)
):
    """Delete a photographer and their data"""
    user = await db.users.find_one({"user_id": user_id, "role": "photographer"})
    if not user:
        raise HTTPException(status_code=404, detail="Photographer not found")
    
    # Delete user
    await db.users.delete_one({"user_id": user_id})
    # Delete sessions
    await db.user_sessions.delete_many({"user_id": user_id})
    # Optionally delete their registration
    await db.registered_photographers.delete_one({"email": user["email"]})
    
    return {"message": "Photographer deleted successfully"}

# ==================== EVENT MANAGEMENT ====================

class CreateEventRequest(BaseModel):
    event_name: str
    bride_name: Optional[str] = None
    groom_name: Optional[str] = None
    event_date: str
    venue: Optional[str] = None
    notes: Optional[str] = None

class UpdateEventStatusRequest(BaseModel):
    status: str  # active, pending, completed, cancelled

class CreateSectionRequest(BaseModel):
    section_name: str

def generate_unique_slug(length: int = 8) -> str:
    """Generate a random unique slug for event URL"""
    chars = string.ascii_lowercase + string.digits
    return ''.join(random.choices(chars, k=length))

def generate_qr_code_base64(url: str) -> str:
    """Generate QR code as base64 image"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode()}"

@api_router.post("/events")
async def create_event(
    request: CreateEventRequest,
    user: dict = Depends(get_current_user_from_header)
):
    """Create a new wedding event (requires admin approval)"""
    if user.get("role") not in ["photographer", "admin"]:
        raise HTTPException(status_code=403, detail="Only photographers can create events")
    
    event_id = str(uuid.uuid4())
    event_slug = generate_unique_slug()
    status = "active" if user.get("role") == "admin" else "pending"
    
    # Generate event URL with full domain for QR code
    # Get the frontend URL from environment or use default
    frontend_url = os.environ.get('FRONTEND_URL', 'https://s3-app-bridge.preview.emergentagent.com')
    full_event_url = f"{frontend_url}/event/{event_slug}"
    event_url = f"/event/{event_slug}"
    qr_code = generate_qr_code_base64(full_event_url)
    
    event_doc = {
        "event_id": event_id,
        "event_slug": event_slug,
        "event_url": event_url,
        "full_event_url": full_event_url,
        "qr_code": qr_code,
        "event_name": request.event_name,
        "bride_name": request.bride_name,
        "groom_name": request.groom_name,
        "event_date": request.event_date,
        "venue": request.venue,
        "notes": request.notes,
        "photographer_id": user["user_id"],
        "photographer_name": user["name"],
        "photographer_email": user["email"],
        "status": status,
        "sections": [],  # Custom sections created by photographer
        "photo_counts": {
            "cover_photos": 0,
            "wall_section": 0,
            "main_gallery": 0
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Create S3 folder structure for this event
    try:
        s3_success = await asyncio.to_thread(
            s3_service.create_folder_structure,
            user["user_id"],
            event_id
        )
        if not s3_success:
            logger.warning(f"Failed to create S3 folder structure for event {event_id}")
    except Exception as e:
        logger.error(f"S3 folder creation error: {e}")
    
    await db.events.insert_one(event_doc)
    
    message = "Event created and is active" if status == "active" else "Event created and pending admin approval"
    return {
        "event_id": event_id,
        "event_slug": event_slug,
        "event_url": event_url,
        "qr_code": qr_code,
        "status": status,
        "message": message
    }

@api_router.get("/events")
async def list_events(user: dict = Depends(get_current_user_from_header)):
    """List events for the current photographer"""
    if user.get("role") == "admin":
        # Admin sees all events
        events = await db.events.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    else:
        # Photographer sees only their events
        events = await db.events.find(
            {"photographer_id": user["user_id"]},
            {"_id": 0}
        ).sort("created_at", -1).to_list(1000)
    
    return events

@api_router.get("/events/{event_id}")
async def get_event(event_id: str, user: dict = Depends(get_current_user_from_header)):
    """Get a specific event"""
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check access
    if user.get("role") != "admin" and event["photographer_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return event

@api_router.put("/events/{event_id}")
async def update_event(
    event_id: str,
    request: CreateEventRequest,
    user: dict = Depends(get_current_user_from_header)
):
    """Update an event"""
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check access
    if user.get("role") != "admin" and event["photographer_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.events.update_one(
        {"event_id": event_id},
        {"$set": {
            "event_name": request.event_name,
            "bride_name": request.bride_name,
            "groom_name": request.groom_name,
            "event_date": request.event_date,
            "venue": request.venue,
            "notes": request.notes,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    return {"message": "Event updated successfully"}

@api_router.delete("/events/{event_id}")
async def delete_event(
    event_id: str,
    user: dict = Depends(get_current_user_from_header)
):
    """Delete an event"""
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check access
    if user.get("role") != "admin" and event["photographer_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.events.delete_one({"event_id": event_id})
    return {"message": "Event deleted successfully"}

@api_router.get("/admin/events")
async def list_all_events(admin: dict = Depends(get_admin_user)):
    """List all events (admin only)"""
    events = await db.events.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return events

@api_router.get("/admin/events/pending")
async def list_pending_events(admin: dict = Depends(get_admin_user)):
    """List pending events that need approval"""
    events = await db.events.find(
        {"status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    return events

@api_router.put("/admin/events/{event_id}/status")
async def update_event_status(
    event_id: str,
    request: UpdateEventStatusRequest,
    admin: dict = Depends(get_admin_user)
):
    """Update event status (approve/reject events)"""
    if request.status not in ["active", "pending", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.events.update_one(
        {"event_id": event_id},
        {"$set": {
            "status": request.status,
            "updated_at": datetime.now(timezone.utc),
            "approved_by": admin["user_id"] if request.status == "active" else None
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {"message": f"Event status updated to {request.status}"}

# ==================== S3 PHOTO UPLOAD ENDPOINTS ====================

@api_router.post("/events/{event_id}/sections")
async def create_event_section(
    event_id: str,
    request: CreateSectionRequest,
    user: dict = Depends(get_current_user_from_header)
):
    """Create a custom section in the main gallery"""
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if user.get("role") != "admin" and event["photographer_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    section_name = request.section_name.lower().replace(' ', '-')
    
    # Create S3 folder for section
    try:
        success = await asyncio.to_thread(
            s3_service.create_section_folder,
            user["user_id"],
            event_id,
            section_name
        )
        if not success:
            raise HTTPException(status_code=500, detail="Failed to create section folder")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"S3 error: {str(e)}")
    
    # Update event with new section
    await db.events.update_one(
        {"event_id": event_id},
        {
            "$addToSet": {"sections": section_name},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    return {"message": f"Section '{section_name}' created successfully", "section_name": section_name}

@api_router.get("/events/{event_id}/sections")
async def list_event_sections(
    event_id: str,
    user: dict = Depends(get_current_user_from_header)
):
    """List all sections in an event's main gallery"""
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if user.get("role") != "admin" and event["photographer_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get sections from S3
    try:
        sections = await asyncio.to_thread(
            s3_service.list_sections,
            event["photographer_id"],
            event_id
        )
        return {"sections": sections}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list sections: {str(e)}")

@api_router.delete("/events/{event_id}/sections/{section_name}")
async def delete_event_section(
    event_id: str,
    section_name: str,
    user: dict = Depends(get_current_user_from_header)
):
    """Delete a custom section folder and all its photos"""
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if user.get("role") != "admin" and event["photographer_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Don't allow deleting default folders
    default_folders = {'cover-photos', 'wall-section', 'main-gallery'}
    if section_name in default_folders:
        raise HTTPException(status_code=400, detail="Cannot delete default folders")
    
    # Delete S3 folder
    try:
        success = await asyncio.to_thread(
            s3_service.delete_section_folder,
            event["photographer_id"],
            event_id,
            section_name
        )
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete section folder")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"S3 error: {str(e)}")
    
    # Remove section from event document
    await db.events.update_one(
        {"event_id": event_id},
        {
            "$pull": {"sections": section_name},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    # Delete photo records from MongoDB
    await db.event_photos.delete_many({
        "event_id": event_id,
        "folder_type": section_name
    })
    
    return {"message": f"Section '{section_name}' deleted successfully"}

@api_router.post("/events/{event_id}/photos/upload")
async def upload_event_photo(
    event_id: str,
    folder_type: str = Form(...),  # cover-photos, wall-section, main-gallery, or custom section
    section_name: Optional[str] = Form(None),  # Deprecated - use folder_type directly
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user_from_header)
):
    """Upload a photo to an event folder in S3"""
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if user.get("role") != "admin" and event["photographer_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate folder type
    valid_folders = ["cover-photos", "wall-section", "main-gallery"]
    if folder_type not in valid_folders:
        raise HTTPException(status_code=400, detail=f"Invalid folder type. Must be one of: {valid_folders}")
    
    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Must be JPEG, PNG, or WebP")
    
    # Read file content
    content = await file.read()
    
    # Validate file size (max 50MB)
    max_size = 50 * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(status_code=413, detail="File too large. Max 50MB")
    
    # Check photo limits
    try:
        counts = await asyncio.to_thread(
            s3_service.get_event_photo_counts,
            event["photographer_id"],
            event_id
        )
        
        if folder_type == "cover-photos" and counts["cover_photos"] >= 20:
            raise HTTPException(status_code=400, detail="Maximum 20 cover photos allowed")
        elif folder_type == "wall-section" and counts["wall_section"] >= 40:
            raise HTTPException(status_code=400, detail="Maximum 40 wall photos allowed")
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Could not check photo counts: {e}")
    
    # Upload to S3
    try:
        result = await asyncio.to_thread(
            s3_service.upload_image,
            content,
            file.filename,
            event["photographer_id"],
            event_id,
            folder_type,
            section_name
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to upload image")
        
        # Store photo metadata in MongoDB
        photo_doc = {
            "photo_id": str(uuid.uuid4()),
            "event_id": event_id,
            "photographer_id": event["photographer_id"],
            "folder_type": folder_type,
            "section_name": section_name,
            "filename": result["filename"],
            "original_url": result["original_url"],
            "thumbnail_url": result["thumbnail_url"],
            "medium_url": result["medium_url"],
            "s3_key": result["original_key"],
            "size": result["size"],
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.event_photos.insert_one(photo_doc)
        
        return {
            "photo_id": photo_doc["photo_id"],
            "original_url": result["original_url"],
            "thumbnail_url": result["thumbnail_url"],
            "medium_url": result["medium_url"],
            "message": "Photo uploaded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.get("/events/{event_id}/photos")
async def list_event_photos(
    event_id: str,
    folder_type: Optional[str] = None,
    section_name: Optional[str] = None,
    user: dict = Depends(get_current_user_from_header)
):
    """List photos in an event (from MongoDB metadata)"""
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if user.get("role") != "admin" and event["photographer_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Build query
    query = {"event_id": event_id}
    if folder_type:
        query["folder_type"] = folder_type
    if section_name:
        query["section_name"] = section_name
    
    photos = await db.event_photos.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    return {"photos": photos, "count": len(photos)}

@api_router.delete("/events/{event_id}/photos/{photo_id}")
async def delete_event_photo(
    event_id: str,
    photo_id: str,
    user: dict = Depends(get_current_user_from_header)
):
    """Delete a photo from an event"""
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if user.get("role") != "admin" and event["photographer_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    photo = await db.event_photos.find_one({"photo_id": photo_id, "event_id": event_id}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    # Delete from S3
    try:
        await asyncio.to_thread(s3_service.delete_image, photo["s3_key"])
    except Exception as e:
        logger.error(f"Failed to delete from S3: {e}")
    
    # Delete from MongoDB
    await db.event_photos.delete_one({"photo_id": photo_id})
    
    return {"message": "Photo deleted successfully"}

@api_router.get("/events/{event_id}/photo-counts")
async def get_event_photo_counts(
    event_id: str,
    user: dict = Depends(get_current_user_from_header)
):
    """Get photo counts for each folder in an event"""
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if user.get("role") != "admin" and event["photographer_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        counts = await asyncio.to_thread(
            s3_service.get_event_photo_counts,
            event["photographer_id"],
            event_id
        )
        return counts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get photo counts: {str(e)}")

# ==================== PUBLIC EVENT PAGE (GUEST ACCESS) ====================

@api_router.get("/public/event/{event_slug}")
async def get_public_event(event_slug: str):
    """Get event data for public guest view (no auth required)"""
    event = await db.events.find_one({"event_slug": event_slug}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if event.get("status") != "active":
        raise HTTPException(status_code=403, detail="This event is not available")
    
    # Get photos from MongoDB
    cover_photos = await db.event_photos.find(
        {"event_id": event["event_id"], "folder_type": "cover-photos"},
        {"_id": 0, "s3_key": 0}
    ).sort("created_at", -1).to_list(20)
    
    wall_photos = await db.event_photos.find(
        {"event_id": event["event_id"], "folder_type": "wall-section"},
        {"_id": 0, "s3_key": 0}
    ).sort("created_at", -1).to_list(40)
    
    # Get main gallery photos (direct and from sections)
    main_gallery = await db.event_photos.find(
        {"event_id": event["event_id"], "folder_type": "main-gallery", "section_name": None},
        {"_id": 0, "s3_key": 0}
    ).sort("created_at", -1).to_list(1000)
    
    # Get sections with their photos
    sections_data = {}
    for section in event.get("sections", []):
        section_photos = await db.event_photos.find(
            {"event_id": event["event_id"], "folder_type": "main-gallery", "section_name": section},
            {"_id": 0, "s3_key": 0}
        ).sort("created_at", -1).to_list(1000)
        sections_data[section] = section_photos
    
    return {
        "event_name": event["event_name"],
        "bride_name": event.get("bride_name"),
        "groom_name": event.get("groom_name"),
        "event_date": event.get("event_date"),
        "venue": event.get("venue"),
        "photographer_name": event["photographer_name"],
        "cover_photos": cover_photos,
        "wall_photos": wall_photos,
        "main_gallery": main_gallery,
        "sections": sections_data
    }

@api_router.get("/public/event/{event_slug}/download/{photo_id}")
async def download_photo(event_slug: str, photo_id: str):
    """Generate presigned URL for photo download"""
    event = await db.events.find_one({"event_slug": event_slug}, {"_id": 0})
    if not event or event.get("status") != "active":
        raise HTTPException(status_code=404, detail="Event not found or not available")
    
    photo = await db.event_photos.find_one(
        {"photo_id": photo_id, "event_id": event["event_id"]},
        {"_id": 0}
    )
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    # Generate presigned URL for download
    try:
        download_url = await asyncio.to_thread(
            s3_service.generate_presigned_url,
            photo["s3_key"],
            3600  # 1 hour expiration
        )
        return {"download_url": download_url, "filename": photo["filename"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate download URL")

# ==================== S3 CONNECTION TEST ====================

@api_router.get("/admin/test-s3")
async def test_s3_connection(admin: dict = Depends(get_admin_user)):
    """Test S3 connection (admin only)"""
    try:
        success = await asyncio.to_thread(s3_service.test_connection)
        if success:
            return {"status": "connected", "bucket": s3_service.bucket_name}
        else:
            return {"status": "failed", "message": "Could not connect to S3"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ==================== PUBLIC/SETTINGS ENDPOINTS ====================

@api_router.get("/settings")
async def get_settings():
    """Get photographer settings (public endpoint)"""
    settings = await db.settings.find_one({}, {"_id": 0})
    
    if not settings:
        return {
            "photography_name": "Wedding Clickz Photography",
            "email": "info@weddingclickz.com",
            "instagram_link": "https://instagram.com/weddingclickz",
            "youtube_link": "https://youtube.com/@weddingclickz",
            "whatsapp_number": "1234567890",
            "location_link": "https://maps.google.com/?q=Bangalore",
            "bride_name": "",
            "groom_name": ""
        }
    
    return settings

@api_router.post("/settings")
async def update_settings(
    settings: dict,
    user: dict = Depends(get_current_user_from_header)
):
    """Update photographer settings"""
    await db.settings.update_one(
        {},
        {"$set": {
            **settings,
            "updated_at": datetime.now(timezone.utc),
            "updated_by": user["user_id"]
        }},
        upsert=True
    )
    
    return {"message": "Settings updated successfully"}

@api_router.get("/wall-photos")
async def get_wall_photos():
    """Get wall/portfolio photos (public endpoint)"""
    photos = await db.wall_photos.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return photos

@api_router.post("/wall-photos/upload")
async def upload_wall_photo(
    request: WallPhotoUploadRequest,
    user: dict = Depends(get_current_user_from_header)
):
    """Upload a photo to the wall/portfolio"""
    try:
        photo_id = str(uuid.uuid4())
        
        photo_doc = {
            "photo_id": photo_id,
            "filename": request.filename,
            "image_data": request.image_data,
            "photographer_id": user["user_id"],
            "photographer_name": user["name"],
            "upload_timestamp": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.wall_photos.insert_one(photo_doc)
        
        return {
            "photo_id": photo_id,
            "message": "Wall photo uploaded successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.delete("/wall-photos/{photo_id}")
async def delete_wall_photo(
    photo_id: str,
    user: dict = Depends(get_current_user_from_header)
):
    """Delete a wall photo"""
    photo = await db.wall_photos.find_one({"photo_id": photo_id}, {"_id": 0})
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    if photo["photographer_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this photo")
    
    await db.wall_photos.delete_one({"photo_id": photo_id})
    
    return {"message": "Wall photo deleted successfully"}

@api_router.get("/background-images")
async def get_background_images():
    """Get background slideshow images (public endpoint)"""
    images = await db.background_images.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return images

@api_router.post("/background-images/upload")
async def upload_background_image(
    request: BackgroundImageUploadRequest,
    user: dict = Depends(get_current_user_from_header)
):
    """Upload a background slideshow image"""
    try:
        photo_id = str(uuid.uuid4())
        
        image_doc = {
            "photo_id": photo_id,
            "filename": request.filename,
            "image_data": request.image_data,
            "photographer_id": user["user_id"],
            "photographer_name": user["name"],
            "upload_timestamp": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.background_images.insert_one(image_doc)
        
        return {
            "photo_id": photo_id,
            "message": "Background image uploaded successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.delete("/background-images/{photo_id}")
async def delete_background_image(
    photo_id: str,
    user: dict = Depends(get_current_user_from_header)
):
    """Delete a background image"""
    image = await db.background_images.find_one({"photo_id": photo_id}, {"_id": 0})
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    if image["photographer_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this image")
    
    await db.background_images.delete_one({"photo_id": photo_id})
    
    return {"message": "Background image deleted successfully"}

@api_router.get("/")
async def root():
    return {"message": "Wedding Clickz Photography API"}

@api_router.post("/auth/session")
async def create_session(session_id: str = Header(..., alias="X-Session-ID")):
    """Exchange session_id for user data and session_token"""
    import httpx
    
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            data = response.json()
            email = data["email"].lower()
            
            # Determine user role
            is_admin = email == ADMIN_EMAIL.lower()
            
            # Check if user already exists in the system
            existing_user = await db.users.find_one({"email": email}, {"_id": 0})
            
            # Check if user is registered photographer (unless admin or already exists)
            if not is_admin and not existing_user:
                is_registered = await db.registered_photographers.find_one({"email": email})
                if not is_registered:
                    raise HTTPException(
                        status_code=403, 
                        detail="Access denied. Your email is not registered. Please contact the administrator to get registered."
                    )
            
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            
            if existing_user:
                user_id = existing_user["user_id"]
                # Update user but preserve role and status
                await db.users.update_one(
                    {"user_id": user_id},
                    {"$set": {
                        "name": data["name"],
                        "picture": data["picture"],
                        "updated_at": datetime.now(timezone.utc)
                    }}
                )
                role = existing_user.get("role", "photographer")
                status = existing_user.get("status", "pending")
            else:
                # New user
                role = "admin" if is_admin else "photographer"
                status = "active" if is_admin else "pending"
                
                await db.users.insert_one({
                    "user_id": user_id,
                    "email": email,
                    "name": data["name"],
                    "picture": data["picture"],
                    "role": role,
                    "status": status,
                    "created_at": datetime.now(timezone.utc)
                })
                
                # If photographer, remove from registered list as they've now signed up
                if not is_admin:
                    await db.registered_photographers.delete_one({"email": email})
            
            session_token = data["session_token"]
            expires_at = datetime.now(timezone.utc) + timedelta(days=7)
            
            await db.user_sessions.update_one(
                {"user_id": user_id},
                {"$set": {
                    "session_token": session_token,
                    "expires_at": expires_at,
                    "created_at": datetime.now(timezone.utc)
                }},
                upsert=True
            )
            
            # Fetch updated user data
            user_data = await db.users.find_one({"user_id": user_id}, {"_id": 0})
            
            return {
                "user": {
                    "user_id": user_id,
                    "email": email,
                    "name": data["name"],
                    "picture": data["picture"],
                    "role": user_data.get("role", role),
                    "status": user_data.get("status", status)
                },
                "session_token": session_token
            }
    
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify session: {str(e)}")

@api_router.get("/auth/me")
async def get_current_user(user: dict = Depends(get_current_user_from_header)):
    """Get current authenticated user"""
    return user

@api_router.post("/auth/logout")
async def logout(user: dict = Depends(get_current_user_from_header)):
    """Logout user by deleting session"""
    await db.user_sessions.delete_many({"user_id": user["user_id"]})
    return {"message": "Logged out successfully"}

@api_router.post("/photos/upload")
async def upload_photo(
    request: PhotoUploadRequest,
    user: dict = Depends(get_current_user_from_header)
):
    """Upload a wedding photo (MOCK: stores base64 in MongoDB)"""
    try:
        photo_id = str(uuid.uuid4())
        
        photo_doc = {
            "photo_id": photo_id,
            "filename": request.filename,
            "image_data": request.image_data,
            "wedding_date": request.wedding_date,
            "photographer_notes": request.photographer_notes,
            "photographer_id": user["user_id"],
            "photographer_name": user["name"],
            "upload_timestamp": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.photos.insert_one(photo_doc)
        
        return {
            "photo_id": photo_id,
            "message": "Photo uploaded successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.get("/photos/list")
async def list_photos(user: dict = Depends(get_current_user_from_header)):
    """List all photos uploaded by the photographer"""
    photos = await db.photos.find(
        {"photographer_id": user["user_id"]},
        {"_id": 0, "image_data": 0}
    ).sort("created_at", -1).to_list(1000)
    
    return photos

@api_router.get("/photos/guest")
async def list_guest_photos():
    """List all wedding photos for guests (public endpoint)"""
    photos = await db.photos.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    return photos

@api_router.get("/photos/{photo_id}")
async def get_photo(photo_id: str):
    """Get a specific photo by ID (public endpoint)"""
    photo = await db.photos.find_one({"photo_id": photo_id}, {"_id": 0})
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    return photo

@api_router.delete("/photos/{photo_id}")
async def delete_photo(
    photo_id: str,
    user: dict = Depends(get_current_user_from_header)
):
    """Delete a photo"""
    photo = await db.photos.find_one({"photo_id": photo_id}, {"_id": 0})
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    if photo["photographer_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this photo")
    
    await db.photos.delete_one({"photo_id": photo_id})
    
    return {"message": "Photo deleted successfully"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()