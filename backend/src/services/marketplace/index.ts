import { query, queryOne } from "../../db.js";

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  active: boolean;
  created_at: Date;
}

export interface Order {
  id: string;
  buyer_id: string;
  total: number;
  momo_provider: string;
  momo_reference: string;
  payment_method: string;
  status: string;
  loan_id: string | null;
  created_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  vendor_id: string;
  qty: number;
  price: number;
}

const COMMISSION_RATE = 0.10;

export async function getAllActiveProducts(): Promise<Product[]> {
  return query<Product>(
    `SELECT * FROM products WHERE active = true ORDER BY created_at DESC`
  );
}

export async function getProductById(productId: string): Promise<Product | null> {
  return queryOne<Product>(
    `SELECT * FROM products WHERE id = $1`,
    [productId]
  );
}

export async function getVendorProducts(vendorId: string): Promise<Product[]> {
  return query<Product>(
    `SELECT * FROM products WHERE vendor_id = $1 ORDER BY created_at DESC`,
    [vendorId]
  );
}

export async function createProduct(params: {
  vendorId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
}): Promise<Product> {
  const product = await queryOne<Product>(
    `INSERT INTO products (vendor_id, name, description, price, image_url, stock, active)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING *`,
    [params.vendorId, params.name, params.description, params.price, params.imageUrl, params.stock]
  );

  if (!product) throw new Error("Failed to create product");
  return product;
}

export async function updateProduct(productId: string, updates: Partial<{
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  active: boolean;
}>): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return;

  values.push(productId);
  await query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values
  );
}

export async function deleteProduct(productId: string): Promise<void> {
  await query(`DELETE FROM products WHERE id = $1`, [productId]);
}

export async function calculateCommission(orderTotal: number): number {
  return Math.round(orderTotal * COMMISSION_RATE * 100) / 100;
}

export async function createOrder(params: {
  buyerId: string;
  items: { productId: string; vendorId: string; qty: number; price: number }[];
  paymentMethod: string;
  momoProvider?: string;
  momoReference?: string;
  loanId?: string;
  status?: string;
}): Promise<Order> {
  const total = params.items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const order = await queryOne<Order>(
    `INSERT INTO orders (buyer_id, total, momo_provider, momo_reference, payment_method, status, loan_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      params.buyerId,
      total,
      params.momoProvider || "System",
      params.momoReference || "",
      params.paymentMethod,
      params.status || (params.paymentMethod === "wallet" || params.paymentMethod === "loan" ? "paid" : "pending"),
      params.loanId || null
    ]
  );

  if (!order) throw new Error("Failed to create order");

  const orderItems = params.items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    vendor_id: item.vendorId,
    qty: item.qty,
    price: item.price,
  }));

  await query(
    `INSERT INTO order_items (order_id, product_id, vendor_id, qty, price)
     SELECT unnest($1::uuid[]), unnest($2::uuid[]), unnest($3::uuid[]), unnest($4::int[]), unnest($5::numeric[])`,
    [
      orderItems.map(i => i.order_id),
      orderItems.map(i => i.product_id),
      orderItems.map(i => i.vendor_id),
      orderItems.map(i => i.qty),
      orderItems.map(i => i.price),
    ]
  );

  for (const item of params.items) {
    await query(
      `UPDATE products SET stock = stock - $1 WHERE id = $2`,
      [item.qty, item.productId]
    );
  }

  return order;
}

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  await query(
    `UPDATE orders SET status = $1 WHERE id = $2`,
    [status, orderId]
  );
}

export async function getOrderWithItems(orderId: string) {
  return queryOne(
    `SELECT o.*, json_agg(oi.*) as items
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.id = $1
     GROUP BY o.id`,
    [orderId]
  );
}

export async function getVendorSales(vendorId: string) {
  return query(
    `SELECT oi.*, o.status, o.created_at as order_date, p.name as product_name
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     JOIN products p ON oi.product_id = p.id
     WHERE oi.vendor_id = $1
     ORDER BY o.created_at DESC`,
    [vendorId]
  );
}

export async function getVendorEarnings(vendorId: string): Promise<{
  totalSales: number;
  commission: number;
  netEarnings: number;
}> {
  const result = await queryOne<{ total_sales: string }>(
    `SELECT COALESCE(SUM(oi.price * oi.qty), 0) as total_sales
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE oi.vendor_id = $1 AND o.status = 'completed'`,
    [vendorId]
  );

  const totalSales = Number(result?.total_sales || 0);
  const commission = await calculateCommission(totalSales);

  return {
    totalSales,
    commission,
    netEarnings: totalSales - commission,
  };
}