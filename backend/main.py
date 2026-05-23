from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import asyncio
import time
import random

app = FastAPI(
    title="Scientific Integrity Sleuth API",
    description="Backend for detecting image manipulation in scientific research.",
    version="1.0.4"
)

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---

class Finding(BaseModel):
    id: str
    type: str = Field(..., description="Type of anomaly detected")
    confidence: float = Field(..., ge=0, le=1)
    bbox: List[int] = Field(..., min_length=4, max_length=4, description="[x, y, width, height]")

class AnalysisResponse(BaseModel):
    filename: str
    filesize: int
    status: str
    timestamp: float
    findings: List[Finding]
    overall_score: float = Field(..., ge=0, le=1)

class HealthResponse(BaseModel):
    status: str
    version: str
    uptime: float

# --- State ---
START_TIME = time.time()

# --- Endpoints ---

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {
        "status": "online", 
        "version": "1.0.4",
        "uptime": time.time() - START_TIME
    }

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File provided is not an image."
        )

    # Simulate complex forensic processing
    await asyncio.sleep(1.5)
    
    # Read file to get size
    content = await file.read()
    file_size = len(content)
    
    # Simulated forensic data generation
    # In a real app, this would call an AI model
    anomaly_types = [
        "Image Manipulation", 
        "Data Inconsistency", 
        "Clone Detection", 
        "Splicing Artifact",
        "Error Level Discrepancy"
    ]
    
    findings = []
    num_findings = random.randint(1, 4)
    
    for i in range(num_findings):
        findings.append(Finding(
            id=f"ANOMALY_{random.randint(1000, 9999)}",
            type=random.choice(anomaly_types),
            confidence=round(random.uniform(0.75, 0.99), 3),
            bbox=[
                random.randint(20, 150),
                random.randint(20, 150),
                random.randint(50, 200),
                random.randint(50, 200)
            ]
        ))
    
    return AnalysisResponse(
        filename=file.filename,
        filesize=file_size,
        status="completed",
        timestamp=time.time(),
        findings=findings,
        overall_score=round(random.uniform(0.4, 0.95), 2)
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
