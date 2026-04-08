use uuid::Uuid;
use crate::models::order::{Order, OrderItem, OrderStatus};
use crate::repository::{order_repo::OrderRepo, product_repo::ProductRepo};
use crate::services::product_service::{ decrease_stock, increase_stock };

#[derive(Clone)]
pub struct CreateOrderItemInput {
    pub product_id: Uuid,
    pub quantity: i32,
}

/* Helper Functions */
/* Merges duplicate order items and validates the input */
fn merge_order_inputs(items: Vec<CreateOrderItemInput>) -> Result<Vec<CreateOrderItemInput>, String> {
    if items.is_empty() {
        return Err("EMPTY_ORDER_ITEMS".into());
    }

    let mut merged: Vec<CreateOrderItemInput> = Vec::new();
    for item in items {
        if item.quantity <= 0 {
            return Err("INVALID_QUANTITY".into());
        }

        if let Some(existing) = merged.iter_mut().find(|i| i.product_id == item.product_id) {
            existing.quantity += item.quantity;
        } else {
            merged.push(item);
        }
    }

    Ok(merged)
}

/* Reserves stock for a list of order items */
fn reserve_stock_for_items(
    product_repo: &ProductRepo,
    items: &[CreateOrderItemInput],
) -> Result<(), String> {
    let mut reserved: Vec<(Uuid, i32)> = Vec::new();

    for item in items {
        match decrease_stock(product_repo, item.product_id, item.quantity) {
            Ok(_) => reserved.push((item.product_id, item.quantity)),
            Err(err) => {
                for (product_id, quantity) in reserved {
                    let _ = increase_stock(product_repo, product_id, quantity);
                }
                return Err(err);
            }
        }
    }

    Ok(())
}

/* Releases stock for a list of order items */
fn release_stock_for_order_items(product_repo: &ProductRepo, items: &[OrderItem]) -> Result<(), String> {
    for item in items {
        increase_stock(product_repo, item.product_id, item.quantity)?;
    }
    Ok(())
}

/* Reserves stock for a list of order items */
fn reserve_stock_for_order_items(product_repo: &ProductRepo, items: &[OrderItem]) -> Result<(), String> {
    let mut reserved: Vec<(Uuid, i32)> = Vec::new();

    for item in items {
        match decrease_stock(product_repo, item.product_id, item.quantity) {
            Ok(_) => reserved.push((item.product_id, item.quantity)),
            Err(err) => {
                for (product_id, quantity) in reserved {
                    let _ = increase_stock(product_repo, product_id, quantity);
                }
                return Err(err);
            }
        }
    }

    Ok(())
}

/* CRUD Operations */
/* Create */
pub fn create_order(
    order_repo: &OrderRepo,
    product_repo: &ProductRepo,
    items: Vec<CreateOrderItemInput>,
) -> Result<Order, String> {
    let merged_items = merge_order_inputs(items)?;

    /* Reserve all requested stock; rollback all reservations if any item fails. */
    reserve_stock_for_items(product_repo, &merged_items)?;

    let products = product_repo.products.lock().unwrap().clone();
    let mut order_items: Vec<OrderItem> = Vec::new();
    let mut total_price = 0.0;

    for item in merged_items {
        let product = products
            .iter()
            .find(|p| p.id == item.product_id)
            .ok_or("PRODUCT_NOT_FOUND")?;

        let line_total = product.price * item.quantity as f64;
        total_price += line_total;

        order_items.push(OrderItem {
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: product.price,
            line_total,
        });
    }

    /* Creates a new order with item lines, total price and creation timestamp */
    let order = Order {
        id: Uuid::new_v4(),
        items: order_items,
        status: OrderStatus::Pending,
        created_at: chrono::Utc::now().to_rfc3339(),
        total_price,
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
    let snapshot = {
        let orders = repo.orders.lock().unwrap();
        orders.iter().find(|o| o.id == order_id).cloned()
    };

    let Some(order_snapshot) = snapshot else {
        return Err("ORDER_NOT_FOUND".into());
    };

    if std::mem::discriminant(&order_snapshot.status) == std::mem::discriminant(&new_status) {
        return Ok(order_snapshot);
    }

    let was_cancelled = matches!(order_snapshot.status, OrderStatus::Cancelled);
    let is_cancelled = matches!(new_status, OrderStatus::Cancelled);

    if !was_cancelled && is_cancelled {
        release_stock_for_order_items(product_repo, &order_snapshot.items)?;
    }

    if was_cancelled && !is_cancelled {
        reserve_stock_for_order_items(product_repo, &order_snapshot.items)?;
    }

    let mut orders = repo.orders.lock().unwrap();
    if let Some(order) = orders.iter_mut().find(|o| o.id == order_id) {
        order.status = new_status;
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
            let _ = release_stock_for_order_items(product_repo, &order.items);
        }
        return Ok(());
    }
    Err("ORDER_NOT_FOUND".into())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::product::Product;
    use crate::repository::{order_repo::OrderRepo, product_repo::ProductRepo};

    fn seed_product(repo: &ProductRepo, name: &str, price: f64, stock: i32) -> Uuid {
        let product = Product {
            id: Uuid::new_v4(),
            name: name.to_string(),
            price,
            stock,
            description: None,
            image_url: None,
            updated_at: chrono::Utc::now().to_rfc3339(),
        };

        repo.products.lock().unwrap().push(product.clone());
        product.id
    }

    #[test]
    fn create_order_rolls_back_stock_when_one_item_fails() {
        let order_repo = OrderRepo::new();
        let product_repo = ProductRepo::new();

        // This test verifies that a partial order does not leave stock mutated when one item fails.
        let keyboard_id = seed_product(&product_repo, "Mechanical Keyboard", 120.0, 10);
        let mouse_id = seed_product(&product_repo, "Gaming Mouse", 60.0, 1);

        let result = create_order(
            &order_repo,
            &product_repo,
            vec![
                CreateOrderItemInput { product_id: keyboard_id, quantity: 3 },
                CreateOrderItemInput { product_id: mouse_id, quantity: 2 },
            ],
        );

        assert_eq!(result.expect_err("should fail on insufficient stock"), "NOT_ENOUGH_STOCK");
        assert!(order_repo.orders.lock().unwrap().is_empty());

        let products = product_repo.products.lock().unwrap();
        let keyboard = products.iter().find(|p| p.id == keyboard_id).unwrap();
        let mouse = products.iter().find(|p| p.id == mouse_id).unwrap();
        assert_eq!(keyboard.stock, 10);
        assert_eq!(mouse.stock, 1);
    }

    #[test]
    fn cancelled_order_can_be_reactivated_and_restocks_correctly() {
        let order_repo = OrderRepo::new();
        let product_repo = ProductRepo::new();

        // This test checks that canceling and then reactivating an order restores stock correctly.
        let keyboard_id = seed_product(&product_repo, "Mechanical Keyboard", 120.0, 10);

        let order = create_order(
            &order_repo,
            &product_repo,
            vec![CreateOrderItemInput { product_id: keyboard_id, quantity: 4 }],
        )
        .expect("order should be created");

        let after_create_stock = product_repo
            .products
            .lock()
            .unwrap()
            .iter()
            .find(|p| p.id == keyboard_id)
            .unwrap()
            .stock;
        assert_eq!(after_create_stock, 6);

        let cancelled = update_order_status(&order_repo, &product_repo, order.id, OrderStatus::Cancelled)
            .expect("cancel should work");
        assert_eq!(cancelled.status, OrderStatus::Cancelled);

        let after_cancel_stock = product_repo
            .products
            .lock()
            .unwrap()
            .iter()
            .find(|p| p.id == keyboard_id)
            .unwrap()
            .stock;
        assert_eq!(after_cancel_stock, 10);

        let reactivated = update_order_status(&order_repo, &product_repo, order.id, OrderStatus::Completed)
            .expect("reactivation should work while enough stock exists");
        assert_eq!(reactivated.status, OrderStatus::Completed);

        let after_reactivate_stock = product_repo
            .products
            .lock()
            .unwrap()
            .iter()
            .find(|p| p.id == keyboard_id)
            .unwrap()
            .stock;
        assert_eq!(after_reactivate_stock, 6);
    }
}

