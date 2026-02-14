"""
S3 Service for Wedding Photography App
Handles all S3 operations for image storage and retrieval
"""
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
import os
import uuid
from typing import Optional, List, Dict
from PIL import Image
import io
import logging
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv(Path(__file__).parent / '.env', override=True)

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        """Initialize S3 client with proper configuration"""
        self.s3_client = boto3.client(
            's3',
            region_name=os.environ.get('AWS_REGION', 'ap-south-2'),
            aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
            config=Config(signature_version="s3v4")
        )
        self.bucket_name = os.environ.get('S3_BUCKET_NAME', 'streamlitmus')
        self.public_url = os.environ.get('S3_PUBLIC_URL', f"https://{self.bucket_name}.s3.ap-south-2.amazonaws.com")
        self.presigned_expiration = int(os.environ.get('PRESIGNED_URL_EXPIRATION', 3600))

    def _get_content_type(self, filename: str) -> str:
        """Get content type based on file extension"""
        extension = filename.lower().split('.')[-1] if '.' in filename else ''
        content_types = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp',
            'gif': 'image/gif'
        }
        return content_types.get(extension, 'application/octet-stream')

    def create_folder_structure(self, photographer_id: str, event_id: str) -> bool:
        """
        Create the folder structure for a new event in S3
        
        Structure:
        photographers/{photographer_id}/events/{event_id}/
            ├── cover-photos/
            ├── wall-section/
            ├── main-gallery/
            └── {custom-sections}/   # Created by photographer
        """
        try:
            base_path = f"photographers/{photographer_id}/events/{event_id}"
            folders = [
                f"{base_path}/cover-photos/.placeholder",
                f"{base_path}/wall-section/.placeholder",
                f"{base_path}/main-gallery/.placeholder"
            ]
            
            for folder in folders:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=folder,
                    Body=b""
                )
            
            logger.info(f"Created folder structure for event {event_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error creating folder structure: {e}")
            return False

    def create_section_folder(self, photographer_id: str, event_id: str, section_name: str) -> bool:
        """Create a custom section folder at the same level as cover-photos and wall-section"""
        try:
            key = f"photographers/{photographer_id}/events/{event_id}/{section_name}/.placeholder"
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=b""
            )
            logger.info(f"Created section folder: {section_name}")
            return True
        except Exception as e:
            logger.error(f"Error creating section folder: {e}")
            return False

    def upload_image(
        self,
        file_content: bytes,
        filename: str,
        photographer_id: str,
        event_id: str,
        folder_type: str,  # cover-photos, wall-section, main-gallery, or custom section name
        section_name: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Upload an image to S3 with optimized versions
        
        Returns:
            Dict with original_url, thumbnail_url, and metadata
        """
        try:
            # Generate unique filename
            unique_id = uuid.uuid4().hex[:8]
            clean_filename = filename.replace(' ', '_')
            unique_filename = f"{unique_id}_{clean_filename}"
            
            # Determine the S3 path - all folders are at the same level
            base_path = f"photographers/{photographer_id}/events/{event_id}/{folder_type}"
            
            # Upload original
            original_key = f"{base_path}/{unique_filename}"
            content_type = self._get_content_type(filename)
            
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=original_key,
                Body=file_content,
                ContentType=content_type
            )
            
            original_url = f"{self.public_url}/{original_key}"
            
            # Create and upload thumbnail
            thumbnail_content = self._create_thumbnail(file_content)
            thumbnail_url = None
            
            if thumbnail_content:
                thumbnail_key = f"{base_path}/thumbnails/thumb_{unique_filename}"
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=thumbnail_key,
                    Body=thumbnail_content,
                    ContentType='image/jpeg'
                )
                thumbnail_url = f"{self.public_url}/{thumbnail_key}"
            
            # Create medium quality version
            medium_content = self._create_medium_quality(file_content)
            medium_url = None
            
            if medium_content:
                medium_key = f"{base_path}/medium/med_{unique_filename}"
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=medium_key,
                    Body=medium_content,
                    ContentType='image/jpeg'
                )
                medium_url = f"{self.public_url}/{medium_key}"
            
            return {
                "original_url": original_url,
                "thumbnail_url": thumbnail_url,
                "medium_url": medium_url,
                "filename": unique_filename,
                "original_key": original_key,
                "size": len(file_content)
            }
            
        except Exception as e:
            logger.error(f"Error uploading image: {e}")
            return None

    def _create_thumbnail(self, image_content: bytes, max_size: tuple = (300, 300)) -> Optional[bytes]:
        """Create a thumbnail from image bytes"""
        try:
            image = Image.open(io.BytesIO(image_content))
            
            # Convert RGBA to RGB if necessary
            if image.mode in ("RGBA", "P"):
                rgb_image = Image.new("RGB", image.size, (255, 255, 255))
                if image.mode == "RGBA":
                    rgb_image.paste(image, mask=image.split()[3])
                else:
                    rgb_image.paste(image)
                image = rgb_image
            
            # Create thumbnail preserving aspect ratio
            image.thumbnail(max_size, Image.LANCZOS)
            
            output = io.BytesIO()
            image.save(output, format="JPEG", quality=80)
            output.seek(0)
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Error creating thumbnail: {e}")
            return None

    def _create_medium_quality(self, image_content: bytes, max_width: int = 1200) -> Optional[bytes]:
        """Create a medium quality version for lightbox preview"""
        try:
            image = Image.open(io.BytesIO(image_content))
            
            # Convert RGBA to RGB if necessary
            if image.mode in ("RGBA", "P"):
                rgb_image = Image.new("RGB", image.size, (255, 255, 255))
                if image.mode == "RGBA":
                    rgb_image.paste(image, mask=image.split()[3])
                else:
                    rgb_image.paste(image)
                image = rgb_image
            
            # Resize if wider than max_width
            if image.width > max_width:
                aspect_ratio = image.height / image.width
                new_height = int(max_width * aspect_ratio)
                image = image.resize((max_width, new_height), Image.LANCZOS)
            
            output = io.BytesIO()
            image.save(output, format="JPEG", quality=85)
            output.seek(0)
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Error creating medium quality image: {e}")
            return None

    def list_images(
        self,
        photographer_id: str,
        event_id: str,
        folder_type: str,
        section_name: Optional[str] = None
    ) -> List[Dict]:
        """List all images in a specific folder"""
        try:
            # All folders are at the same level now
            prefix = f"photographers/{photographer_id}/events/{event_id}/{folder_type}/"
            
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix,
                MaxKeys=1000
            )
            
            images = []
            if "Contents" in response:
                for obj in response["Contents"]:
                    key = obj["Key"]
                    # Skip placeholder files, thumbnails, and medium versions
                    if '.placeholder' in key or '/thumbnails/' in key or '/medium/' in key:
                        continue
                    
                    # Get filename from key
                    filename = key.split('/')[-1]
                    
                    images.append({
                        "key": key,
                        "filename": filename,
                        "url": f"{self.public_url}/{key}",
                        "thumbnail_url": f"{self.public_url}/{'/'.join(key.split('/')[:-1])}/thumbnails/thumb_{filename}",
                        "medium_url": f"{self.public_url}/{'/'.join(key.split('/')[:-1])}/medium/med_{filename}",
                        "size": obj["Size"],
                        "last_modified": obj["LastModified"].isoformat()
                    })
            
            return images
            
        except Exception as e:
            logger.error(f"Error listing images: {e}")
            return []

    def list_sections(self, photographer_id: str, event_id: str) -> List[str]:
        """List all custom sections in main-gallery"""
        try:
            prefix = f"photographers/{photographer_id}/events/{event_id}/main-gallery/sections/"
            
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix,
                Delimiter='/'
            )
            
            sections = []
            if "CommonPrefixes" in response:
                for prefix_obj in response["CommonPrefixes"]:
                    section = prefix_obj["Prefix"].rstrip('/').split('/')[-1]
                    if section:
                        sections.append(section)
            
            return sections
            
        except Exception as e:
            logger.error(f"Error listing sections: {e}")
            return []

    def delete_image(self, key: str) -> bool:
        """Delete an image and its variants from S3"""
        try:
            # Delete original
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
            
            # Delete thumbnail
            filename = key.split('/')[-1]
            base_path = '/'.join(key.split('/')[:-1])
            thumbnail_key = f"{base_path}/thumbnails/thumb_{filename}"
            medium_key = f"{base_path}/medium/med_{filename}"
            
            try:
                self.s3_client.delete_object(Bucket=self.bucket_name, Key=thumbnail_key)
            except:
                pass
            
            try:
                self.s3_client.delete_object(Bucket=self.bucket_name, Key=medium_key)
            except:
                pass
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting image: {e}")
            return False

    def delete_event_folder(self, photographer_id: str, event_id: str) -> bool:
        """Delete entire event folder and all contents"""
        try:
            prefix = f"photographers/{photographer_id}/events/{event_id}/"
            
            # List all objects with this prefix
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )
            
            if "Contents" in response:
                objects_to_delete = [{"Key": obj["Key"]} for obj in response["Contents"]]
                
                if objects_to_delete:
                    self.s3_client.delete_objects(
                        Bucket=self.bucket_name,
                        Delete={"Objects": objects_to_delete}
                    )
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting event folder: {e}")
            return False

    def generate_presigned_url(self, key: str, expiration: Optional[int] = None) -> Optional[str]:
        """Generate a presigned URL for downloading a file"""
        try:
            url = self.s3_client.generate_presigned_url(
                ClientMethod='get_object',
                Params={'Bucket': self.bucket_name, 'Key': key},
                ExpiresIn=expiration or self.presigned_expiration
            )
            return url
        except Exception as e:
            logger.error(f"Error generating presigned URL: {e}")
            return None

    def get_event_photo_counts(self, photographer_id: str, event_id: str) -> Dict:
        """Get photo counts for each folder in an event"""
        try:
            base_path = f"photographers/{photographer_id}/events/{event_id}"
            
            counts = {
                "cover_photos": 0,
                "wall_section": 0,
                "main_gallery": 0,
                "sections": {}
            }
            
            # Count cover photos
            cover_response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=f"{base_path}/cover-photos/"
            )
            if "Contents" in cover_response:
                counts["cover_photos"] = len([
                    obj for obj in cover_response["Contents"]
                    if not obj["Key"].endswith('.placeholder') and '/thumbnails/' not in obj["Key"] and '/medium/' not in obj["Key"]
                ])
            
            # Count wall section
            wall_response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=f"{base_path}/wall-section/"
            )
            if "Contents" in wall_response:
                counts["wall_section"] = len([
                    obj for obj in wall_response["Contents"]
                    if not obj["Key"].endswith('.placeholder') and '/thumbnails/' not in obj["Key"] and '/medium/' not in obj["Key"]
                ])
            
            # Count main gallery (direct uploads)
            gallery_response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=f"{base_path}/main-gallery/",
                Delimiter='/'
            )
            if "Contents" in gallery_response:
                counts["main_gallery"] = len([
                    obj for obj in gallery_response["Contents"]
                    if not obj["Key"].endswith('.placeholder') and '/thumbnails/' not in obj["Key"] and '/medium/' not in obj["Key"]
                ])
            
            # Count sections
            sections = self.list_sections(photographer_id, event_id)
            for section in sections:
                section_response = self.s3_client.list_objects_v2(
                    Bucket=self.bucket_name,
                    Prefix=f"{base_path}/main-gallery/sections/{section}/"
                )
                if "Contents" in section_response:
                    counts["sections"][section] = len([
                        obj for obj in section_response["Contents"]
                        if not obj["Key"].endswith('.placeholder') and '/thumbnails/' not in obj["Key"] and '/medium/' not in obj["Key"]
                    ])
            
            return counts
            
        except Exception as e:
            logger.error(f"Error getting photo counts: {e}")
            return {"cover_photos": 0, "wall_section": 0, "main_gallery": 0, "sections": {}}

    def test_connection(self) -> bool:
        """Test S3 connection"""
        try:
            # Use list_objects_v2 instead of head_bucket for better compatibility
            self.s3_client.list_objects_v2(Bucket=self.bucket_name, MaxKeys=1)
            logger.info(f"Successfully connected to S3 bucket: {self.bucket_name}")
            return True
        except ClientError as e:
            error_code = e.response['Error']['Code']
            logger.error(f"S3 connection failed: {error_code}")
            return False
        except Exception as e:
            logger.error(f"S3 connection error: {e}")
            return False


# Create singleton instance
s3_service = S3Service()
