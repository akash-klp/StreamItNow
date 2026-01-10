from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Header
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
from datetime import datetime, timezone, timedelta
import base64
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None

class SessionData(BaseModel):
    user_id: str
    session_token: str
    expires_at: str

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
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            data = response.json()
            
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            existing_user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
            
            if existing_user:
                user_id = existing_user["user_id"]
                await db.users.update_one(
                    {"user_id": user_id},
                    {"$set": {
                        "name": data["name"],
                        "picture": data["picture"],
                        "updated_at": datetime.now(timezone.utc)
                    }}
                )
            else:
                await db.users.insert_one({
                    "user_id": user_id,
                    "email": data["email"],
                    "name": data["name"],
                    "picture": data["picture"],
                    "created_at": datetime.now(timezone.utc)
                })
            
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
            
            return {
                "user": {
                    "user_id": user_id,
                    "email": data["email"],
                    "name": data["name"],
                    "picture": data["picture"]
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