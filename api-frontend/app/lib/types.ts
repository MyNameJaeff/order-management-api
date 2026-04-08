export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  description?: string | null;
  image_url?: string | null;
  updated_at?: string;
};

export type OrderStatus = "Pending" | "Completed" | "Cancelled";

export type OrderItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type CreateOrderItem = {
  product_id: string;
  quantity: number;
};

export type Order = {
  id: string;
  items: OrderItem[];
  status: OrderStatus;
  total_price: number;
  created_at: string;
};
