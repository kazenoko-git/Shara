# backend/ai_stub/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import uvicorn

app = FastAPI()

class BBoxRequest(BaseModel):
    bbox: List[float]  # [lng_min, lat_min, lng_max, lat_max]

@app.post("/predict")
async def predict(req: BBoxRequest):
    # Dummy: return two square polygons inside bbox
    lng1, lat1, lng2, lat2 = req.bbox
    mid_lng = (lng1 + lng2) / 2
    mid_lat = (lat1 + lat2) / 2

    def square(cx, cy, size=0.001):
        return {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [cx - size, cy - size],
                    [cx + size, cy - size],
                    [cx + size, cy + size],
                    [cx - size, cy + size],
                    [cx - size, cy - size]
                ]]
            },
            "properties": {"class": "waste"}
        }

    return [square(mid_lng, mid_lat), square((lng1+mid_lng)/2, (lat1+mid_lat)/2)]
    
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
