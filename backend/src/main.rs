use axum::{
    extract::{Path, Query, Json},
    http::StatusCode,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    fs,
    net::SocketAddr,
    path::Path as FsPath,
    time::{SystemTime, UNIX_EPOCH},
};
use tower_http::cors::{Any, CorsLayer};
use uuid::Uuid;

// ============================
// MODELS
// ============================

#[derive(Serialize, Deserialize, Clone)]
struct BBox {
    x1: f32,
    y1: f32,
    x2: f32,
    y2: f32,
    confidence: f32,
    label: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct AiResult {
    boxes: Vec<BBox>,
    avg_confidence: f32,
    severity: u8,
}

#[derive(Serialize, Deserialize, Clone)]
struct Issue {
    id: String,
    title: String,
    description: String,
    coords: [f64; 2],
    imageUrl: Option<String>,
    category: String,
    ai: Option<AiResult>,
    reports: u32,
    createdAt: u64,
}

#[derive(Serialize, Deserialize, Clone)]
struct Group {
    id: String,
    issueId: String,
    name: String,
    members: Vec<String>,
    createdAt: u64,
}

#[derive(Serialize, Deserialize, Clone)]
struct Message {
    id: String,
    groupId: String,
    senderId: String,
    text: String,
    createdAt: u64,
}

// ============================
// INPUT DTOs
// ============================

#[derive(Deserialize)]
struct NewIssue {
    title: String,
    description: String,
    coords: [f64; 2],
    imageUrl: Option<String>,
}

#[derive(Deserialize)]
struct CreateGroupReq {
    issueId: String,
    name: String,
    userId: String,
}

#[derive(Deserialize)]
struct MemberReq {
    userId: String,
}

#[derive(Deserialize)]
struct NewMessage {
    senderId: String,
    text: String,
}

#[derive(Deserialize)]
struct AnalyzeReq {
    image_url: String,
}

// ============================
// HELPERS
// ============================

fn now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

fn ensure_data_dir() {
    if !FsPath::new("data").exists() {
        fs::create_dir_all("data").unwrap();
    }
}

fn load_json<T: for<'de> Deserialize<'de>>(path: &str) -> Vec<T> {
    ensure_data_dir();
    fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_else(|| vec![])
}

fn save_json<T: Serialize>(path: &str, data: &Vec<T>) {
    ensure_data_dir();
    fs::write(path, serde_json::to_string_pretty(data).unwrap()).unwrap();
}

// ============================
// AI LOGIC
// ============================

fn iou(a: &BBox, b: &BBox) -> f32 {
    let x1 = a.x1.max(b.x1);
    let y1 = a.y1.max(b.y1);
    let x2 = a.x2.min(b.x2);
    let y2 = a.y2.min(b.y2);

    let inter = (x2 - x1).max(0.0) * (y2 - y1).max(0.0);
    let area_a = (a.x2 - a.x1) * (a.y2 - a.y1);
    let area_b = (b.x2 - b.x1) * (b.y2 - b.y1);

    inter / (area_a + area_b - inter + 1e-5)
}

fn merge_boxes(boxes: Vec<BBox>) -> Vec<BBox> {
    let mut merged: Vec<BBox> = vec![];

    for b in boxes {
        let mut absorbed = false;
        for m in merged.iter_mut() {
            if iou(&b, m) > 0.5 {
                m.x1 = m.x1.min(b.x1);
                m.y1 = m.y1.min(b.y1);
                m.x2 = m.x2.max(b.x2);
                m.y2 = m.y2.max(b.y2);
                m.confidence = m.confidence.max(b.confidence);
                absorbed = true;
                break;
            }
        }
        if !absorbed {
            merged.push(b);
        }
    }

    merged
}

fn compute_severity(boxes: &Vec<BBox>, reports: u32) -> u8 {
    let base = boxes.len() as i32;
    let authority_boost = (reports / 3) as i32;
    let raw = base + authority_boost;

    raw.clamp(0, 5) as u8
}

// ============================
// ANALYZE (ULTRALYTICS)
// ============================

async fn analyze(Json(req): Json<AnalyzeReq>) -> Json<AiResult> {
    let api_key = match std::env::var("ULTRA_API_KEY") {
        Ok(k) => k,
        Err(_) => {
            return Json(AiResult {
                boxes: vec![],
                avg_confidence: 0.0,
                severity: 0,
            });
        }
    };

    let img_bytes = match reqwest::get(&req.image_url).await {
        Ok(r) => r.bytes().await.unwrap(),
        Err(_) => {
            return Json(AiResult {
                boxes: vec![],
                avg_confidence: 0.0,
                severity: 0,
            });
        }
    };

    let form = reqwest::multipart::Form::new()
        .text("model", "https://hub.ultralytics.com/models/7j3uWTMc5oTCmiUkbzCx")
        .text("imgsz", "640")
        .text("conf", "0.25")
        .text("iou", "0.45")
        .part(
            "file",
            reqwest::multipart::Part::bytes(img_bytes.to_vec())
                .file_name("img.jpg")
                .mime_str("image/jpeg")
                .unwrap(),
        );

    let resp = reqwest::Client::new()
        .post("https://predict.ultralytics.com")
        .header("x-api-key", api_key)
        .multipart(form)
        .send()
        .await
        .unwrap();

    let text = resp.text().await.unwrap();
    let json: serde_json::Value = serde_json::from_str(&text).unwrap_or_default();

    let mut boxes = vec![];

    if let Some(images) = json["images"].as_array() {
        for img in images {
            if let Some(results) = img["results"].as_array() {
                for r in results {
                    let box_obj = &r["box"];
                    boxes.push(BBox {
                        x1: box_obj["x1"].as_f64().unwrap_or(0.0) as f32,
                        y1: box_obj["y1"].as_f64().unwrap_or(0.0) as f32,
                        x2: box_obj["x2"].as_f64().unwrap_or(0.0) as f32,
                        y2: box_obj["y2"].as_f64().unwrap_or(0.0) as f32,
                        confidence: r["confidence"].as_f64().unwrap_or(0.0) as f32,
                        label: r["name"].as_str().unwrap_or("unknown").to_string(),
                    });
                }
            }
        }
    }

    let boxes = merge_boxes(boxes);
    let avg = if boxes.is_empty() {
        0.0
    } else {
        boxes.iter().map(|b| b.confidence).sum::<f32>() / boxes.len() as f32
    };
    let severity = compute_severity(&boxes, 1);

    Json(AiResult {
        boxes,
        avg_confidence: avg,
        severity,
    })
}

// ============================
// ISSUES
// ============================

async fn get_issues() -> Json<Vec<Issue>> {
    Json(load_json("data/issues.json"))
}

async fn create_issue(Json(input): Json<NewIssue>) -> (StatusCode, Json<Issue>) {
    let ai = if let Some(ref url) = input.imageUrl {
        Some(
            analyze(Json(AnalyzeReq {
                image_url: url.clone(),
            }))
            .await
            .0,
        )
    } else {
        None
    };

    let issue = Issue {
        id: format!("iss_{}", Uuid::new_v4()),
        title: input.title,
        description: input.description,
        coords: input.coords,
        imageUrl: input.imageUrl,
        category: "unverified".into(),
        ai,
        reports: 1,
        createdAt: now(),
    };

    let mut issues = load_json("data/issues.json");
    issues.push(issue.clone());
    save_json("data/issues.json", &issues);

    (StatusCode::CREATED, Json(issue))
}

// ============================
// GROUPS
// ============================

async fn join_group(Path(id): Path<String>, Json(req): Json<MemberReq>) -> StatusCode {
    let mut groups: Vec<Group> = load_json("data/groups.json");

    for g in &mut groups {
        if g.id == id && !g.members.contains(&req.userId) {
            g.members.push(req.userId.clone());
        }
    }

    save_json("data/groups.json", &groups);
    StatusCode::OK
}

async fn leave_group(Path(id): Path<String>, Json(req): Json<MemberReq>) -> StatusCode {
    let mut groups: Vec<Group> = load_json("data/groups.json");

    for g in &mut groups {
        if g.id == id {
            g.members.retain(|m| m != &req.userId);
        }
    }

    save_json("data/groups.json", &groups);
    StatusCode::OK
}

async fn get_groups(Query(q): Query<HashMap<String, String>>) -> Json<Vec<Group>> {
    let groups: Vec<Group> = load_json("data/groups.json");
    if let Some(issue_id) = q.get("issueId") {
        Json(groups.into_iter().filter(|g| g.issueId == *issue_id).collect())
    } else {
        Json(groups)
    }
}

async fn create_group(Json(req): Json<CreateGroupReq>) -> (StatusCode, Json<Group>) {
    let group = Group {
        id: format!("grp_{}", Uuid::new_v4()),
        issueId: req.issueId,
        name: req.name,
        members: vec![req.userId],
        createdAt: now(),
    };

    let mut groups = load_json("data/groups.json");
    groups.push(group.clone());
    save_json("data/groups.json", &groups);

    (StatusCode::CREATED, Json(group))
}

// ============================
// MESSAGES
// ============================

async fn get_messages(Path(id): Path<String>) -> Json<Vec<Message>> {
    let msgs: Vec<Message> = load_json("data/messages.json");
    Json(msgs.into_iter().filter(|m| m.groupId == id).collect())
}

async fn post_message(
    Path(id): Path<String>,
    Json(input): Json<NewMessage>,
) -> (StatusCode, Json<Message>) {
    let msg = Message {
        id: format!("msg_{}", Uuid::new_v4()),
        groupId: id,
        senderId: input.senderId,
        text: input.text,
        createdAt: now(),
    };

    let mut msgs = load_json("data/messages.json");
    msgs.push(msg.clone());
    save_json("data/messages.json", &msgs);

    (StatusCode::CREATED, Json(msg))
}

// ============================
// MAIN
// ============================

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    let app = Router::new()
        .route("/analyze", post(analyze))
        .route("/issues", get(get_issues).post(create_issue))
        .route("/groups", get(get_groups).post(create_group))
        .route("/groups/:id/join", post(join_group))
        .route("/groups/:id/leave", post(leave_group))
        .route("/groups/:id/messages", get(get_messages).post(post_message))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        );

    let addr = SocketAddr::from(([127, 0, 0, 1], 8000));
    println!("🚀 Backend running on http://localhost:8000");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
