use axum::{Router, routing::{get, post, /* put, delete */}};
use crate::AppState;
use crate::handlers::product_handler::*;

pub fn product_routes() -> Router<AppState> {
    Router::new()
        .route("/products", post(create_product_handler).get(list_products_handler))
        .route("/products/search", get(search_products_handler))
        .route("/products/:id", get(get_product_handler).put(update_product_handler).delete(delete_product_handler))
}