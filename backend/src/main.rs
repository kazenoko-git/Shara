use axum::{
    extract::{Path, Query, Json, State},
    http::StatusCode,
    routing::{get, post, delete},
    response::sse::{Event, KeepAlive, Sse},
    Router,
};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    fs,
    net::SocketAddr,
    path::Path as FsPath,
    time::{SystemTime, UNIX_EPOCH, Duration},
};
use tower_http::cors::{Any, CorsLayer};
use uuid::Uuid;
use tokio::sync::broadcast;
use async_stream::stream;
use futures_core::Stream;
use std::convert::Infallible;
use reqwest::multipart;
use serde_json::Value;

// ============================
// APP STATE
// ============================

#[derive(Clone)]
struct AppState {
    msg_tx: broadcast::Sender<Message>,
}

// ============================
// MODELS
// ============================

#[derive(Serialize, Deserialize, Clone)]
struct User {
    id: String,
    username: String,
    createdAt: u64,
}

// ---------- AI MODELS ----------

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

// ---------- CORE MODELS ----------

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
    senderName: String,
    text: String,
    createdAt: u64,
}

// ============================
// INPUT DTOs
// ============================

#[derive(Deserialize)]
struct CreateUserReq {
    username: String,
}

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
    senderName: String,
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
        .unwrap_or_default()
}

fn save_json<T: Serialize>(path: &str, data: &Vec<T>) {
    ensure_data_dir();
    fs::write(path, serde_json::to_string_pretty(data).unwrap()).unwrap();
}

// ============================
// AI HELPERS
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
    let mut merged = vec![];

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

// ============================
// AI ANALYZE (ULTRALYTICS)
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
        Ok(r) => match r.bytes().await {
            Ok(b) => b,
            Err(_) => return Json(AiResult { boxes: vec![], avg_confidence: 0.0, severity: 0 }),
        },
        Err(_) => return Json(AiResult { boxes: vec![], avg_confidence: 0.0, severity: 0 }),
    };

    let form = multipart::Form::new()
        .text("model", "https://hub.ultralytics.com/models/nNbNzUo22v46beB7tHyQ")
        .text("imgsz", "640")
        .text("conf", "0.20")
        .text("iou", "0.45")
        .part(
            "file",
            multipart::Part::bytes(img_bytes.to_vec())
                .file_name("img.jpg")
                .mime_str("image/jpeg")
                .unwrap(),
        );

    let resp = match reqwest::Client::new()
        .post("https://predict.ultralytics.com")
        .header("x-api-key", api_key)
        .multipart(form)
        .send()
        .await
    {
        Ok(r) => r,
        Err(_) => return Json(AiResult { boxes: vec![], avg_confidence: 0.0, severity: 0 }),
    };

    let json: Value = resp.json().await.unwrap_or_default();

    let mut raw_boxes = vec![];

    if let Some(images) = json["images"].as_array() {
        for img in images {
            if let Some(results) = img["results"].as_array() {
                for r in results {
                    let b = &r["box"];
                    raw_boxes.push(BBox {
                        x1: b["x1"].as_f64().unwrap_or(0.0) as f32,
                        y1: b["y1"].as_f64().unwrap_or(0.0) as f32,
                        x2: b["x2"].as_f64().unwrap_or(0.0) as f32,
                        y2: b["y2"].as_f64().unwrap_or(0.0) as f32,
                        confidence: r["confidence"].as_f64().unwrap_or(0.0) as f32,
                        label: r["name"].as_str().unwrap_or("unknown").to_string(),
                    });
                }
            }
        }
    }

    let boxes = merge_boxes(raw_boxes);
    let count = boxes.len();

    let avg = if count == 0 {
        0.0
    } else {
        boxes.iter().map(|b| b.confidence).sum::<f32>() / count as f32
    };

    let severity = count.min(5) as u8;

    Json(AiResult {
        boxes,
        avg_confidence: avg,
        severity,
    })
}

// ============================
// USERS
// ============================

async fn create_user(Json(req): Json<CreateUserReq>) -> (StatusCode, Json<User>) {
    let user = User {
        id: format!("usr_{}", Uuid::new_v4()),
        username: req.username,
        createdAt: now(),
    };

    let mut users: Vec<User> = load_json("data/users.json");
    users.push(user.clone());
    save_json("data/users.json", &users);

    (StatusCode::CREATED, Json(user))
}

// ============================
// ISSUES
// ============================

async fn get_issues() -> Json<Vec<Issue>> {
    Json(load_json("data/issues.json"))
}

async fn create_issue(Json(input): Json<NewIssue>) -> (StatusCode, Json<Issue>) {
    let ai = if let Some(ref url) = input.imageUrl {
        Some(analyze(Json(AnalyzeReq { image_url: url.clone() })).await.0)
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

async fn delete_issue(Path(id): Path<String>) -> StatusCode {
    let mut issues: Vec<Issue> = load_json("data/issues.json");
    let before = issues.len();
    issues.retain(|i| i.id != id);
    save_json("data/issues.json", &issues);

    if issues.len() < before {
        StatusCode::NO_CONTENT
    } else {
        StatusCode::NOT_FOUND
    }
}

// ============================
// GROUPS + CHAT + SSE
// ============================

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

async fn get_messages(Path(id): Path<String>) -> Json<Vec<Message>> {
    let msgs: Vec<Message> = load_json("data/messages.json");
    Json(msgs.into_iter().filter(|m| m.groupId == id).collect())
}

async fn post_message(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(input): Json<NewMessage>,
) -> (StatusCode, Json<Message>) {
    let msg = Message {
        id: format!("msg_{}", Uuid::new_v4()),
        groupId: id,
        senderId: input.senderId,
        senderName: input.senderName,
        text: input.text,
        createdAt: now(),
    };

    let mut msgs = load_json("data/messages.json");
    msgs.push(msg.clone());
    save_json("data/messages.json", &msgs);

    let _ = state.msg_tx.send(msg.clone());
    (StatusCode::CREATED, Json(msg))
}

async fn stream_messages(
    State(state): State<AppState>,
    Path(group_id): Path<String>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let mut rx = state.msg_tx.subscribe();

    let stream = stream! {
        while let Ok(msg) = rx.recv().await {
            if msg.groupId == group_id {
                yield Ok(Event::default().data(serde_json::to_string(&msg).unwrap()));
            }
        }
    };

    Sse::new(stream).keep_alive(
        KeepAlive::new()
            .interval(Duration::from_secs(15))
            .text("ping"),
    )
}

// ============================
// MAIN
// ============================

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    let (tx, _) = broadcast::channel::<Message>(100);
    let state = AppState { msg_tx: tx };

    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "8000".to_string())
        .parse::<u16>()
        .unwrap();

    let app = Router::new()
        .route("/users", post(create_user))
        .route("/analyze", post(analyze))
        .route("/issues", get(get_issues).post(create_issue))
        .route("/admin/issues/:id", delete(delete_issue))
        .route("/groups", get(get_groups).post(create_group))
        .route("/groups/:id/join", post(join_group))
        .route("/groups/:id/leave", post(leave_group))
        .route("/groups/:id/messages", get(get_messages).post(post_message))
        .route("/groups/:id/stream", get(stream_messages))
        .with_state(state)
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        );

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("🚀 Backend running on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
