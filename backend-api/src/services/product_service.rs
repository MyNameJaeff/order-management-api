use uuid::Uuid;
use crate::models::product::Product;
use crate::repository::product_repo::ProductRepo;

/* CRUD Operations */
/* Creates a new product with the specified details, and a unique ID, as well as a creation timestamp */
pub fn create_product(repo: &ProductRepo, name: String, price: f64, stock: i32) -> Product {
    let product = Product {
        id: Uuid::new_v4(),
        name,
        price,
        stock,
        description: None,
        image_url: None,
        updated_at: chrono::Utc::now().to_rfc3339(),
    };

    repo.products.lock().unwrap().push(product.clone());
    product
}

/* Read Operations */
/* Gets a specific product by ID */
pub fn get_product(repo: &ProductRepo, product_id: Uuid) -> Option<Product> {
    let products = repo.products.lock().unwrap();
    products.iter().cloned().find(|p| p.id == product_id)
}

/* Lists all products */
pub fn list_products(repo: &ProductRepo) -> Vec<Product> {
    repo.products.lock().unwrap().clone()
}

/* Search products by name, case-insensitive substring match */
pub fn search_products(repo: &ProductRepo, query: String) -> Vec<Product> {
    let products = repo.products.lock().unwrap();
    products.iter()
        .cloned()
        .filter(|p| p.name.to_lowercase().contains(&query.to_lowercase()))
        .collect()
}

/* Updates a product with the specified details */
pub fn update_product(repo: &ProductRepo, product_id: Uuid, name: Option<String>, price: Option<f64>, stock: Option<i32>) -> Result<Product, String> {
    let mut products = repo.products.lock().unwrap();
    if let Some(product) = products.iter_mut().find(|p| p.id == product_id) {
        if let Some(name) = name {
            product.name = name;
        }
        if let Some(price) = price {
            product.price = price;
        }
        if let Some(stock) = stock {
            product.stock = stock;
        }
        product.updated_at = chrono::Utc::now().to_rfc3339();
        return Ok(product.clone());
    }
    Err("PRODUCT_NOT_FOUND".into())
}

/* Delete a product by ID */
pub fn delete_product(repo: &ProductRepo, product_id: Uuid) -> Result<bool, String> {
    let mut products = repo.products.lock().unwrap();
    let len_before = products.len();
    products.retain(|p| p.id != product_id);
    Ok(len_before != products.len())
}


/* Stock Management Related Functions */
pub fn increase_stock(repo: &ProductRepo, product_id: Uuid, amount: i32 ) -> Result<Product, String> {
    let mut products = repo.products.lock().unwrap();

    let product = products.iter_mut()
        .find(|p| p.id == product_id)
        .ok_or("PRODUCT_NOT_FOUND")?;

    product.stock += amount;
    product.updated_at = chrono::Utc::now().to_rfc3339();

    Ok(product.clone())
}

pub fn decrease_stock(repo: &ProductRepo, product_id: Uuid, amount: i32 ) -> Result<Product, String> {
    let mut products = repo.products.lock().unwrap();

    let product = products.iter_mut()
        .find(|p| p.id == product_id)
        .ok_or("PRODUCT_NOT_FOUND")?;

    if product.stock < amount {
        return Err("NOT_ENOUGH_STOCK".into());
    }

    product.stock -= amount;
    product.updated_at = chrono::Utc::now().to_rfc3339();

    Ok(product.clone())
}