"""
Tests for B2 client utility
"""

import pytest
import os
from app.utils.b2_client import B2Client

@pytest.fixture
def mock_env_vars():
    """Set mock environment variables for testing"""
    os.environ["B2_KEY_ID"] = "test_key_id"
    os.environ["B2_APPLICATION_KEY"] = "test_app_key"
    os.environ["B2_BUCKET_NAME"] = "test-bucket"
    os.environ["B2_ENDPOINT_URL"] = "https://test.endpoint.com"
    os.environ["B2_AUDIO_FOLDER"] = "audio"
    os.environ["B2_THUMBNAIL_FOLDER"] = "thumbnail"
    os.environ["B2_BASE_URL"] = "https://test.base.url"
    yield
    # Cleanup
    for key in ["B2_KEY_ID", "B2_APPLICATION_KEY", "B2_BUCKET_NAME", 
                "B2_ENDPOINT_URL", "B2_AUDIO_FOLDER", "B2_THUMBNAIL_FOLDER", "B2_BASE_URL"]:
        if key in os.environ:
            del os.environ[key]

def test_b2_client_initialization(mock_env_vars):
    """Test B2 client initialization"""
    client = B2Client()
    assert client.audio_folder == "audio"
    assert client.thumbnail_folder == "thumbnail"

def test_get_audio_url(mock_env_vars):
    """Test audio URL generation"""
    client = B2Client()
    url = client.get_audio_url("0000000.mp3")
    assert "audio/0000000.mp3" in url
    assert client.base_url in url

def test_get_thumbnail_url(mock_env_vars):
    """Test thumbnail URL generation"""
    client = B2Client()
    url = client.get_thumbnail_url("0000000.png")
    assert "thumbnail/0000000.png" in url
    assert client.base_url in url

def test_get_audio_url_with_folder_prefix(mock_env_vars):
    """Test audio URL generation with folder prefix"""
    client = B2Client()
    url = client.get_audio_url("audio/0000000.mp3")
    assert "audio/0000000.mp3" in url
    assert not url.endswith("audio/audio/0000000.mp3")

def test_get_thumbnail_url_with_folder_prefix(mock_env_vars):
    """Test thumbnail URL generation with folder prefix"""
    client = B2Client()
    url = client.get_thumbnail_url("thumbnail/0000000.png")
    assert "thumbnail/0000000.png" in url
    assert not url.endswith("thumbnail/thumbnail/0000000.png")
