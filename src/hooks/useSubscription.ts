import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type SubscriptionTier = Database['public']['Enums']['subscription_tier'];

interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  daily_messages_limit: number;
  visibility_boost: number;
  advanced_insights: boolean;
  starts_at: string;
  expires_at: string | null;
}

interface TierBenefits {
  daily_messages: number;
  visibility_boost: number;
  advanced_insights: boolean;
}

export const TIER_PRICES = {
  free: 0,
  basic: 299, // KES
  premium: 599, // KES
} as const;

export const TIER_FEATURES = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      '5 messages per day',
      'Basic profile visibility',
      'Standard matching',
      'AI message coaching',
    ],
  },
  basic: {
    name: 'Basic',
    price: 299,
    features: [
      '25 messages per day',
      '50% visibility boost',
      'Priority matching',
      'AI message coaching',
      'Read receipts',
    ],
  },
  premium: {
    name: 'Premium',
    price: 599,
    features: [
      '100 messages per day',
      '100% visibility boost',
      'Top priority matching',
      'Advanced AI insights',
      'Read receipts',
      'Profile analytics',
      'Unlimited likes',
    ],
  },
} as const;

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSubscription(null);
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  }

  async function initiatePayment(
    tier: 'basic' | 'premium',
    provider: 'mpesa' | 'airtel',
    phoneNumber: string
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const amount = TIER_PRICES[tier];
    const functionName = provider === 'mpesa' ? 'mpesa-payment' : 'airtel-payment';

    const { data, error } = await supabase.functions.invoke(functionName, {
      body: {
        phoneNumber,
        amount,
        tier,
        userId: user.id,
      },
    });

    if (error) throw error;
    return data;
  }

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
    initiatePayment,
    currentTier: subscription?.tier || 'free',
  };
}
