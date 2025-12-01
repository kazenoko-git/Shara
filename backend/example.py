import json
import requests
import os

# Run inference on an image
url = "https://predict.ultralytics.com"
headers = {"x-api-key": "..."} # IVAN API KEY GOES HERE 
data = {"model": "https://hub.ultralytics.com/models/7j3uWTMc5oTCmiUkbzCx", "imgsz": 640, "conf": 0.25, "iou": 0.45}

images = os.listdir("images/")
for image in images:
    with open(f"images/{image}", "rb") as f:
	    response = requests.post(url, headers=headers, data=data, files={"file": f})

# Check for successful response
response.raise_for_status()

# Print inference results
print(json.dumps(response.json(), indent=2))