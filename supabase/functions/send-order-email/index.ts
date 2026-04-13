import { Resend } from 'https://esm.sh/resend@3.5.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  orderId: string;
  type: 'order_placed' | 'order_confirmed' | 'order_shipped' | 'order_completed' | 'payment_confirmed';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, type }: EmailRequest = await req.json();
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch order with all relations
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        products (id, title, price, image_url),
        seller_profiles (business_name, business_address),
        buyer:profiles!orders_buyer_id_fkey (id, display_name, email, phone_number)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://jztradehub.lovable.app';
    
    const templates: Record<string, { subject: string; html: (order: any) => string }> = {
      order_placed: {
        subject: `Order Confirmation - #${order.id.slice(0, 8)}`,
        html: (order) => `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"></head>
          <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #3b82f6, #10b981); color: white; border-radius: 10px;">
                <h2>JZTradeHub</h2>
                <p>Order Confirmation</p>
              </div>
              <div style="padding: 20px;">
                <h3>Thank you for your order, ${order.buyer?.display_name || 'Customer'}!</h3>
                <p>Your order has been placed successfully and is awaiting payment confirmation.</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin: 15px 0;">
                  <p><strong>Order ID:</strong> ${order.id.slice(0, 8)}</p>
                  <p><strong>Product:</strong> ${order.products?.title}</p>
                  <p><strong>Quantity:</strong> ${order.quantity}</p>
                  <p><strong>Total Amount:</strong> ₦${Number(order.total_amount).toLocaleString()}</p>
                  <p><strong>Delivery Address:</strong> ${order.delivery_address}</p>
                </div>
                <p>You will receive another email once your payment is confirmed.</p>
                <a href="${frontendUrl}/order/${order.id}" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none;">Track Order</a>
              </div>
            </div>
          </body>
          </html>
        `
      },
      payment_confirmed: {
        subject: `Payment Confirmed - #${order.id.slice(0, 8)}`,
        html: (order) => `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"></head>
          <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 10px;">
                <h2>🎉 Payment Confirmed!</h2>
              </div>
              <div style="padding: 20px;">
                <h3>Great news, ${order.buyer?.display_name || 'Customer'}!</h3>
                <p>Your payment has been verified and confirmed. The seller will now prepare your order for shipping.</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin: 15px 0;">
                  <p><strong>Order ID:</strong> ${order.id.slice(0, 8)}</p>
                  <p><strong>Amount Paid:</strong> ₦${Number(order.total_amount).toLocaleString()}</p>
                </div>
                <a href="${frontendUrl}/order/${order.id}" style="display: inline-block; background: #10b981; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none;">Track Your Order</a>
              </div>
            </div>
          </body>
          </html>
        `
      },
      order_shipped: {
        subject: `Your Order Has Been Shipped - #${order.id.slice(0, 8)}`,
        html: (order) => `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"></head>
          <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; border-radius: 10px;">
                <h2>🚚 Your Order is On Its Way!</h2>
              </div>
              <div style="padding: 20px;">
                <h3>Exciting news, ${order.buyer?.display_name || 'Customer'}!</h3>
                <p>Your order has been shipped and is on its way to you.</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin: 15px 0;">
                  <p><strong>Order ID:</strong> ${order.id.slice(0, 8)}</p>
                  <p><strong>Product:</strong> ${order.products?.title}</p>
                  <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
                </div>
                <a href="${frontendUrl}/order/${order.id}" style="display: inline-block; background: #8b5cf6; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none;">Track Delivery</a>
              </div>
            </div>
          </body>
          </html>
        `
      },
      order_completed: {
        subject: `Order Delivered - #${order.id.slice(0, 8)}`,
        html: (order) => `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"></head>
          <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 10px;">
                <h2>✅ Order Delivered!</h2>
              </div>
              <div style="padding: 20px;">
                <h3>Thank you for shopping with us, ${order.buyer?.display_name || 'Customer'}!</h3>
                <p>Your order has been successfully delivered. We hope you love your purchase!</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin: 15px 0;">
                  <p><strong>Order ID:</strong> ${order.id.slice(0, 8)}</p>
                  <p><strong>Product:</strong> ${order.products?.title}</p>
                </div>
                <p>Please consider leaving a review to help other buyers.</p>
                <a href="${frontendUrl}/order/${order.id}" style="display: inline-block; background: #10b981; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none;">Leave a Review</a>
              </div>
            </div>
          </body>
          </html>
        `
      }
    };

    const template = templates[type];
    if (!template || !order.buyer?.email) {
      console.log('No email template or buyer email found');
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    await resend.emails.send({
      from: 'JZTradeHub <notifications@jztradehub.com>',
      to: [order.buyer.email],
      subject: template.subject,
      html: template.html(order),
    });

    console.log(`Email sent for order ${orderId}, type: ${type}`);
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});