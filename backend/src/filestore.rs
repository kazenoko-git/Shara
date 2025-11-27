use reqwest::Client;
use serde_json::{json, Value};

pub struct Firestore {
    pub client: Client,
    pub api_key: String,
    pub project_id: String,
}

impl Firestore {
    pub fn new(api_key: String, project_id: String) -> Self {
        Self {
            client: Client::new(),
            api_key,
            project_id,
        }
    }

    pub async fn save_issue(&self, issue: Value) {
        let url = format!(
            "https://firestore.googleapis.com/v1/projects/{}/databases/(default)/documents/issues?key={}",
            self.project_id, self.api_key
        );

        let body = json!({ "fields": issue });

        let res = self.client.post(&url).json(&body).send().await;

        match res {
            Ok(r) => println!("🔥 Saved issue with status {}", r.status()),
            Err(e) => println!("❌ Firestore error: {:?}", e),
        }
    }
}
