from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.song_service import SongService
from ..config.simple_config import Config
from ..config.logging_global import get_logger
import httpx

logger = get_logger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.get("/health")
async def auth_health_check():
    """Health check for auth service"""
    try:
        # Test database connection
        rpc_url = f"{Config.SUPABASE_URL}/rest/v1/rpc/login_username"
        headers = {
            "Content-Type": "application/json",
            "apikey": Config.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {Config.SUPABASE_SERVICE_ROLE_KEY}",
            "Prefer": "return=representation"
        }
        payload = {"username_input": "test_user"}
        
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.post(rpc_url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
        
        return {
            "status": "healthy",
            "supabase_connected": True,
            "supabase_url": Config.SUPABASE_URL,
            "service_key_present": bool(Config.SUPABASE_SERVICE_ROLE_KEY),
            "test_result": result
        }
    except Exception as e:
        logger.error(f"Auth health check failed: {e}")
        return {
            "status": "unhealthy",
            "supabase_connected": False,
            "supabase_url": Config.SUPABASE_URL,
            "service_key_present": bool(Config.SUPABASE_SERVICE_ROLE_KEY),
            "error": str(e)
        }

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
        
        # Check if required environment variables are set
        if not Config.SUPABASE_URL:
            logger.error("SUPABASE_URL not configured")
            raise HTTPException(status_code=500, detail="Database configuration missing")
        
        if not Config.SUPABASE_SERVICE_ROLE_KEY:
            logger.error("SUPABASE_SERVICE_ROLE_KEY not configured")
            raise HTTPException(status_code=500, detail="Database authentication missing")
        
        # Call Supabase RPC function
        rpc_url = f"{Config.SUPABASE_URL}/rest/v1/rpc/login_username"
        headers = {
            "Content-Type": "application/json",
            "apikey": Config.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {Config.SUPABASE_SERVICE_ROLE_KEY}",
            "Prefer": "return=representation"
        }
        payload = {"username_input": request.username}
        
        logger.info(f"Attempting login for username: {request.username}")
        logger.info(f"Supabase URL: {Config.SUPABASE_URL}")
        logger.info(f"Service role key present: {bool(Config.SUPABASE_SERVICE_ROLE_KEY)}")
        
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(rpc_url, headers=headers, json=payload)
            
            # Check if response is successful
            if response.status_code != 200:
                logger.error(f"Supabase RPC returned status {response.status_code}: {response.text}")
                if response.status_code == 400:
                    try:
                        error_data = response.json()
                        return AuthResponse(success=False, error=error_data.get("error", "Username not found"))
                    except:
                        return AuthResponse(success=False, error="Username not found")
                else:
                    raise HTTPException(status_code=500, detail=f"Supabase RPC error: {response.status_code}")
            
            result = response.json()
        
        if not result.get("success"):
            return AuthResponse(success=False, error=result.get("error", "Login failed"))
        
        return AuthResponse(
            success=True,
            user_id=result["user_id"],
            username=result["username"],
            created_at=result.get("created_at", "")
        )
        
    except httpx.RequestError as e:
        logger.error(f"Request error during login: {e}")
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
    except Exception as e:
        logger.error(f"Login error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

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
            
            # Check if response is successful
            if response.status_code != 200:
                logger.error(f"Supabase RPC returned status {response.status_code}: {response.text}")
                if response.status_code == 400:
                    try:
                        error_data = response.json()
                        return AuthResponse(success=False, error=error_data.get("error", "Registration failed"))
                    except:
                        return AuthResponse(success=False, error="Registration failed")
                else:
                    raise HTTPException(status_code=500, detail=f"Supabase RPC error: {response.status_code}")
            
            result = response.json()
        
        if not result.get("success"):
            return AuthResponse(success=False, error=result.get("error", "Registration failed"))
        
        return AuthResponse(
            success=True,
            user_id=result["user_id"],
            username=result["username"],
            created_at=result.get("created_at", "")
        )
        
    except httpx.RequestError as e:
        logger.error(f"Request error during registration: {e}")
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
    except Exception as e:
        logger.error(f"Register error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

class DeleteRequest(BaseModel):
    username: str

@router.delete("/delete")
async def delete_account(request: DeleteRequest):
    """Delete user account"""
    try:
        if not request.username or len(request.username) > 10:
            raise HTTPException(status_code=400, detail="Invalid username")
        
        # SECURITY: Verify user exists and is authenticated before deletion
        logger.info(f"Verifying user exists before deletion: {request.username}")
        
        # First verify the user exists by trying to login
        verify_rpc_url = f"{Config.SUPABASE_URL}/rest/v1/rpc/login_username"
        verify_headers = {
            "Content-Type": "application/json",
            "apikey": Config.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {Config.SUPABASE_SERVICE_ROLE_KEY}",
            "Prefer": "return=representation"
        }
        verify_payload = {"username_input": request.username}
        
        async with httpx.AsyncClient(timeout=10) as client:
            verify_response = await client.post(verify_rpc_url, headers=verify_headers, json=verify_payload)
            
            if verify_response.status_code != 200:
                logger.warning(f"User verification failed for '{request.username}': {verify_response.status_code}")
                raise HTTPException(status_code=401, detail="User not found or not authenticated")
            
            verify_result = verify_response.json()
            if not verify_result.get("success"):
                logger.warning(f"User verification failed for '{request.username}': {verify_result.get('error')}")
                raise HTTPException(status_code=401, detail="User not found or not authenticated")
        
        # Prevent deletion of test user in development
        if Config.IS_DEVELOPMENT and request.username == Config.TEST_USER_USERNAME:
            logger.warning(f"Attempted to delete test user '{request.username}' in development mode - blocked")
            raise HTTPException(status_code=400, detail="Cannot delete test user in development mode")
        
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
        
        return {
            "success": True, 
            "message": "Account deleted successfully",
            "force_logout": True  # Signal frontend to immediately logout
        }
        
    except httpx.HTTPStatusError as e:
        logger.error(f"Supabase RPC error: {e.response.text}")
        raise HTTPException(status_code=500, detail="Authentication service error")
    except Exception as e:
        logger.error(f"Delete account error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
