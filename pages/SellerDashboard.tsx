import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import SellerWithdrawal from "@/components/SellerWithdrawal";
import {
  Store,
  Package,
  DollarSign,
  TrendingUp,
  Plus,
  Building2,
  ArrowLeft,
  Truck,
  CheckCircle,
  Edit,
  Trash2,
  Save,
  X,
  Clock,
  Zap,
  Shield,
  Eye,
  Star,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DeliveryOption {
  id: string;
  name: string;
  fee: number;
  estimated_days: string;
  is_active: boolean;
  description?: string;
}

interface Order {
  id: string;
  total_amount: number;
  quantity: number;
  status: string;
  payment_status: string;
  delivery_address: string;
  created_at: string;
  product_id: string;
  buyer_id: string;
  products?: {
    title: string;
    image_url: string;
    price: number;
  };
  buyer?: {
    display_name: string;
  };
}

const SellerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [isSettingUpBusiness, setIsSettingUpBusiness] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    averageRating: 0,
    totalCustomers: 0,
  });
  
  // Delivery options state
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([
    { 
      id: "standard", 
      name: "Standard Delivery", 
      fee: 1500, 
      estimated_days: "3-5 business days", 
      is_active: true,
      description: "Regular delivery via our logistics partners"
    },
    { 
      id: "express", 
      name: "Express Delivery", 
      fee: 3000, 
      estimated_days: "1-2 business days", 
      is_active: true,
      description: "Fast delivery for urgent orders"
    },
    { 
      id: "same_day", 
      name: "Same Day Delivery", 
      fee: 5000, 
      estimated_days: "Same day (order before 12pm)", 
      is_active: false,
      description: "Get your order delivered today"
    },
  ]);
  const [editingDeliveryId, setEditingDeliveryId] = useState<string | null>(null);
  const [tempDeliveryOption, setTempDeliveryOption] = useState<DeliveryOption | null>(null);
  const [showAddDelivery, setShowAddDelivery] = useState(false);
  const [newDeliveryOption, setNewDeliveryOption] = useState<DeliveryOption>({
    id: `delivery_${Date.now()}`,
    name: "",
    fee: 0,
    estimated_days: "",
    is_active: true,
    description: "",
  });
  
  const [businessData, setBusinessData] = useState({
    businessName: "",
    businessDescription: "",
    businessAddress: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  useEffect(() => {
    if (user) {
      fetchSellerProfile();
      fetchOrders();
      fetchStats();
      fetchDeliveryOptions();
      
      // Subscribe to new orders in realtime
      const ordersSubscription = supabase
        .channel('seller-orders')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `seller_id=eq.${user.id}`
          },
          (payload) => {
            console.log("📦 New order received!", payload);
            fetchOrders();
            fetchStats();
            toast.success("🎉 New order received!");
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `seller_id=eq.${user.id}`
          },
          (payload) => {
            console.log("📝 Order updated!", payload);
            fetchOrders();
            fetchStats();
          }
        )
        .subscribe();
      
      return () => {
        ordersSubscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchDeliveryOptions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("seller_profiles")
      .select("delivery_options")
      .eq("user_id", user.id)
      .single();

    if (!error && data?.delivery_options) {
      let options = data.delivery_options;
      if (typeof options === 'string') {
        options = JSON.parse(options);
      }
      if (options && options.length > 0) {
        setDeliveryOptions(options);
      }
    }
  };

  const saveDeliveryOptions = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("seller_profiles")
        .update({ delivery_options: deliveryOptions })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Delivery options saved successfully!");
    } catch (error: any) {
      console.error("Error saving delivery options:", error);
      toast.error(error.message || "Failed to save delivery options");
    }
  };

  const handleEditDelivery = (option: DeliveryOption) => {
    setEditingDeliveryId(option.id);
    setTempDeliveryOption({ ...option });
  };

  const handleSaveDelivery = () => {
    if (tempDeliveryOption) {
      setDeliveryOptions(prev => prev.map(opt => 
        opt.id === tempDeliveryOption.id ? tempDeliveryOption : opt
      ));
      setEditingDeliveryId(null);
      setTempDeliveryOption(null);
      toast.success("Delivery option updated");
    }
  };

  const handleCancelEdit = () => {
    setEditingDeliveryId(null);
    setTempDeliveryOption(null);
  };

  const handleToggleActive = (optionId: string) => {
    setDeliveryOptions(prev => prev.map(opt =>
      opt.id === optionId ? { ...opt, is_active: !opt.is_active } : opt
    ));
  };

  const handleDeleteDelivery = (optionId: string) => {
    if (deliveryOptions.length <= 1) {
      toast.error("You must have at least one delivery option");
      return;
    }
    setDeliveryOptions(prev => prev.filter(opt => opt.id !== optionId));
    toast.success("Delivery option removed");
  };

  const handleAddDelivery = () => {
    if (!newDeliveryOption.name || newDeliveryOption.fee <= 0 || !newDeliveryOption.estimated_days) {
      toast.error("Please fill all required fields");
      return;
    }
    setDeliveryOptions(prev => [...prev, { ...newDeliveryOption, id: `delivery_${Date.now()}` }]);
    setNewDeliveryOption({
      id: `delivery_${Date.now()}`,
      name: "",
      fee: 0,
      estimated_days: "",
      is_active: true,
      description: "",
    });
    setShowAddDelivery(false);
    toast.success("Delivery option added");
  };

  const fetchOrders = async () => {
    if (!user) return;

    try {
      console.log("🔄 Fetching orders for seller:", user.id);

      // First, get all orders for this seller
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
        return;
      }

      if (!ordersData || ordersData.length === 0) {
        console.log("No orders found");
        setOrders([]);
        return;
      }

      console.log(`📦 Found ${ordersData.length} orders`);

      // Get product details for each order
      const productIds = [...new Set(ordersData.map(o => o.product_id))];
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, title, image_url, price")
        .in("id", productIds);

      if (productsError) {
        console.error("Error fetching products:", productsError);
      }

      const productMap = new Map(productsData?.map(p => [p.id, p]) || []);

      // Get buyer details for each order
      const buyerIds = [...new Set(ordersData.map(o => o.buyer_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", buyerIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }

      const profileMap = new Map(profilesData?.map(p => [p.id, p.display_name]) || []);

      // Combine data
      const ordersWithDetails = ordersData.map(order => ({
        ...order,
        products: productMap.get(order.product_id),
        buyer: { display_name: profileMap.get(order.buyer_id) || "Unknown" }
      }));

      setOrders(ordersWithDetails);
      
      // Update stats
      const totalRevenue = ordersWithDetails.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const pendingOrders = ordersWithDetails.filter(o => o.status === 'pending' && o.payment_status === 'paid').length;
      
      setStats(prev => ({
        ...prev,
        totalOrders: ordersWithDetails.length,
        totalRevenue,
        pendingOrders
      }));

    } catch (error) {
      console.error("Error in fetchOrders:", error);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", user.id);

      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("seller_id", user.id);

      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("seller_id", user.id);

      const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const pendingOrders = ordersData?.filter(o => o.status === 'pending' && o.payment_status === 'paid').length || 0;
      const completedOrders = ordersData?.filter(o => o.status === 'completed').length || 0;
      const averageRating = reviews?.length 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;
      const uniqueBuyers = new Set(ordersData?.map(o => o.buyer_id)).size;

      setStats({
        totalProducts: products?.length || 0,
        totalOrders: ordersData?.length || 0,
        totalRevenue,
        pendingOrders,
        completedOrders,
        averageRating,
        totalCustomers: uniqueBuyers,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchSellerProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("seller_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setSellerProfile(data);
      setBusinessData({
        businessName: data.business_name,
        businessDescription: data.business_description || "",
        businessAddress: data.business_address || "",
        bankName: data.bank_name || "",
        accountNumber: data.account_number || "",
        accountName: data.account_name || "",
      });
    } else {
      setIsSettingUpBusiness(true);
    }
  };

  const handleSaveBusinessInfo = async () => {
    if (!user) return;

    if (!businessData.businessName.trim()) {
      toast.error("Business name is required");
      return;
    }
// Add this useEffect in both dashboards
useEffect(() => {
  // Subscribe to order updates
  const channel = supabase
    .channel('order-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `buyer_id=eq.${user?.id}`, // For buyer dashboard
        // or `seller_id=eq.${user?.id}` for seller dashboard
      },
      (payload) => {
        console.log('Order updated:', payload);
        fetchOrders(); // Refresh orders
        fetchStats(); // Refresh stats
        if (payload.new.payment_status === 'paid') {
          toast.success('Payment confirmed! Your order is now processing.');
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user]);
    try {
      if (sellerProfile) {
        const { error } = await supabase
          .from("seller_profiles")
          .update({
            business_name: businessData.businessName,
            business_description: businessData.businessDescription,
            business_address: businessData.businessAddress,
            bank_name: businessData.bankName,
            account_number: businessData.accountNumber,
            account_name: businessData.accountName,
          })
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success("Business info updated!");
      } else {
        const { error } = await supabase.from("seller_profiles").insert({
          user_id: user.id,
          business_name: businessData.businessName,
          business_description: businessData.businessDescription,
          business_address: businessData.businessAddress,
          bank_name: businessData.bankName,
          account_number: businessData.accountNumber,
          account_name: businessData.accountName,
          delivery_options: deliveryOptions,
        });

        if (error) throw error;
        toast.success("Business profile created!");
        setIsSettingUpBusiness(false);
      }

      fetchSellerProfile();
      saveDeliveryOptions();
    } catch (error: any) {
      toast.error(error.message || "Failed to save business info");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId)
        .eq("seller_id", user?.id);

      if (error) throw error;

      toast.success(`Order marked as ${status}`);
      
      const emailType = status === 'shipped' ? 'order_shipped' : 
                        status === 'delivered' ? 'order_completed' : 
                        status === 'confirmed' ? 'order_confirmed' : null;
      
      if (emailType) {
        supabase.functions.invoke('send-order-email', {
          body: { orderId, type: emailType }
        }).catch(console.error);
      }
      
      fetchOrders();
      fetchStats();
    } catch (error: any) {
      console.error("Failed to update order:", error);
      toast.error("Failed to update order status");
    }
  };

  if (isSettingUpBusiness || !sellerProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <Header />
        <div className="container px-4 py-8">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <Card className="glass-strong p-8 max-w-2xl mx-auto animate-scale-in">
            <div className="text-center mb-8">
              <div className="inline-flex p-4 rounded-2xl bg-secondary/10 mb-4">
                <Building2 className="w-8 h-8 text-secondary" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Set Up Your Business</h1>
              <p className="text-muted-foreground">
                Tell us about your business to start selling on JZTradeHub
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="Your Business Name"
                  value={businessData.businessName}
                  onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
                  className="glass"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessDescription">Business Description</Label>
                <Textarea
                  id="businessDescription"
                  placeholder="Describe what you sell..."
                  value={businessData.businessDescription}
                  onChange={(e) => setBusinessData({ ...businessData, businessDescription: e.target.value })}
                  className="glass min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAddress">Business Address</Label>
                <Textarea
                  id="businessAddress"
                  placeholder="Your business address..."
                  value={businessData.businessAddress}
                  onChange={(e) => setBusinessData({ ...businessData, businessAddress: e.target.value })}
                  className="glass"
                />
              </div>

              <Button onClick={handleSaveBusinessInfo} size="lg" className="w-full">
                Create Business Profile
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Header />
      <div className="container px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-secondary/10">
              <Store className="w-8 h-8 text-secondary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">{sellerProfile.business_name}</h1>
              <p className="text-muted-foreground">Manage your store and products</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/products")} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
            <Button variant="outline" onClick={() => navigate("/marketplace")} className="gap-2">
              <Eye className="w-4 h-4" />
              View Store
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-strong p-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Products</p>
                <p className="text-3xl font-bold">{stats.totalProducts}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="glass-strong p-4 animate-scale-in" style={{ animationDelay: "0.05s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                <p className="text-3xl font-bold">{stats.totalOrders}</p>
                {stats.pendingOrders > 0 && (
                  <p className="text-xs text-amber-500 mt-1">{stats.pendingOrders} pending</p>
                )}
              </div>
              <div className="p-3 rounded-xl bg-accent/10">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
            </div>
          </Card>

          <Card className="glass-strong p-4 animate-scale-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Revenue</p>
                <p className="text-3xl font-bold">₦{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/10">
                <DollarSign className="w-5 h-5 text-secondary" />
              </div>
            </div>
          </Card>

          <Card className="glass-strong p-4 animate-scale-in" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rating</p>
                <div className="flex items-center gap-1">
                  <span className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</span>
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="glass-strong flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="gap-1">
              <Store className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="withdrawal" className="gap-1">
              <Wallet className="w-4 h-4" />
              Withdrawal
            </TabsTrigger>
            <TabsTrigger value="delivery" className="gap-1">
              <Truck className="w-4 h-4" />
              Delivery
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1">
              <Package className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="business" className="gap-1">
              <Building2 className="w-4 h-4" />
              Business Info
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="glass-strong p-6">
              <h2 className="text-2xl font-bold mb-4">Quick Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-primary/5">
                  <p className="text-2xl font-bold text-primary">{stats.totalProducts}</p>
                  <p className="text-sm text-muted-foreground">Products</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-accent/5">
                  <p className="text-2xl font-bold text-accent">{stats.totalOrders}</p>
                  <p className="text-sm text-muted-foreground">Orders</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-secondary/5">
                  <p className="text-2xl font-bold text-secondary">₦{stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-yellow-500/5">
                  <p className="text-2xl font-bold text-yellow-500">{stats.totalCustomers}</p>
                  <p className="text-sm text-muted-foreground">Customers</p>
                </div>
              </div>
            </Card>

            <Card className="glass-strong p-6">
              <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button size="lg" className="h-auto py-4" onClick={() => navigate("/products")}>
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Product
                </Button>
                <Button size="lg" variant="outline" className="h-auto py-4" onClick={() => navigate("/marketplace")}>
                  <Eye className="w-5 h-5 mr-2" />
                  View Marketplace
                </Button>
                <Button size="lg" variant="outline" className="h-auto py-4" onClick={() => navigate("/disputes")}>
                  <Shield className="w-5 h-5 mr-2" />
                  View Disputes
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Withdrawal Tab */}
          <TabsContent value="withdrawal">
            <SellerWithdrawal />
          </TabsContent>

          {/* Delivery Options Tab */}
          <TabsContent value="delivery">
            <Card className="glass-strong p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Truck className="w-6 h-6 text-primary" />
                    Delivery Options
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set delivery methods and fees for your products. Buyers will see these at checkout.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={saveDeliveryOptions}>
                    <Save className="w-4 h-4 mr-2" />
                    Save All
                  </Button>
                  <Button size="sm" onClick={() => setShowAddDelivery(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {deliveryOptions.map((option) => (
                  <div
                    key={option.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300 bg-background/30"
                  >
                    {editingDeliveryId === option.id ? (
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <Input
                          value={tempDeliveryOption?.name || ""}
                          onChange={(e) => setTempDeliveryOption(prev => prev ? { ...prev, name: e.target.value } : null)}
                          placeholder="Option name"
                          className="glass"
                        />
                        <Input
                          type="number"
                          value={tempDeliveryOption?.fee || 0}
                          onChange={(e) => setTempDeliveryOption(prev => prev ? { ...prev, fee: parseInt(e.target.value) || 0 } : null)}
                          placeholder="Fee (₦)"
                          className="glass"
                        />
                        <Input
                          value={tempDeliveryOption?.estimated_days || ""}
                          onChange={(e) => setTempDeliveryOption(prev => prev ? { ...prev, estimated_days: e.target.value } : null)}
                          placeholder="Est. delivery time"
                          className="glass"
                        />
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={tempDeliveryOption?.is_active || false}
                            onCheckedChange={(checked) => setTempDeliveryOption(prev => prev ? { ...prev, is_active: checked } : null)}
                          />
                          <span className="text-xs text-muted-foreground">Active</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            {option.name.includes("Standard") && <Truck className="w-4 h-4 text-primary" />}
                            {option.name.includes("Express") && <Zap className="w-4 h-4 text-orange-500" />}
                            {option.name.includes("Same Day") && <Clock className="w-4 h-4 text-purple-500" />}
                            <span className="font-semibold text-lg">{option.name}</span>
                          </div>
                          <Badge variant={option.is_active ? "default" : "secondary"} className="gap-1">
                            {option.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-primary font-bold">₦{option.fee.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground">• {option.estimated_days}</span>
                        </div>
                        {option.description && (
                          <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 justify-end">
                      {editingDeliveryId === option.id ? (
                        <>
                          <Button size="sm" onClick={handleSaveDelivery}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(option.id)}
                            className={option.is_active ? "text-green-500" : "text-muted-foreground"}
                          >
                            {option.is_active ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEditDelivery(option)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDeleteDelivery(option.id)}
                            disabled={deliveryOptions.length <= 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Delivery Dialog */}
              <Dialog open={showAddDelivery} onOpenChange={setShowAddDelivery}>
                <DialogContent className="glass-strong">
                  <DialogHeader>
                    <DialogTitle>Add Delivery Option</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Option Name *</Label>
                      <Input
                        placeholder="e.g., Standard Delivery, Express Delivery"
                        value={newDeliveryOption.name}
                        onChange={(e) => setNewDeliveryOption(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Delivery Fee (₦) *</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 1500"
                        value={newDeliveryOption.fee || ""}
                        onChange={(e) => setNewDeliveryOption(prev => ({ ...prev, fee: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated Delivery Time *</Label>
                      <Input
                        placeholder="e.g., 3-5 business days"
                        value={newDeliveryOption.estimated_days}
                        onChange={(e) => setNewDeliveryOption(prev => ({ ...prev, estimated_days: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (Optional)</Label>
                      <Textarea
                        placeholder="Describe this delivery option..."
                        value={newDeliveryOption.description}
                        onChange={(e) => setNewDeliveryOption(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newDeliveryOption.is_active}
                        onCheckedChange={(checked) => setNewDeliveryOption(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label>Active</Label>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleAddDelivery} className="flex-1">Add Option</Button>
                      <Button variant="outline" onClick={() => setShowAddDelivery(false)} className="flex-1">Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="glass-strong p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Package className="w-6 h-6 text-primary" />
                  Orders ({orders.length})
                </h2>
                <Badge variant="outline" className="gap-1">
                  {stats.pendingOrders} Pending
                </Badge>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No orders yet</p>
                  <p className="text-sm mt-2">When customers place orders, they will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="glass p-4 rounded-xl hover:bg-muted/5 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <img 
                          src={order.products?.image_url || '/placeholder.svg'} 
                          alt={order.products?.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{order.products?.title || "Product"}</p>
                          <p className="text-sm text-muted-foreground">
                            Buyer: {order.buyer?.display_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {order.quantity} × ₦{Number(order.total_amount / order.quantity).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Order ID: {order.id.slice(0, 8)}...
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge className={
                              order.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                              order.status === 'confirmed' ? 'bg-blue-500/20 text-blue-500' :
                              order.status === 'shipped' ? 'bg-purple-500/20 text-purple-500' :
                              order.status === 'delivered' ? 'bg-green-500/20 text-green-500' :
                              'bg-emerald-500/20 text-emerald-500'
                            }>
                              {order.status}
                            </Badge>
                            {order.payment_status === 'paid' && (
                              <Badge className="bg-green-500/20 text-green-500">
                                💰 Paid
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">₦{Number(order.total_amount).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Seller action buttons */}
                      {order.payment_status === 'paid' && (
                        <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
                          {order.status === 'pending' && (
                            <Button size="sm" onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirm Order
                            </Button>
                          )}
                          {order.status === 'confirmed' && (
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}>
                              <Truck className="w-4 h-4 mr-1" />
                              Mark as Shipped
                            </Button>
                          )}
                          {order.status === 'shipped' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark as Delivered
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Business Info Tab */}
          <TabsContent value="business">
            <Card className="glass-strong p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary" />
                Business Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <Input
                      value={businessData.businessName}
                      onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
                      className="glass"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={businessData.businessDescription}
                      onChange={(e) => setBusinessData({ ...businessData, businessDescription: e.target.value })}
                      className="glass min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Textarea
                      value={businessData.businessAddress}
                      onChange={(e) => setBusinessData({ ...businessData, businessAddress: e.target.value })}
                      className="glass"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="glass p-4 rounded-xl space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Bank Account Details
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Payments will be sent to this account when orders are delivered
                    </p>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Bank Name</Label>
                        <Input
                          placeholder="e.g., Access Bank, GTBank"
                          value={businessData.bankName}
                          onChange={(e) => setBusinessData({ ...businessData, bankName: e.target.value })}
                          className="glass"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Account Number</Label>
                        <Input
                          placeholder="Enter your account number"
                          value={businessData.accountNumber}
                          onChange={(e) => setBusinessData({ ...businessData, accountNumber: e.target.value })}
                          className="glass"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Account Name</Label>
                        <Input
                          placeholder="Account holder name"
                          value={businessData.accountName}
                          onChange={(e) => setBusinessData({ ...businessData, accountName: e.target.value })}
                          className="glass"
                        />
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleSaveBusinessInfo} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save Business Info
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SellerDashboard;