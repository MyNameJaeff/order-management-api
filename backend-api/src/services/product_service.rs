use uuid::Uuid;
use crate::models::product::Product;
use crate::repository::product_repo::ProductRepo;
use crate::services::validation::{
    validate_non_negative_price,
    validate_non_negative_stock,
    validate_optional_image_url,
    validate_positive_stock_amount,
    ERR_PRODUCT_NOT_FOUND,
};

/* CRUD Operations */
/* Creates a new product with the specified details, and a unique ID, as well as a creation timestamp. */
/* Checks for existing products with the same name and price, if found, updates the stock instead of creating a new one. */
pub fn create_product(
    repo: &ProductRepo,
    name: String,
    price: f64,
    stock: i32,
    description: Option<String>,
    image_url: Option<String>,
) -> Result<Product, String> {
    validate_non_negative_price(price)?;
    validate_non_negative_stock(stock)?;
    validate_optional_image_url(&image_url)?;

    let has_description_field = description.is_some();
    let has_image_url_field = image_url.is_some();

    let normalized_description = description
        .map(|d| d.trim().to_string())
        .filter(|d| !d.is_empty());
    let normalized_image_url = image_url
        .map(|u| u.trim().to_string())
        .filter(|u| !u.is_empty());

    let normalized_name = name.trim().to_lowercase();
    let existing_product_id = {
        let products = repo.products.lock().unwrap();
        products
            .iter()
            .find(|p| {
                p.name.trim().to_lowercase() == normalized_name
                    && (p.price - price).abs() < f64::EPSILON
            })
            .map(|p| p.id)
    };

    if let Some(product_id) = existing_product_id {
        if stock == 0 {
            let mut existing = get_product(repo, product_id)
                .ok_or_else(|| ERR_PRODUCT_NOT_FOUND.to_string())?;
            if has_description_field || has_image_url_field {
                existing = update_product(
                    repo,
                    product_id,
                    None,
                    None,
                    None,
                    normalized_description,
                    normalized_image_url,
                )?;
            }
            return Ok(existing);
        }

        let mut updated = increase_stock(repo, product_id, stock)?;
        if has_description_field || has_image_url_field {
            updated = update_product(
                repo,
                product_id,
                None,
                None,
                None,
                normalized_description,
                normalized_image_url,
            )?;
        }
        return Ok(updated);
    }

    let product = Product {
        id: Uuid::new_v4(),
        name,
        price,
        stock,
        description: normalized_description,
        image_url: normalized_image_url,
        updated_at: chrono::Utc::now().to_rfc3339(),
    };

    let mut products = repo.products.lock().unwrap();
    products.push(product.clone());
    Ok(product)
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
pub fn update_product(
    repo: &ProductRepo,
    product_id: Uuid,
    name: Option<String>,
    price: Option<f64>,
    stock: Option<i32>,
    description: Option<String>,
    image_url: Option<String>,
) -> Result<Product, String> {
    let has_description_field = description.is_some();
    let has_image_url_field = image_url.is_some();

    if let Some(p) = price {
        validate_non_negative_price(p)?;
    }

    if let Some(s) = stock {
        validate_non_negative_stock(s)?;
    }

    validate_optional_image_url(&image_url)?;

    let normalized_description = description
        .map(|d| d.trim().to_string())
        .filter(|d| !d.is_empty());
    let normalized_image_url = image_url
        .map(|u| u.trim().to_string())
        .filter(|u| !u.is_empty());

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
        if has_description_field {
            product.description = normalized_description;
        }
        if has_image_url_field {
            product.image_url = normalized_image_url;
        }
        product.updated_at = chrono::Utc::now().to_rfc3339();
        return Ok(product.clone());
    }
    Err(ERR_PRODUCT_NOT_FOUND.into())
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
    validate_positive_stock_amount(amount)?;

    let mut products = repo.products.lock().unwrap();

    let product = products.iter_mut()
        .find(|p| p.id == product_id)
        .ok_or(ERR_PRODUCT_NOT_FOUND)?;

    product.stock += amount;
    product.updated_at = chrono::Utc::now().to_rfc3339();

    Ok(product.clone())
}

pub fn decrease_stock(repo: &ProductRepo, product_id: Uuid, amount: i32 ) -> Result<Product, String> {
    validate_positive_stock_amount(amount)?;

    let mut products = repo.products.lock().unwrap();

    let product = products.iter_mut()
        .find(|p| p.id == product_id)
        .ok_or(ERR_PRODUCT_NOT_FOUND)?;

    if product.stock < amount {
        return Err("NOT_ENOUGH_STOCK".into());
    }

    product.stock -= amount;
    product.updated_at = chrono::Utc::now().to_rfc3339();

    Ok(product.clone())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::repository::product_repo::ProductRepo;

    #[test]
    fn create_product_rejects_negative_price_and_stock() {
        let repo = ProductRepo::new();

        // Negative prices should be rejected before a product is created.
        let price_err = create_product(&repo, "Mechanical Keyboard".into(), -1.0, 10, None, None)
            .expect_err("negative price should fail");
        assert_eq!(price_err, "INVALID_PRICE");

        // Negative stock should be rejected for the same reason.
        let stock_err = create_product(&repo, "Mechanical Keyboard".into(), 1.0, -10, None, None)
            .expect_err("negative stock should fail");
        assert_eq!(stock_err, "INVALID_STOCK");
    }
}