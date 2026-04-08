use axum::{Json, extract::{Path, Query, State}, http::StatusCode};
use uuid::Uuid;
use std::collections::HashMap;
use crate::AppState;
use crate::services::product_service;
use crate::services::validation::{is_product_validation_error, ERR_PRODUCT_NOT_FOUND};
use crate::models::product::Product;

#[derive(serde::Deserialize)]
pub struct CreateProductRequest {
    pub name: String,
    pub price: f64,
    pub stock: i32,
    pub description: Option<String>,
    pub image_url: Option<String>,
}

#[derive(serde::Deserialize)]
pub struct UpdateProductRequest {
    pub name: Option<String>,
    pub price: Option<f64>,
    pub stock: Option<i32>,
    pub description: Option<String>,
    pub image_url: Option<String>,
}

pub async fn create_product_handler(
    State(state): State<AppState>,
    Json(payload): Json<CreateProductRequest>,
) -> (StatusCode, Json<Option<Product>>) {
    match product_service::create_product(
        &state.product_repo,
        payload.name,
        payload.price,
        payload.stock,
        payload.description,
        payload.image_url,
    ) {
        Ok(product) => (StatusCode::CREATED, Json(Some(product))),
        Err(_) => (StatusCode::BAD_REQUEST, Json(None)),
    }
}

pub async fn get_product_handler(
    Path(product_id): Path<Uuid>,
    State(state): State<AppState>,
) -> (StatusCode, Json<Option<Product>>) {
    match product_service::get_product(&state.product_repo, product_id) {
        Some(p) => (StatusCode::OK, Json(Some(p))),
        None => (StatusCode::NOT_FOUND, Json(None)),
    }
}

pub async fn list_products_handler(
    State(state): State<AppState>,
) -> Json<Vec<Product>> {
    Json(product_service::list_products(&state.product_repo))
}

pub async fn search_products_handler(
    Query(params): Query<HashMap<String, String>>,
    State(state): State<AppState>,
) -> Json<Vec<Product>> {
    let query = params.get("q").cloned().unwrap_or_default();
    Json(product_service::search_products(&state.product_repo, query))
}

pub async fn update_product_handler(
    Path(product_id): Path<Uuid>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateProductRequest>,
) -> (StatusCode, Json<Option<Product>>) {
    match product_service::update_product(
        &state.product_repo,
        product_id,
        payload.name,
        payload.price,
        payload.stock,
        payload.description,
        payload.image_url,
    ) {
        Ok(p) => (StatusCode::OK, Json(Some(p))),
        Err(err) if err == ERR_PRODUCT_NOT_FOUND => (StatusCode::NOT_FOUND, Json(None)),
        Err(err) if is_product_validation_error(&err) => (StatusCode::BAD_REQUEST, Json(None)),
        Err(_) => (StatusCode::BAD_REQUEST, Json(None)),
    }
}

pub async fn delete_product_handler(
    Path(product_id): Path<Uuid>,
    State(state): State<AppState>,
) -> StatusCode {
    match product_service::delete_product(&state.product_repo, product_id) {
        Ok(true) => StatusCode::NO_CONTENT,
        _ => StatusCode::NOT_FOUND,
    }
}