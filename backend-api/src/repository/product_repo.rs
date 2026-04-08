use std::sync::Mutex;
use crate::models::product::Product;

pub struct ProductRepo {
    pub products: Mutex<Vec<Product>>,
}

impl ProductRepo {
    pub fn new() -> Self {
        Self {
            products: Mutex::new(vec![]),
        }
    }
}