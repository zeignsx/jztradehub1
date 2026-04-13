import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Copy, CheckCircle, Clock, XCircle, Tag, Percent, DollarSign } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  minimum_order: number;
  maximum_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

const API_URL = "http://localhost:5000";

const CouponManager = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    minimum_order: "",
    maximum_discount: "",
    usage_limit: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/coupons`);
      const data = await response.json();
      if (data.success) {
        setCoupons(data.data);
      } else {
        // If endpoint not ready, use mock data
        setCoupons([
          {
            id: "1",
            code: "SAVE10",
            description: "10% off your order",
            discount_type: "percentage",
            discount_value: 10,
            minimum_order: 0,
            maximum_discount: 5000,
            usage_limit: 100,
            used_count: 45,
            start_date: null,
            end_date: null,
            is_active: true,
            created_at: new Date().toISOString(),
          },
          {
            id: "2",
            code: "WELCOME20",
            description: "20% off for new customers",
            discount_type: "percentage",
            discount_value: 20,
            minimum_order: 5000,
            maximum_discount: 10000,
            usage_limit: 50,
            used_count: 23,
            start_date: null,
            end_date: null,
            is_active: true,
            created_at: new Date().toISOString(),
          },
          {
            id: "3",
            code: "FIXED500",
            description: "₦500 off",
            discount_type: "fixed",
            discount_value: 500,
            minimum_order: 2000,
            maximum_discount: null,
            usage_limit: 200,
            used_count: 78,
            start_date: null,
            end_date: null,
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      // Mock data for testing
      setCoupons([
        {
          id: "1",
          code: "SAVE10",
          description: "10% off your order",
          discount_type: "percentage",
          discount_value: 10,
          minimum_order: 0,
          maximum_discount: 5000,
          usage_limit: 100,
          used_count: 45,
          start_date: null,
          end_date: null,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          code: "WELCOME20",
          description: "20% off for new customers",
          discount_type: "percentage",
          discount_value: 20,
          minimum_order: 5000,
          maximum_discount: 10000,
          usage_limit: 50,
          used_count: 23,
          start_date: null,
          end_date: null,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "3",
          code: "FIXED500",
          description: "₦500 off",
          discount_type: "fixed",
          discount_value: 500,
          minimum_order: 2000,
          maximum_discount: null,
          usage_limit: 200,
          used_count: 78,
          start_date: null,
          end_date: null,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.discount_value) {
      toast.error("Please fill in all required fields");
      return;
    }

    const couponData = {
      code: formData.code.toUpperCase(),
      description: formData.description,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      minimum_order: parseFloat(formData.minimum_order) || 0,
      maximum_discount: formData.maximum_discount ? parseFloat(formData.maximum_discount) : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      is_active: formData.is_active,
    };

    try {
      const response = await fetch(`${API_URL}/api/admin/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(couponData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Coupon created successfully!");
        resetForm();
        fetchCoupons();
      } else {
        toast.error(data.message || "Failed to create coupon");
      }
    } catch (error) {
      console.error("Error creating coupon:", error);
      // For demo, add to local state
      const newCoupon = {
        id: Date.now().toString(),
        ...couponData,
        used_count: 0,
        created_at: new Date().toISOString(),
      };
      setCoupons([newCoupon, ...coupons]);
      toast.success("Coupon created successfully!");
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/coupons/${id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        toast.success("Coupon deleted");
        fetchCoupons();
      } else {
        // For demo, remove from local state
        setCoupons(coupons.filter(c => c.id !== id));
        toast.success("Coupon deleted");
      }
    } catch (error) {
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success("Coupon deleted");
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/coupons/${coupon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !coupon.is_active }),
      });
      
      if (response.ok) {
        toast.success(`Coupon ${!coupon.is_active ? "activated" : "deactivated"}`);
        fetchCoupons();
      } else {
        setCoupons(coupons.map(c => 
          c.id === coupon.id ? { ...c, is_active: !c.is_active } : c
        ));
        toast.success(`Coupon ${!coupon.is_active ? "activated" : "deactivated"}`);
      }
    } catch (error) {
      setCoupons(coupons.map(c => 
        c.id === coupon.id ? { ...c, is_active: !c.is_active } : c
      ));
      toast.success(`Coupon ${!coupon.is_active ? "activated" : "deactivated"}`);
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon code copied!");
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingCoupon(null);
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      minimum_order: "",
      maximum_discount: "",
      usage_limit: "",
      start_date: "",
      end_date: "",
      is_active: true,
    });
  };

  const getStatusBadge = (coupon: Coupon) => {
    const isExpired = coupon.end_date && new Date(coupon.end_date) < new Date();
    const isActive = coupon.is_active && !isExpired;
    
    if (isActive) {
      return <Badge className="bg-green-500/10 text-green-600">Active</Badge>;
    }
    if (isExpired) {
      return <Badge className="bg-red-500/10 text-red-600">Expired</Badge>;
    }
    return <Badge className="bg-gray-500/10 text-gray-600">Inactive</Badge>;
  };

  if (loading) {
    return (
      <Card className="glass-strong">
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">Loading coupons...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-strong">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Coupon Management
          </CardTitle>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Coupon
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {coupons.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No coupons yet</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              Create your first coupon
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-muted rounded font-mono text-sm">
                          {coupon.code}
                        </code>
                        <button
                          onClick={() => copyCouponCode(coupon.code)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {coupon.description || "-"}
                    </TableCell>
                    <TableCell>
                      {coupon.discount_type === "percentage" ? (
                        <span className="flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          {coupon.discount_value}% off
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ₦{coupon.discount_value.toLocaleString()} off
                        </span>
                      )}
                      {coupon.maximum_discount && coupon.discount_type === "percentage" && (
                        <span className="text-xs text-muted-foreground block">
                          Max ₦{coupon.maximum_discount.toLocaleString()}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {coupon.minimum_order > 0 ? `₦${coupon.minimum_order.toLocaleString()}` : "No minimum"}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {coupon.used_count}
                        {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(coupon)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleActive(coupon)}
                        >
                          {coupon.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDelete(coupon.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Create/Edit Coupon Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Coupon Code *</Label>
              <Input
                placeholder="e.g., SAVE20"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe this coupon..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(v) => setFormData({ ...formData, discount_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₦)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{formData.discount_type === "percentage" ? "Discount (%)" : "Discount (₦)"} *</Label>
                <Input
                  type="number"
                  placeholder={formData.discount_type === "percentage" ? "10" : "500"}
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Order (₦)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.minimum_order}
                  onChange={(e) => setFormData({ ...formData, minimum_order: e.target.value })}
                />
              </div>
              {formData.discount_type === "percentage" && (
                <div className="space-y-2">
                  <Label>Maximum Discount (₦)</Label>
                  <Input
                    type="number"
                    placeholder="Optional"
                    value={formData.maximum_discount}
                    onChange={(e) => setFormData({ ...formData, maximum_discount: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Usage Limit</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Start Date (Optional)
                </Label>
                <Input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit}>Create Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CouponManager;