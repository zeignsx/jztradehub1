import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import PaymentConfirmDialog from "@/components/admin/PaymentConfirmDialog";
import SiteSettingsManager from "@/components/admin/SiteSettingsManager";
import BlogManager from "@/components/admin/BlogManager";
import FlashSalesManager from "@/components/admin/FlashSalesManager";
import DisputesManager from "@/components/admin/DisputesManager";
import ReturnsManager from "@/components/admin/ReturnsManager";
import LogisticsManager from "@/components/admin/LogisticsManager";
import ChatManager from "@/components/admin/ChatManager";
import ReceiptManager from "@/components/admin/ReceiptManager";
import CouponManager from "@/components/admin/CouponManager";
import ReceiptGenerator from "@/components/ReceiptGenerator";
import {
  Users,
  ShoppingBag,
  Shield,
  UserPlus,
  Package,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Upload,
  X,
  ArrowLeft,
  Settings,
  Zap,
  FileText,
  AlertTriangle,
  RotateCcw,
  Truck,
  MessageCircle,
  TrendingUp,
  Tag,
  Bell,
  Eye,
  Search,
  Filter,
  RefreshCw,
  CreditCard,
  Wallet,
  Receipt
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, trend, color, subtitle }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    whileHover={{ y: -5 }}
    className="relative"
  >
    <Card className="glass-strong overflow-hidden border border-white/10 hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <p className={`text-xs mt-2 ${trend > 0 ? "text-green-500" : "text-red-500"} flex items-center gap-1`}>
                <TrendingUp className="w-3 h-3" />
                {trend}% from last month
              </p>
            )}
          </div>
          <div className={`p-4 rounded-2xl bg-${color}/10 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 text-${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// User Card Component
const UserCard = ({ user }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02 }}
    className="glass rounded-xl p-4 border border-white/10 hover:border-primary/30 transition-all duration-300"
  >
    <div className="flex items-center gap-3">
      <Avatar className="w-10 h-10">
        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
          {user.display_name?.charAt(0) || user.email?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{user.display_name || "Anonymous"}</p>
        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
      </div>
      <div className="flex flex-wrap gap-1">
        {user.user_roles?.map((role: any) => (
          <Badge key={role.role} variant="secondary" className="text-xs">
            {role.role}
          </Badge>
        ))}
      </div>
    </div>
  </motion.div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalBuyers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    pendingDisputes: 0,
    pendingReturns: 0,
    monthlyRevenue: 0,
    weeklyOrders: 0,
    averageOrderValue: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [newRoleEmail, setNewRoleEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "seller" | "buyer">("seller");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  
  // Product creation state
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    stock_quantity: "",
    image_url: "",
  });
  const [isDragging, setIsDragging] = useState(false);
  
  // Payment confirmation modal state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<{ id: string; amount: number } | null>(null);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchOrders();
    setupRealtimeSubscriptions();
  }, []);

  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel('admin-order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('📦 Order updated in real-time:', payload);
          fetchOrders();
          fetchStats();
          
          if (payload.new.payment_status === 'paid' && payload.old.payment_status !== 'paid') {
            toast.success(`💰 Order ${payload.new.id.slice(0, 8)} has been paid!`);
          }
        }
      )
      .subscribe();
      
    const newOrderChannel = supabase
      .channel('admin-new-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('🆕 New order received:', payload);
          fetchOrders();
          fetchStats();
          toast.info(`🛍️ New order #${payload.new.id.slice(0, 8)} received!`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(newOrderChannel);
    };
  };

  const fetchStats = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");
    const { data: ordersData } = await supabase.from("orders").select("*");
    const { data: disputes } = await supabase.from("disputes").select("*").eq("status", "pending");
    const { data: returns } = await supabase.from("return_requests").select("*").eq("status", "pending");

    const sellers = roles?.filter((r) => r.role === "seller").length || 0;
    const buyers = roles?.filter((r) => r.role === "buyer").length || 0;
    const pending = ordersData?.filter((o) => o.status === "pending").length || 0;
    const revenue = ordersData?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyRevenue = ordersData?.filter(o => new Date(o.created_at) >= thirtyDaysAgo)
      .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyOrders = ordersData?.filter(o => new Date(o.created_at) >= sevenDaysAgo).length || 0;
    
    const averageOrderValue = ordersData?.length ? revenue / ordersData.length : 0;

    setStats({
      totalUsers: profiles?.length || 0,
      totalSellers: sellers,
      totalBuyers: buyers,
      totalOrders: ordersData?.length || 0,
      pendingOrders: pending,
      totalRevenue: revenue,
      pendingDisputes: disputes?.length || 0,
      pendingReturns: returns?.length || 0,
      monthlyRevenue,
      weeklyOrders,
      averageOrderValue,
    });
  };

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*, user_roles(role)")
      .order("created_at", { ascending: false });

    setUsers(profiles || []);
  };

  const fetchOrders = async () => {
    const { data: ordersData } = await supabase
      .from("orders")
      .select(`*, products(title)`)
      .order("created_at", { ascending: false });

    if (!ordersData) {
      setOrders([]);
      return;
    }

    const buyerIds = [...new Set(ordersData.map(o => o.buyer_id))];
    const sellerIds = [...new Set(ordersData.map(o => o.seller_id))];
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", [...buyerIds, ...sellerIds]);

    const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

    const ordersWithProfiles = ordersData.map(order => ({
      ...order,
      buyer: { display_name: profileMap.get(order.buyer_id) || "Unknown" },
      seller: { display_name: profileMap.get(order.seller_id) || "Unknown" },
      product: order.products,
    }));

    setOrders(ordersWithProfiles);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

      if (error) throw error;

      toast.success(`Order ${status}`);
      fetchOrders();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || "Failed to update order");
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          payment_status: "paid",
          status: "confirmed",
          paid_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Payment confirmed successfully!");
      fetchOrders();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || "Failed to confirm payment");
    }
  };

  const handleAddRole = async () => {
    if (!newRoleEmail) {
      toast.error("Please enter a display name");
      return;
    }

    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .ilike("display_name", `%${newRoleEmail}%`)
        .limit(1);

      if (!profiles || profiles.length === 0) {
        toast.error("User not found");
        setLoading(false);
        return;
      }

      const userId = profiles[0].id;

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (error) {
        if (error.code === '23505') {
          toast.error("User already has this role");
        } else {
          throw error;
        }
      } else {
        toast.success(`Assigned ${newRole} role to ${profiles[0].display_name}`);
      }
      
      setNewRoleEmail("");
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || "Failed to add role");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.title || !newProduct.price) {
      toast.error("Title and price are required");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("products").insert({
        title: newProduct.title,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        stock_quantity: parseInt(newProduct.stock_quantity) || 0,
        image_url: newProduct.image_url,
        seller_id: user.id,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Product created successfully");
      setNewProduct({
        title: "",
        description: "",
        price: "",
        category: "",
        stock_quantity: "",
        image_url: "",
      });
    } catch (error) {
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewProduct({ ...newProduct, image_url: event.target.result as string });
        toast.success("Image uploaded successfully");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewProduct({ ...newProduct, image_url: event.target.result as string });
        toast.success("Image uploaded successfully");
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || order.payment_status === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; className?: string }> = {
      pending: { variant: "secondary", icon: Clock },
      confirmed: { variant: "default", icon: CheckCircle },
      shipped: { variant: "default", icon: Package },
      delivered: { variant: "default", icon: CheckCircle },
      completed: { variant: "default", icon: CheckCircle, className: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" },
      cancelled: { variant: "destructive", icon: XCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={`gap-1 ${config.className || ''}`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    return status === "paid" ? (
      <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/30">
        <CheckCircle className="w-3 h-3" />
        Paid
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
        <Clock className="w-3 h-3" />
        Pending
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Header />
      <div className="container px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your JZTradeHub platform with real-time insights
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Revenue" value={`₦${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} color="primary" trend={12} />
          <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingBag} color="accent" subtitle={`${stats.weeklyOrders} this week`} />
          <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="secondary" subtitle={`${stats.totalSellers} sellers`} />
          <StatCard title="Pending Orders" value={stats.pendingOrders} icon={Clock} color="yellow" />
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Monthly Revenue" value={`₦${stats.monthlyRevenue.toLocaleString()}`} icon={TrendingUp} color="green" />
          <StatCard title="Avg Order Value" value={`₦${Math.round(stats.averageOrderValue).toLocaleString()}`} icon={Wallet} color="blue" />
          <StatCard title="Pending Disputes" value={stats.pendingDisputes} icon={AlertTriangle} color="red" />
          <StatCard title="Pending Returns" value={stats.pendingReturns} icon={RotateCcw} color="orange" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="glass-strong flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="orders" className="gap-1">
              <ShoppingBag className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-1">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="flash-sales" className="gap-1">
              <Zap className="w-4 h-4" />
              Flash Sales
            </TabsTrigger>
            <TabsTrigger value="coupons" className="gap-1">
              <Tag className="w-4 h-4" />
              Coupons
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-1">
              <FileText className="w-4 h-4" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="disputes" className="gap-1">
              <AlertTriangle className="w-4 h-4" />
              Disputes
            </TabsTrigger>
            <TabsTrigger value="returns" className="gap-1">
              <RotateCcw className="w-4 h-4" />
              Returns
            </TabsTrigger>
            <TabsTrigger value="logistics" className="gap-1">
              <Truck className="w-4 h-4" />
              Logistics
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1">
              <MessageCircle className="w-4 h-4" />
              Live Chat
            </TabsTrigger>
            <TabsTrigger value="popup" className="gap-1">
              <Bell className="w-4 h-4" />
              Popup Ad
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="receipts" className="gap-1">
              <Receipt className="w-4 h-4" />
              Receipts
            </TabsTrigger>
            <TabsTrigger value="receipt-generator" className="gap-1">
              <FileText className="w-4 h-4" />
              Generate Receipt
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="glass-strong p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                  Order Management
                </h2>
                
                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-48"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Payment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payment</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => { fetchOrders(); fetchStats(); }}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/50 bg-muted/30">
                      <TableHead>Order ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                          No orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id} className="border-border/50">
                          <TableCell className="font-mono text-xs">
                            {order.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {order.product?.title || "N/A"}
                          </TableCell>
                          <TableCell>{order.buyer?.display_name || "Unknown"}</TableCell>
                          <TableCell>{order.seller?.display_name || "Unknown"}</TableCell>
                          <TableCell className="font-bold">
                            ₦{Number(order.total_amount).toLocaleString()}
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(order.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {order.payment_status === "pending" && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleConfirmPayment(order.id)}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Confirm Payment
                                </Button>
                              )}
                              {order.payment_status === "paid" && order.status === "pending" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateOrderStatus(order.id, "confirmed")}
                                >
                                  Confirm Order
                                </Button>
                              )}
                              {order.status === "confirmed" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateOrderStatus(order.id, "shipped")}
                                >
                                  <Truck className="w-3 h-3 mr-1" />
                                  Ship
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card className="glass-strong p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Package className="w-6 h-6 text-primary" />
                Create New Product
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Product Title</Label>
                    <Input
                      value={newProduct.title}
                      onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                      placeholder="Enter product title"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Price (₦)</Label>
                    <Input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      placeholder="e.g., Electronics, Fashion"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Stock Quantity</Label>
                    <Input
                      type="number"
                      value={newProduct.stock_quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Product Image</Label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mt-1 ${
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-primary/50"
                      }`}
                    >
                      {newProduct.image_url ? (
                        <div className="relative">
                          <img
                            src={newProduct.image_url}
                            alt="Preview"
                            className="max-h-48 mx-auto rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => setNewProduct({ ...newProduct, image_url: "" })}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Drag and drop an image here, or click to browse
                          </p>
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="product-image-upload"
                            onChange={handleFileInput}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("product-image-upload")?.click()}
                          >
                            Browse Files
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Or paste an image URL:
                    </p>
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={newProduct.image_url.startsWith('data:') ? '' : newProduct.image_url}
                      onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      placeholder="Enter product description"
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleCreateProduct} disabled={loading} className="w-full mt-6">
                {loading ? "Creating..." : "Create Product"}
              </Button>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="glass-strong p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-primary" />
                Assign User Role
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>User Display Name</Label>
                  <Input
                    placeholder="Search by display name"
                    value={newRoleEmail}
                    onChange={(e) => setNewRoleEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddRole} disabled={loading} className="w-full">
                    Assign Role
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="glass-strong p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                All Users
              </h2>
              <div className="grid gap-3">
                {users.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Other Tabs */}
          <TabsContent value="flash-sales">
            <FlashSalesManager />
          </TabsContent>
          <TabsContent value="coupons">
            <CouponManager />
          </TabsContent>
          <TabsContent value="blog">
            <BlogManager />
          </TabsContent>
          <TabsContent value="disputes">
            <DisputesManager />
          </TabsContent>
          <TabsContent value="returns">
            <ReturnsManager />
          </TabsContent>
          <TabsContent value="logistics">
            <LogisticsManager />
          </TabsContent>
          <TabsContent value="chat">
            <ChatManager />
          </TabsContent>
          <TabsContent value="popup">
            <SiteSettingsManager />
          </TabsContent>
          <TabsContent value="settings">
            <SiteSettingsManager />
          </TabsContent>
          <TabsContent value="receipts">
            <ReceiptManager />
          </TabsContent>
          <TabsContent value="receipt-generator">
            <ReceiptGenerator />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Payment Confirmation Dialog */}
      {selectedOrder && (
        <PaymentConfirmDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          orderId={selectedOrder.id}
          orderAmount={selectedOrder.amount}
          onConfirm={handleConfirmPayment}
        />
      )}
    </div>
  );
};

export default AdminDashboard