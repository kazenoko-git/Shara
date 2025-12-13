// frontend/src/utils/uploadToCloudinary.js
export async function uploadToCloudinary(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset = import.meta.env.VITE_CLOUDINARY_PRESET;

  if (!cloudName || !preset) {
    throw new Error("Cloudinary env vars not set (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_PRESET).");
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", preset);

  const res = await fetch(url, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("Cloudinary upload failed: " + text);
  }

  const data = await res.json();
  return data.secure_url || data.url;
}

export default uploadToCloudinary;
