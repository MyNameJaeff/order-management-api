use serde::{Serialize, Deserialize};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize)]
pub struct Order {
    pub id: Uuid,
    pub product_id: Uuid,
    pub quantity: i32,
    pub status: OrderStatus,
    pub total_price: f64,
    pub created_at: String,
}

#[derive(Clone, Serialize, Deserialize, PartialEq)]
pub enum OrderStatus {
    Pending,
    Completed,
    Cancelled,
}