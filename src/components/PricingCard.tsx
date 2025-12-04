import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  name: string;
  price: number;
  features: readonly string[];
  isPopular?: boolean;
  isCurrent?: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function PricingCard({
  name,
  price,
  features,
  isPopular,
  isCurrent,
  onSelect,
  disabled,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        'relative flex flex-col transition-all duration-300 hover:shadow-lg',
        isPopular && 'border-primary shadow-md scale-105',
        isCurrent && 'border-secondary'
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1 rounded-full">
            Current Plan
          </span>
        </div>
      )}
      
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription>
          <span className="text-3xl font-bold text-foreground">
            {price === 0 ? 'Free' : `KES ${price}`}
          </span>
          {price > 0 && <span className="text-muted-foreground">/month</span>}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button
          className="w-full"
          variant={isPopular ? 'default' : 'outline'}
          onClick={onSelect}
          disabled={disabled || isCurrent}
        >
          {isCurrent ? 'Current Plan' : price === 0 ? 'Get Started' : 'Upgrade'}
        </Button>
      </CardFooter>
    </Card>
  );
}
