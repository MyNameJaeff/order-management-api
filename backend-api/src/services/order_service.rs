use uuid::Uuid;
use crate::models::order::{Order, OrderStatus};
use crate::repository::{order_repo::OrderRepo, product_repo::ProductRepo};
use crate::services::product_service::{ decrease_stock, increase_stock };

/* CRUD Operations */
/* Create */
pub fn create_order(
    order_repo: &OrderRepo,
    product_repo: &ProductRepo,
    product_id: Uuid,
    quantity: i32,
) -> Result<Order, String> {
    if quantity <= 0 {
        return Err("INVALID_QUANTITY".into());
    }

    /* Decreases stock, also checks if sufficient stock is available, as well as if the product exists */
    decrease_stock(product_repo, product_id, quantity)?;

    /* Creates a new order with the specified details, as well as the total price and creation timestamp */
    let order = Order {
        id: Uuid::new_v4(),
        product_id,
        quantity,
        status: OrderStatus::Pending,
        created_at: chrono::Utc::now().to_rfc3339(),
        total_price: {
            let product = product_repo.products.lock().unwrap()
                .iter()
                .cloned()
                .find(|p| p.id == product_id)
                .ok_or("PRODUCT_NOT_FOUND")?; /* This error should never occur if decrease_stock is called first. */
            product.price * quantity as f64
        },
    };

    order_repo.orders.lock().unwrap().push(order.clone());

    Ok(order)
}

/* Read Operations */
/* Get a specific order by ID */
pub fn get_order(repo: &OrderRepo, order_id: Uuid) -> Option<Order> {
    let orders = repo.orders.lock().unwrap();
    orders.iter().cloned().find(|o| o.id == order_id)
}

/* List all orders */
pub fn list_orders(repo: &OrderRepo) -> Vec<Order> {
    repo.orders.lock().unwrap().clone()
}

/* List orders by status */
pub fn list_orders_by_status(repo: &OrderRepo, status: OrderStatus) -> Vec<Order> {
    let orders = repo.orders.lock().unwrap();
    orders.iter()
        .cloned()
        .filter(|o| std::mem::discriminant(&o.status) == std::mem::discriminant(&status))
        .collect()
}

/* Update */
/* Updates the status of an existing order (If the user wishes to change their order amount they have to delete/cancel the order and create a new one) */
pub fn update_order_status(repo: &OrderRepo, product_repo: &ProductRepo, order_id: Uuid, new_status: OrderStatus) -> Result<Order, String> {
    let mut orders = repo.orders.lock().unwrap();
    if let Some(order) = orders.iter_mut().find(|o| o.id == order_id) {
        let is_cancelled = matches!(new_status, OrderStatus::Cancelled);
        order.status = new_status;
        if is_cancelled {
            // If order is being cancelled, restore the stock that was reserved for this order
            let _ = increase_stock(product_repo, order.product_id, order.quantity);
        }
        return Ok(order.clone());
    }
    Err("ORDER_NOT_FOUND".into())
}

/* Delete */
/* Deletes an order by ID, also restoring the stock if the order is cancelled */
pub fn delete_order(repo: &OrderRepo, product_repo: &ProductRepo, order_id: Uuid) -> Result<(), String> {
    let mut orders = repo.orders.lock().unwrap();
    if let Some(pos) = orders.iter().position(|o| o.id == order_id) {
        let order = orders.remove(pos);
        // If the order is being deleted and it's not already cancelled, restore the stock
        if !matches!(order.status, OrderStatus::Cancelled) {
            let _ = increase_stock(product_repo, order.product_id, order.quantity);
        }
        return Ok(());
    }
    Err("ORDER_NOT_FOUND".into())
}

