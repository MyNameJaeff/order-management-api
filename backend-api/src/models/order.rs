use serde::{Serialize, Deserialize};
use uuid::Uuid;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OrderItem {
    pub product_id: Uuid,
    pub quantity: i32,
    pub unit_price: f64,
    pub line_total: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Order {
    pub id: Uuid,
    pub items: Vec<OrderItem>,
    pub status: OrderStatus,
    pub total_price: f64,
    pub created_at: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum OrderStatus {
    Pending,
    Completed,
    Cancelled,
}