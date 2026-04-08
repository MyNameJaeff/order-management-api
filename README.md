# Order Management API

A Rust + Axum order management API with a lightweight Next.js frontend.

## What is included

* Product management with CRUD, image URLs, and descriptions
* Multi-item orders with automatic stock reservation and rollback
* Cancel/reactivate stock handling
* Dark-mode frontend with editable product cards and expandable order details
* In-memory storage for fast review and easy reset

## Tech Stack

* Rust
* Axum
* Tokio
* Serde
* UUID
* Next.js

## How to run

### 1. Backend

```bash
cd backend-api
cargo run
```

Backend runs on:

```text
http://localhost:3001
```

### 2. Frontend

Open a second terminal:

```bash
cd api-frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

## How to test

### Backend tests

```bash
cd backend-api
cargo test
```

### Frontend production build

```bash
cd api-frontend
npm run build
```

## API Endpoints

### Health

```http
GET /health
```

### Products

```http
GET    /products
GET    /products/:id
GET    /products/search?q=term
POST   /products
PUT    /products/:id
DELETE /products/:id
```

### Orders

```http
GET    /orders
GET    /orders/:id
GET    /orders/list_by_status/:status
POST   /orders
PUT    /orders/:id
DELETE /orders/:id
```

## Multi-item order example

Create an order with multiple line items:

```bash
curl -X POST http://localhost:3001/orders ^
	-H "Content-Type: application/json" ^
	-d "{
		\"items\": [
			{ \"product_id\": \"8dc3fccc-2380-46fe-9fe9-7a6dd3b023e6\", \"quantity\": 2 },
			{ \"product_id\": \"6f452244-6f4f-44d5-822b-e56653d6449c\", \"quantity\": 1 }
		]
	}"
```

Example response:

```json
{
	"id": "b2ce44b6-6eb0-43ec-9f92-0d7a8a3a0c4f",
	"items": [
		{
			"product_id": "8dc3fccc-2380-46fe-9fe9-7a6dd3b023e6",
			"quantity": 2,
			"unit_price": 120.0,
			"line_total": 240.0
		},
		{
			"product_id": "6f452244-6f4f-44d5-822b-e56653d6449c",
			"quantity": 1,
			"unit_price": 60.0,
			"line_total": 60.0
		}
	],
	"status": "Pending",
	"total_price": 300.0,
	"created_at": "2026-04-08T08:30:07.908978600+00:00"
}
```

## Quick curl examples

### Health

```bash
curl http://localhost:3001/health
```

### List products

```bash
curl http://localhost:3001/products
```

### Create a product

```bash
curl -X POST http://localhost:3001/products ^
	-H "Content-Type: application/json" ^
	-d "{
		\"name\": \"USB-C Hub\",
		\"price\": 29.9,
		\"stock\": 20,
		\"description\": \"7-in-1 USB-C hub with HDMI and card reader\",
		\"image_url\": \"https://example.com/usb-c-hub.png\"
	}"
```

### Create a multi-item order

```bash
curl -X POST http://localhost:3001/orders ^
	-H "Content-Type: application/json" ^
	-d "{
		\"items\": [
			{ \"product_id\": \"8dc3fccc-2380-46fe-9fe9-7a6dd3b023e6\", \"quantity\": 1 },
			{ \"product_id\": \"6f452244-6f4f-44d5-822b-e56653d6449c\", \"quantity\": 2 }
		]
	}"
```

### Cancel an order

```bash
curl -X PUT http://localhost:3001/orders/<order-id> ^
	-H "Content-Type: application/json" ^
	-d "{ \"status\": \"Cancelled\" }"
```

## Known limitations

* In-memory storage only; all data resets on restart.
* No authentication or authorization.
* No persistent database.
* Order items are product snapshots by reference, not historical price snapshots beyond the stored unit price.

## Notes

* Seed data is loaded on startup.
* Frontend expects the backend on `http://localhost:3001`.