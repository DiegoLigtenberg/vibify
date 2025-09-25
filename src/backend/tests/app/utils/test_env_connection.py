"""
Test environment variable loading and Supabase connection
"""
import os
from pathlib import Path
from app.config.simple_config import Config
from app.database.connection import SupabaseClient

def test_env_file_exists():
    """Test that .env file exists"""
    env_path = Path(__file__).parent.parent.parent.parent / '.env'
    assert env_path.exists(), f".env file not found at {env_path}"

def test_env_variables_loaded():
    """Test that environment variables are loaded correctly"""
    # Check required Supabase variables through central config
    assert Config.SUPABASE_URL is not None and Config.SUPABASE_URL != "", "SUPABASE_URL not loaded"
    assert Config.SUPABASE_KEY is not None and Config.SUPABASE_KEY != "", "SUPABASE_ANON_KEY not loaded"
    
    # Check B2 variables through central config
    assert Config.B2_KEY_ID is not None and Config.B2_KEY_ID != "", "B2_APPLICATION_KEY_ID not loaded"
    assert Config.B2_APPLICATION_KEY is not None and Config.B2_APPLICATION_KEY != "", "B2_APPLICATION_KEY not loaded"
    assert Config.B2_BUCKET_NAME is not None and Config.B2_BUCKET_NAME != "", "B2_BUCKET_NAME not loaded"
    
    # Check Python environment
    assert Config.PYTHON_ENV is not None and Config.PYTHON_ENV != "", "PYTHON_ENV not loaded"
    
    print(f"✅ SUPABASE_URL: {Config.SUPABASE_URL}")
    print(f"✅ SUPABASE_ANON_KEY: {Config.SUPABASE_KEY[:20]}...")
    print(f"✅ B2_APPLICATION_KEY_ID: {Config.B2_KEY_ID}")
    print(f"✅ PYTHON_ENV: {Config.PYTHON_ENV}")

def test_supabase_connection():
    """Test that Supabase connection works"""
    try:
        supabase_client = SupabaseClient()
        supabase = supabase_client.get_client()
        assert supabase is not None, "Supabase client is None"
        
        # Test a simple query
        result = supabase.table('songs').select('id, title, artist').limit(1).execute()
        assert result is not None, "Supabase query returned None"
        print(f"✅ Supabase connection successful")
        print(f"✅ Query result: {len(result.data)} songs found")
        
    except Exception as e:
        raise AssertionError(f"Supabase connection failed: {str(e)}")

def test_database_has_data():
    """Test that database has songs"""
    try:
        supabase_client = SupabaseClient()
        supabase = supabase_client.get_client()
        result = supabase.table('songs').select('id, title, artist').limit(5).execute()
        
        assert len(result.data) > 0, f"Database has no songs. Found {len(result.data)} songs"
        print(f"✅ Database has {len(result.data)} songs")
        
        # Print first few songs
        for i, song in enumerate(result.data[:3]):
            print(f"  {i+1}. {song['title']} by {song['artist']}")
            
    except Exception as e:
        raise AssertionError(f"Database query failed: {str(e)}")

if __name__ == "__main__":
    # Run tests manually
    test_env_file_exists()
    test_env_variables_loaded()
    test_supabase_connection()
    test_database_has_data()
    print("✅ All tests passed!")
