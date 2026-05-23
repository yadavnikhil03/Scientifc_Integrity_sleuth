import pytest
from httpx import AsyncClient, ASGITransport
from main import app
import io

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "online"
    assert "uptime" in response.json()

@pytest.mark.asyncio
async def test_analyze_image_valid():
    # Create a dummy image
    file_content = b"fake image content"
    files = {"file": ("test.png", file_content, "image/png")}
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/analyze", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.png"
    assert data["status"] == "completed"
    assert len(data["findings"]) > 0
    assert 0 <= data["overall_score"] <= 1

@pytest.mark.asyncio
async def test_analyze_image_invalid_type():
    file_content = b"fake text content"
    files = {"file": ("test.txt", file_content, "text/plain")}
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/analyze", files=files)
    
    assert response.status_code == 400
    assert response.json()["detail"] == "File provided is not an image."

@pytest.mark.asyncio
async def test_analyze_no_file():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/analyze")
    
    assert response.status_code == 422 # FastAPI validation error for missing body
