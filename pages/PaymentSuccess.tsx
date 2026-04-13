import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, Package, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Receipt from "@/components/Receipt";
import confetti from "canvas-confetti";

const API_URL = "http://localhost:5000";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const reference = searchParams.get("reference");
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (reference) {
      verifyPayment();
      triggerConfetti();
    }
  }, [reference]);

  const triggerConfetti = () => {
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#10b981', '#3b82f6', '#8b5cf6'] });
    setTimeout(() => {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.5, x: 0.3 } });
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.5, x: 0.7 } });
    }, 200);
  };

  const verifyPayment = async () => {
    try {
      const response = await fetch(`${API_URL}/api/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, orderId })
      });
      const data = await response.json();
      
      if (data.success && data.paid) {
        setSuccess(true);
        await fetchOrderDetails();
      }
    } catch (error) {
      console.error("Verification error:", error);
    } finally {
      setVerifying(false);
    }
  };

  const fetchOrderDetails = async () => {
    if (orderId) {
      const { data: order } = await supabase
        .from("orders")
        .select(`
          *,
          products(title, price),
          seller_profiles(business_name),
          buyer:profiles!orders_buyer_id_fkey(id, display_name, email, phone_number)
        `)
        .eq("id", orderId)
        .single();
      
      if (order) {
        // Format order details for receipt
        const receiptData = {
          id: order.id,
          order_number: order.id.slice(0, 8).toUpperCase(),
          buyer_name: order.buyer?.display_name || "Customer",
          buyer_email: order.buyer?.email || "",
          buyer_phone: order.phone_number || "",
          buyer_address: order.delivery_address,
          products: [{
            name: order.products?.title,
            quantity: order.quantity,
            price: order.products?.price,
            total: order.total_amount
          }],
          subtotal: order.total_amount - (order.delivery_fee + order.service_fee),
          delivery_fee: order.delivery_fee,
          service_fee: order.service_fee,
          discount: 0,
          total: order.total_amount,
          payment_method: "Card/Bank Transfer",
          payment_reference: order.payment_reference,
          payment_date: order.paid_at || order.created_at,
          delivery_address: order.delivery_address,
          status: order.status,
          seller_name: order.seller_profiles?.business_name || "JZTradeHub Seller"
        };
        setOrderDetails(receiptData);
      }
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold">Verifying Your Payment...</h2>
        </div>
      </div>
    );
  }

  if (!success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-red-500/10">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <CardTitle className="text-2xl">Payment Verification Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-6">
              We couldn't verify your payment. Please contact support.
            </p>
            <Button onClick={() => navigate("/")} className="w-full">Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-8">
      {orderDetails && <Receipt order={orderDetails} />}
      <div className="text-center mt-6">
        <Button variant="outline" onClick={() => navigate("/buyer")} className="gap-2">
          <ShoppingBag className="w-4 h-4" />
          Go to My Orders
        </Button>
      </div>
    </div>
  );
};

const XCircle = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default PaymentSuccess;