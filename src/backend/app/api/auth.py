from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.song_service import SongService
from ..config.simple_config import Config
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    username: str

class RegisterRequest(BaseModel):
    username: str

class AuthResponse(BaseModel):
    success: bool
    error: str = None
    user_id: str = None
    username: str = None
    created_at: str = None

@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Login with username"""
    try:
        if not request.username or len(request.username) > 10:
            raise HTTPException(status_code=400, detail="Username must be 1-10 characters")
        
        # Call Supabase RPC function
        rpc_url = f"{Config.SUPABASE_URL}/rest/v1/rpc/login_username"
        headers = {
            "Content-Type": "application/json",
            "apikey": Config.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {Config.SUPABASE_SERVICE_ROLE_KEY}",
            "Prefer": "return=representation"
        }
        payload = {"username_input": request.username}
        
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(rpc_url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Login failed"))
        
        return AuthResponse(
            success=True,
            user_id=result["user_id"],
            username=result["username"],
            created_at=result.get("created_at", "")
        )
        
    except httpx.HTTPStatusError as e:
        logger.error(f"Supabase RPC error: {e.response.text}")
        raise HTTPException(status_code=500, detail="Authentication service error")
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """Register new username"""
    try:
        if not request.username or len(request.username) > 10 or len(request.username) < 1:
            raise HTTPException(status_code=400, detail="Username must be 1-10 characters")
        
        # Call Supabase RPC function
        rpc_url = f"{Config.SUPABASE_URL}/rest/v1/rpc/register_username"
        headers = {
            "Content-Type": "application/json",
            "apikey": Config.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {Config.SUPABASE_SERVICE_ROLE_KEY}",
            "Prefer": "return=representation"
        }
        payload = {"username_input": request.username}
        
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(rpc_url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Registration failed"))
        
        return AuthResponse(
            success=True,
            user_id=result["user_id"],
            username=result["username"],
            created_at=result.get("created_at", "")
        )
        
    except httpx.HTTPStatusError as e:
        logger.error(f"Supabase RPC error: {e.response.text}")
        raise HTTPException(status_code=500, detail="Authentication service error")
    except Exception as e:
        logger.error(f"Register error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

class DeleteRequest(BaseModel):
    username: str

@router.delete("/delete")
async def delete_account(request: DeleteRequest):
    """Delete user account"""
    try:
        if not request.username or len(request.username) > 10:
            raise HTTPException(status_code=400, detail="Invalid username")
        
        logger.info(f"Attempting to delete user: {request.username}")
        logger.info(f"Supabase URL: {Config.SUPABASE_URL}")
        logger.info(f"Service role key present: {bool(Config.SUPABASE_SERVICE_ROLE_KEY)}")
        
        # Call Supabase RPC function to delete user
        rpc_url = f"{Config.SUPABASE_URL}/rest/v1/rpc/delete_user_by_username"
        headers = {
            "Content-Type": "application/json",
            "apikey": Config.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {Config.SUPABASE_SERVICE_ROLE_KEY}",
            "Prefer": "return=representation"
        }
        payload = {"username_input": request.username}
        
        logger.info(f"Making request to: {rpc_url}")
        logger.info(f"Payload: {payload}")
        
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(rpc_url, headers=headers, json=payload)
            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Response text: {response.text}")
            response.raise_for_status()
            result = response.json()
        
        logger.info(f"Supabase result: {result}")
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Delete failed"))
        
        return {"success": True, "message": "Account deleted successfully"}
        
    except httpx.HTTPStatusError as e:
        logger.error(f"Supabase RPC error: {e.response.text}")
        raise HTTPException(status_code=500, detail="Authentication service error")
    except Exception as e:
        logger.error(f"Delete account error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
