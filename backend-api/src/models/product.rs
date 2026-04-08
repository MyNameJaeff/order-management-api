use serde::{Serialize, Deserialize};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: Uuid,
    pub name: String,
    pub price: f64,
    pub stock: i32,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub updated_at: String,
}