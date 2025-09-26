"""
Supabase database connection for Vibify
"""

from supabase import create_client, Client
from typing import Optional
from ..config.simple_config import Config

class SupabaseClient:
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseClient, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self.url = Config.SUPABASE_URL
        self.key = Config.SUPABASE_KEY
        
        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set")
        
        self.client: Client = create_client(self.url, self.key)
        self._initialized = True
    
    def get_client(self) -> Client:
        """Get the Supabase client instance"""
        return self.client
