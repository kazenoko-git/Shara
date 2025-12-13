use axum::{
    extract::{Path, Query, Json},
    http::StatusCode,
    routing::{get, post},
    Router,
};
use hyper::Server;
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

// --------------------
// MODELS
// --------------------

#[derive(Serialize, Deserialize, Clone)]
struct AiResult {
    summary: String,
    confidence: f32,
    labels: Vec<String>,
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

// --------------------
// HELPERS
// --------------------

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
    let s = serde_json::to_string_pretty(data).unwrap();
    fs::write(path, s).unwrap();
}

// --------------------
// AI (SAFE / OPTIONAL)
// --------------------

#[derive(Deserialize)]
struct AnalyzeReq {
    image_url: String,
}

async fn analyze(Json(_): Json<AnalyzeReq>) -> Json<AiResult> {
    // AI disabled unless ULTRA_API_KEY exists
    if std::env::var("ULTRA_API_KEY").is_err() {
        return Json(AiResult {
            summary: "AI disabled (no ULTRA_API_KEY)".into(),
            confidence: 0.0,
            labels: vec![],
        });
    }

    Json(AiResult {
        summary: "AI placeholder result".into(),
        confidence: 0.42,
        labels: vec!["road".into()],
    })
}

// --------------------
// ISSUES
// --------------------

async fn get_issues() -> Json<Vec<Issue>> {
    Json(load_json("data/issues.json"))
}

async fn create_issue(Json(mut issue): Json<Issue>) -> (StatusCode, Json<Issue>) {
    let mut issues: Vec<Issue> = load_json("data/issues.json");
    issue.id = format!("iss_{}", Uuid::new_v4());
    issue.createdAt = now();
    issues.push(issue.clone());
    save_json("data/issues.json", &issues);
    (StatusCode::CREATED, Json(issue))
}

// --------------------
// GROUPS
// --------------------

async fn get_groups(Query(q): Query<HashMap<String, String>>) -> Json<Vec<Group>> {
    let groups: Vec<Group> = load_json("data/groups.json");
    if let Some(issue_id) = q.get("issueId") {
        Json(groups.into_iter().filter(|g| g.issueId == *issue_id).collect())
    } else {
        Json(groups)
    }
}

async fn create_group(Json(mut g): Json<Group>) -> (StatusCode, Json<Group>) {
    let mut groups: Vec<Group> = load_json("data/groups.json");
    g.id = format!("grp_{}", Uuid::new_v4());
    g.createdAt = now();
    groups.push(g.clone());
    save_json("data/groups.json", &groups);
    (StatusCode::CREATED, Json(g))
}

#[derive(Deserialize)]
struct MemberReq {
    userId: String,
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

// --------------------
// MESSAGES
// --------------------

async fn get_messages(Path(group_id): Path<String>) -> Json<Vec<Message>> {
    let msgs: Vec<Message> = load_json("data/messages.json");
    Json(msgs.into_iter().filter(|m| m.groupId == group_id).collect())
}

async fn post_message(
    Path(group_id): Path<String>,
    Json(mut msg): Json<Message>,
) -> (StatusCode, Json<Message>) {
    let mut msgs: Vec<Message> = load_json("data/messages.json");
    msg.id = format!("msg_{}", Uuid::new_v4());
    msg.groupId = group_id;
    msg.createdAt = now();
    msgs.push(msg.clone());
    save_json("data/messages.json", &msgs);
    (StatusCode::CREATED, Json(msg))
}

// --------------------
// MAIN
// --------------------

#[tokio::main]
async fn main() {
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

    Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
