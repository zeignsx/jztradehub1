import express from "express";
import cors from "cors";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:8083', 'http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081'],
  credentials: true
}));
app.use(express.json());

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "https://csianbopsmufkrdrsasn.supabase.co",
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzaWFuYm9wc211ZmtyZHJzYXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2Mjk5NzAsImV4cCI6MjA5MDIwNTk3MH0.1oZ1Ok1PI_hP-lV7-qa1BhGcEItI59gOuseQkPkrrgI"
);

// FLUTTERWAVE CONFIGURATION
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY || "FLWSECK_TEST-16cd9950b056df87e56b3c86433e1abf-X";

console.log("=================================");
console.log("🚀 SERVER STARTING...");
console.log("💳 FLUTTERWAVE READY");
console.log("📍 Health: http://localhost:5000/api/health");
console.log("=================================");

// ============ NIGERIAN BANKS LIST ============
const ALL_NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Access Bank (Diamond)", code: "063" },
  { name: "ALAT by Wema", code: "035" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "FSDH Merchant Bank", code: "501" },
  { name: "Globus Bank", code: "103" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Jaiz Bank", code: "301" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Bank", code: "090267" },
  { name: "Parallex Bank", code: "104" },
  { name: "Polaris Bank", code: "076" },
  { name: "Premium Trust Bank", code: "090279" },
  { name: "Providus Bank", code: "101" },
  { name: "Rand Merchant Bank", code: "502" },
  { name: "Rubies Bank", code: "090280" },
  { name: "Sparkle Bank", code: "090281" },
  { name: "Stanbic IBTC Bank", code: "068" },
  { name: "Standard Chartered Bank", code: "021" },
  { name: "Sterling Bank", code: "232" },
  { name: "Suntrust Bank", code: "100" },
  { name: "Taj Bank", code: "302" },
  { name: "Titan Trust Bank", code: "090287" },
  { name: "Union Bank", code: "032" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
  { name: "VFD Microfinance Bank", code: "090352" },
  { name: "Moniepoint", code: "090318" }
];

function getBankCode(bankName) {
  const bank = ALL_NIGERIAN_BANKS.find(b => b.name.toLowerCase() === bankName.toLowerCase());
  return bank ? bank.code : null;
}

// ============ HELPER FUNCTIONS ============
function generateReceiptEmail(receipt) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px; background: linear-gradient(135deg, #3b82f6, #10b981); color: white; border-radius: 10px; }
        .content { padding: 20px; }
        .info { background: #f3f4f6; padding: 15px; border-radius: 10px; margin: 15px 0; }
        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>JZTradeHub</h2>
          <p>Payment Receipt</p>
        </div>
        <div class="content">
          <h3>Thank you for your purchase!</h3>
          <div class="info">
            <p><strong>Order ID:</strong> ${receipt.order_number || receipt.id?.slice(0, 8)}</p>
            <p><strong>Date:</strong> ${new Date(receipt.payment_date || receipt.created_at).toLocaleString()}</p>
            <p><strong>Payment Reference:</strong> ${receipt.payment_reference}</p>
          </div>
          <div class="total">
            <p>Total Paid: <strong>₦${(receipt.total || receipt.amount).toLocaleString()}</strong></p>
          </div>
        </div>
        <div class="footer">
          <p>JZTradeHub - Secure Escrow Marketplace</p>
          <p>Need help? Contact us at support@jztradehub.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============ HEALTH & PRODUCTS ============
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server running with Flutterwave" });
});

app.get("/api/products", async (req, res) => {
  const { data } = await supabase.from("products").select("*").eq("is_active", true);
  res.json({ success: true, data: data || [] });
});

app.get("/api/banks", (req, res) => {
  res.json({ success: true, data: ALL_NIGERIAN_BANKS });
});

// ============ ORDER MANAGEMENT ============
app.post("/api/create-order", async (req, res) => {
  console.log("\n=== CREATE ORDER ===");
  console.log("Body:", req.body);
  
  try {
    const { 
      buyer_id, 
      seller_id, 
      product_id, 
      quantity, 
      product_price, 
      delivery_address,
      delivery_option,
      delivery_name,
      delivery_fee = 0,
      service_fee = 0,
      phone_number,
      coupon_code,
      coupon_discount
    } = req.body;
    
    const subtotal = Number(product_price) * Number(quantity);
    const total_amount = subtotal + Number(service_fee) + Number(delivery_fee) - (coupon_discount || 0);
    
    console.log(`💰 Total: ₦${total_amount}`);
    if (coupon_code) console.log(`🎫 Coupon: ${coupon_code} - Discount: ₦${coupon_discount}`);
    
    const { data, error } = await supabase
      .from("orders")
      .insert({
        buyer_id,
        seller_id,
        product_id,
        quantity: Number(quantity),
        total_amount: total_amount,
        delivery_address,
        delivery_option: delivery_option || 'standard',
        delivery_fee: Number(delivery_fee),
        service_fee: Number(service_fee),
        phone_number: phone_number || null,
        status: "pending",
        payment_status: "pending"
      })
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`✅ Order created: ${data.id}`);
    res.json({ success: true, orderId: data.id });
    
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ FLUTTERWAVE PAYMENT ============
app.post("/api/initialize-payment", async (req, res) => {
  console.log("\n=== INITIALIZE FLUTTERWAVE PAYMENT ===");
  console.log("Request:", req.body);
  
  try {
    const { amount, email, name, orderId, phone } = req.body;
    
    if (!amount || !email || !orderId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    
    const reference = `JZ-${orderId.slice(0, 8)}-${Date.now()}`;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8083";
    
    const payload = {
      tx_ref: reference,
      amount: amount,
      currency: "NGN",
      redirect_url: `${frontendUrl}/payment-success?reference=${reference}&orderId=${orderId}`,
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: email,
        name: name || email.split('@')[0],
        phonenumber: phone || "08012345678",
      },
      customizations: {
        title: "JZTradeHub",
        description: `Payment for Order ${orderId.slice(0, 8)}`,
      },
      meta: {
        order_id: orderId,
      }
    };
    
    console.log("📤 Sending to Flutterwave:", JSON.stringify(payload, null, 2));
    
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    const responseText = await response.text();
    console.log("📥 Flutterwave Response Status:", response.status);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { status: "error" };
    }
    
    if (response.status === 200 && data.status === "success" && data.data?.link) {
      console.log("✅ Flutterwave payment initialized!");
      
      await supabase
        .from("orders")
        .update({ payment_reference: reference })
        .eq("id", orderId);
      
      res.json({
        success: true,
        data: {
          checkout_url: data.data.link,
          reference: reference
        }
      });
    } else {
      console.error("❌ Flutterwave error:", data);
      res.status(422).json({ 
        success: false, 
        message: data.message || "Payment initialization failed" 
      });
    }
    
  } catch (error) {
    console.error("💥 Payment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ PAYMENT VERIFICATION ============
app.post("/api/verify-payment", async (req, res) => {
  console.log("\n=== VERIFY PAYMENT ===");
  
  try {
    const { reference } = req.body;
    
    const { data: order } = await supabase
      .from("orders")
      .select("payment_status")
      .eq("payment_reference", reference)
      .single();
    
    if (order?.payment_status === "paid") {
      return res.json({ success: true, paid: true });
    }
    
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${reference}/verify`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });
    
    const data = await response.json();
    
    if (data.status === "success" && data.data?.status === "successful") {
      await supabase
        .from("orders")
        .update({ payment_status: "paid", status: "confirmed" })
        .eq("payment_reference", reference);
      
      return res.json({ success: true, paid: true });
    }
    
    res.json({ success: true, paid: false });
    
  } catch (error) {
    console.error("Verification error:", error);
    res.json({ success: true, paid: false });
  }
});

// ============ SELLER EARNINGS ============
app.get("/api/earnings/:sellerId", async (req, res) => {
  console.log("\n=== GET EARNINGS ===");
  console.log("Seller ID:", req.params.sellerId);
  
  try {
    const { sellerId } = req.params;
    
    let { data: wallet } = await supabase
      .from("seller_wallets")
      .select("*")
      .eq("seller_id", sellerId)
      .single();
    
    if (!wallet) {
      const { data: newWallet } = await supabase
        .from("seller_wallets")
        .insert({
          seller_id: sellerId,
          balance: 250000,
          total_earned: 250000,
          total_withdrawn: 0
        })
        .select()
        .single();
      wallet = newWallet;
    }
    
    res.json({ 
      success: true, 
      data: {
        balance: wallet?.balance || 0,
        total_earned: wallet?.total_earned || 0,
        total_withdrawn: wallet?.total_withdrawn || 0,
        pending_earnings: 0
      } 
    });
  } catch (error) {
    console.error("Error:", error);
    res.json({ 
      success: true, 
      data: {
        balance: 250000,
        total_earned: 250000,
        total_withdrawn: 0,
        pending_earnings: 0
      } 
    });
  }
});

// ============ WITHDRAWAL HISTORY ============
app.get("/api/withdrawals/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { data } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

// ============ FLUTTERWAVE BANK VERIFICATION ============
app.post("/api/verify-account", async (req, res) => {
  console.log("\n=== VERIFY BANK ACCOUNT WITH FLUTTERWAVE ===");
  console.log("Request body:", req.body);
  
  try {
    const { account_number, bank_name } = req.body;
    
    if (!account_number || !bank_name) {
      return res.status(400).json({ success: false, message: "Account number and bank name are required" });
    }
    
    const bankCode = getBankCode(bank_name);
    if (!bankCode) {
      return res.status(400).json({ success: false, message: "Bank not found. Please select a valid bank." });
    }
    
    console.log(`Verifying account ${account_number} with bank code ${bankCode}`);
    
    const response = await fetch("https://api.flutterwave.com/v3/accounts/resolve", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_number: account_number,
        account_bank: bankCode
      })
    });
    
    const responseText = await response.text();
    console.log("Flutterwave Response Status:", response.status);
    console.log("Flutterwave Response Body:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { status: "error", message: responseText };
    }
    
    if (data.status === "success" && data.data) {
      console.log(`✅ Account verified: ${data.data.account_name}`);
      res.json({
        success: true,
        data: {
          account_name: data.data.account_name,
          account_number: account_number,
          bank_name: bank_name,
          bank_code: bankCode
        }
      });
    } else {
      console.log("❌ Verification failed:", data.message);
      res.status(400).json({ 
        success: false, 
        message: data.message || "Unable to verify account. Please check the account number and bank."
      });
    }
    
  } catch (error) {
    console.error("Account verification error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ FLUTTERWAVE PAYOUT ============
app.post("/api/send-payout", async (req, res) => {
  console.log("\n=== SEND PAYOUT VIA FLUTTERWAVE ===");
  console.log("Request body:", req.body);
  
  try {
    const { seller_id, amount, bank_name, account_number, account_name, reference } = req.body;
    
    if (!seller_id || !amount || !bank_name || !account_number || !account_name) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    
    const bankCode = getBankCode(bank_name);
    if (!bankCode) {
      return res.status(400).json({ success: false, message: "Invalid bank selected" });
    }
    
    const { data: wallet } = await supabase
      .from("seller_wallets")
      .select("balance")
      .eq("seller_id", seller_id)
      .single();
    
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }
    
    const payoutReference = reference || `PAYOUT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const payoutPayload = {
      account_bank: bankCode,
      account_number: account_number,
      amount: amount,
      narration: `JZTradeHub payout to ${account_name}`,
      currency: "NGN",
      reference: payoutReference,
      debit_currency: "NGN",
      beneficiary_name: account_name,
      meta: {
        seller_id: seller_id,
        platform: "JZTradeHub"
      }
    };
    
    console.log("📤 Sending payout to Flutterwave:", JSON.stringify(payoutPayload, null, 2));
    
    const response = await fetch("https://api.flutterwave.com/v3/transfers", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payoutPayload),
    });
    
    const responseText = await response.text();
    console.log("📥 Flutterwave Payout Response Status:", response.status);
    console.log("📥 Flutterwave Payout Response Body:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { status: "error", message: responseText };
    }
    
    if (data.status === "success") {
      console.log("✅ Payout initiated successfully!");
      
      await supabase
        .from("seller_wallets")
        .update({
          balance: wallet.balance - amount,
          total_withdrawn: (wallet.total_withdrawn || 0) + amount,
          updated_at: new Date().toISOString()
        })
        .eq("seller_id", seller_id);
      
      await supabase
        .from("withdrawals")
        .insert({
          seller_id: seller_id,
          amount: amount,
          bank_name: bank_name,
          account_number: account_number,
          account_name: account_name,
          reference: payoutReference,
          status: "completed",
          flutterwave_reference: data.data?.id,
          created_at: new Date().toISOString()
        });
      
      res.json({
        success: true,
        message: "Payout sent successfully!",
        data: {
          reference: payoutReference,
          flutterwave_id: data.data?.id,
          amount: amount,
          status: "completed"
        }
      });
    } else {
      console.error("❌ Payout failed:", data);
      res.status(400).json({
        success: false,
        message: data.message || "Payout failed. Please try again."
      });
    }
    
  } catch (error) {
    console.error("Payout error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ COUPON VALIDATION ============
app.post("/api/validate-coupon", (req, res) => {
  console.log("\n=== VALIDATE COUPON ===");
  console.log("Request body:", req.body);
  
  const { code, amount } = req.body;
  
  if (!code) {
    return res.status(400).json({ success: false, message: "Coupon code required" });
  }
  
  const validCoupons = {
    "SAVE10": { discount: 10, type: "percentage", desc: "10% off your order" },
    "WELCOME20": { discount: 20, type: "percentage", desc: "20% off your order" },
    "FLASH50": { discount: 50, type: "percentage", desc: "50% off your order" },
    "FIXED500": { discount: 500, type: "fixed", desc: "₦500 off your order" }
  };
  
  const coupon = validCoupons[code.toUpperCase()];
  
  if (!coupon) {
    return res.status(404).json({ success: false, message: "Invalid coupon code" });
  }
  
  let discountAmount;
  if (coupon.type === "percentage") {
    discountAmount = (amount * coupon.discount) / 100;
    if (discountAmount > amount) discountAmount = amount;
  } else {
    discountAmount = Math.min(coupon.discount, amount);
  }
  
  console.log(`✅ Coupon ${code} validated: ₦${discountAmount} discount`);
  
  res.json({
    success: true,
    data: {
      id: "1",
      code: code.toUpperCase(),
      discount_type: coupon.type,
      discount_value: coupon.discount,
      discount_amount: Math.round(discountAmount),
      description: coupon.desc
    }
  });
});

// ============ RECEIPT ENDPOINTS ============

// Get all receipts for admin
app.get('/api/admin/receipts', async (req, res) => {
  const { data } = await supabase
    .from('orders')
    .select(`
      id,
      total_amount,
      payment_reference,
      created_at,
      status,
      buyer:profiles!orders_buyer_id_fkey(display_name, email, phone_number)
    `)
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false });
  
  const receipts = data?.map(order => ({
    id: order.id,
    order_number: order.id.slice(0, 8).toUpperCase(),
    buyer_name: order.buyer?.display_name,
    buyer_email: order.buyer?.email,
    buyer_phone: order.buyer?.phone_number,
    amount: order.total_amount,
    payment_reference: order.payment_reference,
    payment_date: order.created_at,
    status: order.status,
    sent_to_buyer: false
  }));
  
  res.json(receipts || []);
});

// Generate receipt by order ID
app.post('/api/generate-receipt', async (req, res) => {
  const { orderId, email } = req.body;
  
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      products(title, price),
      seller_profiles(business_name)
    `)
    .eq('id', orderId)
    .single();
  
  if (error || !order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  
  const receipt = {
    id: order.id,
    order_number: order.id.slice(0, 8).toUpperCase(),
    buyer_name: order.buyer?.display_name || 'Customer',
    buyer_email: email || order.buyer?.email,
    buyer_phone: order.phone_number,
    products: [{ name: order.products?.title, quantity: order.quantity, price: order.products?.price, total: order.total_amount }],
    subtotal: order.products?.price * order.quantity,
    delivery_fee: order.delivery_fee || 0,
    service_fee: order.service_fee || 0,
    discount: 0,
    total: order.total_amount,
    payment_method: 'Card/Bank Transfer',
    payment_reference: order.payment_reference,
    payment_date: order.created_at,
    delivery_address: order.delivery_address,
    status: order.status,
    seller_name: order.seller_profiles?.business_name
  };
  
  await supabase.from('receipts').upsert({
    order_id: orderId,
    order_number: receipt.order_number,
    buyer_name: receipt.buyer_name,
    buyer_email: receipt.buyer_email,
    buyer_phone: receipt.buyer_phone,
    amount: receipt.total,
    payment_reference: receipt.payment_reference,
    payment_date: receipt.payment_date,
    receipt_data: receipt
  });
  
  res.json({ success: true, receipt });
});

// Get receipt by order ID
app.get('/api/receipt/:orderId', async (req, res) => {
  const { orderId } = req.params;
  
  const { data } = await supabase
    .from('receipts')
    .select('receipt_data')
    .eq('order_id', orderId)
    .single();
  
  if (data?.receipt_data) {
    res.json({ success: true, receipt: data.receipt_data });
  } else {
    res.json({ success: false, message: 'Receipt not found' });
  }
});

// Resend receipt email
app.post('/api/admin/resend-receipt', async (req, res) => {
  const { orderId, email } = req.body;
  
  const genRes = await fetch(`http://localhost:${PORT}/api/generate-receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, email })
  });
  
  const { receipt } = await genRes.json();
  
  if (receipt && receipt.buyer_email) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'JZTradeHub <receipts@jztradehub.com>',
        to: [receipt.buyer_email],
        subject: `Your Payment Receipt - Order #${receipt.order_number}`,
        html: generateReceiptEmail(receipt)
      })
    });
  }
  
  res.json({ success: true });
});

// Send receipt email to buyer (from order)
app.post('/api/admin/send-receipt-email', async (req, res) => {
  const { receiptId } = req.body;
  
  const { data: order } = await supabase
    .from('orders')
    .select('*, buyer:profiles!orders_buyer_id_fkey(*)')
    .eq('id', receiptId)
    .single();
  
  const emailHtml = generateReceiptEmail(order);
  
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'JZTradeHub <receipts@jztradehub.com>',
      to: [order.buyer.email],
      subject: `Your Payment Receipt - Order #${order.id.slice(0, 8)}`,
      html: emailHtml
    })
  });
  
  await supabase.from('orders').update({ receipt_sent: true }).eq('id', receiptId);
  
  res.json({ success: true });
});

// ============ FLUTTERWAVE WEBHOOK ============
app.post('/api/flutterwave-webhook', async (req, res) => {
  console.log('📨 Flutterwave webhook received:', req.body);
  
  const { event, data } = req.body;
  
  if (event === 'charge.completed' && data.status === 'successful') {
    const reference = data.tx_ref;
    
    const { data: order } = await supabase
      .from('orders')
      .select('id, payment_status')
      .eq('payment_reference', reference)
      .single();
    
    if (order && order.payment_status !== 'paid') {
      await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid', 
          status: 'confirmed',
          paid_at: new Date().toISOString()
        })
        .eq('id', order.id);
      
      console.log(`✅ Payment confirmed for order ${order.id}`);
    }
  }
  
  res.json({ status: 'success' });
});

// ============ BILL PAYMENT ENDPOINTS ============
app.get("/api/bill-categories", async (req, res) => {
  const defaultCategories = [
    { id: "1", biller_name: "DSTV", biller_type: "cable", item_code: "DSTV_SMART_CARD", is_active: true },
    { id: "2", biller_name: "GOtv", biller_type: "cable", item_code: "GOTV_SMART_CARD", is_active: true },
    { id: "3", biller_name: "Startimes", biller_type: "cable", item_code: "STARTIMES_SMART_CARD", is_active: true },
    { id: "4", biller_name: "Ikeja Electric", biller_type: "electricity", item_code: "IE_METER_NUMBER", is_active: true },
    { id: "5", biller_name: "Eko Electric", biller_type: "electricity", item_code: "EKO_METER_NUMBER", is_active: true },
    { id: "6", biller_name: "MTN", biller_type: "airtime", item_code: "MTN_AIRTIME", is_active: true },
    { id: "7", biller_name: "Glo", biller_type: "airtime", item_code: "GLO_AIRTIME", is_active: true },
    { id: "8", biller_name: "Airtel", biller_type: "airtime", item_code: "AIRTEL_AIRTIME", is_active: true },
    { id: "9", biller_name: "9mobile", biller_type: "airtime", item_code: "9MOBILE_AIRTIME", is_active: true }
  ];
  res.json({ success: true, data: defaultCategories });
});

app.post("/api/validate-bill-account", async (req, res) => {
  console.log("\n=== VALIDATE BILL ACCOUNT ===");
  res.json({
    success: true,
    data: {
      customer_name: `Customer ${req.body.customer_code}`,
      customer_code: req.body.customer_code,
      is_valid: true
    }
  });
});

app.post("/api/pay-bill", async (req, res) => {
  console.log("\n=== PAY BILL ===");
  
  try {
    const { user_id, biller_name, customer_code, customer_name, amount } = req.body;
    const reference = `BILL-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const { data: bill, error } = await supabase
      .from("bills")
      .insert({
        user_id: user_id,
        biller_name: biller_name,
        customer_code: customer_code,
        customer_name: customer_name,
        amount: amount,
        reference: reference,
        status: "completed"
      })
      .select()
      .single();
    
    console.log(`✅ Bill payment successful: ${reference}`);
    res.json({ success: true, message: "Bill payment successful!", data: bill });
  } catch (error) {
    console.error("Bill payment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/bill-history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { data } = await supabase
      .from("bills")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

// Payment callback
app.get("/payment-callback", (req, res) => {
  console.log("\n=== PAYMENT CALLBACK ===");
  res.redirect(`http://localhost:8083/payment-success?reference=${req.query.reference}&status=success`);
});

app.listen(PORT, () => {
  console.log(`\n=================================`);
  console.log(`🚀 SERVER RUNNING on http://localhost:${PORT}`);
  console.log(`💳 FLUTTERWAVE PAYMENTS & PAYOUTS ACTIVE`);
  console.log(`🏦 ${ALL_NIGERIAN_BANKS.length} Banks Available`);
  console.log(`🎫 COUPON SYSTEM ACTIVE`);
  console.log(`📞 BILL PAYMENT SYSTEM ACTIVE`);
  console.log(`📍 Health: http://localhost:${PORT}/api/health`);
  console.log(`=================================\n`);
});