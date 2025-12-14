# 🌍 Shara  
**Community-driven issue reporting with AI-assisted analysis**

Shara is a lightweight platform that enables people to **report local infrastructure or environmental issues**, attach visual proof, and collaborate in real time — with optional AI analysis to assist understanding.

> ⚠️ AI outputs are probabilistic and may be inaccurate.  
> Shara clearly labels AI-generated insights and keeps humans in the loop.

---

## ✨ Features

### 📍 Map-based Issue Reporting
- Drop pins on a live interactive map
- Add descriptions and image evidence
- View issues geographically

### 🤖 AI-assisted Analysis *(Optional)*
- Uploaded images are analyzed using a vision model
- Detects possible issue types and estimates severity
- Clearly marked as **“AI (may be inaccurate)”**

### 💬 Real-time Group Collaboration
- Create or join groups per issue
- Live chat using Server-Sent Events (SSE)
- Messages synced across multiple users

### 🖥️ Multi-platform
- 🌐 Web app (Vercel)
- 🖥️ Desktop app (Tauri – macOS & Windows)

---

## 🧠 Why Shara?

Shara is designed around **responsible AI usage**:

- AI **assists**, not decides  
- Human verification is encouraged  
- Transparency over automation  

This makes it suitable for civic tech, sustainability projects, and community reporting systems.

---

## 🛠 Tech Stack

### Frontend
- React + Vite
- MapLibre GL (dark basemap)
- Tailwind / inline UI styling
- Deployed on **Vercel**

### Backend
- Rust (Axum)
- Server-Sent Events (SSE) for live chat
- SQLite for messages
- JSON persistence for issues
- Deployed on **Railway**

### AI
- Image analysis via external vision inference API
- Results stored alongside issues

### Desktop
- Tauri (Rust + WebView)
- macOS `.dmg`
- Windows `.exe`

---

## 📂 Project Structure
Shara/
├── frontend/ # React app
├── backend/ # Axum API server
├── data/ # JSON issue storage
├── messages.db # SQLite chat database
└── README.md


---

## 🚀 Running Locally

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```
cd backend
cargo run
```