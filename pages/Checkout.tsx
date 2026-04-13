import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ShoppingCart, ArrowLeft, Shield, Truck, Clock, CheckCircle2, Building2, CreditCard, Package, Sparkles, Zap, Phone, Tag, X } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  seller_id: string;
  category: string;
  brand: string | null;
}

interface DeliveryOption {
  id: string;
  name: string;
  fee: number;
  estimated_days: string;
  is_active: boolean;
}

interface CouponInfo {
  id: string;
  code: string;
  discountAmount: number;
  discountValue: number;
  discountType: string;
  description: string;
}

const API_URL = "http://localhost:5000";

const Checkout = () => {
  const { productId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState<string>("standard");
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([
    { id: "standard", name: "Standard Delivery", fee: 1500, estimated_days: "3-5 business days", is_active: true },
    { id: "express", name: "Express Delivery", fee: 3000, estimated_days: "1-2 business days", is_active: true },
  ]);
  const [sellerProfile, setSellerProfile] = useState<{ business_name: string } | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Coupon states
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponInfo | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponMsg, setCouponMsg] = useState("");

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();
      
      if (error) throw error;
      setProduct(data);
      
      const { data: sellerData } = await supabase
        .from("seller_profiles")
        .select("business_name")
        .eq("user_id", data.seller_id)
        .single();
      
      if (sellerData) {
        setSellerProfile(sellerData);
      }
      
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product");
      navigate("/marketplace");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    if (!product) return;
    
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find((item: any) => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity = Math.min(existingItem.quantity + itemQuantity, product.stock_quantity);
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image_url: product.image_url,
        quantity: itemQuantity,
        stock_quantity: product.stock_quantity,
        seller_id: product.seller_id,
      });
    }
    
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    toast.success("Added to cart!");
  };

  const getDeliveryOption = () => {
    return deliveryOptions.find(opt => opt.id === selectedDelivery);
  };

  const getOrderTotal = () => {
    const subtotal = product ? product.price * itemQuantity : 0;
    const serviceCharge = subtotal * 0.05;
    const deliveryOption = getDeliveryOption();
    const deliveryCost = deliveryOption?.fee || 0;
    const beforeDiscount = subtotal + serviceCharge + deliveryCost;
    const discount = appliedCoupon?.discountAmount || 0;
    const finalAmount = beforeDiscount - discount;
    
    return { subtotal, serviceCharge, deliveryCost, beforeDiscount, discount, finalAmount };
  };

  const formatPhone = (phone: string): string => {
    let formatted = phone.trim().replace(/\s/g, '');
    if (formatted.startsWith('+234')) {
      formatted = '0' + formatted.slice(4);
    }
    if (!formatted.startsWith('0')) {
      formatted = '0' + formatted;
    }
    if (formatted.length > 11) {
      formatted = formatted.slice(0, 11);
    }
    return formatted;
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    
    setIsApplyingCoupon(true);
    setCouponMsg("");
    
    try {
      const { subtotal, serviceCharge, deliveryCost } = getOrderTotal();
      const orderValue = subtotal + serviceCharge + deliveryCost;
      
      const response = await fetch(`${API_URL}/api/validate-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, amount: orderValue })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAppliedCoupon({
          id: result.data.id,
          code: result.data.code,
          discountAmount: result.data.discount_amount,
          discountValue: result.data.discount_value,
          discountType: result.data.discount_type,
          description: result.data.description
        });
        toast.success(`Coupon applied! You saved ₦${result.data.discount_amount.toLocaleString()}`);
      } else {
        setCouponMsg(result.message);
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Coupon error:", error);
      setCouponMsg("Failed to validate coupon");
      toast.error("Failed to validate coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponInput("");
    setAppliedCoupon(null);
    setCouponMsg("");
    toast.info("Coupon removed");
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    
    if (!product) {
      toast.error("Product not found");
      return;
    }
    
    if (!deliveryAddress.trim()) {
      toast.error("Please enter delivery address");
      return;
    }
    
    if (!phoneNumber.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    const cleanedPhone = formatPhone(phoneNumber);
    if (cleanedPhone.length < 10) {
      toast.error("Please enter a valid phone number (e.g., 08012345678)");
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast.info("Please sign in to continue");
        navigate("/auth", { state: { from: `/checkout/${productId}` } });
        return;
      }

      const deliveryOption = getDeliveryOption();
      const { subtotal, serviceCharge, deliveryCost, finalAmount } = getOrderTotal();
      
      console.log("Creating order...");
      
      const orderRes = await fetch(`${API_URL}/api/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: currentUser.id,
          seller_id: product.seller_id,
          product_id: product.id,
          quantity: itemQuantity,
          product_price: product.price,
          delivery_address: deliveryAddress,
          delivery_option: selectedDelivery,
          delivery_name: deliveryOption?.name,
          delivery_fee: deliveryCost,
          service_fee: serviceCharge,
          phone_number: cleanedPhone,
          coupon_code: appliedCoupon?.code,
          coupon_discount: appliedCoupon?.discountAmount || 0
        })
      });
      
      if (!orderRes.ok) {
        throw new Error(`Order creation failed: ${orderRes.status}`);
      }
      
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.message);
      
      console.log("Order created:", orderData.orderId);
      console.log("Initializing payment for ₦" + finalAmount);
      
      const paymentRes = await fetch(`${API_URL}/api/initialize-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          email: currentUser.email,
          name: currentUser.user_metadata?.display_name || currentUser.email.split('@')[0],
          orderId: orderData.orderId,
          phone: cleanedPhone
        })
      });
      
      const paymentData = await paymentRes.json();
      
      if (!paymentData.success) {
        throw new Error(paymentData.message || "Payment initialization failed");
      }
      
      window.location.href = paymentData.data.checkout_url;
      
if (paymentData.success && paymentData.data?.checkout_url) {
  console.log("Redirecting to Flutterwave...");
  // Redirect to Flutterwave payment page
  window.location.href = paymentData.data.checkout_url;
} else {
  throw new Error(paymentData.message || "Payment initialization failed");
}
    } catch (error: any) {
      console.error("Checkout error:", error);
      const errorMsg = error.message || "Failed to process payment. Please try again.";
      setPaymentError(errorMsg);
      toast.error(errorMsg);
      setIsProcessing(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }
  
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  const { subtotal, serviceCharge, deliveryCost, finalAmount, discount } = getOrderTotal();
  const deliveryOption = getDeliveryOption();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Header />
      <div className="container px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back
          </Button>
          
          {paymentError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-center">
              <p className="font-medium">Payment Error</p>
              <p className="text-sm">{paymentError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 border-red-500/50 text-red-600 hover:bg-red-500/10"
                onClick={() => setPaymentError(null)}
              >
                Dismiss
              </Button>
            </div>
          )}
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Card */}
              <Card className="glass-strong overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-6 p-6">
                  <div className="w-full sm:w-32 h-32 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-2">{product.title}</h2>
                    {product.brand && (
                      <p className="text-sm text-muted-foreground mb-1">Brand: {product.brand}</p>
                    )}
                    {product.category && (
                      <p className="text-sm text-muted-foreground mb-1">Category: {product.category}</p>
                    )}
                    {sellerProfile && (
                      <p className="text-sm text-muted-foreground mb-3">
                        Sold by: <span className="text-primary">{sellerProfile.business_name}</span>
                      </p>
                    )}
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-bold text-primary">
                        ₦{product.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Quantity */}
              <Card className="glass-strong">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Quantity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                      disabled={itemQuantity <= 1}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max={product.stock_quantity}
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.min(parseInt(e.target.value) || 1, product.stock_quantity))}
                      className="w-20 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setItemQuantity(Math.min(itemQuantity + 1, product.stock_quantity))}
                      disabled={itemQuantity >= product.stock_quantity}
                    >
                      +
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {product.stock_quantity} available
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Options */}
              <Card className="glass-strong">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    Delivery Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    {deliveryOptions.filter(opt => opt.is_active).map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedDelivery === option.id
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="deliveryOption"
                          value={option.id}
                          checked={selectedDelivery === option.id}
                          onChange={() => setSelectedDelivery(option.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {option.name.includes("Standard") && <Truck className="w-4 h-4 text-primary" />}
                            {option.name.includes("Express") && <Zap className="w-4 h-4 text-orange-500" />}
                            <span className="font-semibold">{option.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Estimated delivery: {option.estimated_days}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            ₦{option.fee.toLocaleString()}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Address & Phone */}
              <Card className="glass-strong">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Delivery Address *</Label>
                    <Textarea
                      placeholder="Enter your complete delivery address (Street, City, State, Landmark)"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      rows={4}
                      required
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number *
                    </Label>
                    <Input
                      type="tel"
                      placeholder="e.g., 08012345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Required for delivery updates and payment verification
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Coupon Code Section */}
              <Card className="glass-strong">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary" />
                    Coupon Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <div>
                        <p className="font-semibold text-green-600">Coupon Applied!</p>
                        <p className="text-sm text-green-600">
                          {appliedCoupon.code} - Saved ₦{appliedCoupon.discountAmount.toLocaleString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} className="text-red-500">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="flex-1"
                      />
                      <Button onClick={handleApplyCoupon} disabled={isApplyingCoupon} variant="outline">
                        {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                  )}
                  {couponMsg && (
                    <p className="text-sm text-red-500 mt-2">{couponMsg}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <Card className="glass-strong">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal ({itemQuantity} items)</span>
                        <span>₦{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Service Fee (5%)</span>
                        <span>₦{serviceCharge.toLocaleString()}</span>
                      </div>
                      {deliveryOption && (
                        <div className="flex justify-between text-sm">
                          <span>{deliveryOption.name}</span>
                          <span>₦{deliveryCost.toLocaleString()}</span>
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Coupon Discount</span>
                          <span>-₦{discount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">₦{finalAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="bg-primary/5 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-primary">
                        <CreditCard className="w-4 h-4" />
                        <span className="text-sm font-semibold">Secure Payment via Flutterwave</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Pay securely with Card, Bank Transfer, or USSD
                      </p>
                    </div>

                    {/* Escrow Protection */}
                    <div className="bg-primary/5 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-primary">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-semibold">Escrow Protection Active</span>
                        <Sparkles className="w-3 h-3 text-accent" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your payment is held securely until you confirm delivery.
                      </p>
                    </div>

                    <Button
                      onClick={handleCheckout}
                      disabled={isProcessing || product.stock_quantity === 0 || !deliveryAddress || !phoneNumber}
                      className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay ₦{finalAmount.toLocaleString()} with Flutterwave
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={addToCart}
                      className="w-full"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>

                {/* Trust Badges */}
                <Card className="glass-strong">
                  <CardContent className="p-4">
                    <div className="flex justify-around">
                      <div className="text-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Secure Checkout</p>
                      </div>
                      <div className="text-center">
                        <Shield className="w-5 h-5 text-primary mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Buyer Protection</p>
                      </div>
                      <div className="text-center">
                        <Building2 className="w-5 h-5 text-secondary mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Verified Sellers</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;