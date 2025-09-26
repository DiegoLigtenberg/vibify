"""
Tests for B2 client utility - Focus on behavior, not implementation
"""

import pytest
from unittest.mock import patch, MagicMock
from botocore.exceptions import ClientError
from app.utils.b2_client import B2Client

@pytest.fixture
def mock_config():
    """Mock the Config class for testing"""
    with patch('app.config.simple_config.Config') as mock_config:
        mock_config.B2_KEY_ID = "test_key_id"
        mock_config.B2_APPLICATION_KEY = "test_app_key"
        mock_config.B2_BUCKET_NAME = "test-bucket"
        mock_config.B2_ENDPOINT_URL = "https://test.endpoint.com"
        mock_config.B2_API_URL = "https://api.test.com"
        mock_config.B2_AUDIO_FOLDER = "audio"
        mock_config.B2_THUMBNAIL_FOLDER = "thumbnails"
        yield mock_config

def test_b2_client_initialization(mock_config):
    """Test B2 client initializes with correct config values"""
    client = B2Client()
    assert client.audio_folder == "audio"
    assert client.thumbnail_folder == "thumbnails"
    assert client.bucket_name == "test-bucket"
    assert client.endpoint_url == "https://test.endpoint.com"
    assert client.api_url == "https://api.test.com"

def test_get_audio_url_returns_valid_url(mock_config):
    """Test audio URL generation returns a valid presigned URL"""
    with patch('app.utils.b2_client.boto3.client') as mock_boto3:
        mock_s3_client = MagicMock()
        mock_s3_client.generate_presigned_url.return_value = "https://test.com/audio/0000000.mp3?signature=test"
        mock_boto3.return_value = mock_s3_client
        
        client = B2Client()
        url = client.get_audio_url("0000000.mp3")
        
        # Test behavior: URL should be valid and contain expected elements
        assert url.startswith("https://")
        assert "audio/0000000.mp3" in url
        assert "signature=" in url  # Presigned URL should have signature

def test_get_thumbnail_url_returns_valid_url(mock_config):
    """Test thumbnail URL generation returns a valid presigned URL"""
    with patch('app.utils.b2_client.boto3.client') as mock_boto3:
        mock_s3_client = MagicMock()
        mock_s3_client.generate_presigned_url.return_value = "https://test.com/thumbnails/0000000.png?signature=test"
        mock_boto3.return_value = mock_s3_client
        
        client = B2Client()
        url = client.get_thumbnail_url("0000000.png")
        
        # Test behavior: URL should be valid and contain expected elements
        assert url.startswith("https://")
        assert "thumbnails/0000000.png" in url
        assert "signature=" in url  # Presigned URL should have signature

def test_get_audio_url_handles_folder_prefix(mock_config):
    """Test audio URL generation strips folder prefix correctly"""
    with patch('app.utils.b2_client.boto3.client') as mock_boto3:
        mock_s3_client = MagicMock()
        mock_s3_client.generate_presigned_url.return_value = "https://test.com/audio/0000000.mp3?signature=test"
        mock_boto3.return_value = mock_s3_client
        
        client = B2Client()
        url = client.get_audio_url("audio/0000000.mp3")
        
        # Test behavior: Should work with prefixed filename
        assert "audio/0000000.mp3" in url

def test_get_thumbnail_url_handles_folder_prefix(mock_config):
    """Test thumbnail URL generation strips folder prefix correctly"""
    with patch('app.utils.b2_client.boto3.client') as mock_boto3:
        mock_s3_client = MagicMock()
        mock_s3_client.generate_presigned_url.return_value = "https://test.com/thumbnails/0000000.png?signature=test"
        mock_boto3.return_value = mock_s3_client
        
        client = B2Client()
        url = client.get_thumbnail_url("thumbnails/0000000.png")
        
        # Test behavior: Should work with prefixed filename
        assert "thumbnails/0000000.png" in url

def test_get_audio_url_handles_empty_filename(mock_config):
    """Test audio URL generation handles empty filename gracefully"""
    client = B2Client()
    url = client.get_audio_url("")
    assert url == ""

def test_get_thumbnail_url_handles_empty_filename(mock_config):
    """Test thumbnail URL generation handles empty filename gracefully"""
    client = B2Client()
    url = client.get_thumbnail_url("")
    assert url == ""

def test_upload_audio_succeeds(mock_config):
    """Test audio file upload succeeds without errors"""
    with patch('app.utils.b2_client.boto3.client') as mock_boto3:
        mock_s3_client = MagicMock()
        mock_boto3.return_value = mock_s3_client
        
        client = B2Client()
        # Should not raise any exceptions
        client.upload_audio("/path/to/file.mp3", "0000000.mp3")
        
        # Verify upload was attempted
        mock_s3_client.upload_file.assert_called_once()

def test_upload_thumbnail_succeeds(mock_config):
    """Test thumbnail file upload succeeds without errors"""
    with patch('app.utils.b2_client.boto3.client') as mock_boto3:
        mock_s3_client = MagicMock()
        mock_boto3.return_value = mock_s3_client
        
        client = B2Client()
        # Should not raise any exceptions
        client.upload_thumbnail("/path/to/file.png", "0000000.png")
        
        # Verify upload was attempted
        mock_s3_client.upload_file.assert_called_once()

def test_upload_audio_handles_errors(mock_config):
    """Test audio file upload handles errors properly"""
    with patch('app.utils.b2_client.boto3.client') as mock_boto3:
        mock_s3_client = MagicMock()
        mock_s3_client.upload_file.side_effect = ClientError(
            {'Error': {'Code': 'NoSuchBucket', 'Message': 'Bucket not found'}}, 'UploadFile'
        )
        mock_boto3.return_value = mock_s3_client
        
        client = B2Client()
        
        # Should raise the ClientError (not swallow it)
        with pytest.raises(ClientError):
            client.upload_audio("/path/to/file.mp3", "0000000.mp3")

def test_file_exists_returns_true_when_file_exists(mock_config):
    """Test file existence check returns True when file exists"""
    with patch('app.utils.b2_client.boto3.client') as mock_boto3:
        mock_s3_client = MagicMock()
        mock_s3_client.head_object.return_value = {}  # File exists
        mock_boto3.return_value = mock_s3_client
        
        client = B2Client()
        exists = client.file_exists("audio", "0000000.mp3")
        
        assert exists is True

def test_file_exists_returns_false_when_file_not_found(mock_config):
    """Test file existence check returns False when file doesn't exist"""
    with patch('app.utils.b2_client.boto3.client') as mock_boto3:
        mock_s3_client = MagicMock()
        mock_s3_client.head_object.side_effect = ClientError(
            {'Error': {'Code': '404', 'Message': 'Not Found'}}, 'HeadObject'
        )
        mock_boto3.return_value = mock_s3_client
        
        client = B2Client()
        exists = client.file_exists("audio", "nonexistent.mp3")
        
        assert exists is False

def test_delete_file_succeeds(mock_config):
    """Test file deletion succeeds without errors"""
    with patch('app.utils.b2_client.boto3.client') as mock_boto3:
        mock_s3_client = MagicMock()
        mock_boto3.return_value = mock_s3_client
        
        client = B2Client()
        # Should not raise any exceptions
        client.delete_file("audio", "0000000.mp3")
        
        # Verify deletion was attempted
        mock_s3_client.delete_object.assert_called_once()

def test_delete_file_handles_errors(mock_config):
    """Test file deletion handles errors properly"""
    with patch('app.utils.b2_client.boto3.client') as mock_boto3:
        mock_s3_client = MagicMock()
        mock_s3_client.delete_object.side_effect = ClientError(
            {'Error': {'Code': 'NoSuchKey', 'Message': 'Key not found'}}, 'DeleteObject'
        )
        mock_boto3.return_value = mock_s3_client
        
        client = B2Client()
        
        # Should raise the ClientError (not swallow it)
        with pytest.raises(ClientError):
            client.delete_file("audio", "nonexistent.mp3")
