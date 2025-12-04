import { useState } from 'react';
import { Phone, Loader2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { TIER_FEATURES, TIER_PRICES, useSubscription } from '@/hooks/useSubscription';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: 'basic' | 'premium';
}

export function PaymentModal({ open, onOpenChange, tier }: PaymentModalProps) {
  const [provider, setProvider] = useState<'mpesa' | 'airtel'>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { initiatePayment } = useSubscription();

  const tierInfo = TIER_FEATURES[tier];
  const price = TIER_PRICES[tier];

  async function handlePayment() {
    if (!phoneNumber) {
      toast({
        title: 'Phone number required',
        description: 'Please enter your phone number to proceed',
        variant: 'destructive',
      });
      return;
    }

    // Basic phone validation
    const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9 || cleanPhone.length > 12) {
      toast({
        title: 'Invalid phone number',
        description: 'Please enter a valid Kenyan phone number',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const result = await initiatePayment(tier, provider, phoneNumber);
      
      if (result.success) {
        toast({
          title: 'Payment initiated',
          description: result.message || 'Please check your phone and approve the payment',
        });
        onOpenChange(false);
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      toast({
        title: 'Payment failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to {tierInfo.name}</DialogTitle>
          <DialogDescription>
            Complete your subscription for KES {price}/month
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Payment Provider Selection */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup
              value={provider}
              onValueChange={(v) => setProvider(v as 'mpesa' | 'airtel')}
              className="grid grid-cols-2 gap-3"
            >
              <label
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  provider === 'mpesa'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <RadioGroupItem value="mpesa" id="mpesa" className="sr-only" />
                <div className="w-10 h-10 rounded-full bg-[#4CB050] flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground">M-Pesa</p>
                  <p className="text-xs text-muted-foreground">Safaricom</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  provider === 'airtel'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <RadioGroupItem value="airtel" id="airtel" className="sr-only" />
                <div className="w-10 h-10 rounded-full bg-[#ED1C24] flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Airtel Money</p>
                  <p className="text-xs text-muted-foreground">Airtel Kenya</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                +254
              </span>
              <Input
                id="phone"
                type="tel"
                placeholder="712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="pl-14"
                maxLength={10}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You'll receive a payment prompt on this number
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{tierInfo.name} Plan</span>
              <span className="font-medium">KES {price}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-medium">Total</span>
              <span className="font-bold text-primary">KES {price}</span>
            </div>
          </div>

          {/* Pay Button */}
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay KES ${price}`
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By proceeding, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
