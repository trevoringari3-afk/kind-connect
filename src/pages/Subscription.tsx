import { useState } from 'react';
import { ArrowLeft, Crown, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PricingCard } from '@/components/PricingCard';
import { PaymentModal } from '@/components/PaymentModal';
import { TIER_FEATURES, useSubscription } from '@/hooks/useSubscription';

export default function Subscription() {
  const { currentTier, loading } = useSubscription();
  const [selectedTier, setSelectedTier] = useState<'basic' | 'premium' | null>(null);

  function handleSelectTier(tier: 'free' | 'basic' | 'premium') {
    if (tier === 'free') return;
    setSelectedTier(tier);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Subscription Plans</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Crown className="w-4 h-4" />
            <span className="text-sm font-medium">Upgrade Your Experience</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Find Your Perfect Match Faster
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Unlock premium features to boost your profile visibility, send more messages,
            and get advanced AI insights to improve your conversations.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="flex items-start gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Visibility Boost</h3>
              <p className="text-sm text-muted-foreground">
                Get seen by more potential matches with priority placement
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">More Messages</h3>
              <p className="text-sm text-muted-foreground">
                Send up to 100 messages daily to connect with more people
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">AI Insights</h3>
              <p className="text-sm text-muted-foreground">
                Advanced coaching to craft perfect conversation starters
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <PricingCard
            name={TIER_FEATURES.free.name}
            price={TIER_FEATURES.free.price}
            features={TIER_FEATURES.free.features}
            isCurrent={currentTier === 'free'}
            onSelect={() => handleSelectTier('free')}
            disabled={loading}
          />
          <PricingCard
            name={TIER_FEATURES.basic.name}
            price={TIER_FEATURES.basic.price}
            features={TIER_FEATURES.basic.features}
            isPopular
            isCurrent={currentTier === 'basic'}
            onSelect={() => handleSelectTier('basic')}
            disabled={loading}
          />
          <PricingCard
            name={TIER_FEATURES.premium.name}
            price={TIER_FEATURES.premium.price}
            features={TIER_FEATURES.premium.features}
            isCurrent={currentTier === 'premium'}
            onSelect={() => handleSelectTier('premium')}
            disabled={loading}
          />
        </div>

        {/* FAQ Section */}
        <div className="bg-card rounded-2xl p-8 border border-border">
          <h3 className="text-xl font-semibold mb-6 text-center">
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div>
              <h4 className="font-medium mb-2">How does billing work?</h4>
              <p className="text-sm text-muted-foreground">
                You'll be charged monthly via M-Pesa or Airtel Money. Cancel anytime.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Can I change plans?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! Upgrade or downgrade at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Is my payment secure?</h4>
              <p className="text-sm text-muted-foreground">
                Absolutely. All payments are processed through official M-Pesa and Airtel APIs.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">What if I need a refund?</h4>
              <p className="text-sm text-muted-foreground">
                Contact our support team within 7 days for a full refund.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {selectedTier && (
        <PaymentModal
          open={!!selectedTier}
          onOpenChange={(open) => !open && setSelectedTier(null)}
          tier={selectedTier}
        />
      )}
    </div>
  );
}
