import json
import requests
import os

# NOTE: REQUIRES AN 'images' FOLDER AND 'output' FOLDER IN SAME DIRECTORY
# WILL MAKE API CALLS TO RUN INFERENCE ON EACH IMG IN images AND SAVE JSON TO OUTPUT

# Run inference on an image
url = "https://predict.ultralytics.com"
headers = {"x-api-key": "..."} # IVAN API KEY GOES HERE 
data = {"model": "https://hub.ultralytics.com/models/7j3uWTMc5oTCmiUkbzCx", "imgsz": 640, "conf": 0.25, "iou": 0.45}

images = os.listdir("images/")
for image in images:
    with open(f"images/{image}", "rb") as f:
        response = requests.post(url, headers=headers, data=data, files={"file": f})

        response.raise_for_status()

        # SAVE JSON
        with open(f"output/{image}.json", "w") as j:
            j.write(json.dumps(response.json(), indent=2))

input("Done - Press Enter and check output folder.")
