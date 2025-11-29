use axum::{
    extract::State,
    routing::post,
    Json, Router,
};
use dotenvy::dotenv;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::{env, net::SocketAddr, sync::Arc};
use tower_http::cors::{CorsLayer, Any};
use axum::serve;


#[tokio::main]
async fn main() {
    // Load .env
    dotenv().ok();

    // CORS for dev
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_headers(Any)
        .allow_methods(Any);

    // Firebase config
    let api_key = env::var("FIREBASE_API_KEY")
        .expect("missing FIREBASE_API_KEY");
    let project_id = env::var("FIREBASE_PROJECT_ID")
        .expect("missing FIREBASE_PROJECT_ID");

    // Router
    let app = Router::new()
        .route("/scan-area", post(scan_area))
        .with_state(firestore)
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("🚀 Rust API running at http://localhost:3000");

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("Failed to bind");

    serve(listener, app)
        .await
        .expect("Server failed");
}

// ---------------------------------------------
// Request + Response structs
// ---------------------------------------------
#[derive(Deserialize)]
struct ScanAreaRequest {
    bbox: [f64; 4],
}

#[derive(Serialize, Deserialize, Debug)]
struct PolygonFeature {
    r#type: String,
    geometry: serde_json::Value,
    properties: serde_json::Value,
}

#[derive(Serialize)]
struct ScanAreaResponse {
    status: &'static str,
    polygons: Vec<PolygonFeature>,
}

// ---------------------------------------------
// Handler
// ---------------------------------------------
async fn scan_area(
    State(firestore): State<Arc<Firestore>>,
    Json(payload): Json<ScanAreaRequest>,
) -> Json<ScanAreaResponse> {
    
    println!("📥 Rust received bbox: {:?}", payload.bbox);

    // ---------------------------------------------------
    // 1. CALL PYTHON BACKEND
    // ---------------------------------------------------
    let client = Client::new();

    let python_res = client
        .post("http://localhost:8000/predict")
        .json(&payload)
        .send()
        .await;

    if python_res.is_err() {
        println!("❌ Python backend unreachable");
        return Json(ScanAreaResponse {
            status: "python_error",
            polygons: vec![],
        });
    }

    let python_json = python_res.unwrap().json::<Vec<PolygonFeature>>().await;

    if python_json.is_err() {
        println!("❌ Python returned invalid JSON");
        return Json(ScanAreaResponse {
            status: "invalid_python_json",
            polygons: vec![],
        });
    }

    let polygons = python_json.unwrap();
    println!("🟢 Received {} polygons from Python", polygons.len());

    // ---------------------------------------------------
    // 2. SAVE TO FIRESTORE
    // ---------------------------------------------------
    for poly in &polygons {
        let issue_doc = json!({
            "type":         { "stringValue": poly.properties["category"].as_str().unwrap_or("") },
            "geometry":     { "stringValue": poly.geometry.to_string() },
            "created":      { "timestampValue": chrono::Utc::now().to_rfc3339() },
        });

        firestore.save_issue(issue_doc).await;
    }

    // ---------------------------------------------------
    // 3. RETURN TO FRONTEND
    // ---------------------------------------------------
    Json(ScanAreaResponse {
        status: "ok",
        polygons,
    })
}
