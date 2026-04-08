use axum::{Router, routing::{get, post, /* put, delete */}};
use crate::AppState;
use crate::handlers::order_handler::*;

pub fn order_routes() -> Router<AppState> {
    Router::new()
        .route("/orders", post(create_order_handler).get(list_orders_handler))
        .route("/orders/:id", get(get_order_handler).put(update_order_status_handler).delete(delete_order_handler))
        .route("/orders/list_by_status/:status", get(list_orders_by_status_handler))
}