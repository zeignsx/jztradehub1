import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartyPopper, CheckCircle, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface PaymentSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PaymentSuccessDialog = ({ open, onOpenChange }: PaymentSuccessDialogProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      // Fire confetti when dialog opens
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10b981', '#3b82f6', '#8b5cf6']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#10b981', '#3b82f6', '#8b5cf6']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
          <div className="mx-auto mb-4 p-4 rounded-full bg-green-500/10 animate-bounce">
            <PartyPopper className="w-12 h-12 text-green-500" />
          </div>
          <DialogTitle className="text-2xl text-center">
            Congratulations! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Your payment has been confirmed!
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Payment Verified Successfully</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Your order is now being processed. The seller will be notified and your item will be shipped soon.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => {
              onOpenChange(false);
              navigate("/buyer-dashboard");
            }} 
            className="w-full" 
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to My Orders
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => {
              onOpenChange(false);
              navigate("/marketplace");
            }}
            className="w-full"
          >
            Continue Shopping
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSuccessDialog;
