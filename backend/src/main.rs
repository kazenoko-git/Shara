use axum::{
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::{fs, net::SocketAddr};
use tower_http::cors::{Any, CorsLayer};
use uuid::Uuid;
use reqwest::Client;

// =======================
// DATA MODELS
// =======================

#[derive(Serialize, Deserialize, Clone)]
struct AiResult {
    labels: Vec<String>,
    confidence: f32,
    summary: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct Issue {
    id: String,
    title: String,
    description: String,
    coords: [f64; 2],
    imageUrl: Option<String>,
    ai: Option<AiResult>,
    createdAt: u64,
}

#[derive(Deserialize)]
struct CreateIssue {
    title: String,
    description: String,
    coords: [f64; 2],
    imageUrl: Option<String>,
    ai: Option<AiResult>,
}

// =======================
// FILE STORAGE (JSON)
// =======================

fn load_issues() -> Vec<Issue> {
    fs::create_dir_all("data").ok();
    fs::read_to_string("data/issues.json")
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_else(|| vec![])
}

fn save_issues(issues: &Vec<Issue>) {
    let _ = fs::write(
        "data/issues.json",
        serde_json::to_string_pretty(issues).unwrap(),
    );
}

fn now_ts() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

// =======================
// AI SUMMARY (NO LLM)
// =======================

fn build_summary(labels: &Vec<String>, confidence: f32) -> String {
    if labels.is_empty() {
        return "No visible damage detected.".to_string();
    }

    match labels[0].as_str() {
        "pothole" => format!("Pothole detected ({:.0}% confidence).", confidence * 100.0),
        "trash" => format!("Garbage accumulation detected ({:.0}% confidence).", confidence * 100.0),
        "flooding" => format!("Water logging detected ({:.0}% confidence).", confidence * 100.0),
        _ => format!("Infrastructure issue detected ({:.0}% confidence).", confidence * 100.0),
    }
}

// =======================
// API HANDLERS
// =======================

#[derive(Deserialize)]
struct AnalyzeRequest {
    image_url: String,
}

async fn analyze(Json(req): Json<AnalyzeRequest>) -> Json<AiResult> {
    let api_key = match std::env::var("ULTRA_API_KEY") {
        Ok(k) => k,
        Err(_) => {
            return Json(AiResult {
                labels: vec![],
                confidence: 0.0,
                summary: "AI disabled: ULTRA_API_KEY not set.".to_string(),
            });
        }
    };

    let client = Client::new();

    // download image
    let image_bytes = client
        .get(&req.image_url)
        .send()
        .await
        .unwrap()
        .bytes()
        .await
        .unwrap()
        .to_vec(); // 🔥 FIX: Bytes → Vec<u8>

    let response = client
        .post("https://predict.ultralytics.com")
        .header("x-api-key", api_key)
        .multipart(
            reqwest::multipart::Form::new()
                .text("model", "https://hub.ultralytics.com/models/7j3uWTMc5oTCmiUkbzCx")
                .text("imgsz", "640")
                .text("conf", "0.25")
                .part("file", reqwest::multipart::Part::bytes(image_bytes)),
        )
        .send()
        .await
        .unwrap()
        .json::<serde_json::Value>()
        .await
        .unwrap();

    let preds = response["predictions"]
        .as_array()
        .cloned()
        .unwrap_or_else(|| vec![]);

    let mut labels: Vec<String> = vec![];
    let mut max_conf: f32 = 0.0; // 🔥 FIX: explicit type

    for p in preds {
        if let Some(name) = p["name"].as_str() {
            labels.push(name.to_string());
        }
        if let Some(c) = p["confidence"].as_f64() {
            if c as f32 > max_conf {
                max_conf = c as f32;
            }
        }
    }

    let summary = build_summary(&labels, max_conf);

    Json(AiResult {
        labels,
        confidence: max_conf,
        summary,
    })
}

async fn create_issue(Json(input): Json<CreateIssue>) -> Json<Issue> {
    let mut issues = load_issues();

    let issue = Issue {
        id: format!("iss_{}", Uuid::new_v4()),
        title: input.title,
        description: input.description,
        coords: input.coords,
        imageUrl: input.imageUrl,
        ai: input.ai,
        createdAt: now_ts(),
    };

    issues.push(issue.clone());
    save_issues(&issues);

    Json(issue)
}

async fn get_issues() -> Json<Vec<Issue>> {
    Json(load_issues())
}

// =======================
// MAIN
// =======================

#[tokio::main]
async fn main() {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/analyze", post(analyze))
        .route("/issues", get(get_issues).post(create_issue))
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8000));
    println!("🚀 Backend running on http://localhost:8000");

    axum::serve(
        tokio::net::TcpListener::bind(addr).await.unwrap(),
        app,
    )
    .await
    .unwrap();
}
