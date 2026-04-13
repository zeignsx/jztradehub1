import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  Banknote, 
  CheckCircle, 
  Clock, 
  XCircle,
  Loader2,
  History,
  RefreshCw,
  Plus,
  Gift,
  Coins,
  Building2,
  CreditCard,
  Send,
  Shield
} from "lucide-react";

interface Bank {
  name: string;
  code: string;
}

interface WithdrawalHistory {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  created_at: string;
  reference: string;
  flutterwave_reference?: string;
}

interface EarningsData {
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  pending_earnings: number;
}

const API_URL = "http://localhost:5000";

// Complete Nigerian Banks List with Codes
const NIGERIAN_BANKS: Bank[] = [
  { name: "Access Bank", code: "044" },
  { name: "Access Bank (Diamond)", code: "063" },
  { name: "ALAT by Wema", code: "035" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Coronation Merchant Bank", code: "559" },
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
  { name: "Moniepoint Microfinance Bank", code: "090318" },
  { name: "Opay Microfinance Bank", code: "090319" },
  { name: "PalmPay Microfinance Bank", code: "090320" }
];

const SellerWithdrawal = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState<EarningsData>({
    balance: 0,
    total_earned: 0,
    total_withdrawn: 0,
    pending_earnings: 0
  });
  const [withdrawals, setWithdrawals] = useState<WithdrawalHistory[]>([]);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    bank_name: "",
    account_number: "",
    account_name: "",
  });
  const [verifying, setVerifying] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (user) {
      fetchEarnings();
      fetchWithdrawalHistory();
    }
  }, [user]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      console.log("Fetching earnings for user:", user?.id);
      
      const response = await fetch(`${API_URL}/api/earnings/${user?.id}`);
      const data = await response.json();
      console.log("Earnings response:", data);
      
      if (data.success && data.data) {
        setEarnings({
          balance: data.data.balance || 0,
          total_earned: data.data.total_earned || 0,
          total_withdrawn: data.data.total_withdrawn || 0,
          pending_earnings: data.data.pending_earnings || 0
        });
      } else {
        // Fallback to local storage or default
        const savedBalance = localStorage.getItem(`seller_balance_${user?.id}`);
        if (savedBalance) {
          setEarnings({
            balance: parseInt(savedBalance),
            total_earned: parseInt(savedBalance),
            total_withdrawn: 0,
            pending_earnings: 0
          });
        }
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
      // Use localStorage as fallback
      const savedBalance = localStorage.getItem(`seller_balance_${user?.id}`);
      if (savedBalance) {
        setEarnings({
          balance: parseInt(savedBalance),
          total_earned: parseInt(savedBalance),
          total_withdrawn: 0,
          pending_earnings: 0
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawalHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/withdrawals/${user?.id}`);
      const data = await response.json();
      if (data.success && data.data) {
        setWithdrawals(data.data);
      }
    } catch (error) {
      console.error("Error fetching withdrawal history:", error);
      // Load from localStorage as fallback
      const savedHistory = localStorage.getItem(`withdrawals_${user?.id}`);
      if (savedHistory) {
        setWithdrawals(JSON.parse(savedHistory));
      }
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchEarnings(), fetchWithdrawalHistory()]);
    setRefreshing(false);
    toast.success("Balance refreshed!");
  };

  const addTestBalance = () => {
    const newBalance = earnings.balance + 50000;
    setEarnings(prev => ({
      ...prev,
      balance: newBalance,
      total_earned: prev.total_earned + 50000
    }));
    localStorage.setItem(`seller_balance_${user?.id}`, newBalance.toString());
    toast.success("₦50,000 added to your balance!");
  };

  const verifyAccount = async () => {
    if (!formData.account_number || !formData.bank_name) {
      toast.error("Please enter account number and select bank");
      return;
    }

    if (formData.account_number.length < 10) {
      toast.error("Please enter a valid 10-digit account number");
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch(`${API_URL}/api/verify-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_number: formData.account_number,
          bank_name: formData.bank_name
        })
      });

      const data = await response.json();
      console.log("Verification response:", data);
      
      if (data.success) {
        setFormData(prev => ({ ...prev, account_name: data.data.account_name }));
        setAccountVerified(true);
        toast.success(`Account verified: ${data.data.account_name}`);
      } else {
        toast.error(data.message || "Account verification failed");
        setAccountVerified(false);
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Failed to verify account. Please try again.");
      setAccountVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!formData.amount || !formData.bank_name || !formData.account_number || !formData.account_name) {
      toast.error("Please fill all fields and verify your account");
      return;
    }

    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum < 1000) {
      toast.error("Minimum withdrawal amount is ₦1,000");
      return;
    }

    if (amountNum > earnings.balance) {
      toast.error(`Insufficient balance. Available: ₦${earnings.balance.toLocaleString()}`);
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`${API_URL}/api/send-payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_id: user?.id,
          amount: amountNum,
          bank_name: formData.bank_name,
          account_number: formData.account_number,
          account_name: formData.account_name,
          reference: `WD-${Date.now()}-${user?.id?.slice(0, 8)}`
        })
      });

      const data = await response.json();
      console.log("Payout response:", data);
      
      if (data.success) {
        // Update local balance
        const newBalance = earnings.balance - amountNum;
        setEarnings(prev => ({
          ...prev,
          balance: newBalance,
          total_withdrawn: prev.total_withdrawn + amountNum
        }));
        
        // Save to localStorage
        localStorage.setItem(`seller_balance_${user?.id}`, newBalance.toString());
        
        // Add to withdrawal history
        const newWithdrawal: WithdrawalHistory = {
          id: Date.now().toString(),
          amount: amountNum,
          bank_name: formData.bank_name,
          account_number: formData.account_number,
          account_name: formData.account_name,
          status: "completed",
          created_at: new Date().toISOString(),
          reference: data.data.reference,
          flutterwave_reference: data.data.flutterwave_id
        };
        
        const updatedHistory = [newWithdrawal, ...withdrawals];
        setWithdrawals(updatedHistory);
        localStorage.setItem(`withdrawals_${user?.id}`, JSON.stringify(updatedHistory));
        
        toast.success(`₦${amountNum.toLocaleString()} has been sent to your bank account!`);
        setWithdrawalOpen(false);
        resetForm();
      } else {
        toast.error(data.message || "Withdrawal failed. Please try again.");
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Failed to process withdrawal. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: "",
      bank_name: "",
      account_number: "",
      account_name: "",
    });
    setAccountVerified(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="glass-strong">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading your balance...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-strong bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold text-primary">₦{earnings.balance.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-full bg-primary/20">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold text-green-600">₦{earnings.total_earned.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-full bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Withdrawn</p>
                <p className="text-2xl font-bold text-blue-600">₦{earnings.total_withdrawn.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-full bg-blue-500/10">
                <Banknote className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">₦{earnings.pending_earnings.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-full bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button 
          variant="outline" 
          onClick={refreshData} 
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Balance
        </Button>
        <Button 
          variant="outline" 
          onClick={addTestBalance}
          className="gap-2 text-green-600 border-green-600 hover:bg-green-600/10"
        >
          <Gift className="w-4 h-4" />
          Add Test Balance (₦50,000)
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="glass-strong w-full">
          <TabsTrigger value="overview" className="flex-1 gap-2">
            <Wallet className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="flex-1 gap-2">
            <Send className="w-4 h-4" />
            Withdraw
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Withdrawal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h3 className="font-semibold mb-2">Withdrawal Rules</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Minimum withdrawal: ₦1,000</li>
                  <li>• Processing time: Instant to 3 business days</li>
                  <li>• Bank transfer fees: ₦0 (free)</li>
                  <li>• Withdrawals are sent to your verified bank account</li>
                  <li>• Real-time bank account verification via Flutterwave</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Secure Payouts
                </h3>
                <p className="text-sm text-muted-foreground">
                  All payouts are processed securely through Flutterwave's payment infrastructure.
                  Your bank details are encrypted and protected.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <h3 className="font-semibold mb-2">Need Help?</h3>
                <p className="text-sm text-muted-foreground">
                  Contact our support team if you have any issues with your withdrawal.
                  Withdrawals are processed instantly to verified bank accounts.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdraw Tab */}
        <TabsContent value="withdraw">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                Request Withdrawal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div className="p-4 rounded-lg bg-primary/10 text-center">
                  <p className="text-sm text-muted-foreground">Available for withdrawal</p>
                  <p className="text-3xl font-bold text-primary">₦{earnings.balance.toLocaleString()}</p>
                </div>

                <div className="space-y-2">
                  <Label>Amount (₦) *</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount to withdraw"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="glass"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum: ₦1,000 | Maximum: ₦{earnings.balance.toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Select Bank *</Label>
                  <Select
                    value={formData.bank_name}
                    onValueChange={(value) => {
                      setFormData({ ...formData, bank_name: value, account_name: "" });
                      setAccountVerified(false);
                    }}
                  >
                    <SelectTrigger className="glass">
                      <SelectValue placeholder="Choose your bank" />
                    </SelectTrigger>
                    <SelectContent className="glass-strong max-h-60">
                      {NIGERIAN_BANKS.map((bank) => (
                        <SelectItem key={bank.code} value={bank.name}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Account Number *</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter 10-digit account number"
                      value={formData.account_number}
                      onChange={(e) => {
                        setFormData({ ...formData, account_number: e.target.value });
                        setAccountVerified(false);
                      }}
                      maxLength={10}
                      className="glass flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={verifyAccount}
                      disabled={verifying || !formData.account_number || !formData.bank_name}
                      className="gap-2"
                    >
                      {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {verifying ? "Verifying..." : "Verify"}
                    </Button>
                  </div>
                </div>

                {accountVerified && formData.account_name && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Account Verified</span>
                    </div>
                    <p className="text-sm mt-1 font-medium">Account Name: {formData.account_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Bank: {formData.bank_name} | Account: {formData.account_number}
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => setWithdrawalOpen(true)}
                  disabled={processing || !accountVerified || !formData.amount || parseFloat(formData.amount) > earnings.balance}
                  className="w-full bg-gradient-to-r from-primary to-accent"
                  size="lg"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Withdraw ₦{parseFloat(formData.amount || "0").toLocaleString()}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Withdrawal History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Banknote className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No withdrawal history yet</p>
                  <p className="text-sm mt-1">Request a withdrawal to see it here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Banknote className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">₦{withdrawal.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {withdrawal.bank_name} - {withdrawal.account_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(withdrawal.created_at).toLocaleDateString()} at{' '}
                            {new Date(withdrawal.created_at).toLocaleTimeString()}
                          </p>
                          {withdrawal.flutterwave_reference && (
                            <p className="text-xs text-muted-foreground font-mono">
                              Ref: {withdrawal.flutterwave_reference.slice(0, 12)}...
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(withdrawal.status)}
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {withdrawal.reference?.slice(0, 12)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Withdrawal Confirmation Dialog */}
      <Dialog open={withdrawalOpen} onOpenChange={setWithdrawalOpen}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Confirm Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between pb-2 border-b">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-bold text-primary text-lg">₦{parseFloat(formData.amount || "0").toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bank:</span>
              <span className="font-medium">{formData.bank_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Number:</span>
              <span className="font-medium">{formData.account_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Name:</span>
              <span className="font-medium">{formData.account_name}</span>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-sm text-yellow-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Withdrawals are processed instantly to your bank account.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-sm text-blue-600 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                This transaction is secured by Flutterwave
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawalOpen(false)}>Cancel</Button>
            <Button onClick={handleWithdrawal} disabled={processing} className="bg-gradient-to-r from-primary to-accent">
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Confirm Withdrawal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerWithdrawal;