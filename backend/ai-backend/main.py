from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import requests
import os
import io

from tile_stitcher import stitch_bbox

ULTRA_API_KEY = os.getenv("ULTRA_API_KEY")
ULTRA_ENDPOINT = "https://predict.ultralytics.com"
MODEL_URL = "https://hub.ultralytics.com/models/7j3uWTMc5oTCmiUkbzCx"

app = FastAPI()

class BBoxRequest(BaseModel):
    bbox: List[float]

@app.post("/predict")
async def predict(req: BBoxRequest):

    # -----------------------------
    # 1️⃣ Stitch satellite tiles
    # -----------------------------
    min_lng, min_lat, max_lng, max_lat = req.bbox

    stitched_img = stitch_bbox(min_lng, min_lat, max_lng, max_lat)

    buf = io.BytesIO()
    stitched_img.save(buf, format="JPEG")
    buf.seek(0)

    # -----------------------------
    # 2️⃣ Send to Ultralytics API
    # -----------------------------
    files = {"file": ("image.jpg", buf, "image/jpeg")}
    headers = {"x-api-key": ULTRA_API_KEY}
    data = {
        "model": MODEL_URL,
        "imgsz": 640,
        "conf": 0.25,
        "iou": 0.45,
    }

    res = requests.post(ULTRA_ENDPOINT, headers=headers, data=data, files=files)
    res.raise_for_status()

    output = res.json()

    # -----------------------------
    # 3️⃣ Convert to polygons
    # -----------------------------
    polygons = []
    for det in output.get("predictions", []):
        if "segments" in det:
            for seg in det["segments"]:
                polygons.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [seg["xy"]]
                    },
                    "properties": {
                        "class": det.get("class", "unknown")
                    }
                })

    return polygons
