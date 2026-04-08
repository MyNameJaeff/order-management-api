use axum::{Json, extract::{Path, State}, http::StatusCode};
use uuid::Uuid;
use crate::AppState;
use crate::services::order_service;
use crate::models::order::{Order, OrderStatus};

#[derive(serde::Deserialize)]
pub struct CreateOrderItemRequest {
    pub product_id: Uuid,
    pub quantity: i32,
}

#[derive(serde::Deserialize)]
pub struct CreateOrderRequest {
    pub items: Vec<CreateOrderItemRequest>,
}

#[derive(serde::Deserialize)]
pub struct UpdateOrderStatusRequest {
    pub status: OrderStatus,
}

pub async fn create_order_handler(
    State(state): State<AppState>,
    Json(payload): Json<CreateOrderRequest>,
) -> (StatusCode, Json<Option<Order>>) {
    match order_service::create_order(
        &state.order_repo,
        &state.product_repo,
        payload
            .items
            .into_iter()
            .map(|i| order_service::CreateOrderItemInput {
                product_id: i.product_id,
                quantity: i.quantity,
            })
            .collect(),
    ) {
        Ok(order) => (StatusCode::CREATED, Json(Some(order))),
        Err(_) => (StatusCode::BAD_REQUEST, Json(None)),
    }
}

pub async fn get_order_handler(
    Path(order_id): Path<Uuid>,
    State(state): State<AppState>,
) -> (StatusCode, Json<Option<Order>>) {
    match order_service::get_order(&state.order_repo, order_id) {
        Some(o) => (StatusCode::OK, Json(Some(o))),
        None => (StatusCode::NOT_FOUND, Json(None)),
    }
}

pub async fn list_orders_by_status_handler(
    Path(status): Path<OrderStatus>,
    State(state): State<AppState>,
) -> Json<Vec<Order>> {
    Json(order_service::list_orders_by_status(&state.order_repo, status))
}

pub async fn list_orders_handler(
    State(state): State<AppState>,
) -> Json<Vec<Order>> {
    Json(order_service::list_orders(&state.order_repo))
}

pub async fn update_order_status_handler(
    Path(order_id): Path<Uuid>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateOrderStatusRequest>,
) -> (StatusCode, Json<Option<Order>>) {
    match order_service::update_order_status(&state.order_repo, &state.product_repo, order_id, payload.status) {
        Ok(order) => (StatusCode::OK, Json(Some(order))),
        Err(err) if err == "ORDER_NOT_FOUND" => (StatusCode::NOT_FOUND, Json(None)),
        Err(_) => (StatusCode::BAD_REQUEST, Json(None)),
    }
}

pub async fn delete_order_handler(
    Path(order_id): Path<Uuid>,
    State(state): State<AppState>,
) -> StatusCode {
    match order_service::delete_order(&state.order_repo, &state.product_repo, order_id) {
        Ok(_) => StatusCode::NO_CONTENT,
        Err(_) => StatusCode::NOT_FOUND,
    }
}