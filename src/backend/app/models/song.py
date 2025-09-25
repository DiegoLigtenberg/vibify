"""
Song model for Vibify
Defines the structure and validation for song data
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Song(BaseModel):
    """Song model representing a music track"""
    
    # Core identifiers
    id: str = Field(..., description="Unique song identifier")
    title: str = Field(..., description="Song title")
    artist: str = Field(..., description="Artist name")
    album: str = Field(..., description="Album name")
    
    # Media information
    duration: float = Field(..., description="Song duration in seconds")
    storage_url: str = Field(..., description="URL to audio file")
    thumbnail_url: str = Field(..., description="URL to thumbnail image")
    
    # Metadata
    release_date: Optional[str] = Field(None, description="Release date")
    description: Optional[str] = Field(None, description="Song description")
    genres: Optional[List[str]] = Field(default=[], description="Song genres")
    
    # Statistics
    view_count: int = Field(default=0, description="Number of views")
    like_count: int = Field(default=0, description="Number of likes")
    streams: int = Field(default=0, description="Number of streams/listens")
    
    
    # System fields
    is_public: bool = Field(default=True, description="Whether song is publicly visible")
    uploaded_by: Optional[str] = Field(None, description="User who uploaded the song")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    
    class Config:
        """Pydantic configuration"""
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class SongCreate(BaseModel):
    """Model for creating a new song"""
    title: str
    artist: str
    album: str
    duration: float
    release_date: Optional[str] = None
    description: Optional[str] = None
    genres: Optional[List[str]] = []
    is_public: bool = True

class SongUpdate(BaseModel):
    """Model for updating an existing song"""
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    description: Optional[str] = None
    genres: Optional[List[str]] = None
    is_public: Optional[bool] = None

class SongResponse(BaseModel):
    """Model for API responses with song data"""
    songs: List[Song]
    total: int
    page: int = 1
    limit: int = 20
    has_more: bool = False

class SongSearchParams(BaseModel):
    """Model for song search parameters"""
    query: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    genres: Optional[List[str]] = None
    limit: int = 20
    offset: int = 0
    sort_by: str = "created_at"
    sort_order: str = "desc"
