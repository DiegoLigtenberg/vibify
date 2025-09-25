"""
Tests for songs API endpoints
"""

import pytest
from fastapi.testclient import TestClient

def test_get_songs(client: TestClient):
    """Test getting all songs"""
    response = client.get("/api/songs/")
    assert response.status_code == 200
    
    data = response.json()
    assert "songs" in data
    assert "total" in data
    assert isinstance(data["songs"], list)

def test_get_song(client: TestClient):
    """Test getting a single song"""
    response = client.get("/api/songs/0000000")
    assert response.status_code == 200
    
    data = response.json()
    assert data["id"] == "0000000"
    assert "storage_url" in data
    assert "thumbnail_url" in data

def test_get_song_urls(client: TestClient):
    """Test getting song URLs"""
    response = client.get("/api/songs/0000000/urls")
    assert response.status_code == 200
    
    data = response.json()
    assert data["song_id"] == "0000000"
    assert "urls" in data
    assert "storage_url" in data["urls"]
    assert "thumbnail_url" in data["urls"]

@pytest.mark.skip(reason="Requires B2 client mocking - TODO: Implement proper mocking")
def test_validate_song_files(client: TestClient, test_env_vars):
    """Test validating song files"""
    response = client.get("/api/songs/0000000/validate")
    assert response.status_code == 200
    
    data = response.json()
    assert data["song_id"] == "0000000"
    assert "audio_exists" in data
    assert "thumbnail_exists" in data
    assert "all_files_exist" in data
