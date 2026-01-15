import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import { authenticate, authorize, apiResponse } from "@/lib/auth";
import { UserRole } from "@/models/User";

// GET /api/v1/orders - Get orders (customer sees their orders, merchant sees orders for their products)
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    await connectDB();

    let query: Record<string, unknown> = {};

    if (user!.role === UserRole.CUSTOMER) {
      query.customer_id = user!._id;
    } else if (user!.role === UserRole.MERCHANT) {
      query.merchant_id = user!._id;
    }

    const orders = await Order.find(query)
      .populate("customer_id", "full_name phone_number email")
      .populate("merchant_id", "full_name merchant_profile.shop_name")
      .sort({ created_at: -1 });

    return apiResponse.success(orders);
  } catch (error) {
    console.error("Get orders error:", error);
    return apiResponse.serverError("Failed to get orders");
  }
}

// POST /api/v1/orders - Create order (customer places order)
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const authError = authorize(user!, [UserRole.CUSTOMER]);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const { items, shipping_address, note, payment_method } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return apiResponse.error("Order items are required");
    }

    // Validate products and calculate total
    let totalAmount = 0;
    const orderItems: Array<{
      product_id: string;
      name: string;
      price: number;
      product_image?: string;
      quantity: number;
    }> = [];
    let merchantId: string | null = null;

    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        return apiResponse.error(`Product not found: ${item.product_id}`);
      }
      if (!product.is_active) {
        return apiResponse.error(`Product is not available: ${product.name}`);
      }
      if (product.stock_quantity < item.quantity) {
        return apiResponse.error(
          `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`
        );
      }

      // All items must be from the same merchant
      if (merchantId === null) {
        merchantId = product.merchant_id.toString();
      } else if (merchantId !== product.merchant_id.toString()) {
        return apiResponse.error(
          "All items must be from the same merchant"
        );
      }

      // Get first product image URL if available
      const productImageUrl = product.images && product.images.length > 0
        ? product.images[0].url
        : undefined;

      orderItems.push({
        product_id: product._id.toString(),
        name: product.name,
        price: product.price,
        product_image: productImageUrl,
        quantity: item.quantity,
      });

      totalAmount += product.price * item.quantity;
    }

    // Create order
    const order = await Order.create({
      customer_id: user!._id,
      merchant_id: merchantId,
      items: orderItems,
      total_amount: totalAmount,
      payment_method: payment_method || "COD",
      status: "PENDING",
      shipping_address,
      note,
    });

    // Decrease stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product_id, {
        $inc: { stock_quantity: -item.quantity },
      });
    }

    return apiResponse.created(order, "Order placed successfully");
  } catch (error) {
    console.error("Create order error:", error);
    return apiResponse.serverError("Failed to create order");
  }
}
