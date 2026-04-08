# Order Management API

A simple fullstack-ready REST API built with Rust and Axum.

## Features

* Product management (CRUD)
* Order management (create, update, cancel)
* Stock handling with automatic updates
* In-memory storage (no DB required)
* Seeded data for quick testing

## Tech Stack

* Rust
* Axum (web framework)
* Tokio (async runtime)
* Serde (serialization)
* UUID

## Getting Started

### 1. Clone project

```bash
git clone <repo-url>
cd backend-api
```

### 2. Run server

```bash
cargo run
```

Server will start at:

```
http://localhost:3000
```

---

## API Endpoints

### Health

```
GET /health
```

### Products

```
GET    /products
GET    /products/:id
GET    /products/search?q=term
POST   /products
PUT    /products/:id
DELETE /products/:id
```

### Orders

```
GET    /orders
GET    /orders/:id
GET    /orders/list_by_status/:status
POST   /orders
PUT    /orders/:id
DELETE /orders/:id
```

---

## Example Flow

1. Fetch products
2. Create an order
3. Cancel order → stock restored automatically

---

## Notes

* Uses in-memory storage (data resets on restart)
* Seed data is automatically loaded on startup