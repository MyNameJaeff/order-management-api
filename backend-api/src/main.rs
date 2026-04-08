mod models;
mod repository;
mod services;
mod handlers;
mod routes;

use axum::Router;
use axum::extract::Request;
use axum::http::{HeaderValue, Method, StatusCode};
use axum::middleware::{self, Next};
use axum::response::IntoResponse;
use axum::response::Response;
use axum::routing::get;
use tokio::net::TcpListener;
use std::sync::Arc;
use std::time::Instant;
use uuid::Uuid;
use chrono::Utc;
use crate::repository::product_repo::ProductRepo;
use crate::repository::order_repo::OrderRepo;
use crate::routes::product_routes::product_routes;
use crate::routes::order_routes::order_routes;
use crate::models::product::Product;
use crate::models::order::{Order, OrderItem, OrderStatus};

#[derive(Clone)]
pub struct AppState {
    pub product_repo: Arc<ProductRepo>,
    pub order_repo: Arc<OrderRepo>,
}

#[tokio::main]
async fn main() {
    let state = AppState {
        product_repo: Arc::new(ProductRepo::new()),
        order_repo: Arc::new(OrderRepo::new()),
    };

    seed_data(&state);

    let app = Router::new()
        .route("/health", get(|| async { "OK" }))
        .merge(product_routes())
        .merge(order_routes())
        .layer(middleware::from_fn(cors_headers)) /* Adds CORS headers to all responses */
        .layer(middleware::from_fn(log_requests)) /* Logs all incoming requests, use for debugging */
        .with_state(state);

    println!("Server running at http://localhost:3001");

    let listener = TcpListener::bind("0.0.0.0:3001").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

/* Logs all incoming requests for debugging purposes, also a way to check the response time */
async fn log_requests(req: Request, next: Next) -> Response {
    let method = req.method().clone();
    let path = req.uri().path().to_string();
    let started = Instant::now();

    let response = next.run(req).await;

    println!(
        "{} {} -> {} ({} ms)",
        method,
        path,
        response.status(),
        started.elapsed().as_millis()
    );

    response
}

/* Adds CORS headers to all responses */
async fn cors_headers(req: Request, next: Next) -> Response {
    if req.method() == Method::OPTIONS {
        let mut response = StatusCode::NO_CONTENT.into_response();
        add_cors_headers(&mut response);
        return response;
    }

    let mut response = next.run(req).await;
    add_cors_headers(&mut response);
    response
}

fn add_cors_headers(response: &mut Response) {
    response
        .headers_mut()
        .insert("access-control-allow-origin", HeaderValue::from_static("http://localhost:3000"));
    response.headers_mut().insert(
        "access-control-allow-methods",
        HeaderValue::from_static("GET, POST, PUT, DELETE, OPTIONS"),
    );
    response.headers_mut().insert(
        "access-control-allow-headers",
        HeaderValue::from_static("content-type, authorization"),
    );
}


/* Said seed data used in the main function, split for readability */
fn seed_data(state: &AppState) {
    let mut products = state.product_repo.products.lock().unwrap();

    let p1 = Product {
        id: Uuid::new_v4(),
        name: "Mechanical Keyboard".into(),
        price: 120.0,
        stock: 10,
        description: Some("RGB keyboard with blue switches".into()),
        image_url: Some("https://scale.coolshop-cdn.com/product-media.coolshop-cdn.com/23Q8DM/0c6c169d75fd46a98ce45a8cb64c8f3b.png/f/speedlink-atmos-rgb-rainbow-mechanical-60-gaming-keyboard-with-brown-switches-black-us-layout.png?height=484&borderless=1&transparent=1".into()),
        updated_at: Utc::now().to_rfc3339(),
    };

    let p2 = Product {
        id: Uuid::new_v4(),
        name: "Gaming Mouse".into(),
        price: 60.0,
        stock: 25,
        description: Some("Lightweight FPS mouse".into()),
        image_url: Some("https://resource.logitechg.com/w_544,h_466,ar_7:6,c_pad,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/gaming/en/non-braid/hyjal-g502-hero/2025/g502-hero-mouse-top-angle-gallery-1.png".into()),
        updated_at: Utc::now().to_rfc3339(),
    };

    let p3 = Product {
        id: Uuid::new_v4(),
        name: "Ultrawide Monitor".into(),
        price: 450.0,
        stock: 5,
        description: Some("34-inch curved display".into()),
        image_url: Some("https://cdn.inet.se/product/688x386/2227669_4x63c8.png".into()),
        updated_at: Utc::now().to_rfc3339(),
    };

    products.push(p1.clone());
    products.push(p2.clone());
    products.push(p3.clone());

    let mut orders = state.order_repo.orders.lock().unwrap();
    orders.push(Order {
        id: Uuid::new_v4(),
        items: vec![OrderItem {
            product_id: p1.id,
            quantity: 1,
            unit_price: p1.price,
            line_total: p1.price,
        }],
        status: OrderStatus::Pending,
        total_price: p1.price,
        created_at: Utc::now().to_rfc3339(),
    });
}