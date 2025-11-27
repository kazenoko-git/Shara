from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Request model from Rust
class ScanAreaRequest(BaseModel):
    bbox: List[float]   # [minLng, minLat, maxLng, maxLat]

# Response polygon model (GeoJSON feature)
class PolygonFeature(BaseModel):
    type: str
    geometry: dict
    properties: dict

# Root (optional)
@app.get("/")
def root():
    return {"status": "ok", "message": "Python AI backend running"}

# Predict endpoint
@app.post("/predict")
def predict(req: ScanAreaRequest):
    print("📥 Python got bbox:", req.bbox)

    # Module 2: we return dummy polygons
    # For now we just return an empty list to Rust
    return []
