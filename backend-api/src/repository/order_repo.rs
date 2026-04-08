use std::sync::Mutex;
use crate::models::order::Order;

pub struct OrderRepo {
    pub orders: Mutex<Vec<Order>>,
}

impl OrderRepo {
    pub fn new() -> Self {
        Self {
            orders: Mutex::new(vec![]),
        }
    }
}