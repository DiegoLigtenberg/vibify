"""
Pytest configuration and fixtures for Vibify backend tests
"""

import pytest
import os
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    """Test client fixture"""
    return TestClient(app)

@pytest.fixture
def test_env_vars():
    """Set test environment variables"""
    os.environ["B2_KEY_ID"] = "test_key_id"
    os.environ["B2_APPLICATION_KEY"] = "test_app_key"
    os.environ["B2_BUCKET_NAME"] = "test-bucket"
    os.environ["B2_ENDPOINT_URL"] = "https://test.endpoint.com"
    os.environ["B2_AUDIO_FOLDER"] = "audio"
    os.environ["B2_THUMBNAIL_FOLDER"] = "thumbnail"
    yield
    # Cleanup after test
    for key in ["B2_KEY_ID", "B2_APPLICATION_KEY", "B2_BUCKET_NAME", 
                "B2_ENDPOINT_URL", "B2_AUDIO_FOLDER", "B2_THUMBNAIL_FOLDER"]:
        if key in os.environ:
            del os.environ[key]
