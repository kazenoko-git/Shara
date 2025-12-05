import math
import io
import requests
from PIL import Image

# ----------------------------
#  Helpers
# ----------------------------

def lonlat_to_tile(lon, lat, zoom):
    """Convert lon/lat to XYZ tile numbers."""
    lat_rad = math.radians(lat)
    n = 2.0 ** zoom
    x = int((lon + 180.0) / 360.0 * n)
    y = int(
        (1.0 - math.log(math.tan(lat_rad) + (1 / math.cos(lat_rad))) / math.pi)
        / 2.0 * n
    )
    return x, y

def fetch_tile(x, y, z):
    """Download a 256×256 satellite tile from ArcGIS World Imagery."""
    url = f"https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    r = requests.get(url)
    if r.status_code != 200:
        # fallback: blank tile
        return Image.new("RGB", (256, 256), (30, 30, 30))
    return Image.open(io.BytesIO(r.content))

# ----------------------------
#  MAIN: stitch bbox
# ----------------------------

def stitch_bbox(min_lng, min_lat, max_lng, max_lat, zoom=16):
    """
    Returns a single stitched 1024×1024 PIL Image from the bounding box.
    """

    # Convert bbox corners to XYZ tiles
    x1, y1 = lonlat_to_tile(min_lng, max_lat, zoom)
    x2, y2 = lonlat_to_tile(max_lng, min_lat, zoom)

    # Ensure correct ordering
    min_x, max_x = sorted([x1, x2])
    min_y, max_y = sorted([y1, y2])

    width_tiles = max_x - min_x + 1
    height_tiles = max_y - min_y + 1

    # Build blank canvas
    stitched = Image.new("RGB", (width_tiles * 256, height_tiles * 256))

    print(f"🧵 Stitching {width_tiles}×{height_tiles} tiles at zoom {zoom}")

    # Download + paste tiles
    for i, x in enumerate(range(min_x, max_x + 1)):
        for j, y in enumerate(range(min_y, max_y + 1)):
            tile = fetch_tile(x, y, zoom)
            stitched.paste(tile, (i * 256, j * 256))

    # Final resize → YOLO standard input size
    stitched = stitched.resize((1024, 1024), Image.LANCZOS)
    return stitched
