pub const ERR_INVALID_PRICE: &str = "INVALID_PRICE";
pub const ERR_INVALID_STOCK: &str = "INVALID_STOCK";
pub const ERR_INVALID_STOCK_AMOUNT: &str = "INVALID_STOCK_AMOUNT";
pub const ERR_INVALID_IMAGE_URL: &str = "INVALID_IMAGE_URL";
pub const ERR_PRODUCT_NOT_FOUND: &str = "PRODUCT_NOT_FOUND";

pub fn validate_non_negative_price(price: f64) -> Result<(), String> {
    if price < 0.0 {
        return Err(ERR_INVALID_PRICE.into());
    }
    Ok(())
}

pub fn validate_non_negative_stock(stock: i32) -> Result<(), String> {
    if stock < 0 {
        return Err(ERR_INVALID_STOCK.into());
    }
    Ok(())
}

pub fn validate_positive_stock_amount(amount: i32) -> Result<(), String> {
    if amount <= 0 {
        return Err(ERR_INVALID_STOCK_AMOUNT.into());
    }
    Ok(())
}

pub fn validate_optional_image_url(image_url: &Option<String>) -> Result<(), String> {
    if let Some(url) = image_url {
        let trimmed = url.trim();
        if trimmed.is_empty() {
            return Ok(());
        }

        let is_http = trimmed.starts_with("http://") || trimmed.starts_with("https://");
        if !is_http {
            return Err(ERR_INVALID_IMAGE_URL.into());
        }
    }
    Ok(())
}

pub fn is_product_validation_error(err: &str) -> bool {
    err == ERR_INVALID_PRICE
        || err == ERR_INVALID_STOCK
        || err == ERR_INVALID_STOCK_AMOUNT
        || err == ERR_INVALID_IMAGE_URL
}
