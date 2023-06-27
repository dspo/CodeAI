// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::result::Result;
use reqwest;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// remember to call `.manage(MyState::default())`
#[tauri::command]
async fn request() -> Result<String, ()> {
    println!("do resquest");
    let azure_completion_url = "https://terminus3.openai.azure.com/openai/deployments/gpt-35-turbo-0301/chat/completions?api-version=2023-03-15-preview";
    let response= reqwest::Client::new().post(azure_completion_url).body("body").send().await;
    println!("request response: {:?}", response);
    Ok(format!("{:?}", response))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
