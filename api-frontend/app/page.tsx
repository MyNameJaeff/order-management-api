"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { CreateOrderForm } from "./components/CreateOrderForm";
import { CreateProductForm } from "./components/CreateProductForm";
import { OrdersTable } from "./components/OrdersTable";
import { ProductsTable } from "./components/ProductsTable";
import { CreateOrderItem, Order, Product } from "./lib/types";
import {
  isInvalidOrderQuantity,
  normalizeOptionalText,
  validateOptionalImageUrl,
  validateProductInputs,
} from "./lib/validation";
import { API_BASE } from "./lib/constants";


export default function Home() {
  /* Data States */
  const [health, setHealth] = useState<string>("Checking...");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  /* UI States */
  const [error, setError] = useState<string>("");
  const [productSuccess, setProductSuccess] = useState<string>("");
  const [orderSuccess, setOrderSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  /* Form States */
  const [productName, setProductName] = useState<string>("");
  const [productPrice, setProductPrice] = useState<string>("");
  const [productStock, setProductStock] = useState<string>("");
  const [productDescription, setProductDescription] = useState<string>("");
  const [productImageUrl, setProductImageUrl] = useState<string>("");

  /* Order Form States */
  const [orderProductId, setOrderProductId] = useState<string>("");
  const [orderQuantity, setOrderQuantity] = useState<string>("1");
  const [draftOrderItems, setDraftOrderItems] = useState<CreateOrderItem[]>([]);

  /* Computed Values */
  const productsById = useMemo(() => {
    return new Map(products.map((p) => [p.id, p]));
  }, [products]);

  /* Selected Product */
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === orderProductId),
    [products, orderProductId],
  );

  /* Calculates the total quantity of the selected product that is already in the draft order */
  const reservedDraftQuantityForSelected = useMemo(() => {
    if (!orderProductId) {
      return 0;
    }
    return draftOrderItems
      .filter((item) => item.product_id === orderProductId)
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [draftOrderItems, orderProductId]);

  const maxStockForSelection = selectedProduct?.stock ?? 0;
  const remainingStockForSelection = Math.max(0, maxStockForSelection - reservedDraftQuantityForSelected);
  const quantityInvalid = isInvalidOrderQuantity(orderQuantity, remainingStockForSelection);

  /* Load all data on component mount */
  const loadAll = async () => {
    setLoading(true);
    setError("");

    try {
      const [healthRes, productsRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE}/health`),
        fetch(`${API_BASE}/products`),
        fetch(`${API_BASE}/orders`),
      ]);

      if (!healthRes.ok || !productsRes.ok || !ordersRes.ok) {
        throw new Error("Failed to fetch API data");
      }

      const healthText = await healthRes.text();
      const productsJson = (await productsRes.json()) as Product[];
      const ordersJson = (await ordersRes.json()) as Order[];

      setHealth(healthText);
      setProducts(productsJson);
      setOrders(ordersJson);

      if (!orderProductId && productsJson.length > 0) {
        setOrderProductId(productsJson[0].id);
      }
    } catch (error) {
      setHealth("DOWN");
      setError("Could not connect to backend at http://localhost:3001");
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  /* Create a new product */
  const onCreateProduct = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setProductSuccess("");

    const productValidation = validateProductInputs(productPrice, productStock);
    if (!productValidation.valid) {
      setError(productValidation.message ?? "Invalid product input");
      return;
    }

    const imageValidation = validateOptionalImageUrl(productImageUrl);
    if (!imageValidation.valid) {
      setError(imageValidation.message ?? "Invalid image URL");
      return;
    }

    const parsedPrice = productValidation.price as number;
    const parsedStock = productValidation.stock as number;

    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName.trim(),
          price: parsedPrice,
          stock: parsedStock,
          description: normalizeOptionalText(productDescription),
          image_url: imageValidation.normalized ?? null,
        }),
      });

      if (!res.ok) {
        throw new Error("Create product failed");
      }

      const createdOrMerged = (await res.json()) as Product | null;
      if (!createdOrMerged) {
        throw new Error("Create product returned no data");
      }

      setProductSuccess("Product saved successfully.");

      setProducts((prev) => {
        const idx = prev.findIndex((p) => p.id === createdOrMerged.id);
        if (idx === -1) {
          return [...prev, createdOrMerged];
        }
        const next = [...prev];
        next[idx] = createdOrMerged;
        return next;
      });

      if (!orderProductId) {
        setOrderProductId(createdOrMerged.id);
      }

      setProductName("");
      setProductPrice("");
      setProductStock("");
      setProductDescription("");
      setProductImageUrl("");
    } catch {
      setError("Could not create product");
    }
  };

  /* Add an item to the draft order */
  const addDraftOrderItem = () => {
    setError("");

    if (!orderProductId) {
      setError("Please choose a product");
      return;
    }

    if (quantityInvalid) {
      setError("Quantity cannot be greater than remaining available stock");
      return;
    }

    const quantity = Number(orderQuantity);

    setDraftOrderItems((prev) => {
      const idx = prev.findIndex((item) => item.product_id === orderProductId);
      if (idx === -1) {
        return [...prev, { product_id: orderProductId, quantity }];
      }

      const next = [...prev];
      next[idx] = {
        ...next[idx],
        quantity: next[idx].quantity + quantity,
      };
      return next;
    });

    setOrderQuantity("1");
  };

  /* Remove an item from the draft order */
  const removeDraftOrderItem = (index: number) => {
    setDraftOrderItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  /* Create a new order based on the draft order */
  const onCreateOrder = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setOrderSuccess("");

    if (draftOrderItems.length === 0) {
      setError("Add at least one item to the order");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: draftOrderItems,
        }),
      });

      if (!res.ok) {
        throw new Error("Create order failed");
      }

      const createdOrder = (await res.json()) as Order | null;
      if (!createdOrder) {
        throw new Error("Create order returned no data");
      }

      setOrderSuccess("Order created successfully.");

      setOrders((prev) => [...prev, createdOrder]);
      setProducts((prev) => {
        let next = [...prev];
        for (const item of createdOrder.items) {
          next = next.map((p) =>
            p.id === item.product_id ? { ...p, stock: p.stock - item.quantity } : p,
          );
        }
        return next;
      });

      setDraftOrderItems([]);
      setOrderQuantity("1");
    } catch {
      setError("Could not create order (check stock/product)");
    }
  };

  /* Update the status of an existing order */
  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    setError("");

    const currentOrder = orders.find((o) => o.id === id);
    if (!currentOrder) {
      return;
    }

    if (currentOrder.status === status) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error("Update order status failed");
      }

      const updatedOrder = (await res.json()) as Order | null;
      if (!updatedOrder) {
        throw new Error("Update order returned no data");
      }

      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));

      if (currentOrder.status !== "Cancelled" && updatedOrder.status === "Cancelled") {
        setProducts((prev) => {
          let next = [...prev];
          for (const item of updatedOrder.items) {
            next = next.map((p) =>
              p.id === item.product_id ? { ...p, stock: p.stock + item.quantity } : p,
            );
          }
          return next;
        });
      }

      if (currentOrder.status === "Cancelled" && updatedOrder.status !== "Cancelled") {
        setProducts((prev) => {
          let next = [...prev];
          for (const item of updatedOrder.items) {
            next = next.map((p) =>
              p.id === item.product_id ? { ...p, stock: p.stock - item.quantity } : p,
            );
          }
          return next;
        });
      }

    } catch {
      setError("Could not update order status");
    }
  };

  /* Complete an existing order */
  const completeOrder = async (id: string) => {
    await updateOrderStatus(id, "Completed");
  };

  /* Cancel an existing order */
  const cancelOrder = async (id: string) => {
    await updateOrderStatus(id, "Cancelled");
  };

  /* Delete an existing product */
  const deleteProduct = async (id: string) => {
    setError("");

    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Delete product failed");
      }

      setProducts((prev) => prev.filter((p) => p.id !== id));
      setOrders((prev) => prev.filter((o) => !o.items.some((item) => item.product_id === id)));
      setDraftOrderItems((prev) => prev.filter((item) => item.product_id !== id));
      if (orderProductId === id) {
        setOrderProductId("");
      }

    } catch {
      setError("Could not delete product");
    }
  };

  /* Update an existing product */
  const updateProduct = async (
    id: string,
    patch: {
      name: string;
      price: number;
      stock: number;
      description: string | null;
      image_url: string | null;
    },
  ): Promise<boolean> => {
    setError("");

    const productValidation = validateProductInputs(
      patch.price.toString(),
      patch.stock.toString(),
    );

    if (!productValidation.valid) {
      setError(productValidation.message ?? "Invalid product input");
      return false;
    }

    const imageValidation = validateOptionalImageUrl(patch.image_url ?? "");
    if (!imageValidation.valid) {
      setError(imageValidation.message ?? "Invalid image URL");
      return false;
    }

    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: patch.name.trim(),
          price: patch.price,
          stock: patch.stock,
          description: patch.description,
          image_url: imageValidation.normalized ?? null,
        }),
      });

      if (!res.ok) {
        throw new Error("Update product failed");
      }

      const updatedProduct = (await res.json()) as Product | null;
      if (!updatedProduct) {
        throw new Error("Update product returned no data");
      }

      setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
      return true;
    } catch {
      setError("Could not update product");
      return false;
    }
  };

  /* Delete an existing order */
  const deleteOrder = async (id: string) => {
    setError("");

    const orderToDelete = orders.find((o) => o.id === id);
    if (!orderToDelete) return;

    try {
      const res = await fetch(`${API_BASE}/orders/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Delete order failed");
      }

      setOrders((prev) => prev.filter((o) => o.id !== id));

      if (orderToDelete.status !== "Cancelled") {
        setProducts((prev) => {
          let next = [...prev];
          for (const item of orderToDelete.items) {
            next = next.map((p) =>
              p.id === item.product_id ? { ...p, stock: p.stock + item.quantity } : p,
            );
          }
          return next;
        });
      }

    } catch {
      setError("Could not delete order");
    }
  };

  return (
    <main className="mx-auto max-w-6xl p-6 text-zinc-100">
      <AppHeader apiBase={API_BASE} health={health} error={error} onRefresh={() => void loadAll()} />

      <CreateProductForm
        productName={productName}
        productPrice={productPrice}
        productStock={productStock}
        productDescription={productDescription}
        productImageUrl={productImageUrl}
        setProductName={setProductName}
        setProductPrice={setProductPrice}
        setProductStock={setProductStock}
        setProductDescription={setProductDescription}
        setProductImageUrl={setProductImageUrl}
        statusMessage={productSuccess}
        onSubmit={onCreateProduct}
      />

      <CreateOrderForm
        products={products}
        orderProductId={orderProductId}
        orderQuantity={orderQuantity}
        draftItems={draftOrderItems}
        selectedProduct={selectedProduct}
        quantityInvalid={quantityInvalid}
        maxStockForSelection={remainingStockForSelection}
        setOrderProductId={setOrderProductId}
        setOrderQuantity={setOrderQuantity}
        onAddItem={addDraftOrderItem}
        onRemoveItem={removeDraftOrderItem}
        statusMessage={orderSuccess}
        onSubmitOrder={onCreateOrder}
      />

      <ProductsTable
        products={products}
        loading={loading}
        onDelete={(id) => void deleteProduct(id)}
        onUpdate={updateProduct}
      />

      <OrdersTable
        orders={orders}
        loading={loading}
        productsById={productsById}
        onComplete={(id) => void completeOrder(id)}
        onCancel={(id) => void cancelOrder(id)}
        onDelete={(id) => void deleteOrder(id)}
      />
    </main>
  );
}
