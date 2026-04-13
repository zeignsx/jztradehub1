import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Zap, 
  Tv, 
  Lightbulb, 
  Smartphone,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  History
} from "lucide-react";

interface BillCategory {
  id: string;
  biller_name: string;
  biller_type: string;
  item_code: string;
}

interface BillHistory {
  id: string;
  biller_name: string;
  amount: number;
  customer_code: string;
  customer_name: string;
  status: string;
  created_at: string;
  reference: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Biller logos and colors
const billerStyles: Record<string, { icon: any, color: string, bgColor: string }> = {
  "DSTV": { icon: Tv, color: "#E31E24", bgColor: "bg-red-500/10" },
  "GOtv": { icon: Tv, color: "#FF6600", bgColor: "bg-orange-500/10" },
  "Startimes": { icon: Tv, color: "#0099CC", bgColor: "bg-blue-500/10" },
  "Ikeja Electric": { icon: Lightbulb, color: "#FDB913", bgColor: "bg-yellow-500/10" },
  "Eko Electric": { icon: Lightbulb, color: "#00A651", bgColor: "bg-green-500/10" },
  "MTN": { icon: Smartphone, color: "#FFCC00", bgColor: "bg-yellow-500/10" },
  "Glo": { icon: Smartphone, color: "#00A651", bgColor: "bg-green-500/10" },
  "Airtel": { icon: Smartphone, color: "#ED1B24", bgColor: "bg-red-500/10" },
  "9mobile": { icon: Smartphone, color: "#00AEEF", bgColor: "bg-blue-500/10" }
};

const BillPayment = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<BillCategory[]>([]);
  const [history, setHistory] = useState<BillHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BillCategory | null>(null);
  const [formData, setFormData] = useState({
    customer_code: "",
    amount: "",
    phone: "",
  });
  const [validatedName, setValidatedName] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pay");

  useEffect(() => {
    fetchCategories();
    fetchHistory();
  }, [user]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/bill-categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/api/bill-history/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const validateAccount = async () => {
    if (!selectedCategory || !formData.customer_code) {
      toast.error("Please select a biller and enter customer code");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/validate-bill-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_code: selectedCategory.item_code,
          customer_code: formData.customer_code
        })
      });

      const data = await response.json();
      
      if (data.success && data.data.is_valid) {
        setValidatedName(data.data.customer_name);
        setIsValidated(true);
        toast.success(`Account validated: ${data.data.customer_name}`);
      } else {
        toast.error(data.message || "Invalid account number. Please check and try again.");
      }
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Failed to validate account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedCategory || !formData.customer_code || !formData.amount || !isValidated) {
      toast.error("Please complete all fields and validate your account");
      return;
    }

    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum < 100) {
      toast.error("Minimum payment amount is ₦100");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`${API_URL}/api/pay-bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          biller_name: selectedCategory.biller_name,
          biller_type: selectedCategory.biller_type,
          customer_code: formData.customer_code,
          customer_name: validatedName,
          amount: amountNum,
          email: user?.email,
          phone: formData.phone || "08012345678"
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Bill payment successful! ₦${amountNum.toLocaleString()} paid to ${selectedCategory.biller_name}`);
        setDialogOpen(false);
        resetForm();
        fetchHistory();
      } else {
        toast.error(data.message || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setFormData({ customer_code: "", amount: "", phone: "" });
    setValidatedName("");
    setIsValidated(false);
  };

  const getBillerStyle = (billerName: string) => {
    return billerStyles[billerName] || { 
      icon: Zap, 
      color: "#3b82f6", 
      bgColor: "bg-primary/10" 
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-600";
      case "pending": return "bg-yellow-500/10 text-yellow-600";
      case "failed": return "bg-red-500/10 text-red-600";
      default: return "bg-gray-500/10 text-gray-600";
    }
  };

  // Group categories by type
  const cableBillers = categories.filter(c => c.biller_type === "cable");
  const electricityBillers = categories.filter(c => c.biller_type === "electricity");
  const airtimeBillers = categories.filter(c => c.biller_type === "airtime");

  if (loading && categories.length === 0) {
    return (
      <Card className="glass-strong">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading bill categories...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-strong w-full">
          <TabsTrigger value="pay" className="flex-1 gap-2">
            <Zap className="w-4 h-4" />
            Pay Bills
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 gap-2">
            <History className="w-4 h-4" />
            Payment History
          </TabsTrigger>
        </TabsList>

        {/* Pay Bills Tab */}
        <TabsContent value="pay" className="mt-6">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Select Biller
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cable TV Section */}
              {cableBillers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tv className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Cable TV</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {cableBillers.map((category) => {
                      const style = getBillerStyle(category.biller_name);
                      const Icon = style.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsValidated(false);
                            setValidatedName("");
                          }}
                          className={`p-4 rounded-xl border-2 transition-all text-center ${
                            selectedCategory?.id === category.id
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50 hover:bg-primary/2"
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-full ${style.bgColor} flex items-center justify-center mx-auto mb-2`}>
                            <Icon className="w-6 h-6" style={{ color: style.color }} />
                          </div>
                          <p className="text-sm font-medium">{category.biller_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{category.biller_type}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Electricity Section */}
              {electricityBillers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Electricity</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {electricityBillers.map((category) => {
                      const style = getBillerStyle(category.biller_name);
                      const Icon = style.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsValidated(false);
                            setValidatedName("");
                          }}
                          className={`p-4 rounded-xl border-2 transition-all text-center ${
                            selectedCategory?.id === category.id
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50 hover:bg-primary/2"
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-full ${style.bgColor} flex items-center justify-center mx-auto mb-2`}>
                            <Icon className="w-6 h-6" style={{ color: style.color }} />
                          </div>
                          <p className="text-sm font-medium">{category.biller_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{category.biller_type}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Airtime & Data Section */}
              {airtimeBillers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Smartphone className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Airtime & Data</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {airtimeBillers.map((category) => {
                      const style = getBillerStyle(category.biller_name);
                      const Icon = style.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsValidated(false);
                            setValidatedName("");
                          }}
                          className={`p-4 rounded-xl border-2 transition-all text-center ${
                            selectedCategory?.id === category.id
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50 hover:bg-primary/2"
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-full ${style.bgColor} flex items-center justify-center mx-auto mb-2`}>
                            <Icon className="w-6 h-6" style={{ color: style.color }} />
                          </div>
                          <p className="text-sm font-medium">{category.biller_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{category.biller_type}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Biller Form */}
              {selectedCategory && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-3 mb-4">
                    {(() => {
                      const style = getBillerStyle(selectedCategory.biller_name);
                      const Icon = style.icon;
                      return (
                        <div className={`w-12 h-12 rounded-full ${style.bgColor} flex items-center justify-center`}>
                          <Icon className="w-6 h-6" style={{ color: style.color }} />
                        </div>
                      );
                    })()}
                    <div>
                      <h3 className="font-bold text-lg">{selectedCategory.biller_name}</h3>
                      <p className="text-sm text-muted-foreground">Enter your account details below</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Customer Code */}
                    <div className="space-y-2">
                      <Label>
                        {selectedCategory.biller_type === "airtime" ? "Phone Number" : "Customer/Meter Number"}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder={`Enter ${selectedCategory.biller_type === "airtime" ? "phone number" : "customer number"}`}
                          value={formData.customer_code}
                          onChange={(e) => {
                            setFormData({ ...formData, customer_code: e.target.value });
                            setIsValidated(false);
                          }}
                          className="flex-1"
                        />
                        <Button variant="outline" onClick={validateAccount} disabled={loading}>
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validate"}
                        </Button>
                      </div>
                    </div>

                    {/* Validated Account Info */}
                    {isValidated && (
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">Account Verified</span>
                        </div>
                        <p className="text-sm mt-1">Customer Name: {validatedName}</p>
                        <p className="text-sm">Customer ID: {formData.customer_code}</p>
                      </div>
                    )}

                    {/* Amount */}
                    <div className="space-y-2">
                      <Label>Amount (₦)</Label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <Label>Phone Number (for receipt)</Label>
                      <Input
                        type="tel"
                        placeholder="08012345678"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <Button
                      onClick={() => setDialogOpen(true)}
                      disabled={!isValidated || !formData.amount}
                      className="w-full bg-gradient-to-r from-primary to-accent"
                      size="lg"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Pay Bill
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Bill Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No bill payments yet</p>
                  <p className="text-sm mt-1">Pay a bill to see your history here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((bill) => {
                    const style = getBillerStyle(bill.biller_name);
                    const Icon = style.icon;
                    return (
                      <div key={bill.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-accent/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${style.bgColor} flex items-center justify-center`}>
                            <Icon className="w-5 h-5" style={{ color: style.color }} />
                          </div>
                          <div>
                            <p className="font-semibold">{bill.biller_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {bill.customer_code} - {bill.customer_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(bill.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">₦{bill.amount.toLocaleString()}</p>
                          <Badge className={`mt-1 ${getStatusColor(bill.status)}`}>
                            {bill.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>Confirm Bill Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Biller:</span>
              <span className="font-medium">{selectedCategory?.biller_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer ID:</span>
              <span className="font-medium">{formData.customer_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer Name:</span>
              <span className="font-medium">{validatedName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-bold text-primary text-lg">₦{parseFloat(formData.amount || "0").toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-sm text-yellow-600">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                This payment will be processed securely.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePayment} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillPayment;