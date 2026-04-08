mod models;
mod repository;
mod services;
mod handlers;
mod routes;

use axum::Router;
use axum::routing::get;
use tokio::net::TcpListener;
use std::sync::Arc;
use uuid::Uuid;
use chrono::Utc;
use crate::repository::product_repo::ProductRepo;
use crate::repository::order_repo::OrderRepo;
use crate::routes::product_routes::product_routes;
use crate::routes::order_routes::order_routes;
use crate::models::product::Product;
use crate::models::order::{Order, OrderStatus};

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
        .with_state(state);

    println!("Server running at http://localhost:3001");

    let listener = TcpListener::bind("0.0.0.0:3001").await.unwrap();
    axum::serve(listener, app).await.unwrap();
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
        image_url: None,
        updated_at: Utc::now().to_rfc3339(),
    };

    let p2 = Product {
        id: Uuid::new_v4(),
        name: "Gaming Mouse".into(),
        price: 60.0,
        stock: 25,
        description: Some("Lightweight FPS mouse".into()),
        image_url: None,
        updated_at: Utc::now().to_rfc3339(),
    };

    let p3 = Product {
        id: Uuid::new_v4(),
        name: "Ultrawide Monitor".into(),
        price: 450.0,
        stock: 5,
        description: Some("34-inch curved display".into()),
        image_url: None,
        updated_at: Utc::now().to_rfc3339(),
    };

    products.push(p1.clone());
    products.push(p2.clone());
    products.push(p3.clone());

    let mut orders = state.order_repo.orders.lock().unwrap();
    orders.push(Order {
        id: Uuid::new_v4(),
        product_id: p1.id,
        quantity: 1,
        status: OrderStatus::Pending,
        total_price: p1.price,
        created_at: Utc::now().to_rfc3339(),
    });
}